import asyncio
from types import SimpleNamespace

import numpy as np

from src.services.embedding.client import EmbeddingClient


def test_lightrag_embedding_func_returns_numpy_array():
    client = EmbeddingClient.__new__(EmbeddingClient)
    client.config = SimpleNamespace(dim=3, max_tokens=8192)

    async def fake_embed(texts):
        return [[0.0, 1.0, 2.0] for _ in texts]

    client.embed = fake_embed

    embed_func = EmbeddingClient.get_embedding_func(client)
    output = asyncio.run(embed_func(["hello", "world"]))

    assert isinstance(output, np.ndarray)
    assert output.shape == (2, 3)
    assert output.dtype == np.float32

