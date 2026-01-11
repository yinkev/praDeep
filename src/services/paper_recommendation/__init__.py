"""
Paper Recommendation Service
============================

ML-based paper recommendation using:
- Citation networks (Semantic Scholar)
- Semantic similarity (embeddings)
- User reading history

Integrates with:
- arXiv API
- Semantic Scholar API
- OpenAlex API
"""

from .service import PaperRecommendationService, get_paper_recommendation_service
from .models import Paper, RecommendationResult, UserReadingHistory

__all__ = [
    "PaperRecommendationService",
    "get_paper_recommendation_service",
    "Paper",
    "RecommendationResult",
    "UserReadingHistory",
]
