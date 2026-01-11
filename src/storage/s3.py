from __future__ import annotations

from contextlib import contextmanager
from io import BytesIO
from typing import Any, BinaryIO, Generator

from src.storage.provider import DirListing, OpenMode, StorageError, StorageProvider, _normalize_key


class S3StorageProvider(StorageProvider):
    """
    S3-compatible storage provider.

    Requires boto3 at runtime when this backend is selected.
    """

    def __init__(
        self,
        bucket: str,
        *,
        endpoint_url: str | None = None,
        region_name: str | None = None,
        access_key_id: str | None = None,
        secret_access_key: str | None = None,
        session_token: str | None = None,
        prefix: str = "",
    ):
        try:
            import boto3  # type: ignore
        except Exception as e:  # pragma: no cover
            raise StorageError(
                "boto3 is required for S3StorageProvider. Install with: pip install boto3"
            ) from e

        self.bucket = bucket
        self.prefix = _normalize_key(prefix).rstrip("/")
        session = boto3.session.Session(
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            aws_session_token=session_token,
            region_name=region_name,
        )
        self._client = session.client("s3", endpoint_url=endpoint_url)

    def _object_key(self, key: str) -> str:
        normalized = _normalize_key(key)
        if not self.prefix:
            return normalized
        if not normalized:
            return self.prefix
        return f"{self.prefix}/{normalized}"

    def exists(self, key: str) -> bool:
        obj_key = self._object_key(key)
        # Directory-like prefixes: check via list if no exact object exists
        try:
            self._client.head_object(Bucket=self.bucket, Key=obj_key)
            return True
        except Exception:
            # prefix existence
            prefix = obj_key.rstrip("/") + "/"
            resp = self._client.list_objects_v2(
                Bucket=self.bucket, Prefix=prefix, MaxKeys=1
            )
            return bool(resp.get("KeyCount", 0))

    def read_bytes(self, key: str) -> bytes:
        obj_key = self._object_key(key)
        resp = self._client.get_object(Bucket=self.bucket, Key=obj_key)
        body = resp["Body"].read()
        return body

    def write_bytes(self, key: str, data: bytes) -> None:
        obj_key = self._object_key(key)
        self._client.put_object(Bucket=self.bucket, Key=obj_key, Body=data)

    def delete(self, key: str) -> None:
        obj_key = self._object_key(key)
        # delete object
        try:
            self._client.delete_object(Bucket=self.bucket, Key=obj_key)
        except Exception:
            pass
        # delete prefix contents if treated as directory
        prefix = obj_key.rstrip("/") + "/"
        continuation_token: str | None = None
        while True:
            kwargs: dict[str, Any] = {"Bucket": self.bucket, "Prefix": prefix}
            if continuation_token:
                kwargs["ContinuationToken"] = continuation_token
            resp = self._client.list_objects_v2(**kwargs)
            contents = resp.get("Contents", [])
            if contents:
                delete_payload = {"Objects": [{"Key": o["Key"]} for o in contents]}
                self._client.delete_objects(Bucket=self.bucket, Delete=delete_payload)
            if not resp.get("IsTruncated"):
                break
            continuation_token = resp.get("NextContinuationToken")

    def list(self, prefix: str = "", recursive: bool = True) -> list[str]:
        obj_prefix = self._object_key(prefix)
        obj_prefix = obj_prefix.rstrip("/")
        if obj_prefix:
            obj_prefix = obj_prefix + "/"

        keys: list[str] = []
        continuation_token: str | None = None
        delimiter = None if recursive else "/"
        while True:
            kwargs: dict[str, Any] = {
                "Bucket": self.bucket,
                "Prefix": obj_prefix,
            }
            if delimiter:
                kwargs["Delimiter"] = delimiter
            if continuation_token:
                kwargs["ContinuationToken"] = continuation_token

            resp = self._client.list_objects_v2(**kwargs)
            for obj in resp.get("Contents", []):
                k = obj["Key"]
                if self.prefix and k.startswith(self.prefix + "/"):
                    k = k[len(self.prefix) + 1 :]
                keys.append(k)
            if not resp.get("IsTruncated"):
                break
            continuation_token = resp.get("NextContinuationToken")

        return sorted(set(keys))

    def list_dir(self, prefix: str) -> DirListing:
        obj_prefix = self._object_key(prefix).rstrip("/")
        if obj_prefix:
            obj_prefix = obj_prefix + "/"

        resp = self._client.list_objects_v2(
            Bucket=self.bucket, Prefix=obj_prefix, Delimiter="/", MaxKeys=1000
        )
        directories = []
        for cp in resp.get("CommonPrefixes", []):
            p = cp["Prefix"]
            name = p[len(obj_prefix) :].rstrip("/")
            if name:
                directories.append(name)

        files = []
        for obj in resp.get("Contents", []):
            k = obj["Key"]
            if not k.startswith(obj_prefix):
                continue
            name = k[len(obj_prefix) :]
            if name and "/" not in name:
                files.append(name)

        return DirListing(directories=sorted(set(directories)), files=sorted(set(files)))

    @contextmanager
    def open(self, key: str, mode: OpenMode = "rb") -> Generator[BinaryIO, None, None]:
        normalized = _normalize_key(key)
        if mode == "rb":
            yield BytesIO(self.read_bytes(normalized))
            return
        bio = BytesIO()
        try:
            yield bio
        finally:
            self.write_bytes(normalized, bio.getvalue())

