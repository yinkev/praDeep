#!/usr/bin/env python
"""
Agent Configuration API - Provides agent metadata for data-driven UI.
Includes context-aware agent suggestions based on user input.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Dict

router = APIRouter()


# Pydantic Models
class AgentSuggestionRequest(BaseModel):
    """Request model for agent suggestions."""
    input: str = Field(..., min_length=1, description="User input text to analyze")


class AgentSuggestion(BaseModel):
    """Single agent suggestion with confidence score."""
    agent_type: str = Field(..., description="Agent identifier (solve, research, etc.)")
    label: str = Field(..., description="Human-readable agent label")
    description: str = Field(..., description="Agent capability description")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score 0.0-1.0")
    icon: str = Field(..., description="Lucide icon name")
    color: str = Field(..., description="Tailwind color name")


class AgentSuggestionsResponse(BaseModel):
    """Response containing ranked agent suggestions."""
    suggestions: List[AgentSuggestion] = Field(..., description="Ranked agent suggestions")
    query: str = Field(..., description="Original user input")


class AgentCapabilities(BaseModel):
    """Complete agent metadata including capabilities."""
    agent_type: str
    icon: str
    color: str
    label_key: str
    description: str
    use_cases: List[str]
    keywords: List[str]
    examples: List[str]


# Agent registry - single source of truth for agent UI metadata
AGENT_REGISTRY = {
    "solve": {
        "icon": "HelpCircle",
        "color": "blue",
        "label_key": "Problem Solver",
        "description": "Solve math, physics, chemistry problems and homework questions with step-by-step explanations",
        "use_cases": [
            "Solve mathematical equations",
            "Physics problem solving",
            "Chemistry calculations",
            "Homework help",
            "Step-by-step solutions"
        ],
        "keywords": [
            "solve", "calculate", "math", "physics", "chemistry", "equation",
            "homework", "problem", "answer", "compute", "formula", "derivative",
            "integral", "algebra", "geometry", "trigonometry", "calculus"
        ],
        "examples": [
            "Solve the equation 2x + 5 = 15",
            "Calculate the derivative of x^2 + 3x",
            "Help me with this physics problem about momentum"
        ]
    },
    "question": {
        "icon": "FileText",
        "color": "purple",
        "label_key": "Question Generator",
        "description": "Generate practice questions, quizzes, and exam preparation materials",
        "use_cases": [
            "Create practice questions",
            "Generate quiz questions",
            "Exam preparation",
            "Assessment creation",
            "Test generation"
        ],
        "keywords": [
            "question", "quiz", "exam", "test", "practice", "assessment",
            "generate", "create questions", "prepare", "study", "review questions"
        ],
        "examples": [
            "Generate 10 practice questions on photosynthesis",
            "Create a quiz for calculus derivatives",
            "Make exam questions about World War 2"
        ]
    },
    "research": {
        "icon": "Search",
        "color": "emerald",
        "label_key": "Research Assistant",
        "description": "Conduct deep research, literature reviews, and topic exploration with citations",
        "use_cases": [
            "Deep research",
            "Literature review",
            "Topic exploration",
            "Academic paper analysis",
            "Citation management"
        ],
        "keywords": [
            "research", "literature", "papers", "articles", "study", "investigate",
            "explore", "review", "academic", "citations", "sources", "references",
            "analyze", "find papers", "scholarly"
        ],
        "examples": [
            "Research the latest advances in quantum computing",
            "Find papers on climate change impacts",
            "Literature review on machine learning applications"
        ]
    },
    "co_writer": {
        "icon": "PenTool",
        "color": "amber",
        "label_key": "Co-Writer",
        "description": "Collaborative writing, editing, proofreading, and creative content creation",
        "use_cases": [
            "Essay writing",
            "Creative writing",
            "Editing and proofreading",
            "Narrative development",
            "Content creation"
        ],
        "keywords": [
            "write", "edit", "essay", "story", "narrative", "creative",
            "proofread", "draft", "compose", "author", "writing help",
            "improve writing", "revise", "rewrite"
        ],
        "examples": [
            "Help me write an essay about democracy",
            "Edit this paragraph for clarity",
            "Write a creative story about space exploration"
        ]
    },
    "guide": {
        "icon": "BookOpen",
        "color": "indigo",
        "label_key": "Learning Guide",
        "description": "Step-by-step tutorials, concept explanations, and personalized learning paths",
        "use_cases": [
            "Step-by-step tutorials",
            "Concept explanations",
            "Learning paths",
            "Teaching concepts",
            "Knowledge building"
        ],
        "keywords": [
            "explain", "teach", "guide", "tutorial", "learn", "understand",
            "how to", "what is", "help me understand", "show me", "walk me through",
            "step by step", "concept", "lesson"
        ],
        "examples": [
            "Explain how photosynthesis works",
            "Teach me about neural networks",
            "Guide me through learning calculus"
        ]
    },
    "ideagen": {
        "icon": "Lightbulb",
        "color": "yellow",
        "label_key": "Idea Generator",
        "description": "Brainstorming, creative ideation, and project planning assistance",
        "use_cases": [
            "Brainstorming sessions",
            "Creative ideation",
            "Project planning",
            "Innovation workshops",
            "Concept development"
        ],
        "keywords": [
            "idea", "brainstorm", "creative", "innovate", "plan", "project",
            "concept", "think", "suggest", "imagine", "possibilities",
            "generate ideas", "ideate"
        ],
        "examples": [
            "Brainstorm ideas for a science fair project",
            "Generate creative concepts for a mobile app",
            "Help me plan a research project"
        ]
    },
    "chat": {
        "icon": "MessageCircle",
        "color": "gray",
        "label_key": "Chat Assistant",
        "description": "Casual conversation and quick answers to general questions",
        "use_cases": [
            "Casual conversation",
            "Quick questions",
            "General inquiries",
            "Simple queries",
            "Friendly chat"
        ],
        "keywords": [
            "chat", "talk", "ask", "tell me", "what", "who", "when", "where",
            "quick question", "simple", "general", "casual", "conversation"
        ],
        "examples": [
            "What's the weather like today?",
            "Tell me a fun fact",
            "Quick question about history"
        ]
    },
    "personalization": {
        "icon": "User",
        "color": "pink",
        "label_key": "Personalization Engine",
        "description": "Adaptive learning paths and personalized study plan recommendations",
        "use_cases": [
            "Personalized learning paths",
            "Adaptive study plans",
            "Progress tracking",
            "Custom recommendations",
            "Learning optimization"
        ],
        "keywords": [
            "personalize", "custom", "adapt", "my learning", "my progress",
            "recommendations", "tailored", "optimize", "personal", "track progress"
        ],
        "examples": [
            "Create a personalized study plan for me",
            "Adapt my learning path based on my progress",
            "Recommend topics based on my interests"
        ]
    }
}


def calculate_agent_match_score(user_input: str, agent_data: Dict) -> float:
    """
    Calculate confidence score for agent match based on keyword matching.
    
    Args:
        user_input: User's input text (lowercased)
        agent_data: Agent metadata including keywords
        
    Returns:
        Confidence score between 0.0 and 1.0
    """
    keywords = agent_data.get("keywords", [])
    if not keywords:
        return 0.0
    
    # Count keyword matches
    matches = sum(1 for keyword in keywords if keyword.lower() in user_input)
    
    if matches == 0:
        return 0.0
    
    # Calculate confidence: scale matches to 0.0-1.0 range
    # More matches = higher confidence, but cap at 1.0
    # Use logarithmic scaling to avoid over-confidence
    base_score = min(matches / len(keywords), 1.0)
    
    # Boost score if multiple keywords match
    if matches > 3:
        base_score = min(base_score * 1.2, 1.0)
    
    return round(base_score, 3)


@router.get("/agents")
async def get_agent_config():
    """
    Get agent UI configuration (backward compatible).

    Returns:
        Dict mapping agent type to UI metadata (icon, color, label_key)
    """
    return {
        agent_type: {
            "icon": data["icon"],
            "color": data["color"],
            "label_key": data["label_key"]
        }
        for agent_type, data in AGENT_REGISTRY.items()
    }


@router.get("/agents/capabilities")
async def get_agent_capabilities():
    """
    Get complete agent capabilities and metadata.

    Returns:
        List of AgentCapabilities with full metadata for each agent
    """
    capabilities = []
    for agent_type, data in AGENT_REGISTRY.items():
        capabilities.append(AgentCapabilities(
            agent_type=agent_type,
            icon=data["icon"],
            color=data["color"],
            label_key=data["label_key"],
            description=data["description"],
            use_cases=data["use_cases"],
            keywords=data["keywords"],
            examples=data["examples"]
        ))
    return capabilities


@router.post("/agents/suggest", response_model=AgentSuggestionsResponse)
async def suggest_agents(request: AgentSuggestionRequest):
    """
    Suggest relevant agents based on user input using keyword matching.

    Args:
        request: AgentSuggestionRequest with user input text

    Returns:
        AgentSuggestionsResponse with top ranked agent suggestions
    """
    user_input = request.input.lower().strip()
    
    if not user_input:
        # Return default suggestions for empty input
        return AgentSuggestionsResponse(
            suggestions=[],
            query=request.input
        )
    
    # Calculate scores for all agents
    scored_agents = []
    for agent_type, agent_data in AGENT_REGISTRY.items():
        score = calculate_agent_match_score(user_input, agent_data)
        if score > 0.0:  # Only include agents with matches
            scored_agents.append((agent_type, agent_data, score))
    
    # Sort by score (descending) and take top 3
    scored_agents.sort(key=lambda x: x[2], reverse=True)
    top_agents = scored_agents[:3]
    
    # Build response
    suggestions = [
        AgentSuggestion(
            agent_type=agent_type,
            label=agent_data["label_key"],
            description=agent_data["description"],
            confidence=score,
            icon=agent_data["icon"],
            color=agent_data["color"]
        )
        for agent_type, agent_data, score in top_agents
    ]
    
    return AgentSuggestionsResponse(
        suggestions=suggestions,
        query=request.input
    )


@router.get("/agents/{agent_type}")
async def get_single_agent_config(agent_type: str):
    """
    Get UI configuration for a specific agent.

    Args:
        agent_type: Agent type (solve, question, research, etc.)

    Returns:
        Agent UI metadata or 404 if not found
    """
    if agent_type in AGENT_REGISTRY:
        return AGENT_REGISTRY[agent_type]
    return {"error": f"Agent type '{agent_type}' not found"}
