import asyncio
from pathlib import Path
import sys


project_root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(project_root))


def test_run_chat_verify_checkpoint_can_inject_user_questions(monkeypatch):
    from src.services.council.config import CouncilBudgets, CouncilConfig, CouncilModels
    from src.services.council.orchestrator import CouncilOrchestrator
    from src.services.council.types import CouncilCall, CouncilFinal, CouncilReviewParsed

    class DummyLLMCfg:
        base_url = "http://example.invalid/v1"
        api_key = "sk-test"
        binding = "openai"

    monkeypatch.setattr("src.services.council.orchestrator.get_llm_config", lambda: DummyLLMCfg())

    cfg = CouncilConfig(
        enabled=True,
        models=CouncilModels(chairman="chairman", reviewer="reviewer", members=["m1", "m2"]),
        budgets=CouncilBudgets(max_rounds=2, max_cross_exam_questions_per_round=5),
    )

    class DummyPromptManager:
        def load_prompts(self, *args, **kwargs):
            return {
                "member_instructions": "member",
                "reviewer_instructions": "reviewer",
                "chairman_instructions": "chairman",
            }

    orch = CouncilOrchestrator(cfg, prompt_manager=DummyPromptManager())

    seen_questions: list[str] = []
    reviewer_calls = 0

    async def fake_member_drafts(*, base_chat_messages, member_models, member_instructions, max_tokens, temperature):
        return [CouncilCall(role="member", model=m, content=f"draft {m}") for m in member_models]

    async def fake_reviewer(*, base_chat_messages, reviewer_model, reviewer_instructions, member_outputs, existing_answer, max_tokens, temperature):
        nonlocal reviewer_calls
        reviewer_calls += 1
        if reviewer_calls == 1:
            return (
                CouncilCall(role="reviewer", model=reviewer_model, content="review"),
                CouncilReviewParsed(
                    resolved=False,
                    cross_exam_questions=["Reviewer Q1"],
                    notes_for_chairman="",
                ),
            )
        return (
            CouncilCall(role="reviewer", model=reviewer_model, content="review2"),
            CouncilReviewParsed(resolved=True, cross_exam_questions=[]),
        )

    async def fake_cross_exam(*, base_chat_messages, member_models, member_instructions, questions, max_tokens, temperature):
        seen_questions.extend(list(questions))
        return [CouncilCall(role="member", model=m, content=f"x {m}") for m in member_models]

    async def fake_chairman(*, base_chat_messages, chairman_model, chairman_instructions, member_outputs, reviewer_notes, existing_answer, max_tokens, temperature):
        return CouncilFinal(model=chairman_model, content="final")

    orch._run_member_drafts = fake_member_drafts  # type: ignore[method-assign]
    orch._run_reviewer = fake_reviewer  # type: ignore[method-assign]
    orch._run_cross_exam = fake_cross_exam  # type: ignore[method-assign]
    orch._run_chairman = fake_chairman  # type: ignore[method-assign]

    async def checkpoint_cb(event):
        assert event["round_index"] == 1
        return {"user_questions": ["User Q1"]}

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
            existing_answer=None,
            checkpoint_callback=checkpoint_cb,
        )

    asyncio.run(run())

    assert seen_questions == ["Reviewer Q1", "User Q1"]
