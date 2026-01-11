from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class FilesystemKnowledgeBaseRepository:
    def __init__(self, base_dir: str | Path):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

        self.config_file = self.base_dir / "kb_config.json"
        self.ensure_config()

    def ensure_config(self) -> None:
        if not self.config_file.exists():
            self.save_config({"knowledge_bases": {}, "default": None})

    def load_config(self) -> dict[str, Any]:
        self.ensure_config()
        try:
            with open(self.config_file, encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            data = {"knowledge_bases": {}, "default": None}

        if "knowledge_bases" not in data or not isinstance(data.get("knowledge_bases"), dict):
            data["knowledge_bases"] = {}
        if "default" not in data:
            data["default"] = None
        return data

    def save_config(self, config: dict[str, Any]) -> None:
        self.base_dir.mkdir(parents=True, exist_ok=True)
        with open(self.config_file, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)

    def kb_dir(self, name: str) -> Path:
        return self.base_dir / name

    def kb_exists(self, name: str) -> bool:
        kb_dir = self.kb_dir(name)
        return kb_dir.exists() and kb_dir.is_dir()

    def load_metadata(self, name: str) -> dict[str, Any]:
        metadata_file = self.kb_dir(name) / "metadata.json"
        if not metadata_file.exists():
            return {}
        try:
            with open(metadata_file, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def save_metadata(self, name: str, metadata: dict[str, Any]) -> None:
        kb_dir = self.kb_dir(name)
        kb_dir.mkdir(parents=True, exist_ok=True)
        metadata_file = kb_dir / "metadata.json"
        with open(metadata_file, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)

    def delete_kb_dir(self, name: str) -> None:
        kb_dir = self.kb_dir(name)
        if not kb_dir.exists():
            return

        # Avoid importing shutil at module import time for faster cold starts elsewhere.
        import shutil

        shutil.rmtree(kb_dir)

