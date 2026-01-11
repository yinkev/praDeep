from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class FilesystemSessionRepository:
    def __init__(self, base_dir: str | Path):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

        self.sessions_file = self.base_dir / "chat_sessions.json"
        self.ensure_file()

    def ensure_file(self) -> None:
        if not self.sessions_file.exists():
            self.save_data({"version": "1.0", "sessions": []})

    def load_data(self) -> dict[str, Any]:
        self.ensure_file()
        try:
            with open(self.sessions_file, encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {"version": "1.0", "sessions": []}

    def save_data(self, data: dict[str, Any]) -> None:
        self.base_dir.mkdir(parents=True, exist_ok=True)
        with open(self.sessions_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

