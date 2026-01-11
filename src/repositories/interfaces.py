"""
Repository interfaces (Protocols).

These interfaces separate persistence concerns (filesystem/database) from business logic.
Filesystem implementations live in `src/repositories/filesystem/`.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Protocol


class KnowledgeBaseRepository(Protocol):
    """Persistence API for knowledge base configuration and metadata."""

    base_dir: Path

    def ensure_config(self) -> None: ...

    def load_config(self) -> dict[str, Any]: ...

    def save_config(self, config: dict[str, Any]) -> None: ...

    def kb_dir(self, name: str) -> Path: ...

    def kb_exists(self, name: str) -> bool: ...

    def load_metadata(self, name: str) -> dict[str, Any]: ...

    def save_metadata(self, name: str, metadata: dict[str, Any]) -> None: ...

    def delete_kb_dir(self, name: str) -> None: ...


class NotebookRepository(Protocol):
    """Persistence API for notebooks and notebook index."""

    base_dir: Path
    index_file: Path

    def ensure_index(self) -> None: ...

    def load_index(self) -> dict[str, Any]: ...

    def save_index(self, index: dict[str, Any]) -> None: ...

    def notebook_file(self, notebook_id: str) -> Path: ...

    def load_notebook(self, notebook_id: str) -> dict[str, Any] | None: ...

    def save_notebook(self, notebook: dict[str, Any]) -> None: ...

    def delete_notebook_file(self, notebook_id: str) -> bool: ...


class SessionRepository(Protocol):
    """Persistence API for chat sessions."""

    base_dir: Path
    sessions_file: Path

    def ensure_file(self) -> None: ...

    def load_data(self) -> dict[str, Any]: ...

    def save_data(self, data: dict[str, Any]) -> None: ...

