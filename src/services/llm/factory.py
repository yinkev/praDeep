"""
LLM Factory - Central Hub for LLM Calls
=======================================

This module serves as the central hub for all LLM calls in DeepTutor.
It provides a unified interface for agents to call LLMs, routing requests
to the appropriate provider (cloud or local) based on URL detection.

Architecture:
    Agents (ChatAgent, GuideAgent, etc.)
              ↓
         BaseAgent.call_llm() / stream_llm()
              ↓
         LLM Factory (this module)
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
CloudProvider      LocalProvider
(cloud_provider)   (local_provider)
              ↓                   ↓
OpenAI/DeepSeek/etc    LM Studio/Ollama/etc

Routing:
- Automatically routes to local_provider for local URLs (localhost, 127.0.0.1, etc.)
- Routes to cloud_provider for all other URLs

Retry Mechanism:
- Automatic retry with exponential backoff for transient errors
- Configurable max_retries, retry_delay, and exponential_backoff
- Only retries on retriable errors (timeout, rate limit, server errors)
"""

import asyncio
from typing import Any, AsyncGenerator, Dict, List, Optional

import tenacity

from src.logging.logger import get_logger

from . import cloud_provider, local_provider
from .config import get_llm_config
from .exceptions import (
    LLMAPIError,
    LLMAuthenticationError,
    LLMError,
    LLMRateLimitError,
    LLMTimeoutError,
    ProviderContextWindowError,
)
from .utils import is_local_llm_server

# Initialize logger
logger = get_logger("LLMFactory")

# Default retry configuration
DEFAULT_MAX_RETRIES = 3
DEFAULT_RETRY_DELAY = 1.0  # seconds
DEFAULT_EXPONENTIAL_BACKOFF = True

# Default context shrink-and-retry configuration (bounded + deterministic)
DEFAULT_CONTEXT_SHRINK_RETRIES = 3
DEFAULT_HISTORY_KEEP_LAST_LEVELS = (8, 4, 2)
DEFAULT_RAG_CONTEXT_MAX_CHARS_LEVELS = (12000, 6000, 2500, 0)
DEFAULT_USER_SUMMARY_TRIGGER_CHARS = 8000
DEFAULT_USER_SUMMARY_CHUNK_CHARS = 3500
DEFAULT_USER_SUMMARY_MAX_CHUNKS = 5
DEFAULT_USER_SUMMARY_MAX_OUTPUT_CHARS = 1800


def _extract_text_content(content: Any) -> str:
    if isinstance(content, str):
        return content
    # OpenAI vision-style content parts: [{type:'text', text:'...'}, {type:'image_url', ...}]
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                parts.append(str(item.get("text") or ""))
        return "\n".join(parts)
    if isinstance(content, dict):
        # Best-effort; keep deterministic
        return str(content)
    return str(content) if content is not None else ""


def _message_role(message: Dict[str, Any]) -> str:
    return str(message.get("role") or "").strip().lower()


def _is_rag_context_message(idx: int, message: Dict[str, Any]) -> bool:
    # Heuristic: a non-primary system message with a large content payload or known markers.
    if _message_role(message) != "system":
        return False
    if idx == 0:
        return False

    content_text = _extract_text_content(message.get("content"))
    lowered = content_text.lower()

    markers = (
        "reference context",
        "knowledge base",
        "[knowledge base",
        "[web search results",
        "web search results",
        "rag",
        "retrieved context",
    )

    if any(m in lowered for m in markers):
        return True

    # Also treat very large secondary system messages as likely context.
    return len(content_text) >= 2000


def _is_context_window_error(error: Exception) -> bool:
    msg = str(error).lower()
    needles = (
        "context_length_exceeded",
        "context length",
        "maximum context",
        "maximum context length",
        "too many tokens",
        "token limit",
        "input is too long",
        "prompt is too long",
        "reduce the length",
    )
    return any(n in msg for n in needles)


