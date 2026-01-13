from __future__ import annotations

import re


_LEADING_BULLET_RE = re.compile(r"^\s*(?:[-*•]+|\d+\s*[.)]|\d+\s*[-:]|[a-zA-Z]\s*[.)])\s+")
_WHITESPACE_RE = re.compile(r"\s+")
_DEFAULT_COUNCIL_TTS_VOICES = {
    "chairman": "onyx",
    "reviewer": "echo",
    "members": ["nova", "fable", "shimmer", "alloy"],
}


def extract_interjection_lines(text: str) -> list[str]:
    """
    Parse a free-form interjection text blob into a list of clean, single-line items.

    - Splits by newline
    - Strips whitespace
    - Removes leading bullets/numbering (e.g., "1.", "-", "3)")
    """
    if not text:
        return []

    lines: list[str] = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        line = _LEADING_BULLET_RE.sub("", line).strip()
        line = _WHITESPACE_RE.sub(" ", line).strip()
        if line:
            lines.append(line)
    return lines


def merge_cross_exam_questions(
    reviewer_questions: list[str] | None,
    user_questions: list[str] | None,
    *,
    limit: int,
) -> list[str]:
    """
    Merge reviewer + user cross-exam questions into a single ordered list.

    - Preserves first-seen ordering (reviewer first, then user additions)
    - Deduplicates case-insensitively
    - Enforces a hard item limit (>=1)
    """
    max_items = max(1, int(limit))
    merged: list[str] = []
    seen: set[str] = set()

    for question in (reviewer_questions or []) + (user_questions or []):
        q = (question or "").strip()
        if not q:
            continue
        q = _WHITESPACE_RE.sub(" ", q).strip()
        key = q.lower()
        if key in seen:
            continue
        seen.add(key)
        merged.append(q)
        if len(merged) >= max_items:
            break

    return merged


def truncate_text_for_tts(text: str, *, max_chars: int = 4096) -> str:
    """
    OpenAI-style TTS inputs are character-bounded. Keep output <= max_chars.
    """
    limit = max(1, int(max_chars))
    if not text:
        return ""

    cleaned = text.strip()
    if len(cleaned) <= limit:
        return cleaned

    if limit <= 3:
        return cleaned[:limit]

    truncated = cleaned[: limit - 3].rstrip()
    return truncated + "..."


def normalize_tts_voice_map(voices: dict | None, *, member_count: int) -> dict[str, object]:
    """
    Normalize a TTS voice map for council runs.

    Returns:
        {
          "chairman": str,
          "reviewer": str,
          "members": list[str]  # length == member_count (cycled as needed)
        }
    """
    member_n = max(0, int(member_count))
    raw = voices if isinstance(voices, dict) else {}

    chairman = str(raw.get("chairman") or _DEFAULT_COUNCIL_TTS_VOICES["chairman"]).strip()
    reviewer = str(raw.get("reviewer") or _DEFAULT_COUNCIL_TTS_VOICES["reviewer"]).strip()

    members_raw = raw.get("members")
    members_seed: list[str] = []
    if isinstance(members_raw, list):
        members_seed = [str(v).strip() for v in members_raw if str(v).strip()]
    elif isinstance(members_raw, str) and members_raw.strip():
        members_seed = [members_raw.strip()]

    if not members_seed:
        members_seed = list(_DEFAULT_COUNCIL_TTS_VOICES["members"])

    expanded: list[str] = []
    if member_n > 0:
        for i in range(member_n):
            expanded.append(members_seed[i % len(members_seed)])

    return {"chairman": chairman, "reviewer": reviewer, "members": expanded}


__all__ = [
    "extract_interjection_lines",
    "merge_cross_exam_questions",
    "normalize_tts_voice_map",
    "truncate_text_for_tts",
]
