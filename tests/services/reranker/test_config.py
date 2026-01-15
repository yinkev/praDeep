from pathlib import Path
import sys

project_root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(project_root))

from src.services.reranker.config import get_reranker_config

RERANKER_ENV_VARS = [
    "RERANKER_BINDING",
    "RERANKER_MODEL",
    "RERANKER_DEVICE",
    "RERANKER_DTYPE",
    "RERANKER_MAX_LENGTH",
    "RERANKER_REQUEST_TIMEOUT",
]


def test_reranker_config_defaults(monkeypatch):
    for var in RERANKER_ENV_VARS:
        monkeypatch.delenv(var, raising=False)

    config = get_reranker_config()

    assert config.binding == "qwen3_vl"
    assert config.model == "Qwen/Qwen3-VL-Reranker-8B"
    assert config.device == "mps"
    assert config.dtype == "bfloat16"
    assert config.max_length == 512
    assert config.request_timeout == 30


def test_reranker_config_env_overrides(monkeypatch):
    monkeypatch.setenv("RERANKER_BINDING", "qwen3_vl")
    monkeypatch.setenv("RERANKER_MODEL", "Qwen/Qwen3-VL-Reranker-8B-Alt")
    monkeypatch.setenv("RERANKER_DEVICE", "cpu")
    monkeypatch.setenv("RERANKER_DTYPE", "float16")
    monkeypatch.setenv("RERANKER_MAX_LENGTH", "256")
    monkeypatch.setenv("RERANKER_REQUEST_TIMEOUT", "12")

    config = get_reranker_config()

    assert config.binding == "qwen3_vl"
    assert config.model == "Qwen/Qwen3-VL-Reranker-8B-Alt"
    assert config.device == "cpu"
    assert config.dtype == "float16"
    assert config.max_length == 256
    assert config.request_timeout == 12
