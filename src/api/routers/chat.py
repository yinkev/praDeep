"""
Chat API Router
================

WebSocket endpoint for lightweight chat with session management.
REST endpoints for session operations.
"""

from pathlib import Path
import sys

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

                    from src.services.council import CouncilLogStore, CouncilOrchestrator, load_council_config

                    council_cfg = load_council_config(project_root)
                    orchestrator = CouncilOrchestrator(council_cfg)
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
                    )

                    # Persist log and attach reference to the assistant message
                    store = CouncilLogStore()
                    store.save(run)

                    await websocket.send_json(
                        {
                            "type": "status",
                            "stage": "council_synthesis",
                            "message": "Chairman synthesizing...",
                        }
                    )

                    full_response = (run.final.content if run.final else "").strip() or "Verification failed."

                    # Send sources if any
                    if sources.get("rag") or sources.get("web"):
                        await websocket.send_json({"type": "sources", **sources})

                    # Send final result with metadata (frontend may render council details)
                    await websocket.send_json(
                        {
                            "type": "result",
                            "content": full_response,
                            "meta": {
                                "verified": True,
                                "council_id": run.council_id,
                                "council_task": run.task,
                                "status": run.status,
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
                            "verified": True,
                            "council_id": run.council_id,
                            "council_task": run.task,
                            "status": run.status,
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
