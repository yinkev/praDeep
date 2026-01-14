import asyncio
from pathlib import Path
import sys


project_root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(project_root))


def test_chat_verify_requires_prompt_keys(monkeypatch):
    from src.services.council.config import CouncilBudgets, CouncilConfig, CouncilModels
    from src.services.council.orchestrator import CouncilOrchestrator

    class DummyLLMCfg:
        base_url = "http://example.invalid/v1"
        api_key = "sk-test"
        binding = "openai"

    async def fake_llm_complete(*_args, **_kwargs):
        return ""

    monkeypatch.setattr("src.services.council.orchestrator.get_llm_config", lambda: DummyLLMCfg())
    monkeypatch.setattr("src.services.council.orchestrator.llm_complete", fake_llm_complete)

    cfg = CouncilConfig(
        enabled=True,
        models=CouncilModels(chairman="c", reviewer="r", members=["m1"]),
        budgets=CouncilBudgets(max_rounds=1),
    )

    class EmptyPromptManager:
        def load_prompts(self, *args, **kwargs):
            return {}

    orch = CouncilOrchestrator(cfg, prompt_manager=EmptyPromptManager())

    async def run():
        return await orch.run_chat_verify(
            question="q",
            chat_messages=[{"role": "system", "content": "s"}],
            context="",
            sources={},
            kb_name=None,
            enable_rag=False,
            enable_web_search=False,
            language="en",
        )

    result = asyncio.run(run())
    assert result.status == "error"
    assert any("member_instructions" in e for e in result.errors)


def test_question_validate_requires_prompt_keys(monkeypatch):
    from src.services.council.config import CouncilBudgets, CouncilConfig, CouncilModels
    from src.services.council.orchestrator import CouncilOrchestrator

    class DummyLLMCfg:
        base_url = "http://example.invalid/v1"
        api_key = "sk-test"
        binding = "openai"

    async def fake_llm_complete(*_args, **_kwargs):
        return ""

    monkeypatch.setattr("src.services.council.orchestrator.get_llm_config", lambda: DummyLLMCfg())
    monkeypatch.setattr("src.services.council.orchestrator.llm_complete", fake_llm_complete)

    cfg = CouncilConfig(
        enabled=True,
        models=CouncilModels(chairman="c", reviewer="r", members=["m1"]),
        budgets=CouncilBudgets(max_rounds=1),
    )

    class EmptyPromptManager:
        def load_prompts(self, *args, **kwargs):
            return {}

    orch = CouncilOrchestrator(cfg, prompt_manager=EmptyPromptManager())

    async def run():
        return await orch.run_question_validate(
            validation_prompt="vp",
            question_text="qt",
            validation_knowledge="vk",
            kb_name=None,
            language="en",
        )

    result = asyncio.run(run())
    assert result.status == "error"
    assert any("member_instructions" in e for e in result.errors)
