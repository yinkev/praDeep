---
title: Installation
description: Step-by-step installation guide for DeepTutor
---

# Installation

This guide covers the installation process for DeepTutor across different platforms.

## System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| OS | macOS 12+, Ubuntu 20.04+, Windows 10+ |
| Python | 3.10 or higher |
| RAM | 16 GB |
| Storage | 20 GB free space |
| GPU | Optional (CPU inference supported) |

### Recommended Requirements

| Component | Requirement |
|-----------|-------------|
| OS | macOS 14+ (Apple Silicon), Ubuntu 22.04+ |
| Python | 3.11+ |
| RAM | 32 GB+ |
| Storage | 50 GB+ SSD |
| GPU | Apple M2+, NVIDIA RTX 3080+ |

## Installation Methods

### Method 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/HKUDS/DeepTutor.git
cd DeepTutor

# Copy environment configuration
cp .env.example .env

# Start with Docker Compose
docker-compose up -d
```

### Method 2: Local Development

```bash
# Clone the repository
git clone https://github.com/HKUDS/DeepTutor.git
cd DeepTutor

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install web dependencies
cd web && npm install && cd ..

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys and settings
```

## Starting the Application

::: warning Important
You MUST activate the virtual environment before running any commands:
```bash
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```
:::

```bash
# Ensure you're in the project root with venv activated
source .venv/bin/activate

# Start the application (frontend + backend)
python scripts/start_web.py
```

This starts:
- **Frontend**: http://localhost:3783
- **Backend API**: http://localhost:8783

## Verifying Installation

```bash
# Check Python installation
python --version

# Verify dependencies
pip list | grep -E "(torch|transformers|langchain)"

# Run tests
pytest tests/
```

## Troubleshooting

See the [Troubleshooting Guide](../guides/troubleshooting.md) for common installation issues.