def _trim_history_messages(
    messages: List[Dict[str, Any]],
    keep_last_non_system: int,
) -> List[Dict[str, Any]]:
    if keep_last_non_system <= 0:
        keep_last_non_system = 1

    non_system_indices: list[int] = [
        i for i, m in enumerate(messages) if _message_role(m) != "system"
    ]
    if len(non_system_indices) <= keep_last_non_system:
        return messages

    kept_set = set(non_system_indices[-keep_last_non_system:])
    new_messages: list[Dict[str, Any]] = []
    for i, m in enumerate(messages):
        if _message_role(m) == "system" or i in kept_set:
            new_messages.append(m)
    return new_messages


def _truncate_text(text: str, max_chars: int) -> str:
    if max_chars < 0:
        max_chars = 0
    if len(text) <= max_chars:
        return text
    if max_chars == 0:
        return ""
    return text[:max_chars].rstrip() + "\n...[truncated]"


def _shrink_rag_context_messages(
    messages: List[Dict[str, Any]],
    max_chars: int,
) -> List[Dict[str, Any]]:
    new_messages: list[Dict[str, Any]] = []
    for idx, m in enumerate(messages):
        if not _is_rag_context_message(idx, m):
            new_messages.append(m)
            continue

        content = m.get("content")
        # Only truncate string / text-parts deterministically.
        if isinstance(content, str):
            truncated = _truncate_text(content, max_chars)
            if truncated:
                new_messages.append({**m, "content": truncated})
            # If max_chars==0, drop the context message.
            continue

        if isinstance(content, list):
            new_parts: list[dict[str, Any]] = []
            for part in content:
                if not isinstance(part, dict) or part.get("type") != "text":
                    new_parts.append(part)
                    continue
                truncated_text = _truncate_text(str(part.get("text") or ""), max_chars)
                if truncated_text:
                    new_parts.append({**part, "text": truncated_text})
            if new_parts and any(
                p.get("type") == "text" and str(p.get("text") or "")
                for p in new_parts
                if isinstance(p, dict)
            ):
                new_messages.append({**m, "content": new_parts})
            continue

        new_messages.append(m)
    return new_messages


def _split_text_into_chunks(text: str, chunk_chars: int, max_chunks: int) -> list[str]:
    if chunk_chars <= 0:
        return [text]
    if max_chunks <= 0:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(text) and len(chunks) < max_chunks:
        end = min(len(text), start + chunk_chars)
        chunks.append(text[start:end])
        start = end
    return chunks


async def _summarize_text_chunks_via_llm(
    *,
    chunks: list[str],
    do_complete: Any,
    base_call_kwargs: Dict[str, Any],
    max_output_chars: int,
) -> str:
    """Summarize text deterministically in bounded chunks.

    Falls back to truncation if summarization fails.
    """

    if not chunks:
        return ""

    summary_system = (
        "You are a precise summarization assistant. "
        "Summarize the user's text chunk. "
        "Preserve any questions, constraints, and key identifiers. "
        "Be concise and factual."
    )

    per_chunk_summaries: list[str] = []
    for idx, chunk in enumerate(chunks, start=1):
        user = (
            f"Summarize chunk {idx}/{len(chunks)}.\n"
            "Return a compact summary (max ~12 bullet points).\n\n"
            f"TEXT:\n{chunk}"
        )

        try:
            text = await do_complete(
                **{
                    **base_call_kwargs,
                    "prompt": user,
                    "system_prompt": summary_system,
                    "max_tokens": 600,
                    "temperature": 0,
                    "messages": None,
                }
            )
            text = (text or "").strip()
            if text:
                per_chunk_summaries.append(_truncate_text(text, max_output_chars))
        except Exception:
            per_chunk_summaries.append(_truncate_text(chunk, max_output_chars))

    combined = "\n\n".join(per_chunk_summaries).strip()
    return combined


