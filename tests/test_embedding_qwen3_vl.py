import unittest
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_PATH = ROOT / "src" / "services" / "embedding" / "adapters" / "base.py"
PROVIDER_PATH = ROOT / "src" / "services" / "embedding" / "provider.py"
ADAPTER_PATH = ROOT / "src" / "services" / "embedding" / "adapters" / "qwen3_vl.py"


class TestQwen3VLEmbeddingAdapter(unittest.TestCase):
    def test_embedding_request_accepts_images(self):
        spec = spec_from_file_location("embedding_base", BASE_PATH)
        module = module_from_spec(spec)
        assert spec and spec.loader
        spec.loader.exec_module(module)
        EmbeddingRequest = module.EmbeddingRequest

        request = EmbeddingRequest(
            texts=["hello"],
            model="Qwen/Qwen3-VL-Embedding-8B",
            images=["/tmp/fake.png"],
        )
        self.assertEqual(request.images, ["/tmp/fake.png"])

    def test_provider_mapping_includes_qwen3_vl(self):
        provider_text = PROVIDER_PATH.read_text(encoding="utf-8")
        self.assertIn("\"qwen3_vl\"", provider_text)
        self.assertIn("Qwen3VLEmbeddingAdapter", provider_text)

    def test_adapter_rejects_empty_inputs(self):
        adapter_text = ADAPTER_PATH.read_text(encoding="utf-8")
        self.assertIn("def _validate_request", adapter_text)
        self.assertIn("No texts or images provided", adapter_text)


if __name__ == "__main__":
    unittest.main()
