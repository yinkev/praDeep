---
title: Code Playground (code-playground)
date: 2026-01-11
status: implemented
---

## Goal

Add an interactive “Code Playground” to praDeep that can execute snippets in a sandboxed workspace and show results (stdout/stderr) plus lightweight visualizations (render saved artifacts like PNG plots). The playground should support multiple languages (Python, JavaScript, R, Julia) when the corresponding interpreters are available on the host.

## Approach (Recommended)

1. **Backend API**
   - Add `POST /api/v1/playground/execute` in a new FastAPI router.
   - Delegate execution to `src/tools/code_executor.py`, extending it to support multiple languages via subprocess runners.
   - Persist artifacts under `data/user/run_code_workspace/playground/<session_id>/<execution_id>/…` so the frontend can access them via the existing static mount at `/api/outputs`.
   - If an interpreter is missing (e.g., `Rscript`, `julia`), return a clean error message without crashing.

2. **Frontend UI**
   - Add a new Next.js route `web/app/playground/page.tsx` with a Monaco-based editor for syntax highlighting and basic autocomplete.
   - Provide a language selector, Run button, output panes, and an artifact gallery that renders images inline and links non-images.
   - Add a sidebar entry for quick navigation.

## Data Flow

Frontend sends `{ language, code, timeout, session_id }` → backend executes in isolated temp directory (cwd set to the run workspace) → backend returns stdout/stderr/exit_code + artifact URLs rooted under `/api/outputs/...` → frontend renders output and any artifact images.

## Security Notes

Execution is isolated to a controlled workspace directory and is subject to a timeout. This is not a full security sandbox (no syscall/network sandboxing), but it prevents accidental writes outside allowed roots and keeps output artifacts in a predictable location.