def _is_retriable_error(error: Exception) -> bool:
    """
    Check if an error is retriable.

    Retriable errors:
    - Timeout errors
    - Rate limit errors (429)
    - Server errors (5xx)
    - Network/connection errors

    Non-retriable errors:
    - Authentication errors (401)
    - Bad request (400)
    - Not found (404)
    - Client errors (4xx except 429)
    """
    from aiohttp import ClientError
    from requests.exceptions import RequestException

    if isinstance(error, (asyncio.TimeoutError, ClientError, RequestException)):
        return True
    if isinstance(error, LLMTimeoutError):
        return True
    if isinstance(error, LLMRateLimitError):
        return True
    if isinstance(error, LLMAuthenticationError):
        return False  # Don't retry auth errors

    if isinstance(error, LLMAPIError):
        status_code = error.status_code
        if status_code:
            # Retry on server errors (5xx) and rate limits (429)
            if status_code >= 500 or status_code == 429:
                return True
            # Don't retry on client errors (4xx except 429)
            if 400 <= status_code < 500:
                return False
        return True  # Retry by default for unknown API errors

    # For other exceptions (network errors, etc.), retry
    return True


def _should_use_local(base_url: Optional[str]) -> bool:
    """
    Determine if we should use the local provider based on URL.

    Args:
        base_url: The base URL to check

    Returns:
        True if local provider should be used (localhost, 127.0.0.1, etc.)
    """
    return is_local_llm_server(base_url) if base_url else False


