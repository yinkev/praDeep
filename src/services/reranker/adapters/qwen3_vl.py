"""Qwen3-VL-Reranker adapter for local reranking on Apple Silicon."""

import logging
from typing import Any, Dict, List, Optional

from .base import BaseRerankerAdapter, RerankRequest, RerankResponse

logger = logging.getLogger(__name__)


class Qwen3VLRerankerAdapter(BaseRerankerAdapter):
    """Local adapter for Qwen3-VL-Reranker-8B using PyTorch MPS."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self._model = None
        self._tokenizer = None
        self._device = None
        self._dtype = None
        self._loaded_model_name: Optional[str] = None

    async def rerank(self, request: RerankRequest) -> RerankResponse:
        self._validate_request(request)
        model_name = request.model or self.model
        if not model_name:
            raise ValueError("Qwen3-VL reranker model name is required")

        self._ensure_model(model_name)

        queries = [request.query] * len(request.passages)
        max_length = request.max_length or self.max_length or 512

        inputs = self._tokenizer(
            queries,
            request.passages,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=max_length,
        )
        inputs = self._move_to_device(inputs)

        scores = self._run_model(inputs)
        scores_list = scores.float().cpu().tolist()

        logger.info(
            "Generated %d Qwen3-VL rerank scores (model: %s)",
            len(scores_list),
            model_name,
        )

        return RerankResponse(
            scores=scores_list,
            model=model_name,
            usage={"pairs": len(request.passages)},
        )

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "model": self.model,
            "device": self.device,
            "dtype": self.dtype,
            "max_length": self.max_length,
            "local": True,
            "provider": "qwen3_vl",
        }

    def _validate_request(self, request: RerankRequest) -> None:
        if not request.query:
            raise ValueError("Rerank query is required")
        if not request.passages:
            raise ValueError("No passages provided for rerank request")

    def _ensure_model(self, model_name: str) -> None:
        if self._model is not None and self._loaded_model_name == model_name:
            return

        try:
            import torch
            from transformers import AutoModelForSequenceClassification, AutoTokenizer
        except ImportError as exc:
            raise ImportError(
                "Qwen3-VL reranker requires torch and transformers. "
                "Install with: pip install torch torchvision torchaudio transformers"
            ) from exc

        device = self.device or "mps"
        if device == "mps":
            if not torch.backends.mps.is_available():
                raise RuntimeError(
                    "Apple Silicon MPS is not available. "
                    "Install PyTorch with MPS support or run on a compatible Mac."
                )
            self._device = torch.device("mps")
        elif device == "cuda":
            if not torch.cuda.is_available():
                raise RuntimeError("CUDA is not available on this system")
            self._device = torch.device("cuda")
        else:
            self._device = torch.device("cpu")

        self._dtype = self._resolve_dtype(torch, self._device, self.dtype)

        self._tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        self._model = AutoModelForSequenceClassification.from_pretrained(
            model_name, trust_remote_code=True, torch_dtype=self._dtype
        )
        self._model.to(self._device)
        self._model.eval()
        self._loaded_model_name = model_name

        logger.info("Loaded Qwen3-VL reranker model: %s on %s", model_name, self._device)

    def _resolve_dtype(self, torch_module, device, dtype_name: Optional[str]):
        mapping = {
            "bfloat16": torch_module.bfloat16,
            "float16": torch_module.float16,
            "float32": torch_module.float32,
        }
        dtype = mapping.get((dtype_name or "bfloat16").lower(), torch_module.bfloat16)

        if dtype == torch_module.bfloat16:
            try:
                torch_module.zeros(1, device=device, dtype=dtype)
            except Exception:
                dtype = torch_module.float16

        return dtype

    def _move_to_device(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        return {
            key: value.to(self._device) if hasattr(value, "to") else value
            for key, value in inputs.items()
        }

    def _run_model(self, inputs: Dict[str, Any]):
        try:
            import torch
        except ImportError as exc:
            raise ImportError(
                "Qwen3-VL reranker requires torch. Install with: pip install torch"
            ) from exc

        with torch.no_grad():
            outputs = self._model(**inputs)

        if hasattr(outputs, "logits") and outputs.logits is not None:
            logits = outputs.logits
        elif isinstance(outputs, (list, tuple)) and outputs:
            logits = outputs[0]
        else:
            raise RuntimeError("Model outputs do not contain logits")

        return logits.squeeze(-1)
