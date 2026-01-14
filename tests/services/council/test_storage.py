from pathlib import Path
import sys
import time


project_root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(project_root))


def test_council_log_store_roundtrip(tmp_path: Path):
    from src.services.council import CouncilLogStore, CouncilRun

    store = CouncilLogStore(base_dir=tmp_path)
    run = CouncilRun(
        council_id="council_test_1",
        created_at=time.time(),
        task="chat_verify",
        question="What is glycolysis?",
        status="ok",
    )

    path = store.save(run)
    assert path.exists()

    loaded = store.load("council_test_1", task="chat_verify")
    assert loaded is not None
    assert loaded.council_id == run.council_id
    assert loaded.task == run.task
    assert loaded.question == run.question

