from __future__ import annotations

from dataclasses import dataclass, field

from src.storage.provider import DirListing, StorageProvider, _normalize_key, join_key


@dataclass
class InMemoryStorageProvider(StorageProvider):
    """
    Simple in-memory provider for tests.

    Stores file objects as bytes by key. Directories are inferred from key prefixes.
    """

    _objects: dict[str, bytes] = field(default_factory=dict)

    def exists(self, key: str) -> bool:
        normalized = _normalize_key(key)
        if normalized in self._objects:
            return True
        # treat directories as prefixes
        prefix = normalized.rstrip("/") + "/"
        return any(k.startswith(prefix) for k in self._objects.keys())

    def read_bytes(self, key: str) -> bytes:
        normalized = _normalize_key(key)
        return self._objects[normalized]

    def write_bytes(self, key: str, data: bytes) -> None:
        normalized = _normalize_key(key)
        self._objects[normalized] = data

    def delete(self, key: str) -> None:
        normalized = _normalize_key(key)
        if normalized in self._objects:
            del self._objects[normalized]
            return
        prefix = normalized.rstrip("/") + "/"
        for k in [k for k in self._objects.keys() if k.startswith(prefix)]:
            del self._objects[k]

    def list(self, prefix: str = "", recursive: bool = True) -> list[str]:
        normalized = join_key(prefix)
        if not normalized:
            keys = list(self._objects.keys())
        else:
            p = normalized.rstrip("/") + "/"
            keys = [k for k in self._objects.keys() if k == normalized or k.startswith(p)]
        if recursive:
            return sorted(keys)
        listing = self.list_dir(normalized)
        out: list[str] = []
        for d in listing.directories:
            out.append(join_key(normalized, d))
        for f in listing.files:
            out.append(join_key(normalized, f))
        return sorted(out)

    def list_dir(self, prefix: str) -> DirListing:
        normalized = join_key(prefix)
        p = normalized.rstrip("/") + "/" if normalized else ""
        directories: set[str] = set()
        files: set[str] = set()
        for key in self._objects.keys():
            if p and not key.startswith(p):
                continue
            remainder = key[len(p) :] if p else key
            if not remainder:
                continue
            parts = remainder.split("/", 1)
            if len(parts) == 1:
                files.add(parts[0])
            else:
                directories.add(parts[0])
        return DirListing(directories=sorted(directories), files=sorted(files))

