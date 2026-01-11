from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path
from typing import BinaryIO, Generator

from src.storage.provider import DirListing, OpenMode, StorageProvider, _normalize_key, join_key


class LocalFileSystemStorageProvider(StorageProvider):
    def __init__(self, root_dir: str | Path):
        self.root_dir = Path(root_dir).resolve()

    def _path_for(self, key: str) -> Path:
        normalized = _normalize_key(key)
        return (self.root_dir / normalized).resolve()

    def exists(self, key: str) -> bool:
        return self._path_for(key).exists()

    def read_bytes(self, key: str) -> bytes:
        path = self._path_for(key)
        return path.read_bytes()

    def write_bytes(self, key: str, data: bytes) -> None:
        path = self._path_for(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def delete(self, key: str) -> None:
        path = self._path_for(key)
        if path.is_dir():
            for child in sorted(path.rglob("*"), reverse=True):
                if child.is_file() or child.is_symlink():
                    child.unlink(missing_ok=True)
                elif child.is_dir():
                    child.rmdir()
            path.rmdir()
            return
        path.unlink(missing_ok=True)

    def makedirs(self, prefix: str) -> None:
        path = self._path_for(prefix)
        path.mkdir(parents=True, exist_ok=True)

    def list(self, prefix: str = "", recursive: bool = True) -> list[str]:
        normalized = join_key(prefix)
        base = self._path_for(normalized) if normalized else self.root_dir
        if not base.exists():
            return []
        if base.is_file():
            return [normalized] if normalized else []
        keys: list[str] = []
        if recursive:
            for path in base.rglob("*"):
                if path.is_file():
                    rel = path.relative_to(self.root_dir).as_posix()
                    keys.append(rel)
        else:
            for path in base.iterdir():
                rel = path.relative_to(self.root_dir).as_posix()
                keys.append(rel)
        return sorted(keys)

    def list_dir(self, prefix: str) -> DirListing:
        normalized = join_key(prefix)
        base = self._path_for(normalized)
        if not base.exists() or not base.is_dir():
            return DirListing(directories=[], files=[])
        directories: list[str] = []
        files: list[str] = []
        for child in base.iterdir():
            if child.is_dir():
                directories.append(child.name)
            elif child.is_file():
                files.append(child.name)
        return DirListing(directories=sorted(directories), files=sorted(files))

    @contextmanager
    def open(self, key: str, mode: OpenMode = "rb") -> Generator[BinaryIO, None, None]:
        path = self._path_for(key)
        if mode in ("wb", "ab"):
            path.parent.mkdir(parents=True, exist_ok=True)
        with path.open(mode) as f:
            yield f

