"""
Knowledge Base API Router
=========================

Handles knowledge base CRUD operations, file uploads, and initialization.
"""

import asyncio
from datetime import datetime
from pathlib import Path
import shutil
import sys
import traceback

from fastapi import (
    APIRouter,
    BackgroundTasks,
    File,
    Form,
    HTTPException,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from pydantic import BaseModel

from src.api.utils.progress_broadcaster import ProgressBroadcaster
from src.api.utils.task_id_manager import TaskIDManager
from src.knowledge.add_documents import DocumentAdder
from src.knowledge.initializer import KnowledgeBaseInitializer
from src.knowledge.manager import KnowledgeBaseManager
from src.knowledge.progress_tracker import ProgressStage, ProgressTracker
from src.knowledge.document_tracker import DocumentTracker
from src.knowledge.version_manager import VersionManager, VersionType

_project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(_project_root))
from src.logging import get_logger
from src.services.config import load_config_with_main
from src.services.llm import get_llm_config

# Initialize logger with config
project_root = Path(__file__).parent.parent.parent.parent
config = load_config_with_main("solve_config.yaml", project_root)  # Use any config to get main.yaml
log_dir = config.get("paths", {}).get("user_log_dir") or config.get("logging", {}).get("log_dir")
logger = get_logger("Knowledge", level="INFO", log_dir=log_dir)

router = APIRouter()

_kb_base_dir = _project_root / "data" / "knowledge_bases"

# Lazy initialization
kb_manager = None


def get_kb_manager():
    """Get KnowledgeBaseManager instance (lazy init)"""
    global kb_manager
    if kb_manager is None:
        kb_manager = KnowledgeBaseManager(base_dir=str(_kb_base_dir))
    return kb_manager


class KnowledgeBaseInfo(BaseModel):
    name: str
    is_default: bool
    statistics: dict


class RefreshOptions(BaseModel):
    full: bool = False
    no_backup: bool = False
    skip_extract: bool = False
    batch_size: int = 20


async def run_initialization_task(initializer: KnowledgeBaseInitializer):
    """Background task for knowledge base initialization"""
    task_manager = TaskIDManager.get_instance()
    task_id = task_manager.generate_task_id("kb_init", initializer.kb_name)

    try:
        if not initializer.progress_tracker:
            initializer.progress_tracker = ProgressTracker(
                initializer.kb_name, initializer.base_dir
            )

        initializer.progress_tracker.task_id = task_id

        logger.info(f"[{task_id}] Initializing KB: {initializer.kb_name}")

        await initializer.process_documents()
        initializer.extract_numbered_items()

        initializer.progress_tracker.update(
            ProgressStage.COMPLETED, "Knowledge base initialization complete!", current=1, total=1
        )

        logger.success(f"[{task_id}] KB '{initializer.kb_name}' initialized")
        task_manager.update_task_status(task_id, "completed")
    except Exception as e:
        error_msg = str(e)

        logger.error(f"[{task_id}] KB '{initializer.kb_name}' init failed: {error_msg}")

        task_manager.update_task_status(task_id, "error", error=error_msg)

        if initializer.progress_tracker:
            initializer.progress_tracker.update(
                ProgressStage.ERROR, f"Initialization failed: {error_msg}", error=error_msg
            )


