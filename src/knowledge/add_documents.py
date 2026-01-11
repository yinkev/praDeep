#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Incrementally add documents to existing knowledge base

This script allows adding new documents to an existing knowledge base,
rather than recreating the entire knowledge base.
Only newly added documents will be processed, without affecting the existing knowledge graph.
"""

import argparse
import asyncio
from datetime import datetime
import json
import os
from pathlib import Path
import shutil
import sys

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
# Add raganything module path
raganything_path = project_root.parent / "raganything" / "RAG-Anything"
if raganything_path.exists():
    sys.path.insert(0, str(raganything_path))

from dotenv import load_dotenv
from lightrag.llm.openai import openai_complete_if_cache
from lightrag.utils import EmbeddingFunc
from raganything import RAGAnything, RAGAnythingConfig

from src.services.embedding import get_embedding_client, get_embedding_config
from src.services.llm import get_llm_config

load_dotenv(dotenv_path=".env", override=False)

from src.logging import LightRAGLogContext, get_logger

logger = get_logger("KnowledgeInit")

# Import numbered items extraction functionality
from src.knowledge.document_tracker import DocumentStatus, DocumentTracker
from src.knowledge.extract_numbered_items import process_content_list


class DocumentAdder:
    """Add documents to existing knowledge base"""

    def __init__(
        self,
        kb_name: str,
        base_dir="./data/knowledge_bases",
        api_key: str = None,
        base_url: str = None,
        progress_tracker=None,
    ):
        self.kb_name = kb_name
        self.base_dir = Path(base_dir)
        self.kb_dir = self.base_dir / kb_name

        # Check if knowledge base exists
        if not self.kb_dir.exists():
            raise ValueError(f"Knowledge base does not exist: {kb_name}")

        # Directory structure
        self.raw_dir = self.kb_dir / "raw"
        self.images_dir = self.kb_dir / "images"
        self.rag_storage_dir = self.kb_dir / "rag_storage"
        self.content_list_dir = self.kb_dir / "content_list"

        # Check directory structure
        if not self.rag_storage_dir.exists():
            raise ValueError(
                f"Knowledge base not initialized: {kb_name}, please create knowledge base first"
            )

        self.api_key = api_key
        self.base_url = base_url
        self.embedding_cfg = get_embedding_config()
        self.llm_cfg = get_llm_config()
        self.progress_tracker = progress_tracker

        # Initialize document tracker for incremental indexing
        self.document_tracker = DocumentTracker(self.kb_dir)

    def get_existing_files(self) -> set:
        """Get list of existing documents"""
        existing_files = set()
        if self.raw_dir.exists():
            for file_path in self.raw_dir.glob("*"):
                if file_path.is_file():
                    existing_files.add(file_path.name)
        return existing_files

    def detect_document_changes(self) -> dict:
        """
        Detect document changes using content-hash based comparison.

        Returns:
            Dictionary with change summary including:
            - new_files: Files not yet indexed
            - modified_files: Files with changed content
            - deleted_files: Files removed from disk
            - unchanged_files: Files with no changes
        """
        logger.info("Detecting document changes using content hashes...")
        return self.document_tracker.get_incremental_summary()

    def add_documents(
        self,
        source_files: list[str],
        skip_duplicates: bool = True,
        force_reprocess: bool = False,
    ) -> tuple[list[Path], list[Path]]:
        """
        Add documents to knowledge base with content-hash based change detection.

        This method now uses SHA256 content hashes to detect:
        - New files (not yet in metadata)
        - Modified files (content changed since last indexing)
        - Unchanged files (content identical to last indexing)

        Args:
            source_files: List of document files to add
            skip_duplicates: Whether to skip unchanged files (uses hash comparison)
            force_reprocess: If True, reprocess even unchanged files

        Returns:
            Tuple of (new_files, modified_files) that need processing
        """
        logger.info(f"Adding documents to knowledge base '{self.kb_name}'...")
        logger.info("Using content-hash based change detection for incremental indexing")

        new_files = []
        modified_files = []
        skipped_files = []

        for source in source_files:
            source_path = Path(source)
            if not source_path.exists():
                logger.warning(f"  ⚠ Source file does not exist: {source}")
                continue

            # Calculate hash of source file
            source_hash = DocumentTracker.calculate_file_hash(source_path)

            # Check if file exists in raw directory
            dest_path = self.raw_dir / source_path.name
            if dest_path.exists():
                # Check if content has changed using document tracker
                tracked_info = self.document_tracker.get_document_info(source_path.name)

                if tracked_info:
                    if tracked_info.file_hash == source_hash and not force_reprocess:
                        if skip_duplicates:
                            logger.info(f"  → Skipped (unchanged): {source_path.name}")
                            skipped_files.append(source_path.name)
                            continue
                    else:
                        # Content has changed - mark as modified
                        logger.info(f"  ↻ Modified: {source_path.name} (content changed)")
                        shutil.copy2(source_path, dest_path)
                        modified_files.append(dest_path)
                        continue
                else:
                    # File exists but not tracked - treat as modified
                    logger.info(f"  ↻ Modified (untracked): {source_path.name}")
                    shutil.copy2(source_path, dest_path)
                    modified_files.append(dest_path)
                    continue
            else:
                # New file
                shutil.copy2(source_path, dest_path)
                new_files.append(dest_path)
                logger.info(f"  ✓ Added (new): {source_path.name}")

        if skipped_files:
            logger.info(f"\nSkipped {len(skipped_files)} unchanged files (content hash match)")

        if modified_files:
            logger.info(f"Detected {len(modified_files)} modified files (content hash mismatch)")

        logger.info(f"Successfully added {len(new_files)} new files")

        return new_files, modified_files

    async def cleanup_document_from_rag(self, filename: str) -> bool:
        """
        Clean up a document's data from RAG storage before reprocessing.

        This enables true incremental updates for modified documents by:
        1. Removing old chunks associated with the document
        2. Removing entities and relations linked to those chunks
        3. Clearing parse cache for the document

        Args:
            filename: Name of the document file to clean up

        Returns:
            True if cleanup was successful, False otherwise
        """
        logger.info(f"Cleaning up RAG data for modified document: {filename}")

        try:
            # Find document ID in doc_status
            doc_status_file = self.rag_storage_dir / "kv_store_doc_status.json"
            if doc_status_file.exists():
                with open(doc_status_file, encoding="utf-8") as f:
                    doc_status = json.load(f)

                # Find and remove entries for this document
                docs_to_remove = []
                for doc_id, info in doc_status.items():
                    if info.get("file_path") == filename:
                        docs_to_remove.append(doc_id)
                        logger.info(f"  Found RAG document: {doc_id}")

                for doc_id in docs_to_remove:
                    del doc_status[doc_id]
                    logger.info(f"  Removed document status: {doc_id}")

                # Save updated doc_status
                with open(doc_status_file, "w", encoding="utf-8") as f:
                    json.dump(doc_status, f, indent=2, ensure_ascii=False)

            # Clean up text chunks for this document
            chunks_file = self.rag_storage_dir / "kv_store_text_chunks.json"
            if chunks_file.exists():
                with open(chunks_file, encoding="utf-8") as f:
                    chunks = json.load(f)

                chunks_to_remove = []
                for chunk_id, chunk_info in chunks.items():
                    # Check if chunk belongs to this document
                    if isinstance(chunk_info, dict):
                        chunk_file = chunk_info.get("file_path", "")
                        if filename in chunk_file or filename.split(".")[0] in chunk_id:
                            chunks_to_remove.append(chunk_id)

                for chunk_id in chunks_to_remove:
                    del chunks[chunk_id]

                if chunks_to_remove:
                    logger.info(f"  Removed {len(chunks_to_remove)} text chunks")
                    with open(chunks_file, "w", encoding="utf-8") as f:
                        json.dump(chunks, f, indent=2, ensure_ascii=False)

            # Clean up full_docs for this document
            full_docs_file = self.rag_storage_dir / "kv_store_full_docs.json"
            if full_docs_file.exists():
                with open(full_docs_file, encoding="utf-8") as f:
                    full_docs = json.load(f)

                docs_to_remove = [
                    doc_id
                    for doc_id, info in full_docs.items()
                    if isinstance(info, dict) and filename in info.get("file_path", "")
                ]

                for doc_id in docs_to_remove:
                    del full_docs[doc_id]

                if docs_to_remove:
                    logger.info(f"  Removed {len(docs_to_remove)} full document entries")
                    with open(full_docs_file, "w", encoding="utf-8") as f:
                        json.dump(full_docs, f, indent=2, ensure_ascii=False)

            logger.info(f"  ✓ RAG cleanup complete for: {filename}")
            return True

        except Exception as e:
            logger.error(f"  ✗ RAG cleanup failed for {filename}: {e}")
            return False

    async def process_new_documents(
        self,
        new_files: list[Path],
        modified_files: list[Path] = None,
    ):
        """
        Process newly added and modified documents with incremental indexing.

        This method now supports:
        - Processing new files (added to RAG)
        - Processing modified files (RAG cleanup + re-add)
        - Tracking document hashes after successful processing

        Args:
            new_files: List of new files to process
            modified_files: List of modified files requiring RAG cleanup first

        Returns:
            List of successfully processed files
        """
        modified_files = modified_files or []
        all_files = list(new_files) + list(modified_files)

        if not all_files:
            logger.warning("No new or modified files to process")
            return None

        logger.info(f"\nProcessing {len(new_files)} new documents...")

        self.embedding_cfg = get_embedding_config()
        self.llm_cfg = get_llm_config()

        logger.info(
            f"Using: {self.embedding_cfg.model} "
            f"({self.embedding_cfg.dim}D, {self.embedding_cfg.binding})"
        )

        config = RAGAnythingConfig(
            working_dir=str(self.rag_storage_dir),
            parser="mineru",
            enable_image_processing=True,
            enable_table_processing=True,
            enable_equation_processing=True,
        )

        model = self.llm_cfg.model
        api_key = self.api_key or self.llm_cfg.api_key
        base_url = self.base_url or self.llm_cfg.base_url

        def llm_model_func(prompt, system_prompt=None, history_messages=[], **kwargs):
            return openai_complete_if_cache(
                model,
                prompt,
                system_prompt=system_prompt,
                history_messages=history_messages,
                api_key=api_key,
                base_url=base_url,
                **kwargs,
            )

        def vision_model_func(
            prompt,
            system_prompt=None,
            history_messages=[],
            image_data=None,
            messages=None,
            **kwargs,
        ):
            if messages:
                clean_kwargs = {
                    k: v
                    for k, v in kwargs.items()
                    if k not in ["messages", "prompt", "system_prompt", "history_messages"]
                }
                return openai_complete_if_cache(
                    model,
                    prompt="",
                    system_prompt=None,
                    history_messages=[],
                    messages=messages,
                    api_key=api_key,
                    base_url=base_url,
                    **clean_kwargs,
                )
            # Traditional single image format
            if image_data:
                clean_kwargs = {
                    k: v
                    for k, v in kwargs.items()
                    if k not in ["messages", "prompt", "system_prompt", "history_messages"]
                }
                return openai_complete_if_cache(
                    model,
                    prompt="",
                    system_prompt=None,
                    history_messages=[],
                    messages=[
                        {"role": "system", "content": system_prompt} if system_prompt else None,
                        (
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": prompt},
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:image/jpeg;base64,{image_data}"
                                        },
                                    },
                                ],
                            }
                            if image_data
                            else {"role": "user", "content": prompt}
                        ),
                    ],
                    api_key=api_key,
                    base_url=base_url,
                    **clean_kwargs,
                )
            return llm_model_func(prompt, system_prompt, history_messages, **kwargs)

        # Define embedding function using unified EmbeddingClient
        # Reset client to pick up latest config (including active provider from UI)
        from src.services.embedding import reset_embedding_client

        reset_embedding_client()

        embedding_cfg = get_embedding_config()  # Reload config
        embedding_client = get_embedding_client()  # Get fresh client with new config

        logger.info(
            f"Using embedding: {embedding_cfg.model} "
            f"({embedding_cfg.dim}D, {embedding_cfg.binding})"
        )

        # Create async wrapper compatible with LightRAG's expected signature
        async def unified_embed_func(texts):
            """
            Unified embedding function using EmbeddingClient.
            Supports multiple providers: OpenAI, Cohere, Jina, Ollama, etc.

            IMPORTANT: Must return numpy.ndarray, not List[List[float]].
            LightRAG internally calls .size on the embedding result to determine
            dimensions. If we return a plain Python list, this causes:
                AttributeError: 'list' object has no attribute 'size'
            Converting to np.array() provides the .size attribute LightRAG expects.
            """
            try:
                import numpy as np

                embeddings = await embedding_client.embed(texts)
                # Convert to numpy array - LightRAG requires .size attribute
                return np.array(embeddings)
            except Exception as e:
                logger.error(f"Embedding failed: {e}")
                raise

        embedding_func = EmbeddingFunc(
            embedding_dim=embedding_cfg.dim,
            max_token_size=embedding_cfg.max_tokens,
            func=unified_embed_func,
        )

        # Initialize RAGAnything with existing storage and log forwarding
        with LightRAGLogContext(scene="knowledge_init"):
            rag = RAGAnything(
                config=config,
                llm_model_func=llm_model_func,
                vision_model_func=vision_model_func,
                embedding_func=embedding_func,
            )

            # Ensure LightRAG is initialized (will load existing knowledge base)
            await rag._ensure_lightrag_initialized()
            logger.info("✓ Loaded existing knowledge base")

        # Clean up RAG data for modified files before reprocessing
        if modified_files:
            logger.info(f"\nCleaning up RAG data for {len(modified_files)} modified files...")
            for doc_file in modified_files:
                await self.cleanup_document_from_rag(doc_file.name)

        # Process all documents (new + modified)
        processed_files = []
        total_files = len(all_files)
        modified_file_names = {f.name for f in modified_files}

        for idx, doc_file in enumerate(all_files, 1):
            is_modified = doc_file.name in modified_file_names
            status_label = "modified" if is_modified else "new"
            logger.info(f"\nProcessing ({status_label}): {doc_file.name}")

            # Mark document as processing in tracker
            self.document_tracker.track_document(
                doc_file,
                status=DocumentStatus.PROCESSING,
            )

            is_pdf = doc_file.suffix.lower() == ".pdf"
            file_message = (
                "Parsing PDF with MinerU (this can take several minutes)..."
                if is_pdf
                else "Parsing document & building index..."
            )

            # Update progress
            if self.progress_tracker:
                from src.knowledge.progress_tracker import ProgressStage

                self.progress_tracker.update(
                    ProgressStage.PROCESSING_FILE,
                    file_message,
                    current=idx,
                    total=total_files,
                    file_name=doc_file.name,
                )

                async def _heartbeat():
                    # Keep the timestamp fresh during long MinerU/embedding runs so the UI doesn't look stuck.
                    while True:
                        await asyncio.sleep(15)
                        self.progress_tracker.update(
                            ProgressStage.PROCESSING_FILE,
                            file_message,
                            current=idx,
                            total=total_files,
                            file_name=doc_file.name,
                        )

            try:
                # Use RAGAnything's process_document_complete method with timeout
                logger.info("  → Starting document processing...")
                heartbeat_task = None
                if self.progress_tracker:
                    heartbeat_task = asyncio.create_task(_heartbeat())
                try:
                    await asyncio.wait_for(
                        rag.process_document_complete(
                            file_path=str(doc_file),
                            output_dir=str(self.content_list_dir),
                            parse_method="auto",
                        ),
                        timeout=600.0,  # 10 minute timeout
                    )
                finally:
                    if heartbeat_task:
                        heartbeat_task.cancel()
                        try:
                            await heartbeat_task
                        except asyncio.CancelledError:
                            pass
                logger.info(f"  ✓ Successfully processed: {doc_file.name}")
                processed_files.append(doc_file)

                # Track document with updated hash after successful processing
                self.document_tracker.track_document(
                    doc_file,
                    status=DocumentStatus.INDEXED,
                )
                logger.info(f"  ✓ Document hash tracked: {doc_file.name}")

                # Content list should be automatically saved
                doc_name = doc_file.stem
                content_list_file = self.content_list_dir / f"{doc_name}.json"
                if content_list_file.exists():
                    logger.info(f"  ✓ Content list saved: {content_list_file.name}")

            except asyncio.TimeoutError:
                logger.error(f"  ✗ Processing timeout for {doc_file.name} (>10 minutes)")
                logger.error(
                    "  Possible causes: Large PDF (MinerU parsing), slow embedding API, network issues"
                )

                # Track error status
                self.document_tracker.track_document(
                    doc_file,
                    status=DocumentStatus.ERROR,
                    error_message="Processing timeout (>10 minutes)",
                )

                if self.progress_tracker:
                    from src.knowledge.progress_tracker import ProgressStage

                    self.progress_tracker.update(
                        ProgressStage.ERROR,
                        f"Timeout processing: {doc_file.name}",
                        current=idx,
                        total=total_files,
                        error="Processing timeout (>10 minutes)",
                    )
            except Exception as e:
                logger.error(f"  ✗ Processing failed {doc_file.name}: {e!s}")
                import traceback

                logger.error(traceback.format_exc())

                # Track error status
                self.document_tracker.track_document(
                    doc_file,
                    status=DocumentStatus.ERROR,
                    error_message=str(e),
                )

                if self.progress_tracker:
                    from src.knowledge.progress_tracker import ProgressStage

                    self.progress_tracker.update(
                        ProgressStage.ERROR,
                        f"Error processing: {doc_file.name}",
                        current=idx,
                        total=total_files,
                        error=str(e),
                    )

        # Copy extracted images
        rag_images_dir = self.rag_storage_dir / "images"
        if rag_images_dir.exists():
            logger.info("\nCopying extracted images...")
            image_count = 0
            for img_file in rag_images_dir.glob("*"):
                if img_file.is_file():
                    dest = self.images_dir / img_file.name
                    if not dest.exists():
                        shutil.copy2(img_file, dest)
                        image_count += 1
            if image_count > 0:
                logger.info(f"  ✓ Copied {image_count} images")

        # Fix structure
        await self.fix_structure()

        logger.info("\n✓ Document processing completed!")

        return processed_files

    def _find_mineru_output_dir(self, doc_dir: Path) -> Path | None:
        """
        Find MinerU output directory within a document processing folder.

        MinerU creates different output directory names depending on the parsing
        backend/method used. This helper checks multiple patterns to locate the
        correct output directory containing extracted content.

        Directory patterns checked (in order of preference):
            - hybrid_auto: Created by hybrid-auto-engine backend (most common)
            - auto: Created by auto-engine backend
            - txt: Created by text-only extraction
            - ocr: Created by OCR-based extraction
            - vlm: Created by vision-language model backends

        If none of the known patterns match, falls back to finding any subdirectory
        that contains a *_content_list.json file.

        Args:
            doc_dir: Path to the document's processing directory
                     (e.g., content_list_dir/<document_name>/)

        Returns:
            Path to the MinerU output directory if found, None otherwise.

        Note:
            This fix addresses an issue where images extracted by MinerU weren't
            being copied to the KB's images/ folder. The original code only looked
            for 'auto/' directory, but MinerU's hybrid-auto backend creates
            'hybrid_auto/' instead.
        """
        # MinerU output patterns in order of preference
        # hybrid-auto-engine backend creates "hybrid_auto" directory
        # vlm backends create "vlm" directory
        patterns = ["hybrid_auto", "auto", "txt", "ocr", "vlm"]

        # Debug: list what's in doc_dir
        try:
            doc_dir_contents = list(doc_dir.iterdir())
            logger.info(
                f"    _find_mineru_output_dir: {doc_dir.name} contains: {[p.name for p in doc_dir_contents]}"
            )
        except Exception as e:
            logger.error(f"    _find_mineru_output_dir: Failed to list {doc_dir}: {e}")

        for pattern in patterns:
            output_dir = doc_dir / pattern
            if output_dir.exists() and output_dir.is_dir():
                logger.info(f"    Found MinerU output dir (pattern={pattern}): {output_dir}")
                return output_dir

        # Fallback: find any directory that contains _content_list.json
        try:
            for subdir in doc_dir.iterdir():
                if subdir.is_dir():
                    content_list_files = list(subdir.glob("*_content_list.json"))
                    if content_list_files:
                        logger.info(f"    Found MinerU output dir (fallback): {subdir}")
                        return subdir
        except (OSError, StopIteration):
            pass

        logger.info(f"    No MinerU output dir found in: {doc_dir}")
        return None

    async def fix_structure(self):
        """Fix nested directory structure"""
        logger.info("\nFixing directory structure...")
        logger.info(f"  content_list_dir: {self.content_list_dir}")
        logger.info(f"  images_dir: {self.images_dir}")

        # List what's in content_list_dir for debugging
        content_list_contents = list(self.content_list_dir.glob("*"))
        logger.info(f"  Content list directory contains: {[p.name for p in content_list_contents]}")

        # Find nested content lists
        content_list_moves = []
        for doc_dir in self.content_list_dir.glob("*"):
            if not doc_dir.is_dir():
                logger.debug(f"  Skipping non-directory: {doc_dir.name}")
                continue

            logger.info(f"  Processing doc_dir: {doc_dir.name}")
            output_dir = self._find_mineru_output_dir(doc_dir)
            if not output_dir:
                logger.warning(f"  No MinerU output dir found for: {doc_dir.name}")
                # Debug: list contents of doc_dir to understand structure
                try:
                    doc_dir_contents = list(doc_dir.iterdir())
                    logger.info(f"    doc_dir contents: {[p.name for p in doc_dir_contents]}")
                except Exception as e:
                    logger.error(f"    Failed to list doc_dir contents: {e}")
                continue

            logger.info(f"  Found MinerU output: {output_dir.name}")

            # Find the _content_list.json file
            for json_file in output_dir.glob("*_content_list.json"):
                target_file = self.content_list_dir / f"{doc_dir.name}.json"
                content_list_moves.append((json_file, target_file))
                logger.info(f"  Will move: {json_file.name} -> {target_file.name}")

        # Move content list files
        for source, target in content_list_moves:
            try:
                shutil.copy2(source, target)
                logger.info(f"  ✓ Moved: {source.name} -> {target.name}")
            except Exception as e:
                logger.error(f"  ✗ Move failed {source.name}: {e!s}")

        # Find and move nested images
        logger.info("  Scanning for nested images...")
        doc_dirs_found = list(self.content_list_dir.glob("*"))
        logger.info(f"  Found {len(doc_dirs_found)} items in content_list_dir for image scan")

        for doc_dir in doc_dirs_found:
            if not doc_dir.is_dir():
                logger.debug(f"  Skipping non-directory for images: {doc_dir.name}")
                continue

            logger.info(f"  Checking doc_dir for images: {doc_dir.name}")
            output_dir = self._find_mineru_output_dir(doc_dir)
            if not output_dir:
                logger.info(f"    No MinerU output dir found in {doc_dir.name}")
                continue

            logger.info(f"    Found output_dir: {output_dir}")
            images_dir = output_dir / "images"
            logger.info(f"    Looking for images at: {images_dir}")
            logger.info(f"    images_dir.exists(): {images_dir.exists()}")

            if images_dir.exists() and images_dir.is_dir():
                image_files = list(images_dir.glob("*"))
                logger.info(f"    Found {len(image_files)} files in images_dir")

                image_count = 0
                # Ensure target directory exists
                self.images_dir.mkdir(parents=True, exist_ok=True)

                for img_file in image_files:
                    if img_file.is_file() and img_file.exists():
                        target_img = self.images_dir / img_file.name
                        if not target_img.exists():
                            try:
                                # Ensure source file exists
                                if not img_file.exists():
                                    logger.warning(f"  ⚠ Source image does not exist: {img_file}")
                                    continue
                                shutil.copy2(img_file, target_img)
                                image_count += 1
                            except FileNotFoundError:
                                logger.error(
                                    f"  ✗ Failed to move image {img_file.name}: Source file does not exist: {img_file}"
                                )
                            except Exception as e:
                                logger.error(f"  ✗ Failed to move image {img_file.name}: {e!s}")
                        else:
                            logger.debug(f"    Image already exists: {img_file.name}")

                if image_count > 0:
                    logger.info(
                        f"  ✓ Moved {image_count} images from {doc_dir.name}/{output_dir.name}/images/"
                    )
                else:
                    logger.info(f"    No new images to move from {doc_dir.name}")
            else:
                logger.info(f"    No images directory found at {images_dir}")

        # Clean up nested directories
        for doc_dir in self.content_list_dir.glob("*"):
            if doc_dir.is_dir():
                try:
                    shutil.rmtree(doc_dir)
                    logger.info(f"  ✓ Cleaned: {doc_dir.name}/")
                except Exception as e:
                    logger.error(f"  ✗ Cleanup failed {doc_dir.name}: {e!s}")

        logger.info("✓ Directory structure fixed!")

    def extract_numbered_items_for_new_docs(
        self, processed_files: list[Path], batch_size: int = 20
    ):
        """
        Extract numbered items for newly added documents

        Args:
            processed_files: List of newly processed files
            batch_size: Number of items to process per batch
        """
        if not processed_files:
            logger.info("No new files need numbered items extraction")
            return

        logger.info("\n" + "=" * 60)
        logger.info("🔍 Extracting numbered items for new documents...")
        logger.info("=" * 60 + "\n")

        # Use credentials from config as fallback
        api_key = self.api_key or self.llm_cfg.api_key
        base_url = self.base_url or self.llm_cfg.base_url

        output_file = self.kb_dir / "numbered_items.json"

        try:
            for idx, doc_file in enumerate(processed_files, 1):
                doc_name = doc_file.stem
                content_list_file = self.content_list_dir / f"{doc_name}.json"

                if not content_list_file.exists():
                    logger.warning(f"Content list file not found: {content_list_file.name}")
                    continue

                logger.info(
                    f"\nProcessing file [{idx}/{len(processed_files)}]: {content_list_file.name}"
                )

                # Always merge to existing file (if exists)
                merge = output_file.exists()

                process_content_list(
                    content_list_file=content_list_file,
                    output_file=output_file,
                    api_key=api_key,
                    base_url=base_url,
                    batch_size=batch_size,
                    merge=merge,
                )

            logger.info(f"\n{'=' * 60}")
            logger.info("✓ Numbered items extraction complete!")
            logger.info(f"Output file: {output_file}")
            logger.info(f"{'=' * 60}\n")

        except Exception as e:
            logger.error(f"\n✗ Numbered items extraction failed: {e}")
            import traceback

            traceback.print_exc()

    def update_metadata(self, added_count: int):
        """Update knowledge base metadata"""
        metadata_file = self.kb_dir / "metadata.json"

        try:
            if metadata_file.exists():
                with open(metadata_file, encoding="utf-8") as f:
                    metadata = json.load(f)
            else:
                metadata = {}

            # Update modification time
            metadata["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # Record add operation
            if "update_history" not in metadata:
                metadata["update_history"] = []

            metadata["update_history"].append(
                {
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "action": "add_documents",
                    "files_added": added_count,
                }
            )

            with open(metadata_file, "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)

            logger.info("✓ Metadata updated")

        except Exception as e:
            logger.warning(f"Failed to update metadata: {e!s}")


async def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description="Incrementally add documents to existing knowledge base",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Usage examples:
  # Add a single document to knowledge base
  python add_documents.py ai_textbook --docs new_chapter.pdf

  # Add multiple documents to knowledge base
  python add_documents.py math2211 --docs chapter1.pdf chapter2.pdf

  # Add documents from directory
  python add_documents.py ai_textbook --docs-dir ./new_materials/

  # Allow overwriting files with same name
  python add_documents.py ai_textbook --docs document.pdf --allow-duplicates

  # Only add files, skip processing (process manually later)
  python add_documents.py ai_textbook --docs file.pdf --skip-processing

  # Skip numbered items extraction
  python add_documents.py ai_textbook --docs file.pdf --skip-extract
        """,
    )

    parser.add_argument("kb_name", help="Knowledge base name")
    parser.add_argument("--docs", nargs="+", help="Document files to add")
    parser.add_argument("--docs-dir", help="Directory containing documents to add")
    parser.add_argument(
        "--base-dir",
        default="./knowledge_bases",
        help="Knowledge base base directory (default: ./knowledge_bases)",
    )
    parser.add_argument("--api-key", default=os.getenv("LLM_API_KEY"), help="OpenAI API key")
    parser.add_argument("--base-url", default=os.getenv("LLM_HOST"), help="API base URL")
    parser.add_argument(
        "--allow-duplicates",
        action="store_true",
        help="Allow overwriting files with same name (default: skip)",
    )
    parser.add_argument(
        "--skip-processing", action="store_true", help="Only add files, skip document processing"
    )
    parser.add_argument(
        "--skip-extract", action="store_true", help="Skip numbered items extraction"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=20,
        help="Batch size for numbered items extraction (default: 20)",
    )

    args = parser.parse_args()

    # Check API key
    if not args.skip_processing and not args.api_key:
        logger.error("Error: OpenAI API key required")
        logger.error("Please set LLM_API_KEY environment variable or use --api-key option")
        return

    # Collect document files
    doc_files = []
    if args.docs:
        doc_files.extend(args.docs)

    if args.docs_dir:
        docs_dir = Path(args.docs_dir)
        if docs_dir.exists() and docs_dir.is_dir():
            for ext in ["*.pdf", "*.docx", "*.doc", "*.txt", "*.md"]:
                doc_files.extend([str(f) for f in docs_dir.glob(ext)])
        else:
            logger.error(f"Error: Document directory does not exist: {args.docs_dir}")
            return

    if not doc_files:
        logger.error("Error: No documents specified")
        logger.error("Use --docs or --docs-dir to specify documents to add")
        return

    # Initialize document adder
    try:
        adder = DocumentAdder(
            kb_name=args.kb_name,
            base_dir=args.base_dir,
            api_key=args.api_key,
            base_url=args.base_url,
        )
    except ValueError as e:
        logger.error(f"Error: {e!s}")
        return

    logger.info(f"\n{'=' * 60}")
    logger.info(f"Adding documents to knowledge base: {args.kb_name}")
    logger.info(f"{'=' * 60}\n")

    # Add documents to raw directory with content-hash based change detection
    new_files, modified_files = adder.add_documents(
        doc_files, skip_duplicates=not args.allow_duplicates
    )

    if not new_files and not modified_files:
        logger.info("\nNo new or modified files need processing")
        return

    # Show incremental summary
    total_to_process = len(new_files) + len(modified_files)
    logger.info("\nIncremental indexing summary:")
    logger.info(f"  New files: {len(new_files)}")
    logger.info(f"  Modified files: {len(modified_files)}")
    logger.info(f"  Total to process: {total_to_process}")

    # Process new and modified documents
    processed_files = []
    if not args.skip_processing:
        processed_files = await adder.process_new_documents(new_files, modified_files)
    else:
        logger.info("\nSkipping document processing (--skip-processing specified)")
        processed_files = list(new_files) + list(modified_files)

    # Extract numbered items for new documents
    if not args.skip_processing and not args.skip_extract and processed_files:
        adder.extract_numbered_items_for_new_docs(processed_files, batch_size=args.batch_size)
    elif args.skip_extract:
        logger.info("\nSkipping numbered items extraction (--skip-extract specified)")

    # Update metadata
    adder.update_metadata(len(new_files) + len(modified_files))

    logger.info(f"\n{'=' * 60}")
    logger.info(
        f"✓ Successfully added {len(new_files)} documents to knowledge base '{args.kb_name}'!"
    )
    logger.info(f"{'=' * 60}\n")


if __name__ == "__main__":
    # Logging configuration is done during module import, no need to configure again here
    asyncio.run(main())
