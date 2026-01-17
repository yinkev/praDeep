import json
import os
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any, Optional


class ArtifactStore:
    BASE_DIR = Path("data/user/guide_v2/artifacts")

    def __init__(self, base_dir: Optional[Path] = None):
        self._base_dir = Path(base_dir) if base_dir else self.BASE_DIR
        self._base_dir.mkdir(parents=True, exist_ok=True)

    def _artifact_dir(self, session_id: str) -> Path:
        return self._base_dir / session_id

    def _artifact_path(self, session_id: str, objective_id: str) -> Path:
        return self._artifact_dir(session_id) / f"{objective_id}.json"

    def save_artifact(self, session_id: str, objective_id: str, artifact: dict[str, Any]) -> bool:
        path = self._artifact_path(session_id, objective_id)
        path.parent.mkdir(parents=True, exist_ok=True)

        artifact_with_meta = {
            **artifact,
            "session_id": session_id,
            "objective_id": objective_id,
            "updated_at": datetime.utcnow().isoformat(),
        }

        fd, tmp_path = tempfile.mkstemp(
            prefix=f"{objective_id}.", suffix=".tmp", dir=str(path.parent)
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(artifact_with_meta, f, ensure_ascii=False, indent=2)
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

    def load_artifact(self, session_id: str, objective_id: str) -> Optional[dict[str, Any]]:
        path = self._artifact_path(session_id, objective_id)
        if not path.exists():
            return None
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def list_artifacts(self, session_id: str) -> list[dict[str, Any]]:
        artifact_dir = self._artifact_dir(session_id)
        if not artifact_dir.exists():
            return []

        artifacts = []
        for file_path in artifact_dir.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    artifacts.append(
                        {
                            "objective_id": data.get("objective_id", file_path.stem),
                            "session_id": data.get("session_id", session_id),
                            "updated_at": data.get("updated_at"),
                            "artifact_type": data.get("artifact_type"),
                        }
                    )
            except (json.JSONDecodeError, OSError):
                continue

        return sorted(artifacts, key=lambda x: x.get("updated_at") or "", reverse=True)

    def delete_artifact(self, session_id: str, objective_id: str) -> bool:
        path = self._artifact_path(session_id, objective_id)
        if not path.exists():
            return False
        path.unlink()
        return True

    def delete_session_artifacts(self, session_id: str) -> int:
        artifact_dir = self._artifact_dir(session_id)
        if not artifact_dir.exists():
            return 0

        count = 0
        for file_path in artifact_dir.glob("*.json"):
            try:
                file_path.unlink()
                count += 1
            except OSError:
                continue

        try:
            artifact_dir.rmdir()
        except OSError:
            pass

        return count
