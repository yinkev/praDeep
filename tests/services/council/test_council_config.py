from pathlib import Path
import sys


project_root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(project_root))


def test_load_council_config_defaults_members_to_reviewer(tmp_path: Path):
    config_dir = tmp_path / "config"
    config_dir.mkdir(parents=True, exist_ok=True)
    (config_dir / "main.yaml").write_text(
        """
system:
  language: en

council:
  enabled: "yes"
  models:
    chairman: chair-model
    reviewer: review-model
  budgets:
    max_rounds: 1
""".lstrip(),
        encoding="utf-8",
    )

    from src.services.council import load_council_config

    cfg = load_council_config(tmp_path)

    assert cfg.enabled is True
    assert cfg.models.chairman == "chair-model"
    assert cfg.models.reviewer == "review-model"
    assert cfg.models.members == ["review-model"]
    assert cfg.budgets.max_rounds == 1