async def run_upload_processing_task(
    kb_name: str, base_dir: str, api_key: str, base_url: str, uploaded_file_paths: list[str]
):
    """Background task for processing uploaded files"""
    task_manager = TaskIDManager.get_instance()
    task_key = f"{kb_name}_upload_{len(uploaded_file_paths)}"
    task_id = task_manager.generate_task_id("kb_upload", task_key)

    progress_tracker = ProgressTracker(kb_name, Path(base_dir))
    progress_tracker.task_id = task_id

    try:
        logger.info(f"[{task_id}] Processing {len(uploaded_file_paths)} files to KB '{kb_name}'")
        progress_tracker.update(
            ProgressStage.PROCESSING_DOCUMENTS,
            f"Processing {len(uploaded_file_paths)} files...",
            current=0,
            total=len(uploaded_file_paths),
        )

        adder = DocumentAdder(
            kb_name=kb_name,
            base_dir=base_dir,
            api_key=api_key,
            base_url=base_url,
            progress_tracker=progress_tracker,
        )

        new_files = [Path(path) for path in uploaded_file_paths]
        processed_files = await adder.process_new_documents(new_files)

        if processed_files:
            progress_tracker.update(
                ProgressStage.EXTRACTING_ITEMS,
                "Extracting numbered items...",
                current=0,
                total=len(processed_files),
            )
            adder.extract_numbered_items_for_new_docs(processed_files, batch_size=20)

        adder.update_metadata(len(new_files))

        progress_tracker.update(
            ProgressStage.COMPLETED,
            f"Successfully processed {len(processed_files)} files!",
            current=len(processed_files),
            total=len(processed_files),
        )

        logger.success(f"[{task_id}] Processed {len(processed_files)} files to KB '{kb_name}'")
        task_manager.update_task_status(task_id, "completed")
    except Exception as e:
        error_msg = f"Upload processing failed (KB '{kb_name}'): {e}"
        logger.error(f"[{task_id}] {error_msg}")

        task_manager.update_task_status(task_id, "error", error=error_msg)

        progress_tracker.update(
            ProgressStage.ERROR, f"Processing failed: {error_msg}", error=error_msg
        )


