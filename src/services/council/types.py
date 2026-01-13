from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


CouncilRole = Literal["member", "reviewer", "chairman", "user"]


class CouncilCall(BaseModel):
    role: CouncilRole
    model: str
    content: str = ""
    error: str | None = None
    duration_s: float | None = None
    estimated_prompt_tokens: int | None = None
    estimated_completion_tokens: int | None = None
    message_id: str | None = None
    voice: str | None = None
    audio_url: str | None = None
    audio_path: str | None = None
    audio_error: str | None = None


class CouncilReviewParsed(BaseModel):
    resolved: bool = False
    issues: list[str] = Field(default_factory=list)
    disagreements: list[str] = Field(default_factory=list)
    cross_exam_questions: list[str] = Field(default_factory=list)
    notes_for_chairman: str = ""


class CouncilRound(BaseModel):
    round_index: int
    member_answers: list[CouncilCall] = Field(default_factory=list)
    cross_exam_questions: list[str] = Field(default_factory=list)
    cross_exam_answers: list[CouncilCall] = Field(default_factory=list)
    review: CouncilCall | None = None
    review_parsed: CouncilReviewParsed | None = None


class CouncilFinal(BaseModel):
    model: str
    content: str
    duration_s: float | None = None
    estimated_prompt_tokens: int | None = None
    estimated_completion_tokens: int | None = None
    voice: str | None = None
    audio_url: str | None = None
    audio_path: str | None = None
    audio_error: str | None = None


class CouncilRun(BaseModel):
    council_id: str
    created_at: float
    task: str
    question: str
    kb_name: str | None = None
    enable_rag: bool = False
    enable_web_search: bool = False
    models: dict[str, Any] = Field(default_factory=dict)
    budgets: dict[str, Any] = Field(default_factory=dict)
    context_excerpt: str = ""
    sources: dict[str, Any] = Field(default_factory=dict)
    rounds: list[CouncilRound] = Field(default_factory=list)
    final: CouncilFinal | None = None
    status: str = "ok"
    errors: list[str] = Field(default_factory=list)


__all__ = [
    "CouncilCall",
    "CouncilFinal",
    "CouncilReviewParsed",
    "CouncilRound",
    "CouncilRun",
]
