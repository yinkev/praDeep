import asyncio
from pathlib import Path
import sys

project_root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(project_root))


def test_question_validate_templates_allow_json_braces(monkeypatch):
    from src.services.council.config import CouncilBudgets, CouncilConfig, CouncilModels
    from src.services.council.orchestrator import CouncilOrchestrator
    from src.services.council.types import CouncilCall

    class DummyLLMCfg:
        base_url = "http://example.invalid/v1"
        api_key = "sk-test"
        binding = "openai"

    monkeypatch.setattr("src.services.council.orchestrator.get_llm_config", lambda: DummyLLMCfg())

    cfg = CouncilConfig(
        enabled=True,
        models=CouncilModels(chairman="c", reviewer="r", members=["m1", "m2"]),
        budgets=CouncilBudgets(max_rounds=1),
    )

    class PromptManagerWithJson:
        def load_prompts(self, *args, **kwargs):
            return {
                "member_instructions": "member",
                "reviewer_instructions": "reviewer",
                "chairman_instructions": "chairman",
                "cross_exam_user_template": "Questions:\n{questions}\n",
                "chairman_user_template": (
                    "Validator outputs:\n{member_outputs}\n\n"
                    "Reviewer notes:\n{reviewer_notes}\n\n"
                    "Output STRICT JSON only:\n"
                    "{\n"
                    '  "decision": "approve",\n'
                    '  "issues": [],\n'
                    '  "suggestions": [],\n'
                    '  "reasoning": "..." \n'
                    "}\n"
                ),
            }

    orch = CouncilOrchestrator(cfg, prompt_manager=PromptManagerWithJson())

    async def fake_call_complete(*, role, model, messages, max_tokens, temperature):
        if role == "member":
            return CouncilCall(role="member", model=model, content='{"decision":"approve"}')
        if role == "reviewer":
            return CouncilCall(
                role="reviewer",
                model=model,
                content='{"resolved": true, "issues": [], "disagreements": [], "cross_exam_questions": [], "notes_for_chairman": ""}',
            )
        return CouncilCall(role="chairman", model=model, content='{"decision":"approve"}')

    orch._call_complete = fake_call_complete  # type: ignore[method-assign]

    async def run():
        return await orch.run_question_validate(
            validation_prompt="vp",
            question_text="qt",
            validation_knowledge="vk",
            kb_name=None,
            language="en",
        )

    result = asyncio.run(run())
    assert result.status == "ok"
    assert result.final is not None
    assert result.final.content
