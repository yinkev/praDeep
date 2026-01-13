from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any, Callable

from src.services.tts import service as tts_service

from .storage import CouncilLogStore
from .types import CouncilCall, CouncilFinal


def prepare_call_audio(
    call: CouncilCall,
    *,
    store: CouncilLogStore,
    council_id: str,
    task: str,
    voice: str,
    filename: str | None = None,
) -> None:
    """
    Populate audio fields on a call and allocate a deterministic output path/URL.

    This is intentionally separate from synthesis so callers can emit "pending" UI events
    with a stable URL before audio generation completes.
    """
    if not call.message_id:
        call.message_id = uuid.uuid4().hex[:12]

    voice_id = (voice or "").strip()
    if voice_id:
        call.voice = voice_id

    safe_filename = (filename or "").strip() or f"{call.role}_{call.message_id}.mp3"
    out_path = store.audio_dir(council_id, task=task) / safe_filename
    out_path.parent.mkdir(parents=True, exist_ok=True)

    call.audio_path = str(out_path)
    call.audio_url = store.outputs_url_for_path(out_path)
    call.audio_error = None


async def synthesize_call_audio(
    call: CouncilCall,
    *,
    tts_config: dict[str, Any] | None = None,
    client_factory: Callable[..., Any] | None = None,
) -> None:
    """
    Generate the call audio in-place based on pre-populated call.audio_path/voice.

    On failure, call.audio_error is populated and no exception is raised.
    """
    text = (call.content or "").strip()
    if not text:
        return

    if not call.audio_path or not call.voice:
        call.audio_error = "Audio not prepared (missing audio_path or voice)."
        return

    out_path = Path(call.audio_path)

    kwargs: dict[str, Any] = {"tts_config": tts_config}
    if client_factory is not None:
        kwargs["client_factory"] = client_factory

    try:
        await tts_service.synthesize_speech_to_file(
            text=text, voice=call.voice, output_path=out_path, **kwargs
        )
    except Exception as e:
        call.audio_error = str(e)


def prepare_final_audio(
    final: CouncilFinal,
    *,
    store: CouncilLogStore,
    council_id: str,
    task: str,
    voice: str,
    filename: str | None = None,
) -> None:
    """
    Populate audio fields on the final synthesis and allocate a deterministic output path/URL.

    This mirrors `prepare_call_audio` but targets the chairman final output.
    """
    voice_id = (voice or "").strip()
    if voice_id:
        final.voice = voice_id

    safe_filename = (filename or "").strip() or "final.mp3"
    out_path = store.audio_dir(council_id, task=task) / safe_filename
    out_path.parent.mkdir(parents=True, exist_ok=True)

    final.audio_path = str(out_path)
    final.audio_url = store.outputs_url_for_path(out_path)
    final.audio_error = None


async def synthesize_final_audio(
    final: CouncilFinal,
    *,
    tts_config: dict[str, Any] | None = None,
    client_factory: Callable[..., Any] | None = None,
) -> None:
    """
    Generate the final audio in-place based on pre-populated final.audio_path/voice.

    On failure, final.audio_error is populated and no exception is raised.
    """
    text = (final.content or "").strip()
    if not text:
        return

    if not final.audio_path or not final.voice:
        final.audio_error = "Audio not prepared (missing audio_path or voice)."
        return

    out_path = Path(final.audio_path)

    kwargs: dict[str, Any] = {"tts_config": tts_config}
    if client_factory is not None:
        kwargs["client_factory"] = client_factory

    try:
        await tts_service.synthesize_speech_to_file(
            text=text, voice=final.voice, output_path=out_path, **kwargs
        )
    except Exception as e:
        final.audio_error = str(e)


__all__ = [
    "prepare_call_audio",
    "synthesize_call_audio",
    "prepare_final_audio",
    "synthesize_final_audio",
]
