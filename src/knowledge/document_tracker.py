#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Document Tracker for Incremental Indexing

Provides content-hash based change detection for knowledge base documents.
Tracks document status, file hashes, and enables incremental updates.
"""

import hashlib
import json
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Optional

from src.logging import get_logger

logger = get_logger("DocumentTracker")


class DocumentStatus(str, Enum):
    """Document processing status"""
    NEW = "new"
    UNCHANGED = "unchanged"
    MODIFIED = "modified"
    DELETED = "deleted"
    PROCESSING = "processing"
    INDEXED = "indexed"
    ERROR = "error"


@dataclass
class DocumentInfo:
    """Information about a tracked document"""
    filename: str
    file_hash: str
    file_size: int
    last_modified: str
    indexed_at: Optional[str] = None
    status: str = DocumentStatus.NEW
    chunks_count: int = 0
    error_message: Optional[str] = None

    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "DocumentInfo":
        """Create from dictionary"""
        return cls(**data)


class DocumentTracker:
    """
    Tracks document changes using content hashes for incremental indexing.

    This class enables:
    - Detection of new files (not in metadata)
    - Detection of modified files (hash mismatch)
    - Detection of deleted files (in metadata but not on disk)
    - Per-document processing status tracking
    """

    TRACKING_KEY = "document_tracking"

    def __init__(self, kb_dir: Path):
        """
        Initialize document tracker.

        Args:
            kb_dir: Path to the knowledge base directory
        """
        self.kb_dir = Path(kb_dir)
        self.metadata_file = self.kb_dir / "metadata.json"
        self.raw_dir = self.kb_dir / "raw"
        self._metadata: dict = {}
        self._load_metadata()

    def _load_metadata(self) -> None:
        """Load metadata from file"""
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, encoding="utf-8") as f:
                    self._metadata = json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load metadata: {e}")
                self._metadata = {}

        # Ensure document_tracking key exists
        if self.TRACKING_KEY not in self._metadata:
            self._metadata[self.TRACKING_KEY] = {}

    def _save_metadata(self) -> None:
        """Save metadata to file"""
        try:
            # Update last_updated timestamp
            self._metadata["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            with open(self.metadata_file, "w", encoding="utf-8") as f:
                json.dump(self._metadata, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to save metadata: {e}")

    @staticmethod
    def calculate_file_hash(file_path: Path, algorithm: str = "sha256") -> str:
        """
        Calculate hash of file contents.

        Args:
            file_path: Path to the file
            algorithm: Hash algorithm to use (default: sha256)

        Returns:
            Hash string prefixed with algorithm name (e.g., "sha256:abc123...")
        """
        hash_func = hashlib.new(algorithm)

        with open(file_path, "rb") as f:
            # Read in chunks to handle large files
            for chunk in iter(lambda: f.read(8192), b""):
                hash_func.update(chunk)

        return f"{algorithm}:{hash_func.hexdigest()}"

    def get_document_info(self, filename: str) -> Optional[DocumentInfo]:
        """
        Get tracked information for a document.

        Args:
            filename: Name of the document file

        Returns:
            DocumentInfo if tracked, None otherwise
        """
        tracking = self._metadata.get(self.TRACKING_KEY, {})
        if filename in tracking:
            return DocumentInfo.from_dict(tracking[filename])
        return None

    def get_all_tracked_documents(self) -> dict[str, DocumentInfo]:
        """
        Get all tracked documents.

        Returns:
            Dictionary mapping filename to DocumentInfo
        """
        tracking = self._metadata.get(self.TRACKING_KEY, {})
        return {
            name: DocumentInfo.from_dict(info)
            for name, info in tracking.items()
        }

    def detect_changes(self) -> dict[str, DocumentStatus]:
        """
        Detect all document changes by comparing current files with tracked metadata.

        Returns:
            Dictionary mapping filename to detected status:
            - NEW: File exists on disk but not in metadata
            - MODIFIED: File exists but hash differs from metadata
            - UNCHANGED: File exists and hash matches metadata
            - DELETED: File in metadata but not on disk
        """
        changes: dict[str, DocumentStatus] = {}

        # Get currently tracked documents
        tracked = self._metadata.get(self.TRACKING_KEY, {})
        tracked_filenames = set(tracked.keys())

        # Get current files on disk
        current_files = set()
        if self.raw_dir.exists():
            for file_path in self.raw_dir.glob("*"):
                if file_path.is_file():
                    current_files.add(file_path.name)

        # Check for new and modified files
        for filename in current_files:
            file_path = self.raw_dir / filename

            if filename not in tracked_filenames:
                # New file
                changes[filename] = DocumentStatus.NEW
                logger.info(f"  [NEW] {filename}")
            else:
                # Check if modified
                current_hash = self.calculate_file_hash(file_path)
                stored_hash = tracked[filename].get("file_hash", "")

                if current_hash != stored_hash:
                    changes[filename] = DocumentStatus.MODIFIED
                    logger.info(f"  [MODIFIED] {filename} (hash changed)")
                else:
                    changes[filename] = DocumentStatus.UNCHANGED
                    logger.debug(f"  [UNCHANGED] {filename}")

        # Check for deleted files
        for filename in tracked_filenames:
            if filename not in current_files:
                changes[filename] = DocumentStatus.DELETED
                logger.info(f"  [DELETED] {filename}")

        return changes

    def track_document(
        self,
        file_path: Path,
        status: DocumentStatus = DocumentStatus.INDEXED,
        chunks_count: int = 0,
        error_message: Optional[str] = None,
    ) -> DocumentInfo:
        """
        Track a document with its current state.

        Args:
            file_path: Path to the document file
            status: Document status
            chunks_count: Number of chunks created during processing
            error_message: Error message if processing failed

        Returns:
            DocumentInfo with updated tracking information
        """
        file_path = Path(file_path)

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        file_stat = file_path.stat()

        doc_info = DocumentInfo(
            filename=file_path.name,
            file_hash=self.calculate_file_hash(file_path),
            file_size=file_stat.st_size,
            last_modified=datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
            indexed_at=datetime.now().isoformat() if status == DocumentStatus.INDEXED else None,
            status=status.value if isinstance(status, DocumentStatus) else status,
            chunks_count=chunks_count,
            error_message=error_message,
        )

        # Update tracking metadata
        tracking = self._metadata.get(self.TRACKING_KEY, {})
        tracking[file_path.name] = doc_info.to_dict()
        self._metadata[self.TRACKING_KEY] = tracking

        self._save_metadata()

        logger.debug(f"Tracked document: {file_path.name} (status={status})")

        return doc_info

    def update_document_status(
        self,
        filename: str,
        status: DocumentStatus,
        chunks_count: Optional[int] = None,
        error_message: Optional[str] = None,
    ) -> bool:
        """
        Update status of a tracked document.

        Args:
            filename: Name of the document file
            status: New status
            chunks_count: Optional updated chunks count
            error_message: Optional error message

        Returns:
            True if document was found and updated, False otherwise
        """
        tracking = self._metadata.get(self.TRACKING_KEY, {})

        if filename not in tracking:
            return False

        tracking[filename]["status"] = status.value if isinstance(status, DocumentStatus) else status

        if chunks_count is not None:
            tracking[filename]["chunks_count"] = chunks_count

        if error_message is not None:
            tracking[filename]["error_message"] = error_message

        if status == DocumentStatus.INDEXED:
            tracking[filename]["indexed_at"] = datetime.now().isoformat()

        self._save_metadata()

        return True

    def remove_document_tracking(self, filename: str) -> bool:
        """
        Remove tracking for a document (e.g., after deletion).

        Args:
            filename: Name of the document file

        Returns:
            True if document was found and removed, False otherwise
        """
        tracking = self._metadata.get(self.TRACKING_KEY, {})

        if filename not in tracking:
            return False

        del tracking[filename]
        self._save_metadata()

        logger.info(f"Removed tracking for: {filename}")

        return True

    def get_documents_to_process(self) -> tuple[list[str], list[str], list[str]]:
        """
        Get lists of documents that need processing.

        Returns:
            Tuple of (new_files, modified_files, deleted_files)
        """
        changes = self.detect_changes()

        new_files = [f for f, s in changes.items() if s == DocumentStatus.NEW]
        modified_files = [f for f, s in changes.items() if s == DocumentStatus.MODIFIED]
        deleted_files = [f for f, s in changes.items() if s == DocumentStatus.DELETED]

        return new_files, modified_files, deleted_files

    def get_incremental_summary(self) -> dict:
        """
        Get a summary of what incremental processing would do.

        Returns:
            Summary dictionary with counts and file lists
        """
        new_files, modified_files, deleted_files = self.get_documents_to_process()

        all_tracked = self.get_all_tracked_documents()
        unchanged_files = [
            name for name, info in all_tracked.items()
            if info.status == DocumentStatus.INDEXED.value
            and name not in modified_files
            and name not in deleted_files
        ]

        return {
            "new_count": len(new_files),
            "modified_count": len(modified_files),
            "deleted_count": len(deleted_files),
            "unchanged_count": len(unchanged_files),
            "new_files": new_files,
            "modified_files": modified_files,
            "deleted_files": deleted_files,
            "unchanged_files": unchanged_files,
            "total_tracked": len(all_tracked),
            "will_process": len(new_files) + len(modified_files),
            "will_skip": len(unchanged_files),
        }
