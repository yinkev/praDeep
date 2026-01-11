"""
Paper Recommender Agent
=======================

Agent for intelligent paper recommendations using ML-based similarity
and LLM-powered explanations.
"""

from .recommender_agent import PaperRecommenderAgent
from .workflow import PaperRecommendationWorkflow

__all__ = [
    "PaperRecommenderAgent",
    "PaperRecommendationWorkflow",
]
