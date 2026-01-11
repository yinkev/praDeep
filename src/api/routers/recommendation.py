"""
Paper Recommendation API Router
===============================

REST and WebSocket endpoints for ML-based paper recommendations.
"""

import asyncio
import traceback
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, WebSocket
from pydantic import BaseModel, Field

from src.agents.paper_recommender import PaperRecommendationWorkflow
from src.api.utils.history import ActivityType, history_manager
from src.api.utils.task_id_manager import TaskIDManager
from src.logging import get_logger
from src.services.config import load_config_with_main
from src.services.llm import get_llm_config
from src.services.paper_recommendation import get_paper_recommendation_service

router = APIRouter()


def load_config():
    project_root = Path(__file__).parent.parent.parent.parent
    return load_config_with_main("main.yaml", project_root)


config = load_config()
log_dir = config.get("paths", {}).get("user_log_dir")
logger = get_logger("RecommendationAPI", log_dir=log_dir)


# ============================================================================
# Request/Response Models
# ============================================================================


class RecommendationRequest(BaseModel):
    """Request model for paper recommendations."""

    query: str = Field(..., description="Research query or topic")
    seed_papers: Optional[list[str]] = Field(
        default=None, description="Paper IDs to base recommendations on"
    )
    max_results: int = Field(default=10, ge=1, le=50, description="Maximum number of results")
    recommendation_type: str = Field(
        default="hybrid",
        description="Recommendation type: semantic, citation, or hybrid",
    )
    year_start: Optional[int] = Field(default=None, description="Start year filter")
    year_end: Optional[int] = Field(default=None, description="End year filter")
    generate_explanation: bool = Field(default=True, description="Generate LLM explanation")
    suggest_topics: bool = Field(default=False, description="Suggest related topics")


class PaperInteractionRequest(BaseModel):
    """Request model for paper interactions."""

    paper_id: str = Field(..., description="Paper ID")
    interaction_type: str = Field(
        default="read", description="Interaction type: read or save"
    )


class PreferencesRequest(BaseModel):
    """Request model for updating preferences."""

    topics: list[str] = Field(..., description="Preferred research topics")


class PaperAnalysisRequest(BaseModel):
    """Request model for paper analysis."""

    paper_id: str = Field(..., description="Paper ID to analyze")
    query: str = Field(..., description="Context query for analysis")


# ============================================================================
# REST Endpoints
# ============================================================================


@router.post("/recommend")
async def get_recommendations(request: RecommendationRequest) -> dict[str, Any]:
    """
    Get paper recommendations based on query.

    This endpoint performs:
    1. Multi-source paper search (arXiv, Semantic Scholar, OpenAlex)
    2. ML-based scoring (semantic similarity, citations, recency)
    3. Optional LLM-powered explanation
    """
    try:
        # Get LLM config
        try:
            llm_config = get_llm_config()
            api_key = llm_config.api_key
            base_url = llm_config.base_url
        except Exception as e:
            logger.warning(f"LLM config not available: {e}")
            api_key = None
            base_url = None

        # Build year range if provided
        year_range = None
        if request.year_start or request.year_end:
            year_range = (
                request.year_start or 1990,
                request.year_end or 2030,
            )

        # Create workflow
        workflow = PaperRecommendationWorkflow(
            api_key=api_key,
            base_url=base_url,
            config=load_config(),
        )

        # Run recommendations
        result = await workflow.run(
            query=request.query,
            seed_papers=request.seed_papers,
            max_results=request.max_results,
            recommendation_type=request.recommendation_type,
            year_range=year_range,
            generate_explanation=request.generate_explanation,
            suggest_topics=request.suggest_topics,
        )

        # Save to history
        history_manager.add_entry(
            activity_type=ActivityType.RESEARCH,
            title=f"Paper Recommendations: {request.query[:50]}",
            content={
                "query": request.query,
                "recommendation_type": request.recommendation_type,
                "paper_count": len(result.get("papers", [])),
            },
            summary=f"Found {len(result.get('papers', []))} papers",
        )

        return result

    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_paper(request: PaperAnalysisRequest) -> dict[str, Any]:
    """Get detailed analysis of a specific paper."""
    try:
        llm_config = get_llm_config()

        workflow = PaperRecommendationWorkflow(
            api_key=llm_config.api_key,
            base_url=llm_config.base_url,
            config=load_config(),
        )

        result = await workflow.analyze_paper(
            paper_id=request.paper_id,
            query=request.query,
        )

        return result

    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/interaction")
