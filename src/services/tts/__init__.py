"""
TTS Service
===========

Text-to-Speech configuration for praDeep.

Usage:
    from src.services.tts import get_tts_config

    config = get_tts_config()
    # config = {"model": "tts-1", "api_key": "...", "base_url": "...", "voice": "alloy"}
"""

from .config import get_tts_config
from .service import synthesize_speech_to_file

__all__ = ["get_tts_config", "synthesize_speech_to_file"]
