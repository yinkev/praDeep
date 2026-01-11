"""
Reranker Configuration
======================

Configuration management for reranker services.
"""

from dataclasses import dataclass
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# Load environment variables
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
load_dotenv(PROJECT_ROOT / "praDeep.env", override=False)
load_dotenv(PROJECT_ROOT / ".env", override=False)


@dataclass
class RerankerConfig:
    """Reranker configuration dataclass."""

    binding: str
    model: str
    device: str = "mps"
    dtype: str = "bfloat16"
    max_length: int = 512
    request_timeout: int = 30


def _strip_value(value: Optional[str]) -> Optional[str]:
    """Remove leading/trailing whitespace and quotes from string."""
    if value is None:
        return None
    cleaned = value.strip().strip("\"'")
    return cleaned if cleaned else None


def _to_int(value: Optional[str], default: int) -> int:
    """Convert environment variable to int, fallback to default value on failure."""
    try:
        return int(value) if value is not None else default
    except (TypeError, ValueError):
        return default


def get_reranker_config() -> RerankerConfig:
    """
    Load reranker configuration from environment variables.

    Returns:
        RerankerConfig: Configuration dataclass
    """
    binding = _strip_value(os.getenv("RERANKER_BINDING")) or "qwen3_vl"
    model = _strip_value(os.getenv("RERANKER_MODEL")) or "Qwen/Qwen3-VL-Reranker-8B"
    device = _strip_value(os.getenv("RERANKER_DEVICE")) or "mps"
    dtype = _strip_value(os.getenv("RERANKER_DTYPE")) or "bfloat16"

    max_length = _to_int(_strip_value(os.getenv("RERANKER_MAX_LENGTH")), 512)
    request_timeout = _to_int(_strip_value(os.getenv("RERANKER_REQUEST_TIMEOUT")), 30)

    return RerankerConfig(
        binding=binding,
        model=model,
        device=device,
        dtype=dtype,
        max_length=max_length,
        request_timeout=request_timeout,
    )


__all__ = ["RerankerConfig", "get_reranker_config"]
