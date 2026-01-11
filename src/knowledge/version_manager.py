#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Knowledge Base Version Manager

Provides versioning capabilities for knowledge bases including:
- Create snapshots (versions) of knowledge base state
- List and retrieve version information
- Rollback to previous versions
- Compare versions to show document changes
- Delete old versions
"""

import json
import shutil
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Optional

from src.logging import get_logger

logger = get_logger("VersionManager")


class VersionType(str, Enum):
    """Type of version snapshot"""
    MANUAL = "manual"           # User-initiated snapshot
    AUTO_BACKUP = "auto_backup" # System backup before destructive operation
    PRE_ROLLBACK = "pre_rollback"  # Backup created before rollback


@dataclass
class VersionInfo:
    """Information about a knowledge base version"""
    version_id: str
    kb_name: str
    created_at: str
    description: str
    version_type: str
    created_by: str
    document_count: int
    storage_size_bytes: int
    metadata_snapshot: dict

    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "VersionInfo":
        """Create from dictionary"""
        return cls(**data)


@dataclass
class VersionComparison:
    """Result of comparing two versions"""
    version_1_id: str
    version_2_id: str
    documents_added: list
    documents_deleted: list
    documents_modified: list
    documents_unchanged: list
    summary: dict

    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return asdict(self)


class VersionManager:
    """
    Manages versioning for a knowledge base.

    Supports creating snapshots, listing versions, rollback, and comparison.
    Version data is stored in {kb_dir}/versions/ directory.
    """

    VERSIONS_DIR = "versions"
    VERSION_INDEX_FILE = "versions.json"
    VERSION_INFO_FILE = "version_info.json"
    DOCUMENT_TRACKING_FILE = "document_tracking.json"

    def __init__(self, kb_dir: Path):
        """
        Initialize version manager.

        Args:
            kb_dir: Path to the knowledge base directory
        """
        self.kb_dir = Path(kb_dir)
        self.kb_name = self.kb_dir.name
        self.versions_dir = self.kb_dir / self.VERSIONS_DIR
        self.version_index_file = self.versions_dir / self.VERSION_INDEX_FILE

        # Ensure versions directory exists
        self.versions_dir.mkdir(parents=True, exist_ok=True)

        self._version_index: dict = self._load_version_index()

    def _load_version_index(self) -> dict:
        """Load version index from file"""
        if self.version_index_file.exists():
            try:
                with open(self.version_index_file, encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load version index: {e}")

        return {"versions": [], "current_version": None}

    def _save_version_index(self) -> None:
        """Save version index to file"""
        try:
            with open(self.version_index_file, "w", encoding="utf-8") as f:
                json.dump(self._version_index, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to save version index: {e}")
            raise

    def _get_version_dir(self, version_id: str) -> Path:
        """Get directory path for a version"""
        return self.versions_dir / version_id

    def _calculate_dir_size(self, directory: Path) -> int:
        """Calculate total size of a directory in bytes"""
        total_size = 0
        try:
            for item in directory.rglob("*"):
                if item.is_file():
                    total_size += item.stat().st_size
        except Exception as e:
            logger.warning(f"Error calculating directory size: {e}")
        return total_size

    def _load_metadata(self) -> dict:
        """Load knowledge base metadata"""
        metadata_file = self.kb_dir / "metadata.json"
        if metadata_file.exists():
            try:
                with open(metadata_file, encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load metadata: {e}")
        return {}

    def _get_document_tracking(self) -> dict:
        """Get document tracking data from metadata"""
        metadata = self._load_metadata()
        return metadata.get("document_tracking", {})

    def _count_raw_documents(self) -> int:
        """Count documents in raw directory"""
        raw_dir = self.kb_dir / "raw"
        if raw_dir.exists():
            return len([f for f in raw_dir.iterdir() if f.is_file()])
        return 0

    def create_snapshot(
        self,
        description: str = "",
        created_by: str = "system",
        version_type: VersionType = VersionType.MANUAL,
    ) -> VersionInfo:
        """
        Create a new version snapshot of the knowledge base.

        Args:
            description: Optional description for this version
            created_by: Who created this version (e.g., "user", "system")
            version_type: Type of version (MANUAL, AUTO_BACKUP, PRE_ROLLBACK)

        Returns:
            VersionInfo for the created snapshot
        """
        # Generate version ID with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        version_id = f"v_{timestamp}_{uuid.uuid4().hex[:8]}"

        version_dir = self._get_version_dir(version_id)
        version_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"Creating snapshot '{version_id}' for KB '{self.kb_name}'")

        try:
            # Copy metadata.json
            metadata_file = self.kb_dir / "metadata.json"
            if metadata_file.exists():
                shutil.copy2(metadata_file, version_dir / "metadata.json")

            # Copy rag_storage directory
            rag_storage = self.kb_dir / "rag_storage"
            if rag_storage.exists():
                shutil.copytree(rag_storage, version_dir / "rag_storage")

            # Export document tracking separately for easy comparison
            document_tracking = self._get_document_tracking()
            tracking_file = version_dir / self.DOCUMENT_TRACKING_FILE
            with open(tracking_file, "w", encoding="utf-8") as f:
                json.dump(document_tracking, f, indent=2, ensure_ascii=False)

            # Get metadata snapshot
            metadata_snapshot = self._load_metadata()

            # Create version info
            version_info = VersionInfo(
                version_id=version_id,
                kb_name=self.kb_name,
                created_at=datetime.now().isoformat(),
                description=description,
                version_type=version_type.value if isinstance(version_type, VersionType) else version_type,
                created_by=created_by,
                document_count=self._count_raw_documents(),
                storage_size_bytes=self._calculate_dir_size(version_dir),
                metadata_snapshot={
                    "name": metadata_snapshot.get("name"),
                    "created_at": metadata_snapshot.get("created_at"),
                    "description": metadata_snapshot.get("description"),
                    "version": metadata_snapshot.get("version"),
                    "last_updated": metadata_snapshot.get("last_updated"),
                },
            )

            # Save version info in version directory
            info_file = version_dir / self.VERSION_INFO_FILE
            with open(info_file, "w", encoding="utf-8") as f:
                json.dump(version_info.to_dict(), f, indent=2, ensure_ascii=False)

            # Update version index
            self._version_index["versions"].append({
                "version_id": version_id,
                "created_at": version_info.created_at,
                "description": description,
                "version_type": version_info.version_type,
            })
            self._version_index["current_version"] = version_id
            self._save_version_index()

            logger.info(f"Snapshot '{version_id}' created successfully ({version_info.storage_size_bytes} bytes)")

            return version_info

        except Exception as e:
            # Cleanup on failure
            if version_dir.exists():
                shutil.rmtree(version_dir)
            logger.error(f"Failed to create snapshot: {e}")
            raise

    def list_versions(self) -> list[VersionInfo]:
        """
        List all available versions for this knowledge base.

        Returns:
            List of VersionInfo objects, sorted by creation time (newest first)
        """
        versions = []

        for version_entry in self._version_index.get("versions", []):
            version_id = version_entry.get("version_id")
            version_dir = self._get_version_dir(version_id)
            info_file = version_dir / self.VERSION_INFO_FILE

            if info_file.exists():
                try:
                    with open(info_file, encoding="utf-8") as f:
                        version_data = json.load(f)
                    versions.append(VersionInfo.from_dict(version_data))
                except Exception as e:
                    logger.warning(f"Failed to load version '{version_id}': {e}")

        # Sort by created_at, newest first
        versions.sort(key=lambda v: v.created_at, reverse=True)

        return versions

    def get_version(self, version_id: str) -> Optional[VersionInfo]:
        """
        Get details for a specific version.

        Args:
            version_id: ID of the version to retrieve

        Returns:
            VersionInfo if found, None otherwise
        """
        version_dir = self._get_version_dir(version_id)
        info_file = version_dir / self.VERSION_INFO_FILE

        if not info_file.exists():
            return None

        try:
            with open(info_file, encoding="utf-8") as f:
                version_data = json.load(f)
            return VersionInfo.from_dict(version_data)
        except Exception as e:
            logger.warning(f"Failed to load version '{version_id}': {e}")
            return None

    def rollback_to_version(
        self,
        version_id: str,
        backup_current: bool = True,
    ) -> bool:
        """
        Rollback knowledge base to a previous version.

        Args:
            version_id: ID of the version to rollback to
            backup_current: If True, create a backup of current state before rollback

        Returns:
            True if rollback successful, False otherwise
        """
        version_dir = self._get_version_dir(version_id)

        if not version_dir.exists():
            logger.error(f"Version '{version_id}' not found")
            return False

        logger.info(f"Rolling back KB '{self.kb_name}' to version '{version_id}'")

        try:
            # Create backup of current state if requested
            if backup_current:
                logger.info("Creating backup of current state before rollback")
                self.create_snapshot(
                    description=f"Auto-backup before rollback to {version_id}",
                    created_by="system",
                    version_type=VersionType.PRE_ROLLBACK,
                )

            # Remove current rag_storage
            current_rag = self.kb_dir / "rag_storage"
            if current_rag.exists():
                shutil.rmtree(current_rag)

            # Copy rag_storage from version
            version_rag = version_dir / "rag_storage"
            if version_rag.exists():
                shutil.copytree(version_rag, current_rag)
            else:
                current_rag.mkdir(parents=True, exist_ok=True)

            # Restore metadata.json
            version_metadata = version_dir / "metadata.json"
            current_metadata = self.kb_dir / "metadata.json"
            if version_metadata.exists():
                shutil.copy2(version_metadata, current_metadata)

            logger.info(f"Rollback to '{version_id}' completed successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to rollback to version '{version_id}': {e}")
            return False

    def compare_versions(
        self,
        version_id_1: str,
        version_id_2: str,
    ) -> Optional[VersionComparison]:
        """
        Compare two versions and show document changes.

        Args:
            version_id_1: First version ID (typically older)
            version_id_2: Second version ID (typically newer)

        Returns:
            VersionComparison with document changes, or None if versions not found
        """
        version_dir_1 = self._get_version_dir(version_id_1)
        version_dir_2 = self._get_version_dir(version_id_2)

        if not version_dir_1.exists() or not version_dir_2.exists():
            logger.error("One or both versions not found")
            return None

        # Load document tracking from both versions
        tracking_file_1 = version_dir_1 / self.DOCUMENT_TRACKING_FILE
        tracking_file_2 = version_dir_2 / self.DOCUMENT_TRACKING_FILE

        tracking_1 = {}
        tracking_2 = {}

        if tracking_file_1.exists():
            with open(tracking_file_1, encoding="utf-8") as f:
                tracking_1 = json.load(f)

        if tracking_file_2.exists():
            with open(tracking_file_2, encoding="utf-8") as f:
                tracking_2 = json.load(f)

        # Calculate differences
        files_1 = set(tracking_1.keys())
        files_2 = set(tracking_2.keys())

        added = []
        deleted = []
        modified = []
        unchanged = []

        # Files added in version 2
        for filename in files_2 - files_1:
            doc_info = tracking_2[filename]
            added.append({
                "filename": filename,
                "file_hash": doc_info.get("file_hash"),
                "file_size": doc_info.get("file_size"),
            })

        # Files deleted in version 2
        for filename in files_1 - files_2:
            doc_info = tracking_1[filename]
            deleted.append({
                "filename": filename,
                "file_hash": doc_info.get("file_hash"),
                "file_size": doc_info.get("file_size"),
            })

        # Files in both - check for modifications
        for filename in files_1 & files_2:
            hash_1 = tracking_1[filename].get("file_hash")
            hash_2 = tracking_2[filename].get("file_hash")

            if hash_1 != hash_2:
                modified.append({
                    "filename": filename,
                    "old_hash": hash_1,
                    "new_hash": hash_2,
                    "old_size": tracking_1[filename].get("file_size"),
                    "new_size": tracking_2[filename].get("file_size"),
                })
            else:
                unchanged.append({
                    "filename": filename,
                    "file_hash": hash_1,
                })

        comparison = VersionComparison(
            version_1_id=version_id_1,
            version_2_id=version_id_2,
            documents_added=added,
            documents_deleted=deleted,
            documents_modified=modified,
            documents_unchanged=unchanged,
            summary={
                "added_count": len(added),
                "deleted_count": len(deleted),
                "modified_count": len(modified),
                "unchanged_count": len(unchanged),
                "total_changes": len(added) + len(deleted) + len(modified),
            },
        )

        return comparison

    def delete_version(self, version_id: str) -> bool:
        """
        Delete a version snapshot.

        Args:
            version_id: ID of the version to delete

        Returns:
            True if deletion successful, False otherwise
        """
        version_dir = self._get_version_dir(version_id)

        if not version_dir.exists():
            logger.warning(f"Version '{version_id}' not found")
            return False

        try:
            # Remove from disk
            shutil.rmtree(version_dir)

            # Update version index
            self._version_index["versions"] = [
                v for v in self._version_index["versions"]
                if v.get("version_id") != version_id
            ]

            # Update current version if needed
            if self._version_index.get("current_version") == version_id:
                versions = self._version_index["versions"]
                self._version_index["current_version"] = (
                    versions[-1]["version_id"] if versions else None
                )

            self._save_version_index()

            logger.info(f"Version '{version_id}' deleted successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to delete version '{version_id}': {e}")
            return False

    def get_current_version_id(self) -> Optional[str]:
        """Get the ID of the most recent version"""
        return self._version_index.get("current_version")

    def get_version_count(self) -> int:
        """Get the total number of versions"""
        return len(self._version_index.get("versions", []))
