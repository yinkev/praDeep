"""
Guided Learning v2 API Schemas
==============================

Pydantic models for the Guided Learning v2 API request/response types.
Supports plan-graph-based learning with mastery tracking and spaced repetition.
"""

from datetime import datetime
from typing import Any, Literal, Union

from pydantic import BaseModel, ConfigDict, Field


# =============================================================================
# Enums as Literal Types
# =============================================================================

ConfidenceLevel = Literal["LOW", "MED", "HIGH"]
NextAction = Literal["CONTINUE", "RETRY", "REVIEW", "COMPLETE"]
SessionStatus = Literal["CREATED", "ACTIVE", "PAUSED", "COMPLETED", "ABANDONED"]
MasteryState = Literal["NOT_STARTED", "LEARNING", "REVIEWING", "MASTERED"]
LearningStage = Literal["INTRODUCE", "PRACTICE", "ASSESS", "REINFORCE"]
BlockType = Literal[
    "MCQ",
    "DISCRIMINATOR_CARD",
    "MECHANISM_GRAPH",
    "FLOWCHART_DECISION",
    "LAB_PATTERN",
    "TIMELINE",
]


# =============================================================================
# Shared Schemas (reused across multiple responses)
# =============================================================================


class CitationSchema(BaseModel):
    """Citation reference to source material."""

    source_id: str = Field(..., description="Unique identifier for the source document")
    chunk_id: str = Field(..., description="Identifier for the specific chunk within the source")
    text_snippet: str = Field(..., description="Relevant text excerpt from the source")
    page: int | None = Field(None, description="Page number if applicable")

    model_config = ConfigDict(from_attributes=True)


class LedgerEventSchema(BaseModel):
    """Event record in the learning ledger (append-only log)."""

    timestamp: datetime = Field(..., description="When the event occurred")
    event_type: str = Field(
        ..., description="Type of event (e.g., 'answer_submitted', 'mastery_updated')"
    )
    payload: dict[str, Any] = Field(default_factory=dict, description="Event-specific data")

    model_config = ConfigDict(from_attributes=True)


class ReviewItemSchema(BaseModel):
    """Item in the spaced repetition review queue."""

    objective_id: str = Field(..., description="Learning objective identifier")
    concept: str = Field(..., description="Concept name or title")
    last_reviewed: datetime | None = Field(None, description="When this item was last reviewed")
    mastery_state: MasteryState = Field(..., description="Current mastery level")
    suggested_block_type: BlockType = Field(
        ..., description="Recommended activity block type for review"
    )

    model_config = ConfigDict(from_attributes=True)


class PlanNodeSchema(BaseModel):
    """Node in the learning plan graph."""

    id: str = Field(..., description="Unique node identifier")
    objective_id: str = Field(..., description="Associated learning objective")
    title: str = Field(..., description="Node title/label")
    description: str | None = Field(None, description="Optional description")
    prerequisites: list[str] = Field(default_factory=list, description="IDs of prerequisite nodes")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Additional node data")

    model_config = ConfigDict(from_attributes=True)


class PlanEdgeSchema(BaseModel):
    """Edge in the learning plan graph."""

    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    edge_type: str = Field(
        default="prerequisite",
        description="Type of relationship (e.g., 'prerequisite', 'remedial')",
    )
    weight: float = Field(default=1.0, description="Edge weight for pathfinding")

    model_config = ConfigDict(from_attributes=True)


class PlanGraphSchema(BaseModel):
    """Learning plan represented as a directed graph."""

    nodes: list[PlanNodeSchema] = Field(default_factory=list, description="Graph nodes")
    edges: list[PlanEdgeSchema] = Field(default_factory=list, description="Graph edges")

    model_config = ConfigDict(from_attributes=True)


class ProgressSummarySchema(BaseModel):
    """Summary of learning progress within a session."""

    completed_objectives: int = Field(..., description="Number of objectives completed")
    total_objectives: int = Field(..., description="Total number of objectives")
    current_stage: LearningStage | None = Field(None, description="Current learning stage")
    estimated_time_remaining: int | None = Field(None, description="Estimated minutes remaining")

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Block Schemas (for ActivityResponse.block union)
# =============================================================================


