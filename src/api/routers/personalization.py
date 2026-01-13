"""
Personalization API Router
===========================

REST endpoints for AI-driven personalization features.
"""

import traceback
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.agents.personalization import LearningPathAgent, BehaviorTrackerAgent
from src.api.utils.history import ActivityType, history_manager
from src.api.utils.user_memory import get_user_memory_manager
from src.logging import get_logger
from src.services.config import load_config_with_main
from src.services.llm import get_llm_config
from pathlib import Path

router = APIRouter()


def load_config():
    project_root = Path(__file__).parent.parent.parent.parent
    return load_config_with_main("main.yaml", project_root)


config = load_config()
log_dir = config.get("paths", {}).get("user_log_dir")
logger = get_logger("PersonalizationAPI", log_dir=log_dir)


# ============================================================================
# Request/Response Models
# ============================================================================


class LearningStyleRequest(BaseModel):
    """Request model for learning style detection."""

    user_id: str = Field(default="default_user", description="User identifier")


class DifficultyRequest(BaseModel):
    """Request model for difficulty calibration."""

    topic: str = Field(..., description="Topic to calibrate for")
    user_id: str = Field(default="default_user", description="User identifier")


class LearningPathRequest(BaseModel):
    """Request model for learning path generation."""

    topic: str = Field(..., description="Topic to create learning path for")
    target_level: str = Field(
        default="intermediate",
        description="Target difficulty level: beginner, intermediate, or advanced",
    )
    user_id: str = Field(default="default_user", description="User identifier")


class SessionTrackingRequest(BaseModel):
    """Request model for session tracking."""

    module: str = Field(..., description="Module name (solve, research, etc.)")
    duration_seconds: Optional[float] = Field(None, description="Session duration in seconds")
    topic: Optional[str] = Field(None, description="Topic studied")
    success: bool = Field(default=True, description="Whether session was successful")
    user_id: str = Field(default="default_user", description="User identifier")


class BehaviorInsightsRequest(BaseModel):
    """Request model for behavior insights."""

    user_id: str = Field(default="default_user", description="User identifier")


# ============================================================================
# REST Endpoints
# ============================================================================


@router.post("/learning-style")
async def detect_learning_style(request: LearningStyleRequest) -> dict[str, Any]:
    """
    Detect user's learning style based on interaction history.

    Returns:
    - style: visual, auditory, or kinesthetic
    - confidence: 0-1 confidence score
    - evidence: supporting evidence for detection
    - recommendations: personalized recommendations
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

        # Create agent
        agent = LearningPathAgent(
            api_key=api_key,
            base_url=base_url,
            config=load_config(),
        )

        # Detect learning style
        result = await agent.detect_learning_style(user_id=request.user_id)

        # Save to history
        history_manager.add_entry(
            activity_type=ActivityType.ANALYZE,
            title="Learning Style Detection",
            content={
                "user_id": request.user_id,
                "style": result.get("style"),
                "confidence": result.get("confidence"),
            },
            summary=f"Detected learning style: {result.get('style')}",
        )

        return result

    except Exception as e:
        logger.error(f"Learning style detection error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/difficulty")
async def calibrate_difficulty(request: DifficultyRequest) -> dict[str, Any]:
    """
    Calibrate difficulty level for a specific topic.

    Returns:
    - level: beginner, intermediate, or advanced
    - confidence: 0-1 confidence score
    - reasoning: explanation for the calibration
    - suggested_next_steps: recommended actions
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

        # Create agent
        agent = LearningPathAgent(
            api_key=api_key,
            base_url=base_url,
            config=load_config(),
        )

        # Calibrate difficulty
        result = await agent.calibrate_difficulty(
            topic=request.topic,
            user_id=request.user_id,
        )

        # Save to history
        history_manager.add_entry(
            activity_type=ActivityType.ANALYZE,
            title=f"Difficulty Calibration: {request.topic}",
            content={
                "topic": request.topic,
                "level": result.get("level"),
                "confidence": result.get("confidence"),
            },
            summary=f"Calibrated level: {result.get('level')}",
        )

        return result

    except Exception as e:
        logger.error(f"Difficulty calibration error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/learning-path")
