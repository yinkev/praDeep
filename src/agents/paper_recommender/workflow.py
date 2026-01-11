"""
Paper Recommendation Workflow
=============================

Orchestrates the paper recommendation process:
1. Search and retrieve candidate papers
2. Score and rank papers
3. Generate explanations
"""

import asyncio
from typing import Any, Callable, Optional

from src.logging import get_logger
from src.di import Container, get_container
from src.services.paper_recommendation import (
    Paper,
    PaperRecommendationService,
    RecommendationResult,
)

from .recommender_agent import PaperRecommenderAgent


class PaperRecommendationWorkflow:
    """
    Orchestrates the full paper recommendation workflow.

    Stages:
    1. Search - Query multiple paper sources
    2. Score - Compute similarity and citation scores
    3. Rank - Combine scores and rank papers
    4. Explain - Generate LLM explanations (optional)
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        language: str = "en",
        config: Optional[dict[str, Any]] = None,
        progress_callback: Optional[Callable[[dict[str, Any]], None]] = None,
        *,
        container: Container | None = None,
        service: PaperRecommendationService | None = None,
    ):
        self.logger = get_logger("PaperRecommendationWorkflow")

        # Initialize recommendation service
        self.container = container or get_container()
        self.service = service or self.container.paper_recommendation_service()

        # Initialize agent for explanations
        self.agent = PaperRecommenderAgent(
            api_key=api_key,
            base_url=base_url,
            model=model,
            language=language,
            config=config,
        )

        self.progress_callback = progress_callback
        self.config = config or {}

    def _emit_progress(self, stage: str, status: str, **kwargs):
        """Emit progress event."""
        if self.progress_callback:
            event = {
                "type": "progress",
                "stage": stage,
                "status": status,
                **kwargs,
            }
            self.progress_callback(event)

    async def run(
        self,
        query: str,
        seed_papers: Optional[list[str]] = None,
        max_results: int = 10,
        recommendation_type: str = "hybrid",
        year_range: Optional[tuple[int, int]] = None,
        generate_explanation: bool = True,
        suggest_topics: bool = False,
    ) -> dict[str, Any]:
        """
        Run the full recommendation workflow.

        Args:
            query: User's research query
            seed_papers: Optional paper IDs to base recommendations on
            max_results: Number of papers to return
            recommendation_type: "semantic", "citation", or "hybrid"
            year_range: Optional (start_year, end_year) filter
            generate_explanation: Whether to generate LLM explanation
            suggest_topics: Whether to suggest related topics

        Returns:
            Dictionary with recommendations and optional explanation
        """
        self.logger.info(f"Starting paper recommendation workflow for: {query[:50]}...")

        # Stage 1: Search and score papers
        self._emit_progress("searching", "started", query=query)

        result = await self.service.recommend_papers(
            query=query,
            seed_papers=seed_papers,
            max_results=max_results,
            recommendation_type=recommendation_type,
            year_range=year_range,
            use_history=True,
        )

        self._emit_progress(
            "searching",
            "completed",
            total_candidates=result.total_candidates,
            returned=len(result.papers),
        )

        if not result.papers:
            return {
                "query": query,
                "papers": [],
                "total_candidates": 0,
                "recommendation_type": recommendation_type,
                "explanation": "No papers found matching your query. Try a different search term.",
                "processing_time_ms": result.processing_time_ms,
            }

        # Record search query for personalization
        self.service.record_search_query(query)

        # Stage 2: Generate explanation (optional)
        explanation = None
        if generate_explanation:
            self._emit_progress("explaining", "started")

            explanation_result = await self.agent.explain_recommendations(
                query=query,
                papers=result.papers,
            )
            explanation = explanation_result.get("explanation", "")

            self._emit_progress("explaining", "completed")

        # Stage 3: Suggest related topics (optional)
        suggestions = None
        if suggest_topics and result.papers:
            self._emit_progress("suggesting", "started")

            suggestions_result = await self.agent.suggest_related_topics(
                query=query,
                papers=result.papers,
            )
            suggestions = suggestions_result.get("suggestions", "")

            self._emit_progress("suggesting", "completed")

        # Prepare response
        response = {
            "query": query,
            "papers": [p.to_dict() for p in result.papers],
            "total_candidates": result.total_candidates,
            "recommendation_type": recommendation_type,
            "processing_time_ms": result.processing_time_ms,
        }

        if explanation:
            response["explanation"] = explanation

        if suggestions:
            response["related_topics"] = suggestions

        self._emit_progress("workflow", "completed")

        return response

    async def analyze_paper(self, paper_id: str, query: str) -> dict[str, Any]:
        """
        Get detailed analysis of a specific paper.

        Args:
            paper_id: Paper ID to analyze
            query: Context query for analysis

        Returns:
            Detailed paper analysis
        """
        # First, fetch the paper
        paper = None

        # Try Semantic Scholar first
        paper = await self.service.semantic_scholar.get_paper(paper_id)

        if not paper and paper_id.startswith("arxiv:"):
            arxiv_id = paper_id.replace("arxiv:", "")
            paper = await self.service.arxiv.get_paper(arxiv_id)

        if not paper:
            return {"error": f"Paper not found: {paper_id}"}

        # Generate analysis
        result = await self.agent.analyze_papers(query, [paper])

        return result

    def record_paper_interaction(
        self,
        paper_id: str,
        interaction_type: str = "read",
    ):
        """
        Record user interaction with a paper.

        Args:
            paper_id: Paper ID
            interaction_type: "read" or "save"
        """
        if interaction_type == "read":
            self.service.record_paper_read(paper_id)
        elif interaction_type == "save":
            self.service.record_paper_saved(paper_id)

    def get_user_history(self) -> dict[str, Any]:
        """Get user's reading history."""
        history = self.service.get_user_history()
        return history.to_dict()

    def update_preferences(self, topics: list[str]):
        """Update user's preferred topics."""
        self.service.update_preferred_topics(topics)
