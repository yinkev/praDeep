"""
Guided Learning v2 Domain Types - Pure domain types for the mastery engine.
No I/O, no LLM calls. All types are Pydantic v2 models or Python enums/dataclasses.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class SessionStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class NodeType(str, Enum):
    CONCEPT = "concept"
    PROCEDURE = "procedure"
    FACT = "fact"
    PRINCIPLE = "principle"


class NodeStatus(str, Enum):
    LOCKED = "locked"
    AVAILABLE = "available"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class Stage(str, Enum):
    PRIME = "prime"
    TEACH = "teach"
    PRACTICE = "practice"
    ASSESS = "assess"


class MasteryState(str, Enum):
    NOVICE = "novice"
    SHAKY = "shaky"
    COMPETENT = "competent"
    AUTOMATIC = "automatic"


class FailureMode(str, Enum):
    KNOWLEDGE_GAP = "knowledge_gap"
    REASONING_ERROR = "reasoning_error"
    APPLICATION_MISS = "application_miss"
    TIME_PRESSURE = "time_pressure"


class VariantType(str, Enum):
    NEAR = "near"
    FAR = "far"


class Confidence(str, Enum):
    LOW = "low"
    MED = "med"
    HIGH = "high"


@dataclass
class Citation:
    source_id: str
    chunk_id: str
    text_snippet: str
    page: int | None = None


@dataclass
class CanonicalCore:
    concept_id: str
    canonical_statement: str
    citations: list[Citation] = field(default_factory=list)
    supporting_evidence: list[str] = field(default_factory=list)
    common_misconceptions: list[str] = field(default_factory=list)
    prerequisite_ids: list[str] = field(default_factory=list)


class LearningBlock(BaseModel):
    block_type: str
    citations: list[Citation] = Field(default_factory=list)

    class Config:
        arbitrary_types_allowed = True


class MCQBlock(LearningBlock):
    block_type: str = "mcq"
    stem: str
    options: list[str]
    correct_index: int
    distractors_rationale: list[str] = Field(default_factory=list)


class DiscriminatorCardBlock(LearningBlock):
    block_type: str = "discriminator_card"
    concept_a: str
    concept_b: str
    key_differences: list[str] = Field(default_factory=list)
    when_to_use_a: str = ""
    when_to_use_b: str = ""
    common_confusion: str = ""


class MechanismGraphBlock(LearningBlock):
    block_type: str = "mechanism_graph"
    title: str
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)
    mermaid_code: str = ""


class FlowchartDecisionBlock(LearningBlock):
    block_type: str = "flowchart_decision"
    title: str
    decision_points: list[dict[str, Any]] = Field(default_factory=list)
    mermaid_code: str = ""


class LabPatternBlock(LearningBlock):
    block_type: str = "lab_pattern"
    title: str
    normal_ranges: dict[str, tuple[float, float]] = Field(default_factory=dict)
    patterns: list[dict[str, Any]] = Field(default_factory=list)


class TimelineBlock(LearningBlock):
    block_type: str = "timeline"
    title: str
    events: list[dict[str, Any]] = Field(default_factory=list)
    key_transitions: list[str] = Field(default_factory=list)


@dataclass
class ObjectiveNode:
    objective_id: str
    title: str
    description: str
    node_type: NodeType
    status: NodeStatus = NodeStatus.LOCKED
    canonical_core: CanonicalCore | None = None


@dataclass
class PlanGraph:
    nodes: list[ObjectiveNode] = field(default_factory=list)
    edges: list[tuple[str, str]] = field(default_factory=list)

    def get_node(self, objective_id: str) -> ObjectiveNode | None:
        for node in self.nodes:
            if node.objective_id == objective_id:
                return node
        return None

    def get_prerequisites(self, objective_id: str) -> list[str]:
        return [from_id for from_id, to_id in self.edges if to_id == objective_id]

    def get_dependents(self, objective_id: str) -> list[str]:
        return [to_id for from_id, to_id in self.edges if from_id == objective_id]


@dataclass
class Activity:
    objective_id: str
    stage: Stage
    block: LearningBlock
    started_at: datetime = field(default_factory=datetime.now)
    hints_used: int = 0
    attempt_count: int = 0
    variant_type: VariantType | None = None


@dataclass
class ObjectiveMastery:
    mastery_state: MasteryState = MasteryState.NOVICE
    confidence: Confidence = Confidence.LOW
    last_practiced: datetime | None = None
    practice_count: int = 0
    correct_streak: int = 0
    failure_modes: list[FailureMode] = field(default_factory=list)


@dataclass
class LearnerModel:
    user_id: str
    objectives: dict[str, ObjectiveMastery] = field(default_factory=dict)
    streaks: dict[str, int] = field(default_factory=dict)
    failure_patterns: dict[str, list[FailureMode]] = field(default_factory=dict)

    def get_mastery(self, objective_id: str) -> ObjectiveMastery:
        if objective_id not in self.objectives:
            self.objectives[objective_id] = ObjectiveMastery()
        return self.objectives[objective_id]


@dataclass
class LedgerEvent:
    timestamp: datetime
    session_id: str
    event_type: str
    payload: dict[str, Any] = field(default_factory=dict)


@dataclass
class ResponseEvaluation:
    is_correct: bool
    confidence: Confidence
    failure_mode: FailureMode | None = None
    explanation: str = ""
    citations: list[Citation] = field(default_factory=list)


@dataclass
class PlanNode:
    objective_id: str
    title: str
    description: str = ""
    status: str = "pending"
    node_type: NodeType = NodeType.CONCEPT


@dataclass
class PlanEdge:
    source: str
    target: str
    relationship: str = "prerequisite"


@dataclass
class Session:
    session_id: str
    user_id: str
    topic: str
    status: SessionStatus
    plan_graph: PlanGraph
    current_objective_id: str | None = None
    current_activity: Activity | None = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


__all__ = [
    "SessionStatus",
    "NodeType",
    "NodeStatus",
    "Stage",
    "MasteryState",
    "FailureMode",
    "VariantType",
    "Confidence",
    "Citation",
    "CanonicalCore",
    "LearningBlock",
    "MCQBlock",
    "DiscriminatorCardBlock",
    "MechanismGraphBlock",
    "FlowchartDecisionBlock",
    "LabPatternBlock",
    "TimelineBlock",
    "ObjectiveNode",
    "PlanGraph",
    "PlanNode",
    "PlanEdge",
    "Activity",
    "ObjectiveMastery",
    "LearnerModel",
    "LedgerEvent",
    "ResponseEvaluation",
    "Session",
]
