from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from src.storage.local import LocalFileSystemStorageProvider
from src.storage.memory import InMemoryStorageProvider
from src.storage.provider import StorageProvider
from src.storage.s3 import S3StorageProvider


def create_storage_provider(
    config: dict[str, Any] | None = None, *, project_root: Path | None = None
) -> StorageProvider:
    """
    Create a storage provider from config + env vars.

    Precedence:
      1) `STORAGE_BACKEND` env var
      2) `config.storage.backend`
      3) default: local filesystem rooted at project_root
    """
    storage_cfg = (config or {}).get("storage", {}) if isinstance(config, dict) else {}

    backend = (os.getenv("STORAGE_BACKEND") or storage_cfg.get("backend") or "local").lower()

    if project_root is None:
        from src.services.config.loader import PROJECT_ROOT

        project_root = PROJECT_ROOT

    if backend in ("local", "filesystem", "fs"):
        root_dir = (
            os.getenv("STORAGE_LOCAL_ROOT")
            or storage_cfg.get("local_root")
            or str(project_root)
        )
        return LocalFileSystemStorageProvider(root_dir=root_dir)

    if backend in ("memory", "mem", "in-memory", "in_memory"):
        return InMemoryStorageProvider()

    if backend in ("s3", "minio"):
        s3_cfg = storage_cfg.get("s3", {}) if isinstance(storage_cfg, dict) else {}
        bucket = os.getenv("S3_BUCKET") or s3_cfg.get("bucket")
        if not bucket:
            raise ValueError("S3 backend selected but bucket is not configured (S3_BUCKET)")

        return S3StorageProvider(
            bucket=bucket,
            endpoint_url=os.getenv("S3_ENDPOINT_URL") or s3_cfg.get("endpoint_url"),
            region_name=os.getenv("AWS_REGION") or s3_cfg.get("region"),
            access_key_id=os.getenv("AWS_ACCESS_KEY_ID") or s3_cfg.get("access_key_id"),
            secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY") or s3_cfg.get(
                "secret_access_key"
            ),
            session_token=os.getenv("AWS_SESSION_TOKEN") or s3_cfg.get("session_token"),
            prefix=os.getenv("S3_PREFIX") or s3_cfg.get("prefix", ""),
        )

    raise ValueError(f"Unsupported storage backend: {backend}")

