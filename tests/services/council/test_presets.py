from pathlib import Path
import sys

project_root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(project_root))


def test_apply_council_preset_quick_sets_max_rounds_1():
    from src.services.council.config import CouncilBudgets, CouncilConfig, CouncilModels
    from src.services.council.presets import apply_council_preset

    cfg = CouncilConfig(
        enabled=True,
        models=CouncilModels(),
        budgets=CouncilBudgets(
            max_rounds=2, max_seconds_total=45.0, max_cross_exam_questions_per_round=20
        ),
    )

    out = apply_council_preset(cfg, preset="quick")

    assert out.budgets.max_rounds == 1


def test_apply_council_preset_deep_increases_time_and_rounds_and_caps_questions():
    from src.services.council.config import CouncilBudgets, CouncilConfig, CouncilModels
    from src.services.council.presets import apply_council_preset

    cfg = CouncilConfig(
        enabled=True,
        models=CouncilModels(),
        budgets=CouncilBudgets(
            max_rounds=2, max_seconds_total=45.0, max_cross_exam_questions_per_round=20
        ),
    )

    out = apply_council_preset(cfg, preset="deep")

    assert out.budgets.max_rounds >= 3
    assert out.budgets.max_seconds_total >= 90.0
    assert out.budgets.max_cross_exam_questions_per_round == 12


def test_apply_council_preset_standard_returns_config_as_is():
    from src.services.council.config import CouncilBudgets, CouncilConfig, CouncilModels
    from src.services.council.presets import apply_council_preset

    budgets = CouncilBudgets(
        max_rounds=2, max_seconds_total=45.0, max_cross_exam_questions_per_round=20
    )
    cfg = CouncilConfig(enabled=True, models=CouncilModels(), budgets=budgets)

    out = apply_council_preset(cfg, preset="standard")

    assert out is cfg
