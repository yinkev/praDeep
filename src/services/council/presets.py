from __future__ import annotations

from dataclasses import replace

from .config import CouncilConfig


def apply_council_preset(cfg: CouncilConfig, *, preset: str) -> CouncilConfig:
    """
    Apply a named "depth" preset by returning a modified CouncilConfig.

    Presets are intentionally conservative so they can be overridden via solve_config.yaml.
    """
    key = (preset or "").strip().lower()
    if key in {"", "default", "standard"}:
        return cfg

    budgets = cfg.budgets

    if key in {"quick", "fast"}:
        return replace(cfg, budgets=replace(budgets, max_rounds=1))

    if key in {"deep", "thorough"}:
        return replace(
            cfg,
            budgets=replace(
                budgets,
                max_rounds=max(3, budgets.max_rounds),
                max_seconds_total=max(90.0, budgets.max_seconds_total),
                max_cross_exam_questions_per_round=min(12, budgets.max_cross_exam_questions_per_round),
            ),
        )

    return cfg


__all__ = ["apply_council_preset"]
