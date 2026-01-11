"""
Memory API Router
Manages persistent user memory: preferences, topics, patterns, and recurring questions.
"""

from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.api.utils.user_memory import get_user_memory_manager

router = APIRouter()


# ==================== Pydantic Models ====================


class PreferenceUpdate(BaseModel):
    """Update a single preference."""
    key: str = Field(..., description="Preference key (e.g., 'response_style')")
    value: Any = Field(..., description="New value for the preference")


class PreferencesUpdate(BaseModel):
    """Update multiple preferences at once."""
    preferences: dict[str, Any]


class TopicRecord(BaseModel):
    """Record a topic interaction."""
    topic: str = Field(..., min_length=1, description="Topic name")
    category: str | None = Field(None, description="Topic category")
    context: str | None = Field(None, description="Context of the interaction")
    related_topics: list[str] | None = Field(None, description="Related topics")


class InteractionRecord(BaseModel):
    """Record a user interaction."""
    module: str = Field(..., description="Module used (solve, chat, question, etc.)")
    duration_seconds: float | None = Field(None, description="Duration of interaction")
    topic: str | None = Field(None, description="Topic of interaction")
    success: bool = Field(True, description="Whether interaction was successful")


class QuestionRecord(BaseModel):
    """Record a question."""
    question: str = Field(..., min_length=1, description="The question asked")
    answer: str | None = Field(None, description="Optional answer provided")


class MemoryExport(BaseModel):
    """Memory export data."""
    preferences: dict[str, Any] | None = None
    topics: dict[str, Any] | None = None
    patterns: dict[str, Any] | None = None
    questions: dict[str, Any] | None = None


# ==================== Preferences Endpoints ====================


@router.get("/preferences")
async def get_preferences():
    """
    Get all user preferences.

    Returns user's stored preferences for personalization.
    """
    memory = get_user_memory_manager()
    return {"preferences": memory.get_preferences()}


@router.put("/preferences")
async def update_preferences(update: PreferencesUpdate):
    """
    Update multiple preferences at once.

    Args:
        update: Dict of preferences to update

    Returns:
        Updated preferences
    """
    memory = get_user_memory_manager()
    updated = memory.set_preferences(update.preferences)
    return {"preferences": updated}


@router.patch("/preferences")
async def update_single_preference(update: PreferenceUpdate):
    """
    Update a single preference.

    Args:
        update: Key and value to update

    Returns:
        Updated preferences
    """
    memory = get_user_memory_manager()
    updated = memory.update_preference(update.key, update.value)
    return {"preferences": updated}


# ==================== Topics Endpoints ====================


@router.get("/topics")
async def get_topics(
    limit: int = 20,
    category: str | None = None,
    sort_by: Literal["frequency", "last_accessed", "first_accessed"] = "frequency"
):
    """
    Get recorded topics.

    Args:
        limit: Maximum topics to return
        category: Filter by category
        sort_by: Sort field

    Returns:
        List of topics with metadata
    """
    memory = get_user_memory_manager()
    topics = memory.get_topics(limit=limit, category=category, sort_by=sort_by)
    return {"topics": topics, "count": len(topics)}


@router.post("/topics")
async def record_topic(record: TopicRecord):
    """
    Record a topic interaction.

    Args:
        record: Topic details to record

    Returns:
        Updated topic data
    """
    memory = get_user_memory_manager()
    topic_data = memory.record_topic(
        topic=record.topic,
        category=record.category,
        context=record.context,
        related_topics=record.related_topics
    )
    return {"topic": record.topic, "data": topic_data}


@router.get("/topics/categories")
async def get_topic_categories():
    """
    Get all topic categories.

    Returns:
        Dict of categories with their topics
    """
    memory = get_user_memory_manager()
    return {"categories": memory.get_topic_categories()}


# ==================== Learning Patterns Endpoints ====================


@router.get("/patterns")
async def get_learning_patterns():
    """
    Get user learning patterns.

    Returns interaction patterns, preferred modules, peak usage hours, etc.
    """
    memory = get_user_memory_manager()
    return memory.get_learning_patterns()


