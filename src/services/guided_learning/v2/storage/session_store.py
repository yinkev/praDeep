import json
import os
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any, Optional


class SessionStore:
    BASE_DIR = Path("data/user/guide_v2/sessions")

    def __init__(self, base_dir: Optional[Path] = None):
        self._base_dir = Path(base_dir) if base_dir else self.BASE_DIR
        self._base_dir.mkdir(parents=True, exist_ok=True)

    def _session_path(self, session_id: str) -> Path:
        return self._base_dir / f"{session_id}.json"

    def save_session(self, session_id: str, data: dict[str, Any]) -> bool:
        path = self._session_path(session_id)
        path.parent.mkdir(parents=True, exist_ok=True)

        data_with_meta = {
            **data,
            "session_id": session_id,
            "updated_at": datetime.utcnow().isoformat(),
        }

        fd, tmp_path = tempfile.mkstemp(
            prefix=f"{session_id}.", suffix=".tmp", dir=str(path.parent)
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(data_with_meta, f, ensure_ascii=False, indent=2)
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

    def load_session(self, session_id: str) -> Optional[dict[str, Any]]:
        path = self._session_path(session_id)
        if not path.exists():
            return None
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def list_sessions(self) -> list[dict[str, Any]]:
        if not self._base_dir.exists():
            return []

        sessions = []
        for file_path in self._base_dir.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    sessions.append(
                        {
                            "session_id": data.get("session_id", file_path.stem),
                            "updated_at": data.get("updated_at"),
                            "created_at": data.get("created_at"),
                        }
                    )
            except (json.JSONDecodeError, OSError):
                continue

        return sorted(sessions, key=lambda x: x.get("updated_at") or "", reverse=True)

    def delete_session(self, session_id: str) -> bool:
        path = self._session_path(session_id)
        if not path.exists():
            return False
        path.unlink()
        return True
