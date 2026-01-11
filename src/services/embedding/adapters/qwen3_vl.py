"""Qwen3-VL-Embedding adapter for local multimodal embeddings on Apple Silicon."""

import base64
import binascii
import logging
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from .base import BaseEmbeddingAdapter, EmbeddingRequest, EmbeddingResponse

logger = logging.getLogger(__name__)


class Qwen3VLEmbeddingAdapter(BaseEmbeddingAdapter):
    """Local adapter for Qwen3-VL-Embedding-8B using PyTorch MPS."""

    DEFAULT_DIMENSIONS = 4096
    SUPPORTED_DIMENSIONS = [64, 128, 256, 512, 1024, 2048, 4096]

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self._model = None
        self._processor = None
        self._device = None
        self._dtype = None
        self._loaded_model_name: Optional[str] = None

    async def embed(self, request: EmbeddingRequest) -> EmbeddingResponse:
        self._validate_request(request)
        model_name = request.model or self.model
        if not model_name:
            raise ValueError("Qwen3-VL embedding model name is required")

        self._ensure_model(model_name)

        embeddings: List[List[float]] = []

        if request.texts:
            text_embeddings = self._embed_texts(request.texts, request)
            embeddings.extend(text_embeddings)

        if request.images:
            image_embeddings = self._embed_images(request.images, request)
            embeddings.extend(image_embeddings)

        actual_dims = len(embeddings[0]) if embeddings else 0

        logger.info(
            "Generated %d Qwen3-VL embeddings (model: %s, dimensions: %d)",
            len(embeddings),
            model_name,
            actual_dims,
        )

        return EmbeddingResponse(
            embeddings=embeddings,
            model=model_name,
            dimensions=actual_dims,
            usage={
                "text_count": len(request.texts),
                "image_count": len(request.images or []),
            },
        )

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "model": self.model,
            "dimensions": self.dimensions or self.DEFAULT_DIMENSIONS,
            "supported_dimensions": self.SUPPORTED_DIMENSIONS,
            "supports_variable_dimensions": True,
            "local": True,
            "provider": "qwen3_vl",
        }

    def _validate_request(self, request: EmbeddingRequest) -> None:
        if not request.texts and not request.images:
            raise ValueError("No texts or images provided for embedding request")

    def _ensure_model(self, model_name: str) -> None:
        if self._model is not None and self._loaded_model_name == model_name:
            return

        try:
            import torch
            from transformers import AutoModel, AutoProcessor, AutoTokenizer
        except ImportError as exc:
            raise ImportError(
                "Qwen3-VL embedding requires torch and transformers. "
                "Install with: pip install torch torchvision torchaudio transformers"
            ) from exc

        if not torch.backends.mps.is_available():
            raise RuntimeError(
                "Apple Silicon MPS is not available. "
                "Install PyTorch with MPS support or run on a compatible Mac."
            )

        self._device = torch.device("mps")
        self._dtype = torch.bfloat16
        try:
            torch.zeros(1, device=self._device, dtype=self._dtype)
        except Exception:
            self._dtype = torch.float16

        try:
            self._processor = AutoProcessor.from_pretrained(
                model_name, trust_remote_code=True
            )
        except Exception:
            self._processor = AutoTokenizer.from_pretrained(
                model_name, trust_remote_code=True
            )

        self._model = AutoModel.from_pretrained(
            model_name, trust_remote_code=True, torch_dtype=self._dtype
        )
        self._model.to(self._device)
        self._model.eval()
        self._loaded_model_name = model_name

        logger.info("Loaded Qwen3-VL embedding model: %s on MPS", model_name)

    def _embed_texts(self, texts: List[str], request: EmbeddingRequest) -> List[List[float]]:
        inputs = self._processor(
            text=texts,
            return_tensors="pt",
            padding=True,
            truncation=request.truncate if request.truncate is not None else True,
        )
        inputs = self._move_to_device(inputs)

        embeddings = self._run_model(inputs, "text")
        embeddings = self._apply_dimensions(embeddings, request)
        embeddings = self._maybe_normalize(embeddings, request)
        return embeddings.cpu().tolist()

    def _embed_images(
        self, images: List[str], request: EmbeddingRequest
    ) -> List[List[float]]:
        pil_images = self._load_images(images)
        try:
            inputs = self._processor(images=pil_images, return_tensors="pt")
        except TypeError as exc:
            raise RuntimeError(
                "Loaded processor does not support image inputs. "
                "Ensure Qwen3-VL processor files are available."
            ) from exc
        inputs = self._move_to_device(inputs)

        embeddings = self._run_model(inputs, "image")
        embeddings = self._apply_dimensions(embeddings, request)
        embeddings = self._maybe_normalize(embeddings, request)
        return embeddings.cpu().tolist()

    def _move_to_device(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        return {
            key: value.to(self._device) if hasattr(value, "to") else value
            for key, value in inputs.items()
        }

    def _run_model(self, inputs: Dict[str, Any], mode: str):
        try:
            import torch
        except ImportError as exc:
            raise ImportError(
                "Qwen3-VL embedding requires torch. Install with: pip install torch"
            ) from exc

        with torch.no_grad():
            if mode == "text" and hasattr(self._model, "get_text_features"):
                return self._model.get_text_features(**inputs)
            if mode == "image" and hasattr(self._model, "get_image_features"):
                return self._model.get_image_features(**inputs)
            if hasattr(self._model, "encode"):
                return self._model.encode(**inputs)

            outputs = self._model(**inputs)
            attention_mask = inputs.get("attention_mask")
            return self._pool_outputs(outputs, attention_mask)

    def _pool_outputs(self, outputs: Any, attention_mask: Any = None):
        try:
            import torch
        except ImportError as exc:
            raise ImportError(
                "Qwen3-VL embedding requires torch. Install with: pip install torch"
            ) from exc

        if hasattr(outputs, "pooler_output") and outputs.pooler_output is not None:
            return outputs.pooler_output

        if hasattr(outputs, "last_hidden_state"):
            hidden = outputs.last_hidden_state
        elif isinstance(outputs, (list, tuple)) and outputs:
            hidden = outputs[0]
        else:
            raise RuntimeError("Model outputs do not contain embeddings")

        if attention_mask is None:
            return hidden.mean(dim=1)

        mask = attention_mask.unsqueeze(-1).to(hidden.dtype)
        summed = (hidden * mask).sum(dim=1)
        denom = mask.sum(dim=1).clamp(min=1)
        return summed / denom

    def _apply_dimensions(self, embeddings, request: EmbeddingRequest):
        dims = request.dimensions or self.dimensions
        if not dims:
            return embeddings

        if embeddings.shape[1] < dims:
            logger.warning(
                "Requested %d dimensions but model returned %d", dims, embeddings.shape[1]
            )
            return embeddings

        return embeddings[:, :dims]

    def _maybe_normalize(self, embeddings, request: EmbeddingRequest):
        if request.normalized is False:
            return embeddings

        try:
            import torch
        except ImportError as exc:
            raise ImportError(
                "Qwen3-VL embedding requires torch. Install with: pip install torch"
            ) from exc

        return torch.nn.functional.normalize(embeddings, p=2, dim=1)

    def _load_images(self, images: Iterable[str]):
        try:
            from PIL import Image
        except ImportError as exc:
            raise ImportError(
                "Qwen3-VL embedding requires Pillow for image inputs. "
                "Install with: pip install pillow"
            ) from exc

        loaded = []
        for image in images:
            path = Path(image)
            if not path.exists():
                if self._is_base64(image):
                    payload = image.split(",", 1)[-1]
                    raw = base64.b64decode(payload)
                    loaded.append(Image.open(BytesIO(raw)).convert("RGB"))
                    continue
                raise FileNotFoundError(f"Image path does not exist: {image}")
            loaded.append(Image.open(path).convert("RGB"))

        return loaded

    def _is_base64(self, value: str) -> bool:
        if value.startswith("data:image"):
            return True

        try:
            base64.b64decode(value, validate=True)
            return True
        except (ValueError, binascii.Error, TypeError):
            return False
