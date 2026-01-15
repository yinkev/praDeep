import asyncio

from src.services.llm import factory
from src.services.llm.exceptions import ProviderContextWindowError


def _count_non_system(messages: list[dict]) -> int:
    return sum(1 for m in messages if (m.get("role") or "").lower() != "system")


def test_shrink_trims_history_first(monkeypatch) -> None:
    calls: list[list[dict]] = []

    async def fake_cloud_complete(**kwargs):
        calls.append(list(kwargs.get("messages") or []))
        if len(calls) == 1:
            raise ProviderContextWindowError("context_length_exceeded", provider="openai")
        return "ok"

    monkeypatch.setattr(factory.cloud_provider, "complete", fake_cloud_complete)

    messages = [
        {"role": "system", "content": "sys"},
        {"role": "system", "content": "Reference context:\n" + ("R" * 100)},
        {"role": "user", "content": "u1"},
        {"role": "assistant", "content": "a1"},
        {"role": "user", "content": "u2"},
        {"role": "assistant", "content": "a2"},
        {"role": "user", "content": "u3"},
        {"role": "assistant", "content": "a3"},
        {"role": "user", "content": "u4"},
        {"role": "assistant", "content": "a4"},
        {"role": "user", "content": "u5"},
    ]

    result = asyncio.run(
        factory.complete(
            prompt="",
            system_prompt="sys",
            model="test-model",
            api_key="",
            base_url="https://example.com",
            binding="openai",
            messages=messages,
            max_retries=0,
            context_shrink_retries=1,
        )
    )

    assert result == "ok"
    assert len(calls) == 2

    before = calls[0]
    after = calls[1]

    assert _count_non_system(before) > _count_non_system(after)
    # RAG context message should still exist on first shrink retry
    assert any(
        (m.get("role") == "system") and ("Reference context" in (m.get("content") or ""))
        for m in after
    )


def test_shrink_trims_rag_after_history(monkeypatch) -> None:
    calls: list[list[dict]] = []

    async def fake_cloud_complete(**kwargs):
        calls.append(list(kwargs.get("messages") or []))
        if len(calls) <= 2:
            raise ProviderContextWindowError("maximum context length", provider="openai")
        return "ok"

    monkeypatch.setattr(factory.cloud_provider, "complete", fake_cloud_complete)

    rag_blob = "Reference context:\n" + ("X" * 20000)
    messages = [
        {"role": "system", "content": "sys"},
        {"role": "system", "content": rag_blob},
        {"role": "user", "content": "u1"},
        {"role": "assistant", "content": "a1"},
        {"role": "user", "content": "u2"},
        {"role": "assistant", "content": "a2"},
        {"role": "user", "content": "u3"},
        {"role": "assistant", "content": "a3"},
        {"role": "user", "content": "u4"},
        {"role": "assistant", "content": "a4"},
        {"role": "user", "content": "u5"},
    ]

    result = asyncio.run(
        factory.complete(
            prompt="",
            system_prompt="sys",
            model="test-model",
            api_key="",
            base_url="https://example.com",
            binding="openai",
            messages=messages,
            max_retries=0,
            context_shrink_retries=2,
        )
    )

    assert result == "ok"
    assert len(calls) == 3

    rag_len_before = len(calls[1][1]["content"])  # after history trim, before rag trim
    rag_len_after = len(calls[2][1]["content"])  # after rag trim
    assert rag_len_after < rag_len_before


def test_shrink_summarizes_user_content_last(monkeypatch) -> None:
    prompts: list[str] = []

    async def fake_cloud_complete(**kwargs):
        prompt = str(kwargs.get("prompt") or "")
        prompts.append(prompt)

        # Summarization calls
        if prompt.startswith("Summarize chunk"):
            return "- summary\n- bullets"

        # Main calls: succeed only once user message was summarized.
        messages = list(kwargs.get("messages") or [])
        last_user = ""
        for m in reversed(messages):
            if (m.get("role") or "").lower() == "user":
                last_user = str(m.get("content") or "")
                break

        if "[User content was too long; summarized]" in last_user:
            return "ok"

        raise ProviderContextWindowError("too many tokens", provider="openai")

    monkeypatch.setattr(factory.cloud_provider, "complete", fake_cloud_complete)

    long_user = "Q:" + ("Z" * 500)
    messages = [
        {"role": "system", "content": "sys"},
        {"role": "system", "content": "Reference context:\n" + ("R" * 100)},
        {"role": "user", "content": "u1"},
        {"role": "assistant", "content": "a1"},
        {"role": "user", "content": long_user},
    ]

    result = asyncio.run(
        factory.complete(
            prompt="",
            system_prompt="sys",
            model="test-model",
            api_key="",
            base_url="https://example.com",
            binding="openai",
            messages=messages,
            max_retries=0,
            context_shrink_retries=3,
            user_summary_trigger_chars=50,
            user_summary_chunk_chars=40,
            user_summary_max_chunks=2,
            user_summary_max_output_chars=60,
        )
    )

    assert result == "ok"

    summarize_calls = [p for p in prompts if p.startswith("Summarize chunk")]
    assert len(summarize_calls) == 2