class MCQOptionSchema(BaseModel):
    """Option for a multiple-choice question."""

    id: str = Field(..., description="Option identifier (e.g., 'A', 'B', 'C', 'D')")
    text: str = Field(..., description="Option text")
    is_correct: bool = Field(default=False, description="Whether this is the correct answer")

    model_config = ConfigDict(from_attributes=True)


class MCQBlockSchema(BaseModel):
    """Multiple-choice question activity block."""

    block_type: Literal["MCQ"] = "MCQ"
    question: str = Field(..., description="The question text")
    options: list[MCQOptionSchema] = Field(..., description="Answer options")
    explanation: str | None = Field(None, description="Explanation shown after answering")
    citations: list[CitationSchema] = Field(default_factory=list, description="Source citations")

    model_config = ConfigDict(from_attributes=True)


class DiscriminatorCardBlockSchema(BaseModel):
    """Discriminator card for distinguishing similar concepts."""

    block_type: Literal["DISCRIMINATOR_CARD"] = "DISCRIMINATOR_CARD"
    concept_a: str = Field(..., description="First concept to compare")
    concept_b: str = Field(..., description="Second concept to compare")
    similarities: list[str] = Field(default_factory=list, description="Shared characteristics")
    differences: list[str] = Field(default_factory=list, description="Distinguishing features")
    prompt: str = Field(..., description="Question or task for the learner")
    citations: list[CitationSchema] = Field(default_factory=list, description="Source citations")

    model_config = ConfigDict(from_attributes=True)


class MechanismNodeSchema(BaseModel):
    """Node in a mechanism graph."""

    id: str = Field(..., description="Node identifier")
    label: str = Field(..., description="Node label")
    description: str | None = Field(None, description="Node description")

    model_config = ConfigDict(from_attributes=True)


class MechanismEdgeSchema(BaseModel):
    """Edge in a mechanism graph."""

    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    label: str | None = Field(None, description="Edge label (e.g., 'activates', 'inhibits')")

    model_config = ConfigDict(from_attributes=True)


class MechanismGraphBlockSchema(BaseModel):
    """Mechanism graph for visualizing processes and pathways."""

    block_type: Literal["MECHANISM_GRAPH"] = "MECHANISM_GRAPH"
    title: str = Field(..., description="Graph title")
    nodes: list[MechanismNodeSchema] = Field(..., description="Graph nodes")
    edges: list[MechanismEdgeSchema] = Field(..., description="Graph edges")
    prompt: str = Field(..., description="Question or task about the mechanism")
    citations: list[CitationSchema] = Field(default_factory=list, description="Source citations")

    model_config = ConfigDict(from_attributes=True)


class FlowchartDecisionNodeSchema(BaseModel):
    """Node in a flowchart decision tree."""

    id: str = Field(..., description="Node identifier")
    label: str = Field(..., description="Node label/question")
    node_type: Literal["start", "decision", "action", "end"] = Field(
        ..., description="Type of flowchart node"
    )

    model_config = ConfigDict(from_attributes=True)


class FlowchartDecisionEdgeSchema(BaseModel):
    """Edge in a flowchart decision tree."""

    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    label: str | None = Field(None, description="Edge label (e.g., 'Yes', 'No')")

    model_config = ConfigDict(from_attributes=True)


class FlowchartDecisionBlockSchema(BaseModel):
    """Flowchart decision tree for clinical/diagnostic reasoning."""

    block_type: Literal["FLOWCHART_DECISION"] = "FLOWCHART_DECISION"
    title: str = Field(..., description="Flowchart title")
    nodes: list[FlowchartDecisionNodeSchema] = Field(..., description="Flowchart nodes")
    edges: list[FlowchartDecisionEdgeSchema] = Field(..., description="Flowchart edges")
    scenario: str = Field(..., description="Clinical scenario or context")
    prompt: str = Field(..., description="Question about the decision process")
    citations: list[CitationSchema] = Field(default_factory=list, description="Source citations")

    model_config = ConfigDict(from_attributes=True)


