from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, status

from src.api.schemas.guide_v2 import (
    ActivityResponse,
    AnswerFeedbackResponse,
    CitationSchema,
    CreateSessionRequest,
    DashboardResponse,
    LedgerEventSchema,
    LedgerResponse,
    MCQBlockSchema,
    PlanEdgeSchema,
    PlanGraphSchema,
    PlanNodeSchema,
    ProgressSummarySchema,
    ReviewItemSchema,
    ReviewQueueResponse,
    SessionResponse,
)
from src.services.guided_learning.v2.engine import MasteryEngine
from src.services.guided_learning.v2.storage.ledger import LedgerWriter
from src.services.guided_learning.v2.storage.learner_model_store import LearnerModelStore
from src.services.guided_learning.v2.storage.session_store import SessionStore
from src.services.guided_learning.v2.types import (
    Confidence,
    LearnerModel,
    MasteryState,
    ResponseEvaluation,
    SessionStatus,
)

logger = logging.getLogger(__name__)

router = APIRouter()

_session_store = SessionStore()
_ledger_writer = LedgerWriter()
_learner_model_store = LearnerModelStore()
_mastery_engine = MasteryEngine()


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(request: CreateSessionRequest) -> SessionResponse:
    session_id = str(uuid.uuid4())
    now = datetime.now().isoformat()

    nodes = [
        {
            "objective_id": str(uuid.uuid4()),
            "title": objective,
            "description": objective,
            "status": "pending",
        }
        for objective in request.learning_objectives
    ]

    session_data = {
        "session_id": session_id,
        "user_id": request.user_id,
        "topic": request.topic,
        "status": SessionStatus.PLANNING.value,
        "plan_graph": {"nodes": nodes, "edges": []},
        "current_objective_id": nodes[0]["objective_id"] if nodes else None,
        "current_activity": None,
        "created_at": now,
        "updated_at": now,
    }

    _session_store.save_session(session_id, session_data)

    _ledger_writer.append_event(
        session_id,
        {
            "event_type": "session_created",
            "payload": {"user_id": request.user_id, "topic": request.topic},
        },
    )

    return _to_session_response(session_data)


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str) -> SessionResponse:
    session_data = _session_store.load_session(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
    return _to_session_response(session_data)


@router.post("/sessions/{session_id}/start", response_model=SessionResponse)
async def start_session(session_id: str) -> SessionResponse:
    session_data = _session_store.load_session(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")

    if session_data.get("status") != SessionStatus.PLANNING.value:
        raise HTTPException(status_code=400, detail="Session already started")

    session_data["status"] = SessionStatus.ACTIVE.value
    session_data["updated_at"] = datetime.now().isoformat()
    _session_store.save_session(session_id, session_data)

    _ledger_writer.append_event(
        session_id,
        {
            "event_type": "session_started",
            "payload": {},
        },
    )

    return _to_session_response(session_data)


@router.get("/sessions/{session_id}/activity", response_model=ActivityResponse)
async def get_current_activity(session_id: str) -> ActivityResponse:
    session_data = _session_store.load_session(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")

    if session_data.get("status") != SessionStatus.ACTIVE.value:
        raise HTTPException(status_code=400, detail="Session not active")

    activity = session_data.get("current_activity")
    if not activity:
        raise HTTPException(status_code=404, detail="No current activity")

    block_data = activity.get("block", {})
    block_schema = MCQBlockSchema(
        question=block_data.get("stem", ""),
        options=block_data.get("options", []),
        explanation=block_data.get("explanation", ""),
        citations=[CitationSchema(**c) for c in block_data.get("citations", [])],
    )

    return ActivityResponse(
        activity_id=f"{activity.get('objective_id')}_{activity.get('attempt_count', 0)}",
        objective_id=activity.get("objective_id", ""),
        stage=activity.get("stage", "PRIME"),
        block=block_schema,
        hints_available=3 - activity.get("hints_used", 0),
        attempt_number=activity.get("attempt_count", 0),
    )


@router.post("/sessions/{session_id}/submit", response_model=AnswerFeedbackResponse)
async def submit_answer(
    session_id: str,
    answer: Any,
    confidence: str,
    time_taken_seconds: float,
) -> AnswerFeedbackResponse:
    session_data = _session_store.load_session(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")

    activity = session_data.get("current_activity")
    if not activity:
        raise HTTPException(status_code=400, detail="No current activity")

    try:
        conf = Confidence[confidence.upper()]
    except KeyError:
        conf = Confidence.MED

    user_id = session_data.get("user_id", "")
    learner_model = _learner_model_store.load_model(user_id)
    if not learner_model:
        learner_model = LearnerModel(user_id=user_id)

    block = activity.get("block", {})
    is_correct = _check_answer(block, answer)

    objective_id = activity.get("objective_id", "")
    mastery_before = learner_model.get_mastery(objective_id).mastery_state

    evaluation = ResponseEvaluation(
        is_correct=is_correct,
        confidence=conf,
        explanation="Correct!" if is_correct else "Incorrect.",
        citations=[],
        failure_mode=None,
    )

    from src.services.guided_learning.v2.types import Activity, Stage, MCQBlock, Citation

    typed_activity = Activity(
        objective_id=objective_id,
        stage=Stage[activity.get("stage", "PRIME")],
        block=MCQBlock(
            stem=block.get("stem", ""),
            options=block.get("options", []),
            correct_index=block.get("correct_index", 0),
            distractors_rationale=block.get("distractors_rationale", []),
            citations=[Citation(**c) for c in block.get("citations", [])],
        ),
        hints_used=activity.get("hints_used", 0),
        attempt_count=activity.get("attempt_count", 0),
    )

    learner_model = _mastery_engine.update_mastery(learner_model, typed_activity, evaluation)
    mastery_after = learner_model.get_mastery(objective_id).mastery_state

    _learner_model_store.save_model(user_id, _learner_model_to_dict(learner_model))

    _ledger_writer.append_event(
        session_id,
        {
            "event_type": "answer_submitted",
            "payload": {
                "objective_id": objective_id,
                "is_correct": is_correct,
                "confidence": confidence,
                "time_taken": time_taken_seconds,
                "mastery_change": f"{mastery_before.value} -> {mastery_after.value}",
            },
        },
    )

    next_action = "CONTINUE"
    if mastery_after == MasteryState.AUTOMATIC:
        next_action = "COMPLETE"
    elif not is_correct:
        next_action = "RETRY"

    return AnswerFeedbackResponse(
        correct=is_correct,
        explanation=evaluation.explanation,
        citations=[],
        mastery_change=f"{mastery_before.value} -> {mastery_after.value}",
        next_action=next_action,
    )


@router.get("/sessions/{session_id}/ledger", response_model=LedgerResponse)
async def get_ledger(session_id: str) -> LedgerResponse:
    events = _ledger_writer.read_events(session_id)
    return LedgerResponse(
        events=[
            LedgerEventSchema(
                timestamp=e.get("timestamp", ""),
                event_type=e.get("event_type", ""),
                payload=e.get("payload", {}),
            )
            for e in events
        ]
    )


@router.get("/users/{user_id}/dashboard", response_model=DashboardResponse)
async def get_dashboard(user_id: str) -> DashboardResponse:
    model_data = _learner_model_store.load_model(user_id)

    if not model_data:
        return DashboardResponse(
            user_id=user_id,
            total_objectives=0,
            mastered_count=0,
            in_progress_count=0,
            streak_days=0,
            weak_areas=[],
            review_due_count=0,
        )

    objectives = model_data.get("objectives", {})
    total = len(objectives)
    mastered = sum(1 for m in objectives.values() if m.get("mastery_state") == "AUTOMATIC")
    in_progress = sum(
        1 for m in objectives.values() if m.get("mastery_state") in ("SHAKY", "COMPETENT")
    )

    weak_areas = [
        obj_id
        for obj_id, m in objectives.items()
        if m.get("mastery_state") == "NOVICE" or len(m.get("failure_modes", [])) > 2
    ][:5]

    streaks = model_data.get("streaks", {})

    return DashboardResponse(
        user_id=user_id,
        total_objectives=total,
        mastered_count=mastered,
        in_progress_count=in_progress,
        streak_days=streaks.get("current", 0),
        weak_areas=weak_areas,
        review_due_count=sum(
            1 for m in objectives.values() if m.get("mastery_state") == "COMPETENT"
        ),
    )


@router.get("/users/{user_id}/review-queue", response_model=ReviewQueueResponse)
async def get_review_queue(user_id: str, limit: int = 10) -> ReviewQueueResponse:
    model_data = _learner_model_store.load_model(user_id)

    if not model_data:
        return ReviewQueueResponse(items=[])

    objectives = model_data.get("objectives", {})

    items = [
        ReviewItemSchema(
            objective_id=obj_id,
            concept=obj_id,
            last_reviewed=m.get("last_attempt"),
            mastery_state=m.get("mastery_state", "NOVICE"),
            suggested_block_type="MCQBlock",
        )
        for obj_id, m in objectives.items()
        if m.get("mastery_state") in ("SHAKY", "COMPETENT")
    ][:limit]

    return ReviewQueueResponse(items=items)


def _to_session_response(data: dict[str, Any]) -> SessionResponse:
    plan_graph = data.get("plan_graph", {})
    nodes = plan_graph.get("nodes", [])
    edges = plan_graph.get("edges", [])

    return SessionResponse(
        session_id=data.get("session_id", ""),
        status=data.get("status", "PLANNING"),
        topic=data.get("topic", ""),
        plan_graph=PlanGraphSchema(
            nodes=[PlanNodeSchema(**n) for n in nodes],
            edges=[PlanEdgeSchema(**e) for e in edges],
        ),
        current_objective_id=data.get("current_objective_id"),
        progress_summary=ProgressSummarySchema(
            completed_objectives=0,
            total_objectives=len(nodes),
            current_stage="PRIME",
            estimated_time_remaining=30,
        ),
    )


def _check_answer(block: dict[str, Any], answer: Any) -> bool:
    try:
        return int(answer) == block.get("correct_index", -1)
    except (ValueError, TypeError):
        return False


def _learner_model_to_dict(model: LearnerModel) -> dict[str, Any]:
    return {
        "user_id": model.user_id,
        "objectives": {
            obj_id: {
                "mastery_state": m.mastery_state.value,
                "confidence": m.confidence.value if m.confidence else None,
                "last_attempt": m.last_attempt.isoformat() if m.last_attempt else None,
                "practice_count": m.practice_count,
                "correct_streak": m.correct_streak,
                "failure_modes": [fm.value for fm in m.failure_modes],
            }
            for obj_id, m in model.objectives.items()
        },
        "streaks": model.streaks,
        "failure_patterns": {k: [fm.value for fm in v] for k, v in model.failure_patterns.items()},
    }
