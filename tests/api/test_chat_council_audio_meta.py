from __future__ import annotations

from pathlib import Path
import time


def test_chat_verify_includes_audio_meta_when_enabled(monkeypatch, tmp_path: Path):
    from fastapi.testclient import TestClient

    from src.api.main import app

    # ------------------------------------------------------------------
    # Patch dependencies to avoid network calls and keep test deterministic.
    # ------------------------------------------------------------------

    class DummyChatAgent:
        def __init__(self, *args, **kwargs):
            pass

        def truncate_history(self, history):
            return history

        async def retrieve_context(self, *args, **kwargs):
            return "", {"rag": [], "web": []}

        def build_messages(self, *, message, history, context):
            return [{"role": "user", "content": message}]

    monkeypatch.setattr("src.api.routers.chat.ChatAgent", DummyChatAgent)

    from src.services.council.types import CouncilFinal, CouncilRun

    class DummyOrchestrator:
        def __init__(self, *args, **kwargs):
            pass

        async def run_chat_verify(self, *, question: str, **_kwargs):
            return CouncilRun(
                council_id="council_test_audio",
                created_at=time.time(),
                task="chat_verify",
                question=question,
                final=CouncilFinal(model="chairman", content="hello"),
                status="ok",
            )

    monkeypatch.setattr("src.services.council.CouncilOrchestrator", DummyOrchestrator)

    from src.services.council.storage import CouncilLogStore as RealCouncilLogStore

    class TmpCouncilLogStore(RealCouncilLogStore):
        def __init__(self, *args, **kwargs) -> None:
            super().__init__(base_dir=tmp_path)

    monkeypatch.setattr("src.services.council.CouncilLogStore", TmpCouncilLogStore)
    monkeypatch.setattr("src.services.council.storage.CouncilLogStore", TmpCouncilLogStore)

    monkeypatch.setattr(
        "src.services.tts.config.get_tts_config",
        lambda: {
            "model": "tts-1",
            "api_key": "sk-proxy",
            "base_url": "http://localhost:8317/v1",
            "voice": "alloy",
        },
    )

    async def fake_synthesize_speech_to_file(*, text, voice, output_path, **_kwargs):
        assert text == "hello"
        assert voice == "alloy"
        output_path.write_bytes(b"mp3-bytes")
        return output_path

    monkeypatch.setattr(
        "src.services.tts.service.synthesize_speech_to_file", fake_synthesize_speech_to_file
    )

    # ------------------------------------------------------------------
    # Exercise the WebSocket verify flow.
    # ------------------------------------------------------------------

    client = TestClient(app)
    with client.websocket_connect("/api/v1/chat") as ws:
        ws.send_json(
            {
                "action": "verify",
                "target_question": "What is 2 + 2?",
                "target_answer": "2 + 2 = 4.",
                "session_id": None,
                "history": [],
                "kb_name": "",
                "enable_rag": False,
                "enable_web_search": False,
                "council_depth": "quick",
                "enable_council_interaction": False,
                "council_audio_mode": "final",
            }
        )

        while True:
            msg = ws.receive_json()
            if msg.get("type") == "result":
                meta = msg.get("meta") or {}
                assert meta.get("audio_url")
                assert meta.get("voice") == "alloy"
                assert meta.get("audio_error") in (None, "")
                break
