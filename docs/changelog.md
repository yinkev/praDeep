---
title: Changelog
description: Version history and release notes for praDeep
---

# Changelog

All notable changes to praDeep are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Qwen3-VL-Embedding-8B support for multimodal document embeddings
- Apple Silicon MPS optimization for local inference
- Research documentation with embedding model comparisons
- Re-index/refresh button in Knowledge Base UI
- `POST /api/v1/knowledge/{kb_name}/refresh` API endpoint for programmatic KB refresh

### Changed
- Updated to PyTorch 2.9.1 for improved MPS performance

### Fixed
- Memory management for large PDF processing on Apple Silicon
- Embedding function now returns numpy array (fixes LightRAG compatibility)
- Image extraction now properly handles MinerU's `hybrid_auto` output directory
- Images are now correctly copied to KB's `images/` folder during processing

---

## [0.4.1] - 2025-01-XX

### Added
- Deep Research feature with web search and paper retrieval
- Co-Writer mode for AI-assisted writing
- Text-to-speech narration support
- Community roster for contributors

### Changed
- Improved citation formatting and accuracy
- Enhanced streaming response handling

### Fixed
- PDF parsing edge cases
- WebSocket connection stability

---

## [0.4.0] - 2025-01-XX

### Added
- Guided Learning with visual mind maps
- Practice Question Generator
- Exam simulation mode
- Multi-language support (30+ languages)
- Docker deployment support

### Changed
- Redesigned UI with dark mode
- Improved retrieval accuracy
- Faster document processing

### Fixed
- Authentication token expiration handling
- Large file upload timeouts

---

## [0.3.0] - 2024-12-XX

### Added
- Knowledge base management
- Multi-document support
- Conversation history persistence
- Export/import functionality

### Changed
- Migrated to FastAPI backend
- Updated embedding model integration

### Fixed
- Memory leaks in long sessions
- Concurrent request handling

---

## [0.2.0] - 2024-11-XX

### Added
- Smart Problem Solving with dual-loop reasoning
- Step-by-step solution generation
- Citation system with source linking

### Changed
- Improved chunking strategy
- Better context window management

### Fixed
- Unicode handling in PDFs
- LaTeX rendering issues

---

## [0.1.0] - 2024-10-XX

### Added
- Initial release
- Basic PDF upload and processing
- Q&A interface
- OpenAI integration

---

## Version Support

| Version | Status | Support Until |
|---------|--------|---------------|
| 0.4.x | Active | Current |
| 0.3.x | Maintenance | 2025-06 |
| 0.2.x | End of Life | 2025-03 |
| 0.1.x | End of Life | Ended |

## Upgrade Guides

### From 0.3.x to 0.4.x

1. Update environment variables (see [Configuration](./configuration/index.md))
2. Run database migrations: `alembic upgrade head`
3. Rebuild Docker containers: `docker compose build`

### From 0.2.x to 0.3.x

1. Export existing knowledge bases
2. Perform clean installation
3. Import knowledge bases

## Release Schedule

We aim to release:
- **Patch versions** (0.x.Y): As needed for bug fixes
- **Minor versions** (0.X.0): Monthly with new features
- **Major versions** (X.0.0): When breaking changes are necessary

## Contributing

See [CONTRIBUTING.md](https://github.com/HKUDS/praDeep/blob/main/CONTRIBUTING.md) for how to contribute to praDeep.

## Links

- [GitHub Releases](https://github.com/HKUDS/praDeep/releases)
- [Roadmap](./roadmap.md)
- [Documentation](./index.md)