async def complete(
    prompt: str,
    system_prompt: str = "You are a helpful assistant.",
    model: Optional[str] = None,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    api_version: Optional[str] = None,
    binding: Optional[str] = None,
    messages: Optional[List[Dict[str, str]]] = None,
    max_retries: int = DEFAULT_MAX_RETRIES,
    retry_delay: float = DEFAULT_RETRY_DELAY,
    exponential_backoff: bool = DEFAULT_EXPONENTIAL_BACKOFF,
    enable_context_shrink: bool = True,
    context_shrink_retries: int = DEFAULT_CONTEXT_SHRINK_RETRIES,
    user_summary_trigger_chars: int = DEFAULT_USER_SUMMARY_TRIGGER_CHARS,
    user_summary_chunk_chars: int = DEFAULT_USER_SUMMARY_CHUNK_CHARS,
    user_summary_max_chunks: int = DEFAULT_USER_SUMMARY_MAX_CHUNKS,
    user_summary_max_output_chars: int = DEFAULT_USER_SUMMARY_MAX_OUTPUT_CHARS,
    **kwargs,
) -> str:
    """
    Unified LLM completion function with automatic retry.

    Routes to cloud_provider or local_provider based on configuration.
    Includes automatic retry with exponential backoff for transient errors.

    Args:
        prompt: The user prompt
        system_prompt: System prompt for context
        model: Model name (optional, uses effective config if not provided)
        api_key: API key (optional)
        base_url: Base URL for the API (optional)
        api_version: API version for Azure OpenAI (optional)
        binding: Provider binding type (optional)
        messages: Pre-built messages array (optional)
        max_retries: Maximum number of retry attempts (default: 3)
        retry_delay: Initial delay between retries in seconds (default: 1.0)
        exponential_backoff: Whether to use exponential backoff (default: True)
        **kwargs: Additional parameters (temperature, max_tokens, etc.)

    Returns:
        str: The LLM response
    """
    # Get config if parameters not provided
    if not model or not base_url:
        config = get_llm_config()
        model = model or config.model
        api_key = api_key if api_key is not None else config.api_key
        base_url = base_url or config.base_url
        api_version = api_version or config.api_version
        binding = binding or config.binding or "openai"

    # Determine which provider to use
    use_local = _should_use_local(base_url)

    # Define helper to determine if a generic LLMAPIError is retriable
    def _is_retriable_llm_api_error(exc: BaseException) -> bool:
        """
        Return True for LLMAPIError instances that represent retriable conditions.

        We only retry on:
          - HTTP 429 (rate limit), or
          - HTTP 5xx server errors.

        All other LLMAPIError instances (e.g., 4xx like 400, 401, 403, 404) are treated
        as non-retriable to avoid unnecessary retries.
        """
        if not isinstance(exc, LLMAPIError):
            return False

        status_code = getattr(exc, "status_code", None)
        if status_code is None:
            # Do not retry when status code is unknown to avoid retrying non-transient errors
            return False

        if status_code == 429:
            return True

        if 500 <= status_code < 600:
            return True

        return False

    # Define the actual completion function with tenacity retry
    @tenacity.retry(
        retry=(
            tenacity.retry_if_exception_type(LLMRateLimitError)
            | tenacity.retry_if_exception_type(LLMTimeoutError)
            | tenacity.retry_if_exception(_is_retriable_llm_api_error)
        ),
        wait=tenacity.wait_exponential(multiplier=retry_delay, min=retry_delay, max=60),
        stop=tenacity.stop_after_attempt(max_retries + 1),
        before_sleep=lambda retry_state: logger.warning(
            f"LLM call failed (attempt {retry_state.attempt_number}/{max_retries + 1}), "
            f"retrying in {retry_state.upcoming_sleep:.1f}s... Error: {str(retry_state.outcome.exception())}"
        ),
    )
    async def _do_complete(**call_kwargs):
        try:
            if use_local:
                return await local_provider.complete(**call_kwargs)
            else:
                return await cloud_provider.complete(**call_kwargs)
        except Exception as e:
            # Preserve already-mapped unified exceptions.
            if isinstance(e, LLMError):
                raise

            # Map raw SDK exceptions to unified exceptions for retry logic
            from .error_mapping import map_error

            mapped_error = map_error(e, provider=call_kwargs.get("binding", "unknown"))
            raise mapped_error from e

    # Build call kwargs
    call_kwargs = {
        "prompt": prompt,
        "system_prompt": system_prompt,
        "model": model,
        "api_key": api_key,
        "base_url": base_url,
        "messages": messages,
        **kwargs,
    }

    # Add cloud-specific kwargs if not local
    if not use_local:
        call_kwargs["api_version"] = api_version
        call_kwargs["binding"] = binding or "openai"

    # Execute with retry (handled by tenacity decorator), plus bounded shrink-and-retry
    # for context window errors.
    shrink_retries = max(0, int(context_shrink_retries))

    # Ensure we have a messages array for shrink logic.
    current_messages: List[Dict[str, Any]]
    if call_kwargs.get("messages") is None:
        current_messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ]
        call_kwargs["messages"] = current_messages
        # When messages are set, providers ignore prompt.
        call_kwargs["prompt"] = ""
    else:
        current_messages = list(call_kwargs["messages"] or [])

    # Track whether we've already summarized the user content so we don't re-summarize.
    user_summarized = False

    for shrink_attempt in range(shrink_retries + 1):
        try:
            call_kwargs["messages"] = current_messages
            return await _do_complete(**call_kwargs)
        except Exception as e:
            if not enable_context_shrink or not _is_context_window_error(e):
                raise

            if shrink_attempt >= shrink_retries:
                raise ProviderContextWindowError(
                    "Context length exceeded (even after shrinking). Please shorten the input or disable RAG/context.",
                    provider=getattr(e, "provider", None),
                ) from e

            # Shrink steps (deterministic order):
            # 1) Trim older chat history (keep most recent messages)
            # 2) Trim RAG/system context
            # 3) Summarize oversized user content in bounded chunks
            history_keep = DEFAULT_HISTORY_KEEP_LAST_LEVELS[
                min(shrink_attempt, len(DEFAULT_HISTORY_KEEP_LAST_LEVELS) - 1)
            ]
            current_messages = _trim_history_messages(current_messages, history_keep)

            if shrink_attempt >= 1:
                rag_cap = DEFAULT_RAG_CONTEXT_MAX_CHARS_LEVELS[
                    min(shrink_attempt - 1, len(DEFAULT_RAG_CONTEXT_MAX_CHARS_LEVELS) - 1)
                ]
                current_messages = _shrink_rag_context_messages(current_messages, rag_cap)

            if shrink_attempt >= 2 and not user_summarized:
                # Summarize only if user content is clearly oversized.
                last_user_index = None
                for i in range(len(current_messages) - 1, -1, -1):
                    if _message_role(current_messages[i]) == "user":
                        last_user_index = i
                        break

                if last_user_index is not None:
                    last_user_content = current_messages[last_user_index].get("content")
                    last_user_text = _extract_text_content(last_user_content)

                    if len(last_user_text) >= int(user_summary_trigger_chars):
                        chunks = _split_text_into_chunks(
                            last_user_text,
                            int(user_summary_chunk_chars),
                            int(user_summary_max_chunks),
                        )

                        base_call_kwargs = {
                            k: v
                            for k, v in call_kwargs.items()
                            if k
                            in {
                                "model",
                                "api_key",
                                "base_url",
                                "api_version",
                                "binding",
                            }
                        }

                        summary = await _summarize_text_chunks_via_llm(
                            chunks=chunks,
                            do_complete=_do_complete,
                            base_call_kwargs=base_call_kwargs,
                            max_output_chars=int(user_summary_max_output_chars),
                        )

                        if summary.strip():
                            current_messages[last_user_index] = {
                                **current_messages[last_user_index],
                                "content": (
                                    "[User content was too long; summarized]\n\n" + summary.strip()
                                ),
                            }
                            user_summarized = True

            logger.warning(
                "LLM context window exceeded; shrinking and retrying "
                f"(attempt {shrink_attempt + 1}/{shrink_retries})."
            )


