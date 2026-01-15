from pathlib import Path
import sys

project_root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(project_root))


def test_council_public_imports():
    from src.services.council import CouncilLogStore, CouncilOrchestrator, load_council_config

    assert CouncilLogStore is not None
    assert CouncilOrchestrator is not None
    assert callable(load_council_config)