async def record_interaction(request: PaperInteractionRequest) -> dict[str, str]:
    """Record user interaction with a paper (read or save)."""
    try:
        service = get_paper_recommendation_service()

        if request.interaction_type == "read":
            service.record_paper_read(request.paper_id)
        elif request.interaction_type == "save":
            service.record_paper_saved(request.paper_id)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid interaction type: {request.interaction_type}",
            )

        return {"status": "recorded", "paper_id": request.paper_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Interaction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_user_history() -> dict[str, Any]:
    """Get user's reading history and preferences."""
    try:
        service = get_paper_recommendation_service()
        history = service.get_user_history()
        return history.to_dict()

    except Exception as e:
        logger.error(f"History error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/preferences")
async def update_preferences(request: PreferencesRequest) -> dict[str, str]:
    """Update user's preferred research topics."""
    try:
        service = get_paper_recommendation_service()
        service.update_preferred_topics(request.topics)
        return {"status": "updated", "topics_count": len(request.topics)}

    except Exception as e:
        logger.error(f"Preferences error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_papers(
    query: str,
    limit: int = 10,
    source: str = "all",
) -> dict[str, Any]:
    """
    Quick paper search without full recommendation scoring.

    Useful for fast lookups and autocomplete.
    """
    try:
        service = get_paper_recommendation_service()

        papers = []
        if source in ["all", "semantic_scholar"]:
            ss_papers = await service.semantic_scholar.search_papers(query, limit)
            papers.extend(ss_papers)

        if source in ["all", "arxiv"]:
            arxiv_papers = await service.arxiv.search_papers(query, limit)
            papers.extend(arxiv_papers)

        if source in ["all", "openalex"]:
            oa_papers = await service.openalex.search_papers(query, limit)
            papers.extend(oa_papers)

        # Deduplicate
        seen = set()
        unique_papers = []
        for p in papers:
            if p.paper_id not in seen:
                seen.add(p.paper_id)
                unique_papers.append(p.to_dict())

        return {
            "query": query,
            "papers": unique_papers[:limit],
            "total": len(unique_papers),
        }

    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# WebSocket Endpoint for Real-time Updates
# ============================================================================


@router.websocket("/recommend/stream")
async def websocket_recommendations(websocket: WebSocket):
    """
    WebSocket endpoint for real-time recommendation updates.

    Streams progress events during the recommendation process.
    """
    await websocket.accept()
    task_manager = TaskIDManager.get_instance()

    try:
        # Receive request
        data = await websocket.receive_json()
        query = data.get("query")

        if not query:
            await websocket.send_json({"type": "error", "content": "Query is required"})
            return

        # Generate task ID
        task_key = f"recommendation_{hash(query)}"
        task_id = task_manager.generate_task_id("recommendation", task_key)

        await websocket.send_json({"type": "task_id", "task_id": task_id})

        # Get LLM config
        try:
            llm_config = get_llm_config()
            api_key = llm_config.api_key
            base_url = llm_config.base_url
        except Exception:
            api_key = None
            base_url = None

        # Progress callback
        progress_queue = asyncio.Queue()

        def progress_callback(event: dict[str, Any]):
            try:
                asyncio.get_event_loop().call_soon_threadsafe(
                    progress_queue.put_nowait, event
                )
            except Exception:
                pass

        # Progress pusher task
        async def progress_pusher():
            while True:
                try:
                    event = await progress_queue.get()
                    if event is None:
                        break
                    await websocket.send_json(event)
                except Exception:
                    break

        pusher_task = asyncio.create_task(progress_pusher())

        # Create workflow with progress callback
        workflow = PaperRecommendationWorkflow(
            api_key=api_key,
            base_url=base_url,
            config=load_config(),
            progress_callback=progress_callback,
        )

        # Build parameters
        year_range = None
        if data.get("year_start") or data.get("year_end"):
            year_range = (
                data.get("year_start", 1990),
                data.get("year_end", 2030),
            )

        # Run workflow
        await websocket.send_json({"type": "status", "content": "started"})

        result = await workflow.run(
            query=query,
            seed_papers=data.get("seed_papers"),
            max_results=data.get("max_results", 10),
            recommendation_type=data.get("recommendation_type", "hybrid"),
            year_range=year_range,
            generate_explanation=data.get("generate_explanation", True),
            suggest_topics=data.get("suggest_topics", False),
        )

        # Send final result
        await websocket.send_json({
            "type": "result",
            "data": result,
        })

        # Stop progress pusher
        await progress_queue.put(None)
        pusher_task.cancel()

        task_manager.update_task_status(task_id, "completed")

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.send_json({"type": "error", "content": str(e)})