@router.post("/patterns/interaction")
async def record_interaction(record: InteractionRecord):
    """
    Record a user interaction to learn patterns.

    Args:
        record: Interaction details

    Returns:
        Success status
    """
    memory = get_user_memory_manager()
    memory.record_interaction(
        module=record.module,
        duration_seconds=record.duration_seconds,
        topic=record.topic,
        success=record.success
    )
    return {"success": True}


@router.get("/patterns/modules")
async def get_preferred_modules():
    """
    Get modules sorted by usage frequency.

    Returns:
        List of (module, count) tuples
    """
    memory = get_user_memory_manager()
    modules = memory.get_preferred_modules()
    return {"modules": [{"name": m, "count": c} for m, c in modules]}


# ==================== Recurring Questions Endpoints ====================


@router.get("/questions")
async def get_recurring_questions(min_frequency: int = 2, limit: int = 20):
    """
    Get recurring questions.

    Args:
        min_frequency: Minimum times asked
        limit: Maximum questions to return

    Returns:
        List of recurring question patterns
    """
    memory = get_user_memory_manager()
    questions = memory.get_recurring_questions(min_frequency=min_frequency, limit=limit)
    return {"questions": questions, "count": len(questions)}


@router.post("/questions")
async def record_question(record: QuestionRecord):
    """
    Record a question.

    Args:
        record: Question and optional answer

    Returns:
        Success status
    """
    memory = get_user_memory_manager()
    memory.record_question(question=record.question, answer=record.answer)
    return {"success": True}


@router.post("/questions/{question_hash}/resolve")
async def resolve_question(question_hash: str):
    """
    Mark a recurring question as resolved/mastered.

    Args:
        question_hash: Hash of the question to resolve

    Returns:
        Success status
    """
    memory = get_user_memory_manager()
    success = memory.mark_question_resolved(question_hash)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"success": True}


# ==================== Memory Context & Management ====================


@router.get("/context")
async def get_memory_context():
    """
    Get summarized memory context for agent use.

    Returns a compact summary useful for personalizing agent responses.
    """
    memory = get_user_memory_manager()
    return memory.get_memory_context()


@router.get("/summary")
async def get_memory_summary():
    """
    Get a human-readable memory summary.

    Returns statistics and highlights from user memory.
    """
    memory = get_user_memory_manager()

    preferences = memory.get_preferences()
    topics = memory.get_topics(limit=5, sort_by="frequency")
    patterns = memory.get_learning_patterns()
    recurring = memory.get_recurring_questions(min_frequency=2, limit=3)

    return {
        "preferences": {
            "response_style": preferences.get("response_style", "balanced"),
            "difficulty_level": preferences.get("difficulty_level", "adaptive"),
            "explanation_format": preferences.get("preferred_explanation_format", "structured")
        },
        "statistics": {
            "total_interactions": patterns.get("interaction_count", 0),
            "topics_tracked": len(memory._load_file(memory.topics_file).get("topics", {})),
            "recurring_questions": len(recurring)
        },
        "top_topics": [t["name"] for t in topics],
        "preferred_modules": [m for m, _ in memory.get_preferred_modules()[:3]],
        "peak_hours": patterns.get("peak_usage_hours", [])
    }


@router.delete("")
async def clear_memory(memory_type: str | None = None):
    """
    Clear memory data.

    Args:
        memory_type: Type to clear ('preferences', 'topics', 'patterns', 'questions')
                    If None, clears all memory.

    Returns:
        Success status
    """
    memory = get_user_memory_manager()
    success = memory.clear_memory(memory_type)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid memory type")
    return {"success": True, "cleared": memory_type or "all"}


@router.get("/export")
async def export_memory():
    """
    Export all memory data for backup.

    Returns:
        Complete memory export
    """
    memory = get_user_memory_manager()
    return memory.export_memory()


@router.post("/import")
async def import_memory(data: MemoryExport):
    """
    Import memory data from backup.

    Args:
        data: Memory export data

    Returns:
        Success status
    """
    memory = get_user_memory_manager()
    import_data = {}
    if data.preferences:
        import_data["preferences"] = data.preferences
    if data.topics:
        import_data["topics"] = data.topics
    if data.patterns:
        import_data["patterns"] = data.patterns
    if data.questions:
        import_data["questions"] = data.questions

    success = memory.import_memory(import_data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to import memory")
    return {"success": True}