class LabValueSchema(BaseModel):
    """Laboratory value with reference range."""

    name: str = Field(..., description="Lab test name")
    value: str = Field(..., description="Measured value with units")
    reference_range: str = Field(..., description="Normal reference range")
    is_abnormal: bool = Field(default=False, description="Whether value is outside normal range")

    model_config = ConfigDict(from_attributes=True)


class LabPatternBlockSchema(BaseModel):
    """Lab pattern recognition activity block."""

    block_type: Literal["LAB_PATTERN"] = "LAB_PATTERN"
    title: str = Field(..., description="Pattern title")
    clinical_context: str = Field(..., description="Clinical scenario")
    lab_values: list[LabValueSchema] = Field(..., description="Lab values to interpret")
    prompt: str = Field(..., description="Question about the lab pattern")
    expected_interpretation: str | None = Field(
        None, description="Expected interpretation (hidden until answered)"
    )
    citations: list[CitationSchema] = Field(default_factory=list, description="Source citations")

    model_config = ConfigDict(from_attributes=True)


class TimelineEventSchema(BaseModel):
    """Event in a timeline."""

    id: str = Field(..., description="Event identifier")
    timestamp: str = Field(..., description="Time marker (e.g., 'Day 1', '2 hours post-op')")
    title: str = Field(..., description="Event title")
    description: str | None = Field(None, description="Event description")

    model_config = ConfigDict(from_attributes=True)


class TimelineBlockSchema(BaseModel):
    """Timeline activity block for temporal sequences."""

    block_type: Literal["TIMELINE"] = "TIMELINE"
    title: str = Field(..., description="Timeline title")
    events: list[TimelineEventSchema] = Field(..., description="Timeline events")
    prompt: str = Field(..., description="Question about the timeline")
    citations: list[CitationSchema] = Field(default_factory=list, description="Source citations")

    model_config = ConfigDict(from_attributes=True)


# Union type for all activity blocks
ActivityBlock = Union[
    MCQBlockSchema,
    DiscriminatorCardBlockSchema,
    MechanismGraphBlockSchema,
    FlowchartDecisionBlockSchema,
    LabPatternBlockSchema,
    TimelineBlockSchema,
]


# =============================================================================
# Answer Types (for SubmitAnswerRequest.answer union)
# =============================================================================


class MCQAnswerSchema(BaseModel):
    """Answer for MCQ block."""

    answer_type: Literal["MCQ"] = "MCQ"
    selected_option_id: str = Field(..., description="ID of the selected option")

    model_config = ConfigDict(from_attributes=True)


class FreeTextAnswerSchema(BaseModel):
    """Free-text answer for open-ended questions."""

    answer_type: Literal["FREE_TEXT"] = "FREE_TEXT"
    text: str = Field(..., description="User's free-text response")

    model_config = ConfigDict(from_attributes=True)


class GraphInteractionAnswerSchema(BaseModel):
    """Answer for graph-based interactions."""

    answer_type: Literal["GRAPH_INTERACTION"] = "GRAPH_INTERACTION"
    selected_nodes: list[str] = Field(default_factory=list, description="IDs of selected nodes")
    selected_edges: list[str] = Field(default_factory=list, description="IDs of selected edges")
    path: list[str] = Field(
        default_factory=list, description="Ordered list of node IDs forming a path"
    )

    model_config = ConfigDict(from_attributes=True)


class TimelineOrderAnswerSchema(BaseModel):
    """Answer for timeline ordering tasks."""

    answer_type: Literal["TIMELINE_ORDER"] = "TIMELINE_ORDER"
    ordered_event_ids: list[str] = Field(..., description="Event IDs in user-specified order")

    model_config = ConfigDict(from_attributes=True)


# Union type for all answer types
AnswerPayload = Union[
    MCQAnswerSchema,
    FreeTextAnswerSchema,
    GraphInteractionAnswerSchema,
    TimelineOrderAnswerSchema,
]


# =============================================================================
# Request Schemas
# =============================================================================