async def generate_learning_path(request: LearningPathRequest) -> dict[str, Any]:
    """
    Generate a personalized learning path for a topic.

    Returns:
    - overview: description of the learning path
    - estimated_total_hours: total time estimate
    - milestones: structured learning milestones with activities
    - tips: personalized success tips
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

        # Create agent
        agent = LearningPathAgent(
            api_key=api_key,
            base_url=base_url,
            config=load_config(),
        )

        # Generate learning path
        result = await agent.generate_learning_path(
            topic=request.topic,
            user_id=request.user_id,
            target_level=request.target_level,
        )

        # Save to history
        history_manager.add_entry(
            activity_type=ActivityType.PLAN,
            title=f"Learning Path: {request.topic}",
            content={
                "topic": request.topic,
                "target_level": request.target_level,
                "estimated_hours": result.get("estimated_total_hours"),
                "milestone_count": len(result.get("milestones", [])),
            },
            summary=f"Generated learning path with {len(result.get('milestones', []))} milestones",
        )

        return result

    except Exception as e:
        logger.error(f"Learning path generation error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/track-session")
async def track_session(request: SessionTrackingRequest) -> dict[str, str]:
    """
    Track a learning session for behavioral analytics.

    Records the session in user memory for pattern analysis.
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

        # Create agent
        agent = BehaviorTrackerAgent(
            api_key=api_key,
            base_url=base_url,
            config=load_config(),
        )

        # Track session
        session_data = {
            "module": request.module,
            "duration_seconds": request.duration_seconds,
            "topic": request.topic,
            "success": request.success,
        }

        result = await agent.track_session(
            user_id=request.user_id,
            session_data=session_data,
        )

        return result

    except Exception as e:
        logger.error(f"Session tracking error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/behavior-insights")
async def get_behavior_insights(user_id: str = "default_user") -> dict[str, Any]:
    """
    Get comprehensive behavioral insights for the user.

    Returns:
    - strengths: learning strengths
    - improvement_areas: areas for improvement
    - patterns: behavioral patterns (consistency, focus, etc.)
    - engagement_score: 0-1 engagement level
    - recommendations: personalized improvement suggestions
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

        # Create agent
        agent = BehaviorTrackerAgent(
            api_key=api_key,
            base_url=base_url,
            config=load_config(),
        )

        # Get insights
        result = await agent.get_behavior_insights(user_id=user_id)

        # Save to history
        history_manager.add_entry(
            activity_type=ActivityType.ANALYZE,
            title="Behavior Analysis",
            content={
                "user_id": user_id,
                "engagement_score": result.get("engagement_score"),
                "strengths_count": len(result.get("strengths", [])),
            },
            summary=f"Engagement level: {result.get('engagement_level')}",
        )

        return result

    except Exception as e:
        logger.error(f"Behavior insights error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize-schedule")
async def optimize_schedule(user_id: str = "default_user") -> dict[str, Any]:
    """
    Suggest optimal study schedule based on behavioral patterns.

    Returns:
    - optimal_schedule: time blocks with activities
    - energy_patterns: user's energy levels throughout the day
    - focus_tips: tips for maintaining focus
    - recommendations: schedule optimization suggestions
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

        # Create agent
        agent = BehaviorTrackerAgent(
            api_key=api_key,
            base_url=base_url,
            config=load_config(),
        )

        # Analyze peak hours
        result = await agent.analyze_peak_hours(user_id=user_id)

        # Save to history
        history_manager.add_entry(
            activity_type=ActivityType.PLAN,
            title="Schedule Optimization",
            content={
                "user_id": user_id,
                "peak_hours": result.get("peak_hours"),
                "confidence": result.get("confidence"),
            },
            summary=f"Peak hours: {', '.join(map(str, result.get('peak_hours', [])))}",
        )

        return result

    except Exception as e:
        logger.error(f"Schedule optimization error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/memory-context")
async def get_memory_context(user_id: str = "default_user") -> dict[str, Any]:
    """
    Get summarized memory context for personalization.

    Returns user preferences, topics, patterns, and recurring questions.
    """
    try:
        memory_manager = get_user_memory_manager()
        context = memory_manager.get_memory_context(user_id=user_id)
        return context

    except Exception as e:
        logger.error(f"Memory context error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
