import asyncio

import src.agents.personalization.behavior_tracker as behavior_tracker_module
from src.agents.personalization.behavior_tracker import BehaviorTrackerAgent
from src.api.utils.user_memory import UserMemoryManager


def test_behavior_tracker_persists_strengths_and_improvements(tmp_path, monkeypatch):
    memory = UserMemoryManager(base_dir=str(tmp_path))
    monkeypatch.setattr(behavior_tracker_module, "get_user_memory_manager", lambda: memory)

    agent = BehaviorTrackerAgent(api_key=None, base_url=None, config={})

    async def fail_call_llm(*args, **kwargs):
        raise RuntimeError("LLM unavailable in tests")

    monkeypatch.setattr(agent, "call_llm", fail_call_llm)

    result = asyncio.run(agent.get_behavior_insights(user_id="test-user"))
    patterns = memory.get_learning_patterns(user_id="test-user")

    assert patterns.get("strength_areas") == result.get("strengths")
    assert patterns.get("improvement_areas") == result.get("improvement_areas")