async def complete_with_vision(
    prompt: str,
    images: List[Dict[str, str]],
    system_prompt: str = "You are a helpful assistant.",
    model: Optional[str] = None,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    api_version: Optional[str] = None,
    binding: Optional[str] = None,
    max_retries: int = DEFAULT_MAX_RETRIES,
    retry_delay: float = DEFAULT_RETRY_DELAY,
    exponential_backoff: bool = DEFAULT_EXPONENTIAL_BACKOFF,
    **kwargs,
) -> str:
    """Completion helper for vision/multimodal prompts.

    Builds an OpenAI-compatible `messages` array with `image_url` parts and routes
    through the regular `complete()` factory so provider selection/retry stays centralized.

    Args:
        prompt: Text prompt
        images: List of image dicts with keys: data (base64), mimeType
    """

    content: list[dict[str, Any]] = [{"type": "text", "text": prompt}]
    for image in images or []:
        mime_type = image.get("mimeType") or "image/jpeg"
        data = image.get("data") or ""
        content.append(
            {
                "type": "image_url",
                "image_url": {"url": f"data:{mime_type};base64,{data}"},
            }
        )

    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": content},
    ]

    return await complete(
        prompt="",
        system_prompt=system_prompt,
        model=model,
        api_key=api_key,
        base_url=base_url,
        api_version=api_version,
        binding=binding,
        messages=messages,
        max_retries=max_retries,
        retry_delay=retry_delay,
        exponential_backoff=exponential_backoff,
        **kwargs,
    )


