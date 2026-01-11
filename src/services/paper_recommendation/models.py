"""
Paper Recommendation Models
===========================

Data models for paper recommendations.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class Paper:
    """Represents a research paper."""

    paper_id: str
    title: str
    authors: list[str]
    abstract: str
    year: int
    url: str
    source: str  # "arxiv", "semantic_scholar", "openalex"

    # Optional metadata
    arxiv_id: Optional[str] = None
    doi: Optional[str] = None
    citation_count: Optional[int] = None
    venue: Optional[str] = None
    fields_of_study: list[str] = field(default_factory=list)
    references: list[str] = field(default_factory=list)  # Paper IDs
    citations: list[str] = field(default_factory=list)  # Paper IDs that cite this

    # Computed during recommendation
    similarity_score: float = 0.0
    citation_score: float = 0.0
    recency_score: float = 0.0
    user_preference_score: float = 0.0
    combined_score: float = 0.0
    recommendation_reason: str = ""

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "paper_id": self.paper_id,
            "title": self.title,
            "authors": self.authors,
            "abstract": self.abstract,
            "year": self.year,
            "url": self.url,
            "source": self.source,
            "arxiv_id": self.arxiv_id,
            "doi": self.doi,
            "citation_count": self.citation_count,
            "venue": self.venue,
            "fields_of_study": self.fields_of_study,
            "similarity_score": round(self.similarity_score, 4),
            "citation_score": round(self.citation_score, 4),
            "recency_score": round(self.recency_score, 4),
            "user_preference_score": round(self.user_preference_score, 4),
            "combined_score": round(self.combined_score, 4),
            "recommendation_reason": self.recommendation_reason,
        }


@dataclass
class UserReadingHistory:
    """User's reading history for personalized recommendations."""

    user_id: str
    read_papers: list[str] = field(default_factory=list)  # Paper IDs
    saved_papers: list[str] = field(default_factory=list)  # Paper IDs
    search_queries: list[str] = field(default_factory=list)
    preferred_topics: list[str] = field(default_factory=list)
    last_updated: Optional[datetime] = None

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "read_papers": self.read_papers,
            "saved_papers": self.saved_papers,
            "search_queries": self.search_queries,
            "preferred_topics": self.preferred_topics,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "UserReadingHistory":
        return cls(
            user_id=data.get("user_id", "default"),
            read_papers=data.get("read_papers", []),
            saved_papers=data.get("saved_papers", []),
            search_queries=data.get("search_queries", []),
            preferred_topics=data.get("preferred_topics", []),
            last_updated=datetime.fromisoformat(data["last_updated"]) if data.get("last_updated") else None,
        )


@dataclass
class RecommendationResult:
    """Result of paper recommendation request."""

    query: str
    papers: list[Paper]
    total_candidates: int
    recommendation_type: str  # "semantic", "citation", "hybrid"
    processing_time_ms: float

    def to_dict(self) -> dict:
        return {
            "query": self.query,
            "papers": [p.to_dict() for p in self.papers],
            "total_candidates": self.total_candidates,
            "recommendation_type": self.recommendation_type,
            "processing_time_ms": round(self.processing_time_ms, 2),
        }
