import json
import os
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any, Optional


class LearnerModelStore:
    BASE_DIR = Path("data/user/guide_v2/users")

    def __init__(self, base_dir: Optional[Path] = None):
        self._base_dir = Path(base_dir) if base_dir else self.BASE_DIR
        self._base_dir.mkdir(parents=True, exist_ok=True)

    def _model_path(self, user_id: str) -> Path:
        return self._base_dir / user_id / "learner_model.json"

    def save_model(self, user_id: str, model: dict[str, Any]) -> bool:
        path = self._model_path(user_id)
        path.parent.mkdir(parents=True, exist_ok=True)

        model_with_meta = {
            **model,
            "user_id": user_id,
            "schema_version": model.get("schema_version", 1),
            "updated_at": datetime.utcnow().isoformat(),
        }

        fd, tmp_path = tempfile.mkstemp(
            prefix="learner_model.", suffix=".tmp", dir=str(path.parent)
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(model_with_meta, f, ensure_ascii=False, indent=2)
                f.flush()
                os.fsync(f.fileno())
            os.replace(tmp_path, path)
            return True
        except Exception:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass
            raise

    def load_model(self, user_id: str) -> Optional[dict[str, Any]]:
        path = self._model_path(user_id)
        if not path.exists():
            return None
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def update_objective_mastery(
        self,
        user_id: str,
        objective_id: str,
        mastery_level: float,
        evidence: Optional[dict[str, Any]] = None,
    ) -> bool:
        existing = self.load_model(user_id)
        model: dict[str, Any] = (
            existing
            if existing
            else {
                "user_id": user_id,
                "schema_version": 1,
                "objectives": {},
                "created_at": datetime.utcnow().isoformat(),
            }
        )

        objectives: dict[str, Any] = model.get("objectives", {})
        if not isinstance(objectives, dict):
            objectives = {}

        objectives[objective_id] = {
            "mastery_level": mastery_level,
            "updated_at": datetime.utcnow().isoformat(),
            "evidence": evidence or {},
        }
        model["objectives"] = objectives

        return self.save_model(user_id, model)

    def get_objective_mastery(self, user_id: str, objective_id: str) -> Optional[dict[str, Any]]:
        model = self.load_model(user_id)
        if not model:
            return None
        return model.get("objectives", {}).get(objective_id)
