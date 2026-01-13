from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from src.services.config import load_config_with_main


def _project_root_from_here() -> Path:
    # Path(__file__) = src/services/council/config.py
    # .parent.parent.parent.parent = project root
    return Path(__file__).resolve().parent.parent.parent.parent


def _as_bool(value: Any, default: bool) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        v = value.strip().lower()
        if v in {"1", "true", "yes", "y", "on"}:
            return True
        if v in {"0", "false", "no", "n", "off"}:
            return False
    return default


def _as_int(value: Any, default: int) -> int:
    try:
        return int(value)
    except Exception:
        return default


def _as_float(value: Any, default: float) -> float:
    try:
        return float(value)
    except Exception:
        return default


@dataclass
class CouncilModels:
    chairman: str = "gpt-4o-mini"
    reviewer: str = "gpt-4o-mini"
    members: list[str] = field(default_factory=list)


@dataclass
class CouncilBudgets:
    max_rounds: int = 2
    max_cross_exam_questions_per_round: int = 20
    max_seconds_total: float = 45.0
    member_max_tokens: int = 1200
    reviewer_max_tokens: int = 1200
    cross_exam_max_tokens: int = 800
    chairman_max_tokens: int = 1600
    member_temperature: float = 0.2
    reviewer_temperature: float = 0.2
    chairman_temperature: float = 0.2


@dataclass
class CouncilConfig:
    enabled: bool = False
    models: CouncilModels = field(default_factory=CouncilModels)
    budgets: CouncilBudgets = field(default_factory=CouncilBudgets)


def load_council_config(project_root: Path | None = None) -> CouncilConfig:
    """
    Load Council configuration from solve_config.yaml (via load_config_with_main).

    This intentionally keeps the config object as dataclasses so internal code can use
    attribute access and also safely serialize budgets via __dict__.
    """
    root = project_root or _project_root_from_here()
    config = load_config_with_main("solve_config.yaml", root)
    section = config.get("council") or {}
    if not isinstance(section, dict):
        section = {}

    enabled = _as_bool(section.get("enabled"), default=False)

    models_raw = section.get("models") or {}
    if not isinstance(models_raw, dict):
        models_raw = {}

    members_raw = models_raw.get("members") or []
    members: list[str] = []
    if isinstance(members_raw, list):
        members = [str(m).strip() for m in members_raw if str(m).strip()]
    elif isinstance(members_raw, str) and members_raw.strip():
        members = [members_raw.strip()]

    models = CouncilModels(
        chairman=str(models_raw.get("chairman") or CouncilModels.chairman).strip(),
        reviewer=str(models_raw.get("reviewer") or CouncilModels.reviewer).strip(),
        members=members,
    )
    if not models.members:
        # Ensure at least one member so the council can run.
        models.members = [models.reviewer]

    budgets_raw = section.get("budgets") or {}
    if not isinstance(budgets_raw, dict):
        budgets_raw = {}

    budgets = CouncilBudgets(
        max_rounds=max(1, _as_int(budgets_raw.get("max_rounds"), CouncilBudgets.max_rounds)),
        max_cross_exam_questions_per_round=max(
            1,
            _as_int(
                budgets_raw.get("max_cross_exam_questions_per_round"),
                CouncilBudgets.max_cross_exam_questions_per_round,
            ),
        ),
        max_seconds_total=max(
            5.0, _as_float(budgets_raw.get("max_seconds_total"), CouncilBudgets.max_seconds_total)
        ),
        member_max_tokens=max(
            128, _as_int(budgets_raw.get("member_max_tokens"), CouncilBudgets.member_max_tokens)
        ),
        reviewer_max_tokens=max(
            128, _as_int(budgets_raw.get("reviewer_max_tokens"), CouncilBudgets.reviewer_max_tokens)
        ),
        cross_exam_max_tokens=max(
            64,
            _as_int(
                budgets_raw.get("cross_exam_max_tokens"),
                CouncilBudgets.cross_exam_max_tokens,
            ),
        ),
        chairman_max_tokens=max(
            128, _as_int(budgets_raw.get("chairman_max_tokens"), CouncilBudgets.chairman_max_tokens)
        ),
        member_temperature=_as_float(
            budgets_raw.get("member_temperature"), CouncilBudgets.member_temperature
        ),
        reviewer_temperature=_as_float(
            budgets_raw.get("reviewer_temperature"), CouncilBudgets.reviewer_temperature
        ),
        chairman_temperature=_as_float(
            budgets_raw.get("chairman_temperature"), CouncilBudgets.chairman_temperature
        ),
    )

    return CouncilConfig(enabled=enabled, models=models, budgets=budgets)


__all__ = [
    "CouncilBudgets",
    "CouncilConfig",
    "CouncilModels",
    "load_council_config",
]
