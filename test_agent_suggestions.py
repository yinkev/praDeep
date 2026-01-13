#!/usr/bin/env python3
"""
Test script for Agent Suggestions API endpoints
"""

import asyncio
import sys
sys.path.insert(0, '/Users/kyin/Projects/praDeep')

from src.api.routers.agent_config import (
    suggest_agents,
    get_agent_capabilities,
    AgentSuggestionRequest
)


async def test_suggestions():
    """Test agent suggestion matching"""
    print("=" * 60)
    print("Testing Agent Suggestion System")
    print("=" * 60)

    test_cases = [
        "help me solve this math problem",
        "I need to write an essay about history",
        "research quantum computing",
        "explain how photosynthesis works",
        "brainstorm ideas for a science project",
        "quick question about chemistry",
    ]

    for query in test_cases:
        print(f"\n📝 Query: '{query}'")
        print("-" * 60)

        request = AgentSuggestionRequest(input=query)
        response = await suggest_agents(request)

        if response.suggestions:
            for i, suggestion in enumerate(response.suggestions, 1):
                print(f"{i}. {suggestion.label} ({suggestion.agent_type})")
                print(f"   Confidence: {suggestion.confidence:.1%}")
                print(f"   {suggestion.description}")
                print()
        else:
            print("   No suggestions found")

    print("\n" + "=" * 60)
    print("Testing Agent Capabilities Endpoint")
    print("=" * 60)

    capabilities = await get_agent_capabilities()
    print(f"\n✓ Found {len(capabilities)} agents with full metadata:")
    for cap in capabilities:
        print(f"  - {cap.label_key} ({cap.agent_type})")
        print(f"    Keywords: {len(cap.keywords)} | Use cases: {len(cap.use_cases)}")

    print("\n✅ All tests completed successfully!")


if __name__ == "__main__":
    asyncio.run(test_suggestions())
