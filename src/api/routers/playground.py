"""
Code Playground API Router
Exposes a lightweight multi-language code execution endpoint for the web playground.
"""

from __future__ import annotations

import re
from urllib.parse import quote
from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.tools.code_executor import run_code

router = APIRouter()


def _safe_id(raw: str) -> str:
    raw = (raw or "").strip()
    if not raw:
        return uuid4().hex
    return re.sub(r"[^a-zA-Z0-9_-]", "_", raw)


class ExecuteRequest(BaseModel):
    language: str = Field(..., description="Language to execute: python/javascript/r/julia")
    code: str = Field(..., description="Source code to run")
    timeout: int = Field(10, ge=1, le=60, description="Execution timeout in seconds")
    session_id: str | None = Field(
        default=None, description="Optional client session id for grouping runs"
    )
    stdin: str | None = Field(default=None, description="Optional stdin payload")
    allowed_imports: list[str] | None = Field(
        default=None, description="Python-only: allowlist of top-level imports"
    )


class Artifact(BaseModel):
    name: str
    url: str


class ExecuteResponse(BaseModel):
    session_id: str
    execution_id: str
    language: str
    stdout: str
    stderr: str
    exit_code: int
    elapsed_ms: float
    artifacts: list[Artifact] = Field(default_factory=list)


@router.post("/execute", response_model=ExecuteResponse)
async def execute_code(req: ExecuteRequest) -> ExecuteResponse:
    session_id = _safe_id(req.session_id or uuid4().hex[:12])
    execution_id = uuid4().hex

    assets_dir = f"playground/{session_id}/{execution_id}"

    result = await run_code(
        language=req.language,
        code=req.code,
        timeout=req.timeout,
        assets_dir=assets_dir,
        allowed_imports=req.allowed_imports,
        stdin=req.stdin,
    )

    artifacts: list[Artifact] = []
    for name in result.get("artifacts", []) or []:
        encoded_name = quote(str(name))
        artifacts.append(
            Artifact(
                name=str(name),
                url=f"/api/outputs/run_code_workspace/{assets_dir}/{encoded_name}",
            )
        )

    return ExecuteResponse(
        session_id=session_id,
        execution_id=execution_id,
        language=req.language,
        stdout=result.get("stdout", ""),
        stderr=result.get("stderr", ""),
        exit_code=int(result.get("exit_code", -1)),
        elapsed_ms=float(result.get("elapsed_ms", 0.0)),
        artifacts=artifacts,
    )

