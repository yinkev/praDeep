import pytest

from src.api.utils.user_memory import UserMemoryManager


def test_record_interaction_records_session_duration(tmp_path):
    memory = UserMemoryManager(base_dir=str(tmp_path))

    memory.record_interaction(module="personalization", duration_seconds=120)
    patterns = memory.get_learning_patterns()
    assert patterns["session_count"] == 1
    assert patterns["average_session_length"] == pytest.approx(120.0)

    memory.record_interaction(module="personalization", duration_seconds=60)
    patterns = memory.get_learning_patterns()
    assert patterns["session_count"] == 2
    assert patterns["average_session_length"] == pytest.approx(90.0)

    memory.record_interaction(module="chat")
    patterns = memory.get_learning_patterns()
    assert patterns["session_count"] == 2

