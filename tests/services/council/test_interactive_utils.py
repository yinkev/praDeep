from pathlib import Path
import sys

project_root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(project_root))


def test_extract_interjection_lines_splits_and_strips():
    from src.services.council.interactive_utils import extract_interjection_lines

    text = """
    1. What is glycolysis?
    - Compare to gluconeogenesis

    3) Explain the rate-limiting enzyme
    """

    lines = extract_interjection_lines(text)

    assert lines == [
        "What is glycolysis?",
        "Compare to gluconeogenesis",
        "Explain the rate-limiting enzyme",
    ]


def test_merge_cross_exam_questions_dedupes_and_limits():
    from src.services.council.interactive_utils import merge_cross_exam_questions

    reviewer = [" What is A? ", "What is B?", "What is A?"]
    user = ["What is C?", "what is b? ", ""]

    merged = merge_cross_exam_questions(reviewer, user, limit=4)

    assert merged == ["What is A?", "What is B?", "What is C?"]


def test_truncate_text_for_tts_caps_length():
    from src.services.council.interactive_utils import truncate_text_for_tts

    text = "a" * 5000
    truncated = truncate_text_for_tts(text, max_chars=4096)

    assert len(truncated) <= 4096
    assert truncated


def test_normalize_tts_voice_map_defaults_and_cycles():
    from src.services.council.interactive_utils import normalize_tts_voice_map

    voices = normalize_tts_voice_map(None, member_count=5)

    assert voices["chairman"] == "onyx"
    assert voices["reviewer"] == "echo"
    assert voices["members"] == ["nova", "fable", "shimmer", "alloy", "nova"]
