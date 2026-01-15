import asyncio
from pathlib import Path
import sys

project_root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(project_root))


def test_synthesize_speech_to_file_writes_mp3(tmp_path: Path):
    from src.services.tts.service import synthesize_speech_to_file

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
        out_path = tmp_path / "out.mp3"
        result = await synthesize_speech_to_file(
            text="hello",
            voice="onyx",
            output_path=out_path,
            tts_config={
                "model": "tts-1",
                "api_key": "sk-proxy",
                "base_url": "http://localhost:8317/v1",
            },
            client_factory=lambda *_args, **_kwargs: DummyClient(),
        )
        assert result == out_path
        assert out_path.exists()
        assert out_path.read_bytes() == b"mp3-bytes"

    asyncio.run(run())
