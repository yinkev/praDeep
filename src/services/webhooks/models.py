from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, HttpUrl


class WebhookEventType(str, Enum):
    WORKFLOW_COMPLETED = "workflow.completed"
    KNOWLEDGE_BASE_UPDATED = "knowledge_base.updated"
    SESSION_MILESTONE = "session.milestone"


class WebhookConfig(BaseModel):
    id: str
    url: HttpUrl
    enabled: bool = True
    events: list[str] = Field(default_factory=list)
    secret: str = ""
    max_attempts: int = 5
    timeout_seconds: float = 10.0
    created_at: float
    updated_at: float


class WebhookCreateRequest(BaseModel):
    url: HttpUrl
    enabled: bool = True
    events: list[str] = Field(default_factory=list)
    secret: str | None = None
    max_attempts: int = 5
    timeout_seconds: float = 10.0


class WebhookUpdateRequest(BaseModel):
    url: HttpUrl | None = None
    enabled: bool | None = None
    events: list[str] | None = None
    secret: str | None = None
    max_attempts: int | None = None
    timeout_seconds: float | None = None


class WebhookDeliveryStatus(str, Enum):
    PENDING = "pending"
    DELIVERING = "delivering"
    SUCCESS = "success"
    RETRYING = "retrying"
    FAILED = "failed"


class WebhookDelivery(BaseModel):
    id: str
    webhook_id: str
    event_type: str
    payload: dict[str, Any]
    status: WebhookDeliveryStatus
    attempt_count: int
    max_attempts: int
    next_attempt_at: float
    last_attempt_at: float | None = None
    last_status_code: int | None = None
    last_error: str | None = None
    created_at: float
    updated_at: float


class WebhookTestRequest(BaseModel):
    event_type: str = WebhookEventType.WORKFLOW_COMPLETED.value
    payload: dict[str, Any] = Field(default_factory=dict)