class CreateSessionRequest(BaseModel):
    """Request to create a new guided learning session."""

    user_id: str = Field(..., description="Unique user identifier")
    topic: str = Field(..., description="Learning topic or subject")
    learning_objectives: list[str] = Field(
        ..., min_length=1, description="List of learning objectives"
    )
    time_budget_minutes: int | None = Field(
        None, ge=5, le=480, description="Optional time budget in minutes (5-480)"
    )

    model_config = ConfigDict(from_attributes=True)


class StartSessionRequest(BaseModel):
    """Request to start an existing session."""

    session_id: str = Field(..., description="Session identifier to start")

    model_config = ConfigDict(from_attributes=True)


class SubmitAnswerRequest(BaseModel):
    """Request to submit an answer for an activity."""

    session_id: str = Field(..., description="Session identifier")
    activity_id: str = Field(..., description="Activity identifier")
    answer: AnswerPayload = Field(..., description="User's answer")
    confidence: ConfidenceLevel = Field(..., description="User's confidence level")
    time_taken_seconds: int = Field(..., ge=0, description="Time taken to answer in seconds")

    model_config = ConfigDict(from_attributes=True)


class AdvanceRequest(BaseModel):
    """Request to advance to the next activity."""

    session_id: str = Field(..., description="Session identifier")
    activity_id: str = Field(..., description="Current activity identifier")

    model_config = ConfigDict(from_attributes=True)


class GetReviewQueueRequest(BaseModel):
    """Request to get items due for review."""

    user_id: str = Field(..., description="User identifier")
    limit: int = Field(default=10, ge=1, le=100, description="Maximum items to return")

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Response Schemas
# =============================================================================


class SessionResponse(BaseModel):
    """Response containing session information."""

    session_id: str = Field(..., description="Unique session identifier")
    status: SessionStatus = Field(..., description="Current session status")
    topic: str = Field(..., description="Learning topic")
    plan_graph: PlanGraphSchema = Field(..., description="Learning plan graph")
    current_objective_id: str | None = Field(None, description="Currently active objective ID")
    progress_summary: ProgressSummarySchema = Field(..., description="Progress summary")

    model_config = ConfigDict(from_attributes=True)


class ActivityResponse(BaseModel):
    """Response containing the current activity."""

    activity_id: str = Field(..., description="Unique activity identifier")
    objective_id: str = Field(..., description="Associated learning objective")
    stage: LearningStage = Field(..., description="Current learning stage")
    block: ActivityBlock = Field(..., description="Activity block content")
    hints_available: int = Field(default=0, ge=0, description="Number of hints available")
    attempt_number: int = Field(default=1, ge=1, description="Current attempt number")

    model_config = ConfigDict(from_attributes=True)


class AnswerFeedbackResponse(BaseModel):
    """Response containing feedback on a submitted answer."""

    correct: bool = Field(..., description="Whether the answer was correct")
    explanation: str = Field(..., description="Explanation of the correct answer")
    citations: list[CitationSchema] = Field(
        default_factory=list, description="Supporting citations"
    )
    mastery_change: float = Field(..., description="Change in mastery score (-1.0 to 1.0)")
    next_action: NextAction = Field(..., description="Recommended next action")

    model_config = ConfigDict(from_attributes=True)


class LedgerResponse(BaseModel):
    """Response containing ledger events."""

    events: list[LedgerEventSchema] = Field(
        default_factory=list, description="List of ledger events"
    )

    model_config = ConfigDict(from_attributes=True)


class DashboardResponse(BaseModel):
    """Response containing user dashboard data."""

    user_id: str = Field(..., description="User identifier")
    total_objectives: int = Field(..., description="Total learning objectives")
    mastered_count: int = Field(..., description="Number of mastered objectives")
    in_progress_count: int = Field(..., description="Number of in-progress objectives")
    streak_days: int = Field(default=0, ge=0, description="Current learning streak in days")
    weak_areas: list[str] = Field(default_factory=list, description="Topics needing more practice")
    review_due_count: int = Field(default=0, ge=0, description="Items due for review")

    model_config = ConfigDict(from_attributes=True)


class ReviewQueueResponse(BaseModel):
    """Response containing review queue items."""

    items: list[ReviewItemSchema] = Field(default_factory=list, description="Items due for review")

    model_config = ConfigDict(from_attributes=True)
