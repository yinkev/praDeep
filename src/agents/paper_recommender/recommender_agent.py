"""
Paper Recommender Agent
=======================

Agent for generating intelligent explanations for paper recommendations.
"""

from typing import Any, Optional

from src.agents.base_agent import BaseAgent
from src.services.paper_recommendation import Paper


class PaperRecommenderAgent(BaseAgent):
    """
    Agent for explaining and enhancing paper recommendations.

    Uses LLM to:
    - Explain why papers are relevant to user's query
    - Analyze individual papers in depth
    - Suggest related research topics
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        language: str = "en",
        config: Optional[dict[str, Any]] = None,
        **kwargs,
    ):
        super().__init__(
            module_name="paper_recommender",
            agent_name="recommender",
            api_key=api_key,
            base_url=base_url,
            model=model,
            language=language,
            config=config,
            **kwargs,
        )

    async def process(
        self,
        query: str,
        papers: list[Paper],
        action: str = "explain",
    ) -> dict[str, Any]:
        """
        Process recommendation request.

        Args:
            query: User's research query
            papers: List of recommended papers
            action: Action to perform - "explain", "analyze", "suggest_topics"

        Returns:
            Dictionary with explanation or analysis
        """
        if action == "explain":
            return await self.explain_recommendations(query, papers)
        elif action == "analyze":
            return await self.analyze_papers(query, papers)
        elif action == "suggest_topics":
            return await self.suggest_related_topics(query, papers)
        else:
            return {"error": f"Unknown action: {action}"}

    async def explain_recommendations(
        self,
        query: str,
        papers: list[Paper],
    ) -> dict[str, Any]:
        """Generate explanation for recommended papers."""
        if not papers:
            return {"explanation": "No papers to explain."}

        # Format papers for prompt
        papers_summary = self._format_papers_summary(papers[:5])  # Top 5

        # Get prompt template
        system_prompt = self.get_prompt("system", "You are an expert research assistant.")
        user_prompt_template = self.get_prompt(
            "explain_recommendations",
            "Please explain why these papers are relevant to: {query}\n\n{papers_summary}",
        )

        user_prompt = user_prompt_template.format(
            query=query,
            papers_summary=papers_summary,
        )

        try:
            response = await self.call_llm(
                user_prompt=user_prompt,
                system_prompt=system_prompt,
                temperature=0.7,
                max_tokens=1000,
            )

            return {
                "query": query,
                "explanation": response,
                "paper_count": len(papers),
            }
        except Exception as e:
            self.logger.error(f"Failed to generate explanation: {e}")
            return {
                "query": query,
                "explanation": self._generate_fallback_explanation(papers),
                "paper_count": len(papers),
                "error": str(e),
            }

    async def analyze_papers(
        self,
        topic: str,
        papers: list[Paper],
    ) -> dict[str, Any]:
        """Analyze papers in depth."""
        analyses = []

        system_prompt = self.get_prompt("system", "You are an expert research assistant.")
        analyze_template = self.get_prompt(
            "analyze_paper",
            "Analyze this paper's relevance to {topic}:\n{title}\n{abstract}",
        )

        for paper in papers[:3]:  # Analyze top 3
            user_prompt = analyze_template.format(
                topic=topic,
                title=paper.title,
                authors=", ".join(paper.authors[:3]),
                year=paper.year,
                abstract=paper.abstract[:500] if paper.abstract else "No abstract available",
            )

            try:
                analysis = await self.call_llm(
                    user_prompt=user_prompt,
                    system_prompt=system_prompt,
                    temperature=0.7,
                    max_tokens=500,
                )
                analyses.append({
                    "paper_id": paper.paper_id,
                    "title": paper.title,
                    "analysis": analysis,
                })
            except Exception as e:
                self.logger.warning(f"Failed to analyze paper {paper.title}: {e}")
                analyses.append({
                    "paper_id": paper.paper_id,
                    "title": paper.title,
                    "analysis": f"Analysis unavailable: {paper.recommendation_reason}",
                })

        return {
            "topic": topic,
            "analyses": analyses,
        }

    async def suggest_related_topics(
        self,
        query: str,
        papers: list[Paper],
    ) -> dict[str, Any]:
        """Suggest related research topics."""
        system_prompt = self.get_prompt("system", "You are an expert research assistant.")
        suggest_template = self.get_prompt(
            "suggest_related_topics",
            "Based on the search for {query} and these papers:\n{saved_papers}\n\nSuggest related topics.",
        )

        papers_text = "\n".join([f"- {p.title}" for p in papers[:5]])

        user_prompt = suggest_template.format(
            query=query,
            saved_papers=papers_text,
        )

        try:
            response = await self.call_llm(
                user_prompt=user_prompt,
                system_prompt=system_prompt,
                temperature=0.8,
                max_tokens=500,
            )

            return {
                "query": query,
                "suggestions": response,
            }
        except Exception as e:
            self.logger.error(f"Failed to suggest topics: {e}")
            return {
                "query": query,
                "suggestions": "Unable to generate suggestions at this time.",
                "error": str(e),
            }

    def _format_papers_summary(self, papers: list[Paper]) -> str:
        """Format papers into a summary string for prompts."""
        summaries = []
        for i, paper in enumerate(papers, 1):
            authors = ", ".join(paper.authors[:3])
            if len(paper.authors) > 3:
                authors += " et al."

            abstract_preview = paper.abstract[:300] + "..." if len(paper.abstract) > 300 else paper.abstract

            summary = f"""
{i}. **{paper.title}**
   Authors: {authors}
   Year: {paper.year}
   Source: {paper.source}
   Citations: {paper.citation_count or 'N/A'}
   Relevance Score: {paper.combined_score:.2f}
   Abstract: {abstract_preview}
"""
            summaries.append(summary)

        return "\n".join(summaries)

    def _generate_fallback_explanation(self, papers: list[Paper]) -> str:
        """Generate a simple explanation when LLM fails."""
        if not papers:
            return "No papers found matching your query."

        explanation = "Here are the top recommended papers based on relevance:\n\n"

        for i, paper in enumerate(papers[:5], 1):
            explanation += f"{i}. **{paper.title}** ({paper.year})\n"
            explanation += f"   - {paper.recommendation_reason}\n\n"

        return explanation
