import fcntl
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Iterator, Optional


class LedgerWriter:
    BASE_DIR = Path("data/user/guide_v2/ledger")

    def __init__(self, base_dir: Optional[Path] = None):
        self._base_dir = Path(base_dir) if base_dir else self.BASE_DIR
        self._base_dir.mkdir(parents=True, exist_ok=True)

    def _ledger_path(self, session_id: str) -> Path:
        return self._base_dir / f"{session_id}.jsonl"

    def append_event(self, session_id: str, event: dict[str, Any]) -> None:
        path = self._ledger_path(session_id)
        path.parent.mkdir(parents=True, exist_ok=True)

        event_with_meta = {
            "timestamp": datetime.utcnow().isoformat(),
            "session_id": session_id,
            **event,
        }

        line = json.dumps(event_with_meta, ensure_ascii=False) + "\n"
        encoded = line.encode("utf-8")

        fd = os.open(str(path), os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
        try:
            fcntl.flock(fd, fcntl.LOCK_EX)
            try:
                os.write(fd, encoded)
                os.fsync(fd)
            finally:
                fcntl.flock(fd, fcntl.LOCK_UN)
        finally:
            os.close(fd)

    def read_events(self, session_id: str) -> list[dict[str, Any]]:
        path = self._ledger_path(session_id)
        if not path.exists():
            return []

        events = []
        with open(path, "r", encoding="utf-8") as f:
            fcntl.flock(f.fileno(), fcntl.LOCK_SH)
            try:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            events.append(json.loads(line))
                        except json.JSONDecodeError:
                            continue
            finally:
                fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        return events

    def get_events_since(self, session_id: str, since: datetime) -> list[dict[str, Any]]:
        events = self.read_events(session_id)
        since_iso = since.isoformat()
        return [e for e in events if e.get("timestamp", "") >= since_iso]

    def iter_events(self, session_id: str) -> Iterator[dict[str, Any]]:
        path = self._ledger_path(session_id)
        if not path.exists():
            return

        with open(path, "r", encoding="utf-8") as f:
            fcntl.flock(f.fileno(), fcntl.LOCK_SH)
            try:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            yield json.loads(line)
                        except json.JSONDecodeError:
                            continue
            finally:
                fcntl.flock(f.fileno(), fcntl.LOCK_UN)
