import asyncio
from pathlib import Path
import sys

project_root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(project_root))


def test_prepare_and_synthesize_call_audio_writes_mp3(tmp_path: Path):
    from src.services.council import CouncilCall, CouncilLogStore
    from src.services.council.audio import prepare_call_audio, synthesize_call_audio

    store = CouncilLogStore(base_dir=tmp_path)
    call = CouncilCall(role="member", model="dummy", content="hello")

    prepare_call_audio(
        call,
        store=store,
        council_id="council_test",
        task="chat_verify",
        voice="onyx",
    )

    class DummyResponse:
        def __init__(self, payload: bytes) -> None:
            self._payload = payload

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def stream_to_file(self, path: Path) -> None:
            path.write_bytes(self._payload)

    class DummyClient:
        class audio:
            class speech:
                class with_streaming_response:
                    @staticmethod
                    def create(*, model: str, voice: str, input: str):
                        assert model == "tts-1"
                        assert voice == "onyx"
                        assert input == "hello"
                        return DummyResponse(b"mp3-bytes")

    async def run():
        await synthesize_call_audio(
            call,
            tts_config={
                "model": "tts-1",
                "api_key": "sk-proxy",
                "base_url": "http://localhost:8317/v1",
            },
            client_factory=lambda *_args, **_kwargs: DummyClient(),
        )

    asyncio.run(run())

    assert call.audio_path
    assert Path(call.audio_path).exists()
    assert Path(call.audio_path).read_bytes() == b"mp3-bytes"
    assert call.voice == "onyx"


def test_synthesize_call_audio_records_error(tmp_path: Path):
    from src.services.council import CouncilCall, CouncilLogStore
    from src.services.council.audio import prepare_call_audio, synthesize_call_audio

    store = CouncilLogStore(base_dir=tmp_path)
    call = CouncilCall(role="member", model="dummy", content="hello")

    prepare_call_audio(
        call,
        store=store,
        council_id="council_test",
        task="chat_verify",
        voice="onyx",
    )

    def failing_factory(*_args, **_kwargs):
        raise RuntimeError("boom")

    async def run():
        await synthesize_call_audio(
            call,
            tts_config={
                "model": "tts-1",
                "api_key": "sk-proxy",
                "base_url": "http://localhost:8317/v1",
            },
            client_factory=failing_factory,
        )

    asyncio.run(run())

    assert call.audio_error


def test_prepare_and_synthesize_final_audio_writes_mp3(tmp_path: Path):
    from src.services.council import CouncilFinal, CouncilLogStore
    from src.services.council.audio import prepare_final_audio, synthesize_final_audio

    store = CouncilLogStore(base_dir=tmp_path)
    final = CouncilFinal(model="chairman", content="hello")

    prepare_final_audio(
        final,
        store=store,
        council_id="council_test",
        task="chat_verify",
        voice="nova",
    )

    class DummyResponse:
        def __init__(self, payload: bytes) -> None:
            self._payload = payload

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def stream_to_file(self, path: Path) -> None:
            path.write_bytes(self._payload)

    class DummyClient:
        class audio:
            class speech:
                class with_streaming_response:
                    @staticmethod
                    def create(*, model: str, voice: str, input: str):
                        assert model == "tts-1"
                        assert voice == "nova"
                        assert input == "hello"
                        return DummyResponse(b"mp3-bytes")

    async def run():
        await synthesize_final_audio(
            final,
            tts_config={
                "model": "tts-1",
                "api_key": "sk-proxy",
                "base_url": "http://localhost:8317/v1",
            },
            client_factory=lambda *_args, **_kwargs: DummyClient(),
        )

    asyncio.run(run())

    assert final.audio_path
    assert Path(final.audio_path).exists()
    assert Path(final.audio_path).read_bytes() == b"mp3-bytes"
    assert final.voice == "nova"
