"""
Chat API Router
================

WebSocket endpoint for lightweight chat with session management.
REST endpoints for session operations.
"""

import asyncio
from pathlib import Path
import sys
import time

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

_project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(_project_root))

from src.agents.chat import ChatAgent, SessionManager
from src.api.utils.user_memory import get_user_memory_manager
from src.logging import get_logger
from src.services.config import load_config_with_main

# Initialize logger
project_root = Path(__file__).parent.parent.parent.parent
config = load_config_with_main("solve_config.yaml", project_root)
log_dir = config.get("paths", {}).get("user_log_dir") or config.get("logging", {}).get("log_dir")
logger = get_logger("ChatAPI", level="INFO", log_dir=log_dir)

router = APIRouter()

# Initialize session manager and memory manager
session_manager = SessionManager()
memory_manager = get_user_memory_manager()


# =============================================================================
# REST Endpoints for Session Management
# =============================================================================


@router.get("/chat/council/{council_id}")
async def get_council_log(council_id: str):
    """
    Fetch a stored Council log by id.

    Council logs are stored separately (data/user/council/<task>/<council_id>.json)
    to avoid bloating chat_sessions.json.
    """
    from src.services.council import CouncilLogStore

    store = CouncilLogStore()
    run = store.load(council_id, task="chat_verify")
    if not run:
        raise HTTPException(status_code=404, detail="Council log not found")
    return run.model_dump()


@router.get("/chat/sessions")
async def list_sessions(limit: int = 20):
    """
    List recent chat sessions.

    Args:
        limit: Maximum number of sessions to return

    Returns:
        List of session summaries
    """
    return session_manager.list_sessions(limit=limit, include_messages=False)


@router.get("/chat/sessions/{session_id}")
async def get_session(session_id: str):
    """
    Get a specific chat session with full message history.

    Args:
        session_id: Session identifier

    Returns:
        Complete session data including messages
    """
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/chat/sessions/{session_id}")
async def delete_session(session_id: str):
    """
    Delete a chat session.

    Args:
        session_id: Session identifier

    Returns:
        Success message
    """
    if session_manager.delete_session(session_id):
        return {"status": "deleted", "session_id": session_id}
    raise HTTPException(status_code=404, detail="Session not found")


# =============================================================================
# WebSocket Endpoint for Chat
# =============================================================================


