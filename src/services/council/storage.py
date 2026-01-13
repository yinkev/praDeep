from __future__ import annotations

import json
from pathlib import Path

from src.services.config import load_config_with_main

from .types import CouncilRun


def _project_root_from_here() -> Path:
    # Path(__file__) = src/services/council/storage.py
    return Path(__file__).resolve().parent.parent.parent.parent


class CouncilLogStore:
    def __init__(self, *, base_dir: Path | None = None, project_root: Path | None = None) -> None:
        self._project_root = project_root or _project_root_from_here()
        self._user_data_dir: Path | None = None

        if base_dir is not None:
            self._base_dir = Path(base_dir)
            return

        config = load_config_with_main("solve_config.yaml", self._project_root)
        user_data_dir = config.get("paths", {}).get("user_data_dir", "./data/user")
        user_data_path = (
            Path(user_data_dir)
            if Path(user_data_dir).is_absolute()
            else (self._project_root / user_data_dir)
        )
        self._user_data_dir = user_data_path
        self._base_dir = user_data_path / "council"

    def _task_dir(self, task: str) -> Path:
        return self._base_dir / task

    def run_log_path(self, council_id: str, *, task: str) -> Path:
        return self._task_dir(task) / f"{council_id}.json"

    def run_dir(self, council_id: str, *, task: str) -> Path:
        return self._task_dir(task) / council_id

    def audio_dir(self, council_id: str, *, task: str) -> Path:
        return self.run_dir(council_id, task=task) / "audio"

    def outputs_url_for_path(self, path: Path) -> str | None:
        """
        Convert an on-disk artifact path under data/user into a static outputs URL.
        Returns None if the store cannot compute a safe relative path.
        """
        if self._user_data_dir is None:
            return None
        try:
            rel = path.resolve().relative_to(self._user_data_dir.resolve())
        except Exception:
            return None
        return f"/api/outputs/{rel.as_posix()}"

    def save(self, run: CouncilRun) -> Path:
        task_dir = self._task_dir(run.task)
        task_dir.mkdir(parents=True, exist_ok=True)
        path = self.run_log_path(run.council_id, task=run.task)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(run.model_dump(), f, indent=2, ensure_ascii=False)
        return path

    def load(self, council_id: str, *, task: str) -> CouncilRun | None:
        path = self.run_log_path(council_id, task=task)
        if not path.exists():
            return None
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return CouncilRun.model_validate(data)


__all__ = ["CouncilLogStore"]
