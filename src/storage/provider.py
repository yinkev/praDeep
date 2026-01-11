from __future__ import annotations

from abc import ABC, abstractmethod
from contextlib import contextmanager
from dataclasses import dataclass
from io import BytesIO
from typing import BinaryIO, Generator, Iterable, Literal


class StorageError(Exception):
    pass


OpenMode = Literal["rb", "wb", "ab"]


def _normalize_key(key: str) -> str:
    key = key.replace("\\", "/")
    while key.startswith("./"):
        key = key[2:]
    key = key.lstrip("/")
    return key


def join_key(*parts: str) -> str:
    normalized = []
    for part in parts:
        if part is None:
            continue
        p = _normalize_key(str(part))
        if not p:
            continue
        normalized.append(p.strip("/"))
    return "/".join(normalized)


@dataclass(frozen=True)
class DirListing:
    directories: list[str]
    files: list[str]


class StorageProvider(ABC):
    """
    Minimal storage abstraction for filesystem-like operations.

    Keys are POSIX-like paths (e.g., "data/user/solve/run_123/final_answer.md").
    Providers may treat directories as prefixes (e.g., S3).
    """

    @abstractmethod
    def exists(self, key: str) -> bool:
        raise NotImplementedError

    @abstractmethod
    def read_bytes(self, key: str) -> bytes:
        raise NotImplementedError

    @abstractmethod
    def write_bytes(self, key: str, data: bytes) -> None:
        raise NotImplementedError

    def read_text(self, key: str, encoding: str = "utf-8") -> str:
        return self.read_bytes(key).decode(encoding)

    def write_text(self, key: str, text: str, encoding: str = "utf-8") -> None:
        self.write_bytes(key, text.encode(encoding))

    @abstractmethod
    def delete(self, key: str) -> None:
        raise NotImplementedError

    @abstractmethod
    def list(self, prefix: str = "", recursive: bool = True) -> list[str]:
        raise NotImplementedError

    @abstractmethod
    def list_dir(self, prefix: str) -> DirListing:
        """
        List immediate children under a prefix.

        Returns:
            DirListing where `directories` and `files` are *names* (not full keys).
        """

    def makedirs(self, prefix: str) -> None:
        """
        Ensure a directory/prefix exists.

        Object stores may treat this as a no-op.
        """

    @contextmanager
    def open(self, key: str, mode: OpenMode = "rb") -> Generator[BinaryIO, None, None]:
        """
        A convenience for byte-oriented read/write.
        Providers should override for streaming if needed.
        """
        if mode not in ("rb", "wb", "ab"):
            raise ValueError(f"Unsupported mode: {mode}")

        normalized_key = _normalize_key(key)
        if mode == "rb":
            bio = BytesIO(self.read_bytes(normalized_key))
            yield bio
            return

        existing = b""
        if mode == "ab" and self.exists(normalized_key):
            existing = self.read_bytes(normalized_key)

        bio = BytesIO(existing)
        try:
            yield bio
        finally:
            self.write_bytes(normalized_key, bio.getvalue())

    def is_prefix(self, prefix: str) -> bool:
        normalized = join_key(prefix)
        if not normalized:
            return True
        listing = self.list(prefix=normalized, recursive=False)
        return len(listing) > 0

    def ensure_parent_dir(self, key: str) -> None:
        normalized = join_key(key)
        parent = "/".join(normalized.split("/")[:-1])
        if parent:
            self.makedirs(parent)

    def iter_prefixes(self, prefix: str) -> Iterable[str]:
        normalized = join_key(prefix)
        listing = self.list(prefix=normalized, recursive=True)
        return listing