@router.websocket("/chat")
async def websocket_chat(websocket: WebSocket):
    """
    WebSocket endpoint for chat with session and context management.

    Message format:
    {
        "action": "chat" | "verify", # Optional. Defaults to "chat".
        "message": str,              # User message
        "session_id": str | null,    # Session ID (null for new session)
        "history": [...] | null,     # Optional: explicit history override
        "kb_name": str,              # Knowledge base name (for RAG)
        "enable_rag": bool,          # Enable RAG retrieval
        "enable_web_search": bool,   # Enable Web Search
        # Verify action only:
        "target_question": str,      # Question to verify
        "target_answer": str | null  # Existing assistant answer (optional baseline)
        "council_depth": "standard" | "quick" | "deep",  # Optional: depth preset
        "enable_council_interaction": bool,              # Optional: checkpoints between steps
        "enable_council_audio": bool,                    # Optional: generate TTS audio for final output
        "checkpoint_timeout_s": int | float | null       # Optional: checkpoint wait limit
    }

    Response format:
    - {"type": "session", "session_id": str}           # Session ID (new or existing)
    - {"type": "status", "stage": str, "message": str} # Status updates
    - {"type": "stream", "content": str}               # Streaming response chunks
    - {"type": "sources", "rag": list, "web": list}    # Source citations
    - {"type": "result", "content": str}               # Final complete response
    - {"type": "error", "message": str}                # Error message
    """
    await websocket.accept()

    # Get system language for agent
    language = config.get("system", {}).get("language", "en")

    try:
        while True:
            # Receive message
            data = await websocket.receive_json()
            action = (data.get("action") or "chat").strip().lower()
            if action == "verify":
                message = (data.get("target_question") or "").strip()
            else:
                message = (data.get("message") or "").strip()
            session_id = data.get("session_id")
            explicit_history = data.get("history")  # Optional override
            kb_name = data.get("kb_name", "")
            enable_rag = data.get("enable_rag", False)
            enable_web_search = data.get("enable_web_search", False)
            target_answer = data.get("target_answer") if action == "verify" else None
            council_depth = str(data.get("council_depth") or "standard").strip().lower()
            enable_council_interaction = bool(data.get("enable_council_interaction", False))
            enable_council_audio = bool(data.get("enable_council_audio", False))
            checkpoint_timeout_s = data.get("checkpoint_timeout_s")

            if not message:
                await websocket.send_json({"type": "error", "message": "Message is required"})
                continue

            logger.info(
                f"Chat request: session={session_id}, "
                f"action={action}, message={message[:50]}..., rag={enable_rag}, web={enable_web_search}"
            )

            try:
                # Get or create session
                if session_id:
                    session = session_manager.get_session(session_id)
                    if not session:
                        # Session not found, create new one
                        session = session_manager.create_session(
                            title=message[:50] + ("..." if len(message) > 50 else ""),
                            settings={
                                "kb_name": kb_name,
                                "enable_rag": enable_rag,
                                "enable_web_search": enable_web_search,
                            },
                        )
                        session_id = session["session_id"]
                else:
                    # Create new session
                    session = session_manager.create_session(
                        title=message[:50] + ("..." if len(message) > 50 else ""),
                        settings={
                            "kb_name": kb_name,
                            "enable_rag": enable_rag,
                            "enable_web_search": enable_web_search,
                        },
                    )
                    session_id = session["session_id"]

                # Send session ID to frontend
                await websocket.send_json(
                    {
                        "type": "session",
                        "session_id": session_id,
                    }
                )

                # Build history from session or explicit override
                if explicit_history is not None:
                    history = explicit_history
                else:
                    # Get history from session messages
                    history = []
                    for msg in session.get("messages", []):
                        if msg.get("exclude_from_history"):
                            continue
                        role = msg.get("role")
                        if role not in ("user", "assistant"):
                            continue
                        history.append({"role": role, "content": msg.get("content", "")})

                # Add user message to session (chat action only)
                if action != "verify":
                    session_manager.add_message(
                        session_id=session_id,
                        role="user",
                        content=message,
                    )

                # Initialize ChatAgent
                agent = ChatAgent(language=language, config=config)

                # Send status updates
                if enable_rag and kb_name:
                    await websocket.send_json(
                        {
                            "type": "status",
                            "stage": "rag",
                            "message": f"Searching knowledge base: {kb_name}...",
                        }
                    )

                if enable_web_search:
                    await websocket.send_json(
                        {
                            "type": "status",
                            "stage": "web",
                            "message": "Searching the web...",
                        }
                    )

                await websocket.send_json(
                    {
                        "type": "status",
                        "stage": "generating" if action != "verify" else "council",
                        "message": "Generating response..."
                        if action != "verify"
                        else "Starting council verification...",
                    }
                )

                full_response = ""
                sources = {"rag": [], "web": []}

                if action == "verify":
                    # Council verification path (non-streaming for MVP)
                    await websocket.send_json(
                        {
                            "type": "status",
                            "stage": "council_draft",
                            "message": "Council drafting...",
                        }
                    )

                    # Reuse ChatAgent retrieval + message building to preserve context and history
                    truncated_history = agent.truncate_history(history)
                    context, sources = await agent.retrieve_context(
                        message=message,
                        kb_name=kb_name,
                        enable_rag=enable_rag,
                        enable_web_search=enable_web_search,
                    )
                    chat_messages = agent.build_messages(
                        message=message, history=truncated_history, context=context
                    )

                    await websocket.send_json(
                        {
                            "type": "status",
                            "stage": "council_review",
                            "message": "Council reviewing...",
                        }
                    )

                    from src.services.council import (
                        CouncilLogStore,
                        CouncilOrchestrator,
                        load_council_config,
                    )
                    from src.services.council.presets import apply_council_preset

                    council_cfg = apply_council_preset(
                        load_council_config(project_root),
                        preset=council_depth,
                    )
                    orchestrator = CouncilOrchestrator(council_cfg)

                    async def checkpoint_callback(event: dict[str, object]):
                        if not enable_council_interaction:
                            return None

                        timeout = 120.0
                        if isinstance(checkpoint_timeout_s, (int, float)):
                            timeout = max(5.0, float(checkpoint_timeout_s))

                        checkpoint = {
                            "checkpoint_id": f"{event.get('council_id')}_r{event.get('round_index')}",
                            "council_id": event.get("council_id"),
                            "task": event.get("task"),
                            "round_index": event.get("round_index"),
                            "review_parsed": event.get("review_parsed"),
                            "cross_exam_questions": event.get("cross_exam_questions") or [],
                            "limit": event.get("limit"),
                        }

                        await websocket.send_json({"type": "checkpoint", "checkpoint": checkpoint})
                        await websocket.send_json(
                            {
                                "type": "status",
                                "stage": "council_checkpoint",
                                "message": "Council paused for your input.",
                            }
                        )

                        deadline = time.monotonic() + timeout
                        while True:
                            remaining = deadline - time.monotonic()
                            if remaining <= 0:
                                return None
                            try:
                                incoming = await asyncio.wait_for(
                                    websocket.receive_json(), timeout=remaining
                                )
                            except asyncio.TimeoutError:
                                return None
                            except WebSocketDisconnect:
                                return {"action": "cancel"}

                            if not isinstance(incoming, dict):
                                continue
                            if (
                                str(incoming.get("action") or "").strip().lower()
                                != "council_checkpoint"
                            ):
                                continue

                            payload = incoming.get("payload")
                            if not isinstance(payload, dict):
                                continue

                            decision = str(payload.get("action") or "").strip().lower()
                            if decision not in {"continue", "cancel"}:
                                continue

                            return payload
                    run = await orchestrator.run_chat_verify(
                        question=message,
                        chat_messages=chat_messages,
                        context=context,
                        sources=sources,
                        kb_name=kb_name,
                        enable_rag=enable_rag,
                        enable_web_search=enable_web_search,
                        language=language,
                        existing_answer=target_answer,
                        checkpoint_callback=checkpoint_callback
                        if enable_council_interaction
                        else None,
                    )

                    store = CouncilLogStore()

                    # Optional: generate TTS audio for the final synthesis (blocking for now)
                    if (
                        enable_council_audio
                        and run.final is not None
                        and bool((run.final.content or "").strip())
                    ):
                        await websocket.send_json(
                            {
                                "type": "status",
                                "stage": "council_audio",
                                "message": "Generating audio...",
                            }
                        )
                        from src.services.council.audio import (
                            prepare_final_audio,
                            synthesize_final_audio,
                        )
                        from src.services.tts.config import get_tts_config

                        try:
                            tts_cfg = get_tts_config()
                            voice = str(tts_cfg.get("voice") or "").strip()
                            prepare_final_audio(
                                run.final,
                                store=store,
                                council_id=run.council_id,
                                task=run.task,
                                voice=voice,
                            )
                            await synthesize_final_audio(run.final, tts_config=tts_cfg)
                        except Exception as e:
                            run.final.audio_error = str(e)

                    # Persist log and attach reference to the assistant message
                    store.save(run)

                    await websocket.send_json(
                        {
                            "type": "status",
                            "stage": "council_synthesis",
                            "message": "Chairman synthesizing...",
                        }
                    )

                    if run.status == "canceled":
                        full_response = "Verification canceled."
                    else:
                        full_response = (
                            (run.final.content if run.final else "").strip()
                            or "Verification failed."
                        )

                    verified = bool(run.final and run.final.content and run.status == "ok")

                    audio_meta: dict[str, object] = {}
                    if run.final:
                        if run.final.voice:
                            audio_meta["voice"] = run.final.voice
                        if run.final.audio_url:
                            audio_meta["audio_url"] = run.final.audio_url
                        if run.final.audio_error:
                            audio_meta["audio_error"] = run.final.audio_error

                    # Send sources if any
                    if sources.get("rag") or sources.get("web"):
                        await websocket.send_json({"type": "sources", **sources})

                    # Send final result with metadata (frontend may render council details)
                    await websocket.send_json(
                        {
                            "type": "result",
                            "content": full_response,
                            "meta": {
                                "verified": verified,
                                "council_id": run.council_id,
                                "council_task": run.task,
                                "status": run.status,
                                **audio_meta,
                            },
                        }
                    )

                    # Save assistant message to session (excluded from future LLM history by default)
                    session_manager.add_message(
                        session_id=session_id,
                        role="assistant",
                        content=full_response,
                        sources=sources if (sources.get("rag") or sources.get("web")) else None,
                        meta={
                            "verified": verified,
                            "council_id": run.council_id,
                            "council_task": run.task,
                            "status": run.status,
                            **audio_meta,
                        },
                        exclude_from_history=True,
                    )

                else:
                    # Standard chat path (streaming)
                    stream_generator = await agent.process(
                        message=message,
                        history=history,
                        kb_name=kb_name,
                        enable_rag=enable_rag,
                        enable_web_search=enable_web_search,
                        stream=True,
                    )

                    async for chunk_data in stream_generator:
                        if chunk_data["type"] == "chunk":
                            await websocket.send_json(
                                {
                                    "type": "stream",
                                    "content": chunk_data["content"],
                                }
                            )
                            full_response += chunk_data["content"]
                        elif chunk_data["type"] == "complete":
                            full_response = chunk_data["response"]
                            sources = chunk_data.get("sources", {"rag": [], "web": []})

                if action != "verify":
                    # Send sources if any
                    if sources.get("rag") or sources.get("web"):
                        await websocket.send_json({"type": "sources", **sources})

                    # Send final result
                    await websocket.send_json(
                        {
                            "type": "result",
                            "content": full_response,
                        }
                    )

                    # Save assistant message to session
                    session_manager.add_message(
                        session_id=session_id,
                        role="assistant",
                        content=full_response,
                        sources=sources if (sources.get("rag") or sources.get("web")) else None,
                    )

                logger.info(f"Chat completed: session={session_id}, {len(full_response)} chars")

                # Record interaction in memory system
                try:
                    memory_manager.record_interaction(
                        module="chat", topic=kb_name if kb_name else None
                    )
                    memory_manager.record_question(question=message, answer=full_response[:500])
                    if kb_name:
                        memory_manager.record_topic(topic=kb_name, category="knowledge_base")
                except Exception as mem_error:
                    logger.warning(f"Failed to record memory: {mem_error}")

            except Exception as e:
                logger.error(f"Chat processing error: {e}")
                await websocket.send_json({"type": "error", "message": str(e)})

    except WebSocketDisconnect:
        logger.debug("Client disconnected from chat")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