async def stream(
    prompt: str,
    system_prompt: str = "You are a helpful assistant.",
    model: Optional[str] = None,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    api_version: Optional[str] = None,
    binding: Optional[str] = None,
    messages: Optional[List[Dict[str, str]]] = None,
    max_retries: int = DEFAULT_MAX_RETRIES,
    retry_delay: float = DEFAULT_RETRY_DELAY,
    exponential_backoff: bool = DEFAULT_EXPONENTIAL_BACKOFF,
    enable_context_shrink: bool = True,
    context_shrink_retries: int = DEFAULT_CONTEXT_SHRINK_RETRIES,
    user_summary_trigger_chars: int = DEFAULT_USER_SUMMARY_TRIGGER_CHARS,
    user_summary_chunk_chars: int = DEFAULT_USER_SUMMARY_CHUNK_CHARS,
    user_summary_max_chunks: int = DEFAULT_USER_SUMMARY_MAX_CHUNKS,
    user_summary_max_output_chars: int = DEFAULT_USER_SUMMARY_MAX_OUTPUT_CHARS,
    **kwargs,
) -> AsyncGenerator[str, None]:
    """
    Unified LLM streaming function with automatic retry.

    Routes to cloud_provider or local_provider based on configuration.
    Includes automatic retry with exponential backoff for connection errors.

    Note: Retry only applies to initial connection errors. Once streaming
    starts, errors during streaming will not be automatically retried.

    Args:
        prompt: The user prompt
        system_prompt: System prompt for context
        model: Model name (optional, uses effective config if not provided)
        api_key: API key (optional)
        base_url: Base URL for the API (optional)
        api_version: API version for Azure OpenAI (optional)
        binding: Provider binding type (optional)
        messages: Pre-built messages array (optional)
        max_retries: Maximum number of retry attempts (default: 3)
        retry_delay: Initial delay between retries in seconds (default: 1.0)
        exponential_backoff: Whether to use exponential backoff (default: True)
        **kwargs: Additional parameters (temperature, max_tokens, etc.)

    Yields:
        str: Response chunks
    """
    # Get config if parameters not provided
    if not model or not base_url:
        config = get_llm_config()
        model = model or config.model
        api_key = api_key if api_key is not None else config.api_key
        base_url = base_url or config.base_url
        api_version = api_version or config.api_version
        binding = binding or config.binding or "openai"

    # Determine which provider to use
    use_local = _should_use_local(base_url)

    # Build call kwargs
    call_kwargs = {
        "prompt": prompt,
        "system_prompt": system_prompt,
        "model": model,
        "api_key": api_key,
        "base_url": base_url,
        "messages": messages,
        **kwargs,
    }

    # Add cloud-specific kwargs if not local
    if not use_local:
        call_kwargs["api_version"] = api_version
        call_kwargs["binding"] = binding or "openai"

    # Bounded streaming retry: transient retry (inner loop) + shrink-and-retry for
    # context window errors (outer loop). Context window errors are expected to happen
    # before streaming begins (server rejects request), so restarting is safe.
    shrink_retries = max(0, int(context_shrink_retries))

    current_messages: List[Dict[str, Any]]
    if call_kwargs.get("messages") is None:
        current_messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ]
        call_kwargs["messages"] = current_messages
        call_kwargs["prompt"] = ""
    else:
        current_messages = list(call_kwargs["messages"] or [])

    user_summarized = False
    last_exception: Exception | None = None

    for shrink_attempt in range(shrink_retries + 1):
        delay = retry_delay
        for attempt in range(max_retries + 1):
            try:
                call_kwargs["messages"] = current_messages
                if use_local:
                    async for chunk in local_provider.stream(**call_kwargs):
                        yield chunk
                else:
                    async for chunk in cloud_provider.stream(**call_kwargs):
                        yield chunk
                return
            except Exception as e:
                last_exception = e

                if enable_context_shrink and _is_context_window_error(e):
                    if shrink_attempt >= shrink_retries:
                        raise ProviderContextWindowError(
                            "Context length exceeded (even after shrinking). Please shorten the input or disable RAG/context.",
                            provider=getattr(e, "provider", None),
                        ) from e

                    history_keep = DEFAULT_HISTORY_KEEP_LAST_LEVELS[
                        min(shrink_attempt, len(DEFAULT_HISTORY_KEEP_LAST_LEVELS) - 1)
                    ]
                    current_messages = _trim_history_messages(current_messages, history_keep)

                    if shrink_attempt >= 1:
                        rag_cap = DEFAULT_RAG_CONTEXT_MAX_CHARS_LEVELS[
                            min(
                                shrink_attempt - 1,
                                len(DEFAULT_RAG_CONTEXT_MAX_CHARS_LEVELS) - 1,
                            )
                        ]
                        current_messages = _shrink_rag_context_messages(current_messages, rag_cap)

                    if shrink_attempt >= 2 and not user_summarized:
                        last_user_index = None
                        for i in range(len(current_messages) - 1, -1, -1):
                            if _message_role(current_messages[i]) == "user":
                                last_user_index = i
                                break

                        if last_user_index is not None:
                            last_user_text = _extract_text_content(
                                current_messages[last_user_index].get("content")
                            )
                            if len(last_user_text) >= int(user_summary_trigger_chars):
                                chunks = _split_text_into_chunks(
                                    last_user_text,
                                    int(user_summary_chunk_chars),
                                    int(user_summary_max_chunks),
                                )

                                base_call_kwargs = {
                                    k: v
                                    for k, v in call_kwargs.items()
                                    if k
                                    in {
                                        "model",
                                        "api_key",
                                        "base_url",
                                        "api_version",
                                        "binding",
                                    }
                                }

                                # Summarize chunks using non-streaming completion, then retry streaming.
                                async def _do_summary_complete(**summary_kwargs):
                                    if use_local:
                                        return await local_provider.complete(**summary_kwargs)
                                    return await cloud_provider.complete(**summary_kwargs)

                                summary = await _summarize_text_chunks_via_llm(
                                    chunks=chunks,
                                    do_complete=_do_summary_complete,
                                    base_call_kwargs=base_call_kwargs,
                                    max_output_chars=int(user_summary_max_output_chars),
                                )

                                if summary.strip():
                                    current_messages[last_user_index] = {
                                        **current_messages[last_user_index],
                                        "content": (
                                            "[User content was too long; summarized]\n\n"
                                            + summary.strip()
                                        ),
                                    }
                                    user_summarized = True

                    logger.warning(
                        "Streaming context window exceeded; shrinking and retrying "
                        f"(attempt {shrink_attempt + 1}/{shrink_retries})."
                    )
                    break  # break inner transient retry loop; retry with shrunk context

                # Not a context window error: handle transient retry.
                if attempt >= max_retries or not _is_retriable_error(e):
                    raise

                if exponential_backoff:
                    current_delay = delay * (2**attempt)
                else:
                    current_delay = delay

                if isinstance(e, LLMRateLimitError) and e.retry_after:
                    current_delay = max(current_delay, e.retry_after)

                await asyncio.sleep(current_delay)

        # Continue to next shrink attempt
        continue

    if last_exception is not None:
        raise last_exception


