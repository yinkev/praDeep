import asyncio
from pathlib import Path
import sys

project_root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(project_root))

from src.services.reranker.adapters.base import (
    BaseRerankerAdapter,
    RerankRequest,
    RerankResponse,
)
from src.services.reranker.config import RerankerConfig
from src.services.reranker.service import RerankerService


class StubRerankerAdapter(BaseRerankerAdapter):
    async def rerank(self, request: RerankRequest) -> RerankResponse:
        return RerankResponse(
            scores=[0.1, 0.9, 0.4],
            model=request.model or "stub",
            usage={"pairs": len(request.passages)},
        )

    def get_model_info(self):
        return {"model": self.model}


class FailingRerankerAdapter(BaseRerankerAdapter):
    async def rerank(self, request: RerankRequest) -> RerankResponse:
        raise RuntimeError("adapter failure")

    def get_model_info(self):
        return {"model": self.model}


def test_reranker_service_orders_results():
    config = RerankerConfig(binding="stub", model="stub")
    service = RerankerService(config=config, adapter=StubRerankerAdapter({"model": "stub"}))

    results = asyncio.run(service.rerank("query", ["a", "b", "c"]))

    assert [result.index for result in results] == [1, 2, 0]
    assert [result.score for result in results] == [0.9, 0.4, 0.1]


def test_reranker_service_falls_back_on_failure():
    config = RerankerConfig(binding="stub", model="stub")
    service = RerankerService(config=config, adapter=FailingRerankerAdapter({"model": "stub"}))

    results = asyncio.run(service.rerank("query", ["a", "b"]))

    assert [result.index for result in results] == [0, 1]
    assert [result.score for result in results] == [0.0, 0.0]
    assert [result.passage for result in results] == ["a", "b"]
