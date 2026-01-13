from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any, Callable

from .config import get_tts_config


def _default_client_factory(*, base_url: str, api_key: str):
    from openai import OpenAI

    return OpenAI(base_url=base_url, api_key=api_key)


def _truncate_text(text: str, *, max_chars: int = 4096) -> str:
    cleaned = (text or "").strip()
    if not cleaned:
        return ""

    limit = max(1, int(max_chars))
    if len(cleaned) <= limit:
        return cleaned

    if limit <= 3:
        return cleaned[:limit]

    return cleaned[: limit - 3].rstrip() + "..."


async def synthesize_speech_to_file(
    *,
    text: str,
    voice: str,
    output_path: Path,
    tts_config: dict[str, Any] | None = None,
    client_factory: Callable[..., Any] = _default_client_factory,
) -> Path:
    """
    Synthesize `text` to an MP3 file at `output_path` using an OpenAI-compatible TTS API.

    Args:
        text: Text input for TTS.
        voice: Voice id (e.g., alloy/echo/fable/onyx/nova/shimmer).
        output_path: Target path for the generated MP3 file.
        tts_config: Optional explicit config dict (model/api_key/base_url/voice).
        client_factory: Dependency injection point for tests.
    """
    cfg = tts_config or get_tts_config()
    model = str(cfg.get("model") or "").strip()
    base_url = str(cfg.get("base_url") or "").strip()
    api_key = str(cfg.get("api_key") or "").strip()
    voice_id = str(voice or cfg.get("voice") or "alloy").strip()

    if not model or not base_url or not api_key:
        raise ValueError("TTS configuration incomplete (model/base_url/api_key).")

    input_text = _truncate_text(text)
    if not input_text:
        raise ValueError("TTS input text is empty.")

    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    def _run() -> None:
        client = client_factory(base_url=base_url, api_key=api_key)
        with client.audio.speech.with_streaming_response.create(
            model=model,
            voice=voice_id,
            input=input_text,
        ) as response:
            response.stream_to_file(out_path)

    await asyncio.to_thread(_run)
    return out_path


__all__ = ["synthesize_speech_to_file"]