async def fetch_models(
    binding: str,
    base_url: str,
    api_key: Optional[str] = None,
) -> List[str]:
    """
    Fetch available models from the provider.

    Routes to cloud_provider or local_provider based on URL.

    Args:
        binding: Provider type (openai, ollama, etc.)
        base_url: API endpoint URL
        api_key: API key (optional for local providers)

    Returns:
        List of available model names
    """
    if is_local_llm_server(base_url):
        return await local_provider.fetch_models(base_url, api_key)
    else:
        return await cloud_provider.fetch_models(base_url, api_key, binding)


# API Provider Presets
API_PROVIDER_PRESETS = {
    "openai": {
        "name": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "requires_key": True,
        "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    },
    "anthropic": {
        "name": "Anthropic",
        "base_url": "https://api.anthropic.com/v1",
        "requires_key": True,
        "binding": "anthropic",
        "models": ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
    },
    "deepseek": {
        "name": "DeepSeek",
        "base_url": "https://api.deepseek.com",
        "requires_key": True,
        "models": ["deepseek-chat", "deepseek-reasoner"],
    },
    "openrouter": {
        "name": "OpenRouter",
        "base_url": "https://openrouter.ai/api/v1",
        "requires_key": True,
        "models": [],  # Dynamic
    },
}

# Local Provider Presets
LOCAL_PROVIDER_PRESETS = {
    "ollama": {
        "name": "Ollama",
        "base_url": "http://localhost:11434/v1",
        "requires_key": False,
        "default_key": "ollama",
    },
    "lm_studio": {
        "name": "LM Studio",
        "base_url": "http://localhost:1234/v1",
        "requires_key": False,
        "default_key": "lm-studio",
    },
    "vllm": {
        "name": "vLLM",
        "base_url": "http://localhost:8000/v1",
        "requires_key": False,
        "default_key": "vllm",
    },
    "llama_cpp": {
        "name": "llama.cpp",
        "base_url": "http://localhost:8080/v1",
        "requires_key": False,
        "default_key": "llama-cpp",
    },
}


def get_provider_presets() -> Dict[str, Any]:
    """
    Get all provider presets for frontend display.
    """
    return {
        "api": API_PROVIDER_PRESETS,
        "local": LOCAL_PROVIDER_PRESETS,
    }


__all__ = [
    "complete",
    "stream",
    "fetch_models",
    "get_provider_presets",
    "API_PROVIDER_PRESETS",
    "LOCAL_PROVIDER_PRESETS",
    # Retry configuration defaults
    "DEFAULT_MAX_RETRIES",
    "DEFAULT_RETRY_DELAY",
    "DEFAULT_EXPONENTIAL_BACKOFF",
]
