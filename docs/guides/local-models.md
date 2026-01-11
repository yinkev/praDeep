---
title: Local Models Guide
description: Running embedding and LLM models locally for privacy and cost savings
---

# Local Models Guide

Run praDeep with local models for enhanced privacy, reduced costs, and offline operation.

## Prerequisites

- Python 3.10+
- 16 GB RAM minimum (32 GB recommended)
- Apple Silicon Mac (M1/M2/M3) or NVIDIA GPU (8+ GB VRAM)
- 20+ GB disk space for model weights

## Supported Local Models

### Embedding Models

| Model | Size | Dimensions | Best For |
|-------|------|------------|----------|
| Qwen3-VL-Embedding-8B | 16 GB | 4096 | High quality, multimodal |
| ColQwen2 | 4 GB | 128 | Fast, late interaction |
| nomic-embed-text | 500 MB | 768 | Lightweight |
| bge-large-en-v1.5 | 1.3 GB | 1024 | Balanced |

### LLM Models

| Model | Size | Context | Best For |
|-------|------|---------|----------|
| Llama 3.1 8B | 16 GB | 128K | General purpose |
| Qwen2.5 7B | 14 GB | 32K | Multilingual |
| Mistral 7B | 14 GB | 32K | Fast inference |
| Phi-3 Mini | 7 GB | 4K | Lightweight |

## Apple Silicon Setup

### 1. Install Dependencies

```bash
# Install PyTorch with MPS support
pip install torch torchvision torchaudio

# Install transformers and model libraries
pip install transformers accelerate sentencepiece

# Verify MPS is available
python -c "import torch; print(f'MPS available: {torch.backends.mps.is_available()}')"
```

### 2. Configure Environment

```bash
# .env configuration for M2 Max
USE_LOCAL_MODELS=true
DEVICE=mps
EMBEDDING_MODEL=Qwen/Qwen3-VL-Embedding-8B
LLM_MODEL=meta-llama/Meta-Llama-3.1-8B-Instruct
BATCH_SIZE=4
MAX_MEMORY=24GB
```

### 3. Download Models

```python
from transformers import AutoModel, AutoTokenizer

# Download embedding model
model_name = "Qwen/Qwen3-VL-Embedding-8B"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name, device_map="mps")

print(f"Model loaded: {model_name}")
```

### 4. Verify Installation

```bash
python -c "
from deeptutor.embeddings import LocalEmbedding
embed = LocalEmbedding('Qwen/Qwen3-VL-Embedding-8B')
result = embed.encode('Hello world')
print(f'Embedding dimensions: {len(result)}')
"
```

## NVIDIA GPU Setup

### 1. Install CUDA Dependencies

```bash
# Install PyTorch with CUDA
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Verify CUDA
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"
```

### 2. Configure Environment

```bash
# .env for NVIDIA GPU
USE_LOCAL_MODELS=true
DEVICE=cuda
EMBEDDING_MODEL=Qwen/Qwen3-VL-Embedding-8B
LLM_MODEL=meta-llama/Meta-Llama-3.1-8B-Instruct
BATCH_SIZE=16
CUDA_VISIBLE_DEVICES=0
```

### 3. Memory Optimization

```bash
# For GPUs with limited VRAM (8-12 GB)
USE_8BIT=true
LOAD_IN_8BIT=true
MAX_MEMORY=10GB
```

## Apple Silicon Optimization

### M2 Max Specific Settings

Based on our benchmarking (see [Research: M2 Max Benchmarks](/research/apple-silicon-benchmarks.md)):

```bash
# Optimal settings for M2 Max (32GB unified memory)
DEVICE=mps
BATCH_SIZE=4
MAX_MEMORY=24GB
EMBEDDING_MODEL=Qwen/Qwen3-VL-Embedding-8B
USE_FLASH_ATTENTION=false  # Not supported on MPS
TORCH_BACKENDS_CUDNN_BENCHMARK=false
```

### Memory Management

```python
import torch

# Clear MPS cache between operations
def clear_memory():
    if torch.backends.mps.is_available():
        torch.mps.empty_cache()

# Use with large batch operations
for batch in batches:
    embeddings = model.encode(batch)
    clear_memory()
```

### Performance Tips

1. **Use bfloat16** - Better precision than float16 on M-series
2. **Batch size 4** - Optimal for 32GB unified memory
3. **Avoid large context** - Keep under 8K tokens for best performance
4. **Sequential processing** - Don't parallelize MPS operations

## Cost Optimization

### API vs Local Cost Comparison

| Operation | OpenAI API | Local (M2 Max) | Savings |
|-----------|------------|----------------|---------|
| 1M tokens embedded | $0.13 | $0.02 (electricity) | 85% |
| 1M tokens generated | $30.00 | $0.05 (electricity) | 99% |

### When to Use Local Models

**Use local models when:**
- Processing sensitive/private documents
- High volume processing (>1M tokens/day)
- Offline operation required
- Predictable latency needed

**Use API models when:**
- Occasional usage
- Need latest model capabilities
- Limited local compute resources
- Quality is critical (GPT-4 level)

### Hybrid Approach

```python
# Use local for embedding, API for generation
EMBEDDING_MODEL=Qwen/Qwen3-VL-Embedding-8B  # Local
LLM_PROVIDER=openai                          # API
LLM_MODEL=gpt-4-turbo                        # API
```

## Model Configuration

### Embedding Model Settings

```yaml
# config/models.yaml
embedding:
  model: "Qwen/Qwen3-VL-Embedding-8B"
  device: "mps"
  batch_size: 4
  max_length: 8192
  normalize: true
  pooling: "mean"
  dtype: "bfloat16"
```

### LLM Settings

```yaml
llm:
  model: "meta-llama/Meta-Llama-3.1-8B-Instruct"
  device: "mps"
  max_new_tokens: 2048
  temperature: 0.7
  top_p: 0.9
  dtype: "bfloat16"
  use_cache: true
```

## Ollama Integration

For simplified local model management, use Ollama:

### 1. Install Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Pull Models

```bash
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

### 3. Configure praDeep

```bash
# .env
LLM_PROVIDER=ollama
LLM_MODEL=llama3.1:8b
OLLAMA_BASE_URL=http://localhost:11434
```

## Troubleshooting

### Out of Memory Errors

```bash
# Reduce batch size
BATCH_SIZE=2

# Use smaller model
EMBEDDING_MODEL=nomic-embed-text

# Enable quantization
USE_8BIT=true
```

### Slow Inference

```bash
# Check device is being used
python -c "import torch; print(torch.backends.mps.is_available())"

# Ensure correct device
DEVICE=mps  # not "cpu"
```

### Model Loading Fails

```bash
# Clear cache and redownload
rm -rf ~/.cache/huggingface/hub/models--Qwen*

# Increase timeout
HF_HUB_DOWNLOAD_TIMEOUT=3600
```

### MPS Stability Issues

```python
# Fallback to CPU for problematic operations
import os
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
```

## Performance Benchmarks

See [Research: Apple Silicon Benchmarks](/research/apple-silicon-benchmarks.md) for detailed performance data on M2 Max.

### Quick Reference (M2 Max 32GB)

| Operation | Throughput | Latency |
|-----------|------------|---------|
| Embedding (batch 4) | 50 docs/sec | 80ms |
| Generation (512 tokens) | 25 tok/sec | 20s |
| Document processing | 5 pages/sec | 200ms |
