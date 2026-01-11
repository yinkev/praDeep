"""
Paper Recommendation Service
============================

ML-based paper recommendation combining:
- Semantic similarity (embeddings)
- Citation network analysis
- User reading history
"""

import asyncio
import json
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

import numpy as np

from src.logging import get_logger
from src.services.embedding import get_embedding_client

from .api_clients import ArxivClient, OpenAlexClient, SemanticScholarClient
from .models import Paper, RecommendationResult, UserReadingHistory


class PaperRecommendationService:
    """
    ML-based paper recommendation service.

    Combines multiple signals:
    1. Semantic similarity - embedding-based similarity between papers
    2. Citation networks - papers cited by or citing similar papers
    3. User history - personalized based on reading patterns
    """

    def __init__(
        self,
        semantic_scholar_api_key: Optional[str] = None,
        openalex_email: Optional[str] = None,
        cache_dir: Optional[str] = None,
    ):
        self.logger = get_logger("PaperRecommendation")

        # Initialize API clients
        self.semantic_scholar = SemanticScholarClient(api_key=semantic_scholar_api_key)
        self.openalex = OpenAlexClient(email=openalex_email)
        self.arxiv = ArxivClient()

        # Initialize embedding client (singleton)
        self._embedding_client = None

        # Cache directory for paper embeddings
        if cache_dir is None:
            project_root = Path(__file__).parent.parent.parent.parent
            cache_dir = str(project_root / "data" / "user" / "paper_cache")
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        # User history file
        self.history_file = self.cache_dir / "reading_history.json"

        # Weights for combining scores
        self.weights = {
            "semantic": 0.4,
            "citation": 0.3,
            "recency": 0.2,
            "user_preference": 0.1,
        }

    @property
    def embedding_client(self):
        """Lazy-load embedding client."""
        if self._embedding_client is None:
            self._embedding_client = get_embedding_client()
        return self._embedding_client

    async def close(self):
        """Close API clients."""
        await self.semantic_scholar.close()
        await self.openalex.close()

    async def recommend_papers(
        self,
        query: str,
        seed_papers: Optional[list[str]] = None,
        max_results: int = 10,
        recommendation_type: str = "hybrid",
        year_range: Optional[tuple[int, int]] = None,
        use_history: bool = True,
    ) -> RecommendationResult:
        """
        Get paper recommendations based on query and/or seed papers.

        Args:
            query: Search query or topic description
            seed_papers: Optional list of paper IDs to base recommendations on
            max_results: Maximum number of recommendations to return
            recommendation_type: "semantic", "citation", or "hybrid"
            year_range: Optional (start_year, end_year) filter
            use_history: Whether to incorporate user reading history

        Returns:
            RecommendationResult with ranked papers
        """
        start_time = time.time()
        all_candidates: list[Paper] = []

        # Step 1: Gather candidate papers from multiple sources
        gather_tasks = []

        # Search by query
        if query:
            gather_tasks.append(self._search_all_sources(query, max_results * 3, year_range))

        # Get related papers from seeds
        if seed_papers:
            for paper_id in seed_papers[:3]:  # Limit to avoid too many API calls
                gather_tasks.append(self._get_related_papers(paper_id))

        results = await asyncio.gather(*gather_tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, list):
                all_candidates.extend(result)

        # Deduplicate by paper_id
        seen_ids = set()
        unique_candidates = []
        for paper in all_candidates:
            if paper.paper_id and paper.paper_id not in seen_ids:
                seen_ids.add(paper.paper_id)
                unique_candidates.append(paper)

        if not unique_candidates:
            return RecommendationResult(
                query=query,
                papers=[],
                total_candidates=0,
                recommendation_type=recommendation_type,
                processing_time_ms=(time.time() - start_time) * 1000,
            )

        # Step 2: Score papers
        scored_papers = await self._score_papers(
            candidates=unique_candidates,
            query=query,
            seed_papers=seed_papers,
            recommendation_type=recommendation_type,
            use_history=use_history,
        )

        # Step 3: Rank and return top results
        scored_papers.sort(key=lambda p: p.combined_score, reverse=True)
        top_papers = scored_papers[:max_results]

        # Generate recommendation reasons
        for paper in top_papers:
            paper.recommendation_reason = self._generate_reason(paper, recommendation_type)

        processing_time = (time.time() - start_time) * 1000

        return RecommendationResult(
            query=query,
            papers=top_papers,
            total_candidates=len(unique_candidates),
            recommendation_type=recommendation_type,
            processing_time_ms=processing_time,
        )

    async def _search_all_sources(
        self,
        query: str,
        limit: int,
        year_range: Optional[tuple[int, int]] = None,
    ) -> list[Paper]:
        """Search papers from all sources in parallel."""
        per_source_limit = limit // 3 + 1

        tasks = [
            self.semantic_scholar.search_papers(query, per_source_limit, year_range=year_range),
            self.openalex.search_papers(query, per_source_limit, year_range=year_range),
            self.arxiv.search_papers(query, per_source_limit),
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)
        papers = []

        for result in results:
            if isinstance(result, list):
                papers.extend(result)

        return papers

    async def _get_related_papers(self, paper_id: str) -> list[Paper]:
        """Get papers related to a seed paper via citations."""
        papers = []

        try:
            # Get citing papers
            citations = await self.semantic_scholar.get_citations(paper_id, limit=20)
            papers.extend(citations)

            # Get referenced papers
            references = await self.semantic_scholar.get_references(paper_id, limit=20)
            papers.extend(references)

            # Get Semantic Scholar's recommendations
            recommendations = await self.semantic_scholar.get_recommended_papers(paper_id, limit=10)
            papers.extend(recommendations)

        except Exception as e:
            self.logger.warning(f"Failed to get related papers for {paper_id}: {e}")

        return papers

    async def _score_papers(
        self,
        candidates: list[Paper],
        query: str,
        seed_papers: Optional[list[str]],
        recommendation_type: str,
        use_history: bool,
    ) -> list[Paper]:
        """Score papers based on multiple factors."""

        # Compute semantic similarity scores
        if recommendation_type in ["semantic", "hybrid"] and query:
            await self._compute_semantic_scores(candidates, query)

        # Compute citation scores
        if recommendation_type in ["citation", "hybrid"]:
            self._compute_citation_scores(candidates)

        # Compute recency scores
        self._compute_recency_scores(candidates)

        # Compute user preference scores if history available
        if use_history:
            await self._compute_user_preference_scores(candidates)

        # Combine scores
        for paper in candidates:
            if recommendation_type == "semantic":
                paper.combined_score = paper.similarity_score
            elif recommendation_type == "citation":
                paper.combined_score = paper.citation_score
            else:  # hybrid
                paper.combined_score = (
                    self.weights["semantic"] * paper.similarity_score
                    + self.weights["citation"] * paper.citation_score
                    + self.weights["recency"] * paper.recency_score
                )

        return candidates

    async def _compute_semantic_scores(self, candidates: list[Paper], query: str):
        """Compute semantic similarity between query and paper abstracts."""
        try:
            # Get query embedding
            query_embedding = await self.embedding_client.embed([query])
            query_vec = np.array(query_embedding[0])

            # Get paper abstract embeddings
            abstracts = [p.abstract if p.abstract else p.title for p in candidates]
            paper_embeddings = await self.embedding_client.embed(abstracts)

            # Compute cosine similarity
            for i, paper in enumerate(candidates):
                paper_vec = np.array(paper_embeddings[i])
                similarity = self._cosine_similarity(query_vec, paper_vec)
                paper.similarity_score = max(0.0, similarity)  # Ensure non-negative

        except Exception as e:
            self.logger.warning(f"Failed to compute semantic scores: {e}")
            # Fallback: all papers get neutral score
            for paper in candidates:
                paper.similarity_score = 0.5

    def _compute_citation_scores(self, candidates: list[Paper]):
        """Compute citation-based scores using citation count and network position."""
        max_citations = max((p.citation_count or 0 for p in candidates), default=1)
        max_citations = max(max_citations, 1)  # Avoid division by zero

        for paper in candidates:
            # Normalize citation count (log scale to handle high variance)
            citation_count = paper.citation_count or 0
            if citation_count > 0:
                log_citations = np.log1p(citation_count)
                log_max = np.log1p(max_citations)
                paper.citation_score = log_citations / log_max
            else:
                paper.citation_score = 0.0

    def _compute_recency_scores(self, candidates: list[Paper]):
        """Compute recency scores favoring recent papers."""
        current_year = datetime.now().year

        for paper in candidates:
            years_old = current_year - paper.year
            # Exponential decay with half-life of 3 years
            paper.recency_score = np.exp(-years_old / 3)

    async def _compute_user_preference_scores(self, candidates: list[Paper]):
        """Compute scores based on user reading history."""
        history = self._load_user_history()

        if not history.preferred_topics and not history.read_papers:
            # No history, neutral scores
            for paper in candidates:
                paper.combined_score += 0  # No preference boost
            return

        # Match against preferred topics
        if history.preferred_topics:
            topic_set = set(t.lower() for t in history.preferred_topics)
            for paper in candidates:
                paper_fields = set(f.lower() for f in paper.fields_of_study)
                topic_overlap = len(topic_set & paper_fields)
                if topic_overlap > 0:
                    paper.combined_score += self.weights["user_preference"] * (topic_overlap / len(topic_set))

    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Compute cosine similarity between two vectors."""
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return dot_product / (norm1 * norm2)

    def _generate_reason(self, paper: Paper, recommendation_type: str) -> str:
        """Generate human-readable recommendation reason."""
        reasons = []

        if paper.similarity_score > 0.7:
            reasons.append("highly relevant to your query")
        elif paper.similarity_score > 0.5:
            reasons.append("relevant to your query")

        if paper.citation_count and paper.citation_count > 100:
            reasons.append(f"well-cited ({paper.citation_count} citations)")
        elif paper.citation_count and paper.citation_count > 20:
            reasons.append(f"moderately cited ({paper.citation_count} citations)")

        if paper.recency_score > 0.8:
            reasons.append("recent publication")

        if paper.fields_of_study:
            reasons.append(f"in {', '.join(paper.fields_of_study[:2])}")

        if not reasons:
            reasons.append("matches your search criteria")

        return "; ".join(reasons).capitalize()

    # User history management

    def _load_user_history(self, user_id: str = "default") -> UserReadingHistory:
        """Load user reading history."""
        try:
            if self.history_file.exists():
                with open(self.history_file, encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict) and data.get("user_id") == user_id:
                        return UserReadingHistory.from_dict(data)
        except Exception as e:
            self.logger.warning(f"Failed to load user history: {e}")

        return UserReadingHistory(user_id=user_id)

    def _save_user_history(self, history: UserReadingHistory):
        """Save user reading history."""
        try:
            with open(self.history_file, "w", encoding="utf-8") as f:
                json.dump(history.to_dict(), f, indent=2, ensure_ascii=False)
        except Exception as e:
            self.logger.error(f"Failed to save user history: {e}")

    def record_paper_read(self, paper_id: str, user_id: str = "default"):
        """Record that user read a paper."""
        history = self._load_user_history(user_id)
        if paper_id not in history.read_papers:
            history.read_papers.append(paper_id)
            history.last_updated = datetime.now()
            self._save_user_history(history)

    def record_paper_saved(self, paper_id: str, user_id: str = "default"):
        """Record that user saved a paper."""
        history = self._load_user_history(user_id)
        if paper_id not in history.saved_papers:
            history.saved_papers.append(paper_id)
            history.last_updated = datetime.now()
            self._save_user_history(history)

    def record_search_query(self, query: str, user_id: str = "default"):
        """Record user's search query."""
        history = self._load_user_history(user_id)
        if query not in history.search_queries:
            history.search_queries.append(query)
            # Keep only recent queries
            history.search_queries = history.search_queries[-50:]
            history.last_updated = datetime.now()
            self._save_user_history(history)

    def update_preferred_topics(self, topics: list[str], user_id: str = "default"):
        """Update user's preferred topics."""
        history = self._load_user_history(user_id)
        history.preferred_topics = topics
        history.last_updated = datetime.now()
        self._save_user_history(history)

    def get_user_history(self, user_id: str = "default") -> UserReadingHistory:
        """Get user's reading history."""
        return self._load_user_history(user_id)


# Singleton instance
_service: Optional[PaperRecommendationService] = None


def get_paper_recommendation_service(
    semantic_scholar_api_key: Optional[str] = None,
    openalex_email: Optional[str] = None,
) -> PaperRecommendationService:
    """Get or create the singleton paper recommendation service."""
    global _service
    if _service is None:
        # Try to get API key from environment
        if semantic_scholar_api_key is None:
            semantic_scholar_api_key = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
        if openalex_email is None:
            openalex_email = os.getenv("OPENALEX_EMAIL")

        _service = PaperRecommendationService(
            semantic_scholar_api_key=semantic_scholar_api_key,
            openalex_email=openalex_email,
        )
    return _service
