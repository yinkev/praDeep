from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class FilesystemNotebookRepository:
    def __init__(self, base_dir: str | Path):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

        self.index_file = self.base_dir / "notebooks_index.json"
        self.ensure_index()

    def ensure_index(self) -> None:
        if not self.index_file.exists():
            self.save_index({"notebooks": []})

    def load_index(self) -> dict[str, Any]:
        self.ensure_index()
        try:
            with open(self.index_file, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"notebooks": []}

    def save_index(self, index: dict[str, Any]) -> None:
        self.base_dir.mkdir(parents=True, exist_ok=True)
        with open(self.index_file, "w", encoding="utf-8") as f:
            json.dump(index, f, indent=2, ensure_ascii=False)

    def notebook_file(self, notebook_id: str) -> Path:
        return self.base_dir / f"{notebook_id}.json"

    def load_notebook(self, notebook_id: str) -> dict[str, Any] | None:
        filepath = self.notebook_file(notebook_id)
        if not filepath.exists():
            return None
        try:
            with open(filepath, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def save_notebook(self, notebook: dict[str, Any]) -> None:
        filepath = self.notebook_file(notebook["id"])
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(notebook, f, indent=2, ensure_ascii=False)

    def delete_notebook_file(self, notebook_id: str) -> bool:
        filepath = self.notebook_file(notebook_id)
        if not filepath.exists():
            return False
        filepath.unlink()
        return True