async def run_refresh_task(
    kb_name: str,
    base_dir: str,
    api_key: str,
    base_url: str,
    options: RefreshOptions,
):
    """Background task for refreshing/rebuilding a knowledge base"""
    task_manager = TaskIDManager.get_instance()
    task_id = task_manager.generate_task_id("kb_refresh", kb_name)

    kb_path = Path(base_dir) / kb_name
    progress_tracker = ProgressTracker(kb_name, Path(base_dir))
    progress_tracker.task_id = task_id

    try:
        logger.info(f"[{task_id}] Starting refresh for KB '{kb_name}' (full={options.full})")

        # Step 1: Clean RAG storage (with optional backup)
        rag_storage_dir = kb_path / "rag_storage"
        if rag_storage_dir.exists():
            if not options.no_backup:
                # Create backup
                from datetime import datetime as dt
                backup_name = f"rag_storage_backup_{dt.now().strftime('%Y%m%d_%H%M%S')}"
                backup_dir = kb_path / backup_name
                logger.info(f"[{task_id}] Creating backup: {backup_name}")
                progress_tracker.update(
                    ProgressStage.INITIALIZING,
                    f"Creating backup of RAG storage...",
                    current=0,
                    total=0,
                )
                shutil.copytree(rag_storage_dir, backup_dir)
                logger.info(f"[{task_id}] Backup created at {backup_dir}")

            # Remove existing RAG storage
            logger.info(f"[{task_id}] Removing existing RAG storage")
            progress_tracker.update(
                ProgressStage.INITIALIZING,
                "Cleaning RAG storage...",
                current=0,
                total=0,
            )
            shutil.rmtree(rag_storage_dir)
            rag_storage_dir.mkdir(parents=True, exist_ok=True)

        # Step 2: If full refresh, also clean content_list and images
        if options.full:
            logger.info(f"[{task_id}] Full refresh: cleaning content_list and images")
            progress_tracker.update(
                ProgressStage.INITIALIZING,
                "Full refresh: cleaning content_list and images...",
                current=0,
                total=0,
            )

            content_list_dir = kb_path / "content_list"
            if content_list_dir.exists():
                shutil.rmtree(content_list_dir)
                content_list_dir.mkdir(parents=True, exist_ok=True)

            images_dir = kb_path / "images"
            if images_dir.exists():
                shutil.rmtree(images_dir)
                images_dir.mkdir(parents=True, exist_ok=True)

            # Also remove numbered_items.json if it exists
            numbered_items_file = kb_path / "numbered_items.json"
            if numbered_items_file.exists():
                numbered_items_file.unlink()

        # Step 3: Process documents using KnowledgeBaseInitializer
        logger.info(f"[{task_id}] Starting document processing")
        progress_tracker.update(
            ProgressStage.PROCESSING_DOCUMENTS,
            "Starting document processing...",
            current=0,
            total=0,
        )

        initializer = KnowledgeBaseInitializer(
            kb_name=kb_name,
            base_dir=base_dir,
            api_key=api_key,
            base_url=base_url,
            progress_tracker=progress_tracker,
        )

        await initializer.process_documents()

        # Step 4: Extract numbered items (unless skip_extract is True)
        if not options.skip_extract:
            logger.info(f"[{task_id}] Extracting numbered items")
            initializer.extract_numbered_items(batch_size=options.batch_size)
        else:
            logger.info(f"[{task_id}] Skipping numbered items extraction")

        progress_tracker.update(
            ProgressStage.COMPLETED,
            "Knowledge base refresh complete!",
            current=1,
            total=1,
        )

        logger.success(f"[{task_id}] KB '{kb_name}' refresh completed")
        task_manager.update_task_status(task_id, "completed")

    except Exception as e:
        error_msg = str(e)
        logger.error(f"[{task_id}] KB '{kb_name}' refresh failed: {error_msg}")
        logger.debug(traceback.format_exc())

        task_manager.update_task_status(task_id, "error", error=error_msg)

        progress_tracker.update(
            ProgressStage.ERROR,
            f"Refresh failed: {error_msg}",
            error=error_msg,
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        manager = get_kb_manager()
        config_exists = manager.config_file.exists()
        kb_count = len(manager.list_knowledge_bases())
        return {
            "status": "ok",
            "config_file": str(manager.config_file),
            "config_exists": config_exists,
            "base_dir": str(manager.base_dir),
            "base_dir_exists": manager.base_dir.exists(),
            "knowledge_bases_count": kb_count,
        }
    except Exception as e:
        return {"status": "error", "error": str(e), "traceback": traceback.format_exc()}


@router.get("/list", response_model=list[KnowledgeBaseInfo])
async def list_knowledge_bases():
    """List all available knowledge bases with their details."""
    try:
        manager = get_kb_manager()
        kb_names = manager.list_knowledge_bases()

        logger.info(f"Found {len(kb_names)} knowledge bases: {kb_names}")

        if not kb_names:
            logger.info("No knowledge bases found, returning empty list")
            return []

        result = []
        errors = []

        for name in kb_names:
            try:
                info = manager.get_info(name)
                logger.debug(f"Successfully got info for KB '{name}': {info.get('statistics', {})}")
                result.append(
                    KnowledgeBaseInfo(
                        name=info["name"],
                        is_default=info["is_default"],
                        statistics=info.get("statistics", {}),
                    )
                )
            except Exception as e:
                error_msg = f"Error getting info for KB '{name}': {e}"
                errors.append(error_msg)
                logger.warning(f"{error_msg}\n{traceback.format_exc()}")
                try:
                    kb_dir = manager.base_dir / name
                    if kb_dir.exists():
                        logger.info(f"KB '{name}' directory exists, creating fallback info")
                        result.append(
                            KnowledgeBaseInfo(
                                name=name,
                                is_default=name == manager.get_default(),
                                statistics={
                                    "raw_documents": 0,
                                    "images": 0,
                                    "content_lists": 0,
                                    "rag_initialized": False,
                                },
                            )
                        )
                except Exception as fallback_err:
                    logger.error(f"Fallback also failed for KB '{name}': {fallback_err}")

        if errors and not result:
            error_detail = f"Failed to load knowledge bases. Errors: {'; '.join(errors)}"
            logger.error(error_detail)
            raise HTTPException(status_code=500, detail=error_detail)

        if errors:
            logger.warning(
                f"Some KBs had errors, returning {len(result)} results. Errors: {errors}"
            )

        logger.info(f"Returning {len(result)} knowledge bases")
        return result
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error listing knowledge bases: {e}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to list knowledge bases: {e!s}")


@router.get("/{kb_name}")
async def get_knowledge_base_details(kb_name: str):
    """Get detailed info for a specific KB."""
    try:
        manager = get_kb_manager()
        return manager.get_info(kb_name)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Knowledge base '{kb_name}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{kb_name}")
async def delete_knowledge_base(kb_name: str):
    """Delete a knowledge base."""
    try:
        manager = get_kb_manager()
        success = manager.delete_knowledge_base(kb_name, confirm=True)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to delete knowledge base")
        logger.info(f"KB '{kb_name}' deleted")
        return {"message": f"Knowledge base '{kb_name}' deleted successfully"}
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Knowledge base '{kb_name}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{kb_name}/refresh")
async def refresh_knowledge_base(
    kb_name: str,
    background_tasks: BackgroundTasks,
    options: RefreshOptions = None,
):
    """Refresh/rebuild a knowledge base by reprocessing all documents.

    This endpoint triggers a background task that clears the RAG storage and
    reprocesses all documents in the knowledge base. Progress can be tracked
    via the WebSocket endpoint at `/api/v1/knowledge/{kb_name}/progress/ws`.

    Args:
        kb_name: Name of the knowledge base to refresh.
        options: Refresh options (all optional):
            - full (bool): If True, performs a full refresh that also cleans
              content_list, images, and numbered_items.json. Default: False.
            - no_backup (bool): If True, skips creating a backup of RAG storage
              before cleaning. Default: False (backup is created).
            - skip_extract (bool): If True, skips the numbered items extraction
              step after document processing. Default: False.
            - batch_size (int): Batch size for numbered items extraction.
              Default: 20.

    Returns:
        dict: Response containing:
            - message (str): Status message indicating refresh has started.
            - name (str): Name of the knowledge base being refreshed.
            - options (dict): The options used for this refresh operation.

    Raises:
        HTTPException 404: If the knowledge base does not exist.
        HTTPException 500: If there's an error starting the refresh task.

    Example:
        ```python
        import requests

        # Basic refresh (keeps backup, processes all)
        response = requests.post(
            "http://localhost:8783/api/v1/knowledge/my_kb/refresh"
        )

        # Full refresh with custom options
        response = requests.post(
            "http://localhost:8783/api/v1/knowledge/my_kb/refresh",
            json={
                "full": True,
                "no_backup": False,
                "skip_extract": False,
                "batch_size": 50
            }
        )
        ```
    """
    try:
        manager = get_kb_manager()
        kb_path = manager.get_knowledge_base_path(kb_name)

        # Verify KB exists
        if not kb_path.exists():
            raise HTTPException(status_code=404, detail=f"Knowledge base '{kb_name}' not found")

        # Get LLM config
        try:
            llm_config = get_llm_config()
            api_key = llm_config.api_key
            base_url = llm_config.base_url
        except ValueError as e:
            raise HTTPException(status_code=500, detail=f"LLM config error: {e!s}")

        # Use default options if none provided
        if options is None:
            options = RefreshOptions()

        logger.info(f"Starting refresh for KB '{kb_name}' (full={options.full}, no_backup={options.no_backup})")

        background_tasks.add_task(
            run_refresh_task,
            kb_name=kb_name,
            base_dir=str(_kb_base_dir),
            api_key=api_key,
            base_url=base_url,
            options=options,
        )

        return {
            "message": f"Refresh started for knowledge base '{kb_name}'. Processing in background.",
            "name": kb_name,
            "options": {
                "full": options.full,
                "no_backup": options.no_backup,
                "skip_extract": options.skip_extract,
                "batch_size": options.batch_size,
            },
        }

    except HTTPException:
        raise
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Knowledge base '{kb_name}' not found")
    except Exception as e:
        logger.error(f"Failed to start refresh for KB '{kb_name}': {e}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{kb_name}/upload")
async def upload_files(
    kb_name: str, background_tasks: BackgroundTasks, files: list[UploadFile] = File(...)
):
    """Upload files to a knowledge base and process them in background."""
    try:
        manager = get_kb_manager()
        kb_path = manager.get_knowledge_base_path(kb_name)
        raw_dir = kb_path / "raw"
        raw_dir.mkdir(parents=True, exist_ok=True)

        try:
            llm_config = get_llm_config()
            api_key = llm_config.api_key
            base_url = llm_config.base_url
        except ValueError as e:
            raise HTTPException(status_code=500, detail=f"LLM config error: {e!s}")

        uploaded_files = []
        uploaded_file_paths = []
        for file in files:
            file_path = raw_dir / file.filename
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            uploaded_files.append(file.filename)
            uploaded_file_paths.append(str(file_path))

        logger.info(f"Uploading {len(uploaded_files)} files to KB '{kb_name}'")

        background_tasks.add_task(
            run_upload_processing_task,
            kb_name=kb_name,
            base_dir=str(_kb_base_dir),
            api_key=api_key,
            base_url=base_url,
            uploaded_file_paths=uploaded_file_paths,
        )

        return {
            "message": f"Uploaded {len(uploaded_files)} files. Processing in background.",
            "files": uploaded_files,
        }
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Knowledge base '{kb_name}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create")
async def create_knowledge_base(
    background_tasks: BackgroundTasks, name: str = Form(...), files: list[UploadFile] = File(...)
):
    """Create a new knowledge base and initialize it with files."""
    try:
        manager = get_kb_manager()
        if name in manager.list_knowledge_bases():
            raise HTTPException(status_code=400, detail=f"Knowledge base '{name}' already exists")

        try:
            llm_config = get_llm_config()
            api_key = llm_config.api_key
            base_url = llm_config.base_url
        except ValueError as e:
            raise HTTPException(status_code=500, detail=f"LLM config error: {e!s}")

        progress_tracker = ProgressTracker(name, _kb_base_dir)

        logger.info(f"Creating KB: {name}")

        progress_tracker.update(
            ProgressStage.INITIALIZING, "Initializing knowledge base...", current=0, total=0
        )

        initializer = KnowledgeBaseInitializer(
            kb_name=name,
            base_dir=str(_kb_base_dir),
            api_key=api_key,
            base_url=base_url,
            progress_tracker=progress_tracker,
        )

        initializer.create_directory_structure()

        manager = get_kb_manager()
        if name not in manager.list_knowledge_bases():
            logger.warning(f"KB {name} not found in config, registering manually")
            initializer._register_to_config()

        uploaded_files = []
        for file in files:
            file_path = initializer.raw_dir / file.filename
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            uploaded_files.append(file.filename)

        progress_tracker.update(
            ProgressStage.PROCESSING_DOCUMENTS,
            f"Saved {len(uploaded_files)} files, preparing to process...",
            current=0,
            total=len(uploaded_files),
        )

        background_tasks.add_task(run_initialization_task, initializer)

        logger.success(f"KB '{name}' created, processing {len(uploaded_files)} files in background")

        return {
            "message": f"Knowledge base '{name}' created. Processing {len(uploaded_files)} files in background.",
            "name": name,
            "files": uploaded_files,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create KB: {e}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{kb_name}/progress")
async def get_progress(kb_name: str):
    """Get initialization progress for a knowledge base"""
    try:
        progress_tracker = ProgressTracker(kb_name, _kb_base_dir)
        progress = progress_tracker.get_progress()

        if progress is None:
            return {"status": "not_started", "message": "Initialization not started"}

        return progress
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{kb_name}/progress/clear")
async def clear_progress(kb_name: str):
    """Clear progress file for a knowledge base (useful for stuck states)"""
    try:
        progress_tracker = ProgressTracker(kb_name, _kb_base_dir)
        progress_tracker.clear()
        return {"status": "success", "message": f"Progress cleared for {kb_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/{kb_name}/progress/ws")
async def websocket_progress(websocket: WebSocket, kb_name: str):
    """WebSocket endpoint for real-time progress updates"""
    await websocket.accept()

    broadcaster = ProgressBroadcaster.get_instance()

    try:
        await broadcaster.connect(kb_name, websocket)

        progress_tracker = ProgressTracker(kb_name, _kb_base_dir)
        initial_progress = progress_tracker.get_progress()

        # Check if KB is already ready (has rag_storage)
        kb_dir = _kb_base_dir / kb_name
        rag_storage_dir = kb_dir / "rag_storage"
        kb_is_ready = rag_storage_dir.exists() and rag_storage_dir.is_dir()

        # Only send non-completed progress if KB is not ready
        # or if progress is recent (within 5 minutes)
        if initial_progress:
            stage = initial_progress.get("stage")
            timestamp = initial_progress.get("timestamp")

            should_send = False
            if stage in ["completed", "error"] or not kb_is_ready:
                should_send = True
            elif timestamp:
                # Check if progress is recent
                try:
                    progress_time = datetime.fromisoformat(timestamp)
                    now = datetime.now()
                    age_seconds = (now - progress_time).total_seconds()
                    if age_seconds < 300:  # 5 minutes
                        should_send = True
                except:
                    pass

            if should_send:
                await websocket.send_json({"type": "progress", "data": initial_progress})

        last_progress = initial_progress
        last_timestamp = initial_progress.get("timestamp") if initial_progress else None

        while True:
            try:
                try:
                    await asyncio.wait_for(websocket.receive_text(), timeout=1.0)
                except asyncio.TimeoutError:
                    current_progress = progress_tracker.get_progress()
                    if current_progress:
                        current_timestamp = current_progress.get("timestamp")
                        if current_timestamp != last_timestamp:
                            await websocket.send_json(
                                {"type": "progress", "data": current_progress}
                            )
                            last_progress = current_progress
                            last_timestamp = current_timestamp

                            if current_progress.get("stage") in ["completed", "error"]:
                                await asyncio.sleep(3)
                                break
                    continue

            except WebSocketDisconnect:
                break
            except Exception:
                break

    except Exception as e:
        logger.debug(f"Progress WS error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
    finally:
        await broadcaster.disconnect(kb_name, websocket)
        try:
            await websocket.close()
        except:
            pass


@router.get("/{kb_name}/documents")
async def get_document_status(kb_name: str):
    """
    Get document tracking status for a knowledge base.

    Returns information about all tracked documents including:
    - Document hashes for change detection
    - Processing status (new, indexed, modified, error)
    - File sizes and timestamps

    This endpoint supports the incremental indexing feature by exposing
    which documents have been indexed and their content hashes.
    """
    try:
        manager = get_kb_manager()
        kb_path = manager.get_knowledge_base_path(kb_name)

        tracker = DocumentTracker(kb_path)
        documents = tracker.get_all_tracked_documents()

        # Convert to serializable format
        result = {
            name: info.to_dict()
            for name, info in documents.items()
        }

        return {
            "kb_name": kb_name,
            "document_count": len(result),
            "documents": result,
        }
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Knowledge base '{kb_name}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{kb_name}/documents/changes")
async def get_document_changes(kb_name: str):
    """
    Detect document changes for incremental indexing.

    Returns a summary of what incremental processing would do:
    - new_files: Files added but not yet indexed
    - modified_files: Files with changed content (hash mismatch)
    - deleted_files: Files removed from disk but still in index
    - unchanged_files: Files with matching content hashes

    This endpoint allows users to preview what documents would be
    processed during an incremental update without actually running it.
    """
    try:
        manager = get_kb_manager()
        kb_path = manager.get_knowledge_base_path(kb_name)

        tracker = DocumentTracker(kb_path)
        summary = tracker.get_incremental_summary()

        return {
            "kb_name": kb_name,
            **summary,
        }
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Knowledge base '{kb_name}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Version Management Endpoints
# =============================================================================


class CreateVersionRequest(BaseModel):
    """Request body for creating a version snapshot"""
    description: str = ""
    created_by: str = "user"


class RollbackRequest(BaseModel):
    """Request body for rollback operation"""
    backup_current: bool = True


class CompareVersionsRequest(BaseModel):
    """Request body for version comparison"""
    version_1: str
    version_2: str


@router.post("/{kb_name}/versions")
async def create_version_snapshot(kb_name: str, request: CreateVersionRequest = None):
    """
    Create a new version snapshot of the knowledge base.

    This creates a complete snapshot of the current KB state including:
    - RAG storage (entities, relations, chunks)
    - Document tracking metadata
    - KB metadata

    Args:
        kb_name: Name of the knowledge base
        request: Optional request body with description and created_by

    Returns:
        dict containing version info for the created snapshot

    Raises:
        HTTPException 404: If the knowledge base does not exist
        HTTPException 500: If snapshot creation fails
    """
    try:
        manager = get_kb_manager()
        kb_path = manager.get_knowledge_base_path(kb_name)

        version_manager = VersionManager(kb_path)

        description = request.description if request else ""
        created_by = request.created_by if request else "user"

        logger.info(f"Creating version snapshot for KB '{kb_name}'")

        version_info = version_manager.create_snapshot(
            description=description,
            created_by=created_by,
            version_type=VersionType.MANUAL,
        )

        return {
            "message": f"Version snapshot created successfully",
            "version": version_info.to_dict(),
        }
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Knowledge base '{kb_name}' not found")
    except Exception as e:
        logger.error(f"Failed to create version snapshot for KB '{kb_name}': {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{kb_name}/versions")
async def list_versions(kb_name: str):
    """
    List all available versions for a knowledge base.

    Returns a list of all snapshots, sorted by creation time (newest first).

    Args:
        kb_name: Name of the knowledge base

    Returns:
        dict containing list of version info objects

    Raises:
        HTTPException 404: If the knowledge base does not exist
    """
    try:
        manager = get_kb_manager()
        kb_path = manager.get_knowledge_base_path(kb_name)

        version_manager = VersionManager(kb_path)
        versions = version_manager.list_versions()

        return {
            "kb_name": kb_name,
            "version_count": len(versions),
            "versions": [v.to_dict() for v in versions],
        }
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Knowledge base '{kb_name}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{kb_name}/versions/{version_id}")
async def get_version_details(kb_name: str, version_id: str):
    """
    Get detailed information for a specific version.

    Args:
        kb_name: Name of the knowledge base
        version_id: ID of the version to retrieve

    Returns:
        dict containing version info

    Raises:
        HTTPException 404: If KB or version not found
    """
    try:
        manager = get_kb_manager()
        kb_path = manager.get_knowledge_base_path(kb_name)

        version_manager = VersionManager(kb_path)
        version_info = version_manager.get_version(version_id)

        if version_info is None:
            raise HTTPException(status_code=404, detail=f"Version '{version_id}' not found")

        return {
            "kb_name": kb_name,
            "version": version_info.to_dict(),
        }
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Knowledge base '{kb_name}' not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def run_rollback_task(
    kb_name: str,
    base_dir: str,
    version_id: str,
    backup_current: bool,
):
    """Background task for rolling back to a previous version"""
    task_manager = TaskIDManager.get_instance()
    task_id = task_manager.generate_task_id("kb_rollback", f"{kb_name}_{version_id}")

    kb_path = Path(base_dir) / kb_name
    progress_tracker = ProgressTracker(kb_name, Path(base_dir))
    progress_tracker.task_id = task_id

    try:
        logger.info(f"[{task_id}] Starting rollback for KB '{kb_name}' to version '{version_id}'")

        progress_tracker.update(
            ProgressStage.INITIALIZING,
            f"Preparing rollback to version {version_id}...",
            current=0,
            total=3,
        )

        version_manager = VersionManager(kb_path)

        if backup_current:
            progress_tracker.update(
                ProgressStage.INITIALIZING,
                "Creating backup of current state...",
                current=1,
                total=3,
            )

        progress_tracker.update(
            ProgressStage.PROCESSING_DOCUMENTS,
            "Restoring version data...",
            current=2,
            total=3,
        )

        success = version_manager.rollback_to_version(
            version_id=version_id,
            backup_current=backup_current,
        )

        if success:
            progress_tracker.update(
                ProgressStage.COMPLETED,
                f"Rollback to version {version_id} completed!",
                current=3,
                total=3,
            )
            logger.success(f"[{task_id}] KB '{kb_name}' rolled back to version '{version_id}'")
            task_manager.update_task_status(task_id, "completed")
        else:
            error_msg = f"Rollback failed for version {version_id}"
            progress_tracker.update(
                ProgressStage.ERROR,
                error_msg,
                error=error_msg,
            )
            task_manager.update_task_status(task_id, "error", error=error_msg)

    except Exception as e:
        error_msg = f"Rollback failed: {e}"
        logger.error(f"[{task_id}] {error_msg}")

        task_manager.update_task_status(task_id, "error", error=error_msg)

        progress_tracker.update(
            ProgressStage.ERROR,
            error_msg,
            error=error_msg,
        )


@router.post("/{kb_name}/versions/{version_id}/rollback")
async def rollback_to_version(
    kb_name: str,
    version_id: str,
    background_tasks: BackgroundTasks,
    request: RollbackRequest = None,
):
    """
    Rollback knowledge base to a previous version.

    This restores the KB to the state captured in the specified version snapshot.
    By default, creates a backup of the current state before rollback.

    Args:
        kb_name: Name of the knowledge base
        version_id: ID of the version to rollback to
        request: Optional request body with backup_current flag

    Returns:
        dict with rollback status message

    Raises:
        HTTPException 404: If KB or version not found
        HTTPException 500: If rollback fails to start
    """
    try:
        manager = get_kb_manager()
        kb_path = manager.get_knowledge_base_path(kb_name)

        # Verify version exists
        version_manager = VersionManager(kb_path)
        version_info = version_manager.get_version(version_id)

        if version_info is None:
            raise HTTPException(status_code=404, detail=f"Version '{version_id}' not found")

        backup_current = request.backup_current if request else True

        logger.info(f"Starting rollback for KB '{kb_name}' to version '{version_id}' (backup={backup_current})")

        background_tasks.add_task(
            run_rollback_task,
            kb_name=kb_name,
            base_dir=str(_kb_base_dir),
            version_id=version_id,
            backup_current=backup_current,
        )

        return {
            "message": f"Rollback to version '{version_id}' started. Processing in background.",
            "kb_name": kb_name,
            "version_id": version_id,
            "backup_current": backup_current,
        }
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Knowledge base '{kb_name}' not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start rollback for KB '{kb_name}': {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{kb_name}/versions/compare")
async def compare_versions(kb_name: str, request: CompareVersionsRequest):
    """
    Compare two versions and show document changes.

    Returns the differences between two version snapshots including:
    - Documents added in version 2
    - Documents deleted in version 2
    - Documents modified between versions
    - Documents unchanged

    Args:
        kb_name: Name of the knowledge base
        request: Request body with version_1 and version_2 IDs

    Returns:
        dict with comparison results

    Raises:
        HTTPException 404: If KB or versions not found
    """
    try:
        manager = get_kb_manager()
        kb_path = manager.get_knowledge_base_path(kb_name)

        version_manager = VersionManager(kb_path)

        # Verify both versions exist
        v1_info = version_manager.get_version(request.version_1)
        v2_info = version_manager.get_version(request.version_2)

        if v1_info is None:
            raise HTTPException(status_code=404, detail=f"Version '{request.version_1}' not found")
        if v2_info is None:
            raise HTTPException(status_code=404, detail=f"Version '{request.version_2}' not found")

        comparison = version_manager.compare_versions(
            version_id_1=request.version_1,
            version_id_2=request.version_2,
        )

        if comparison is None:
            raise HTTPException(status_code=500, detail="Failed to compare versions")

        return {
            "kb_name": kb_name,
            "comparison": comparison.to_dict(),
            "version_1_info": v1_info.to_dict(),
            "version_2_info": v2_info.to_dict(),
        }
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Knowledge base '{kb_name}' not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{kb_name}/versions/{version_id}")
async def delete_version(kb_name: str, version_id: str):
    """
    Delete a version snapshot.

    Permanently removes the specified version snapshot from the knowledge base.

    Args:
        kb_name: Name of the knowledge base
        version_id: ID of the version to delete

    Returns:
        dict with deletion status

    Raises:
        HTTPException 404: If KB or version not found
        HTTPException 500: If deletion fails
    """
    try:
        manager = get_kb_manager()
        kb_path = manager.get_knowledge_base_path(kb_name)

        version_manager = VersionManager(kb_path)

        # Verify version exists
        version_info = version_manager.get_version(version_id)
        if version_info is None:
            raise HTTPException(status_code=404, detail=f"Version '{version_id}' not found")

        success = version_manager.delete_version(version_id)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete version")

        logger.info(f"Version '{version_id}' deleted from KB '{kb_name}'")

        return {
            "message": f"Version '{version_id}' deleted successfully",
            "kb_name": kb_name,
            "version_id": version_id,
        }
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Knowledge base '{kb_name}' not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
