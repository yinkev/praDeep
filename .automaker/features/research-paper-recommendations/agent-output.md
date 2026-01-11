I'll implement the ML-based paper recommendation feature for the Research Agent. Let me start by exploring the codebase to understand the existing structure.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing structure",
      "status": "in_progress",
      "activeForm": "Exploring codebase structure"
    },
    {
      "content": "Plan implementation approach for paper recommendations",
      "status": "pending",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Implement ML-based paper recommendation system",
      "status": "pending",
      "activeForm": "Implementing paper recommendation system"
    },
    {
      "content": "Integrate with arXiv, Semantic Scholar, and OpenAlex APIs",
      "status": "pending",
      "activeForm": "Integrating external APIs"
    },
    {
      "content": "Verify feature with Playwright test",
      "status": "pending",
      "activeForm": "Verifying with Playwright"
    }
  ]
}

🔧 Tool: Task
Input: {
  "description": "Explore codebase structure",
  "prompt": "Explore the praDeep codebase thoroughly to understand its structure for implementing an ML-based paper recommendation feature. I need to understand:\n\n1. The overall project structure (directories, key files)\n2. Existing agent implementations (especially any Research Agent)\n3. How services are organized (LLM, embedding, RAG)\n4. API router patterns\n5. Frontend structure (Next.js)\n6. Any existing recommendation or similarity-based features\n7. Database/storage patterns for user history\n\nFocus on finding:\n- src/agents/ directory structure\n- src/services/ organization\n- src/api/routers/ patterns\n- Any existing paper or research-related code\n- Embedding/similarity services\n\nBe very thorough - check multiple naming conventions and locations.",
  "subagent_type": "Explore"
}

🔧 Tool: Bash
Input: {
  "command": "find /Users/kyin/Projects/praDeep -type f -name \"*.md\" | head -20",
  "description": "Find markdown documentation files"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.py",
  "path": "/Users/kyin/Projects/praDeep/src"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.tsx",
  "path": "/Users/kyin/Projects/praDeep/web"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/kyin/Projects/praDeep/docs/ 2>/dev/null | head -20",
  "description": "List documentation directory"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/kyin/Projects/praDeep/src/agents/",
  "description": "List agents directory"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/kyin/Projects/praDeep/src/services/",
  "description": "List services directory"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/docs/praDeep-architecture-overview.md"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/docs/ai-orchestration-guide.md"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/docs/ideagen-context-fix-summary.md"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/kyin/Projects/praDeep/src/api/routers/",
  "description": "List API routers directory"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/agents/research/research_pipeline.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/agents/base_agent.py",
  "limit": 100
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/kyin/Projects/praDeep/src/services/embedding/",
  "description": "List embedding services directory"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/services/embedding/client.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/services/rag/service.py",
  "limit": 150
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/kyin/Projects/praDeep/src/services/rag/",
  "description": "List RAG services directory"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/api/routers/ideagen.py",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/api/routers/research.py",
  "limit": 100
}

🔧 Tool: Bash
Input: {
  "command": "find /Users/kyin/Projects/praDeep -type f -name \"*history*\" -o -name \"*user*\" | grep -E \"\\.(py|json)$\" | head -20",
  "description": "Find history and user tracking files"
}

🔧 Tool: Bash
Input: {
  "command": "find /Users/kyin/Projects/praDeep/src -type f -name \"*history*\" | head -10",
  "description": "Find history-related files in src"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/kyin/Projects/praDeep/src/api/utils/",
  "description": "List API utils directory"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/api/utils"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/api/utils/history.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/api/utils/notebook_manager.py",
  "limit": 100
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/kyin/Projects/praDeep/config/",
  "description": "List config directory"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/config/main.yaml",
  "limit": 80
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/web/context/GlobalContext.tsx",
  "limit": 80
}

🔧 Tool: Bash
Input: {
  "command": "find /Users/kyin/Projects/praDeep/src -type f -name \"*tool*.py\" | head -15",
  "description": "Find tool files"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/tools/paper_search_tool.py",
  "limit": 100
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/kyin/Projects/praDeep/src/tools/",
  "description": "List tools directory"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/agents/ideagen/idea_generation_workflow.py",
  "limit": 100
}

🔧 Tool: Bash
Input: {
  "command": "find /Users/kyin/Projects/praDeep/data -type f -name \"*.json\" | head -20",
  "description": "Find sample JSON data files"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/kyin/Projects/praDeep/data/user/ 2>/dev/null | head -20",
  "description": "List user data directory"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/services/rag/factory.py"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/kyin/Projects/praDeep/src/services/rag/pipelines/",
  "description": "List RAG pipelines directory"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/services/reranker"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/kyin/Projects/praDeep/src/services/reranker/",
  "description": "List reranker directory"
}

🔧 Tool: Bash
Input: {
  "command": "find /Users/kyin/Projects/praDeep/web/app -type f -name \"*.tsx\" | sort",
  "description": "List all web app pages"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/web/app/research/page.tsx",
  "limit": 80
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/kyin/Projects/praDeep/src/services/llm/",
  "description": "List LLM services directory"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/services/llm/factory.py",
  "limit": 80
}

🔧 Tool: Bash
Input: {
  "command": "find /Users/kyin/Projects/praDeep/src/services -type d | sort",
  "description": "List all services subdirectories"
}
Excellent! I now have a comprehensive understanding of the codebase. Let me update the todo list and proceed with planning the implementation.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing structure",
      "status": "completed",
      "activeForm": "Exploring codebase structure"
    },
    {
      "content": "Plan implementation approach for paper recommendations",
      "status": "in_progress",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Implement ML-based paper recommendation system",
      "status": "pending",
      "activeForm": "Implementing paper recommendation system"
    },
    {
      "content": "Integrate with arXiv, Semantic Scholar, and OpenAlex APIs",
      "status": "pending",
      "activeForm": "Integrating external APIs"
    },
    {
      "content": "Create frontend UI for paper recommendations",
      "status": "pending",
      "activeForm": "Creating frontend UI"
    },
    {
      "content": "Verify feature with Playwright test",
      "status": "pending",
      "activeForm": "Verifying with Playwright"
    }
  ]
}
Now let me read some key files to understand the exact patterns used, then plan the implementation:

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/tools/paper_search_tool.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/agents/base_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/api/routers/research.py"
}
Now let me read the embedding client and a frontend page to understand patterns:

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/services/embedding/client.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/web/app/research/page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/api/utils/history.py"
}
Now I have a comprehensive understanding of the codebase patterns. Let me update my plan and proceed with implementation:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing structure",
      "status": "completed",
      "activeForm": "Exploring codebase structure"
    },
    {
      "content": "Plan implementation approach for paper recommendations",
      "status": "completed",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Create paper recommendation service with API clients",
      "status": "in_progress",
      "activeForm": "Creating paper recommendation service"
    },
    {
      "content": "Implement recommendation agent with similarity scoring",
      "status": "pending",
      "activeForm": "Implementing recommendation agent"
    },
    {
      "content": "Create API router for paper recommendations",
      "status": "pending",
      "activeForm": "Creating API router"
    },
    {
      "content": "Create frontend UI for paper recommendations",
      "status": "pending",
      "activeForm": "Creating frontend UI"
    },
    {
      "content": "Verify feature with Playwright test",
      "status": "pending",
      "activeForm": "Verifying with Playwright"
    }
  ]
}
Now let me implement the feature. I'll start by creating the paper recommendation service with API clients for Semantic Scholar and OpenAlex:

🔧 Tool: Write
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/services/paper_recommendation/__init__.py",
  "content": "\"\"\"\nPaper Recommendation Service\n============================\n\nML-based paper recommendation using:\n- Citation networks (Semantic Scholar)\n- Semantic similarity (embeddings)\n- User reading history\n\nIntegrates with:\n- arXiv API\n- Semantic Scholar API\n- OpenAlex API\n\"\"\"\n\nfrom .service import PaperRecommendationService, get_paper_recommendation_service\nfrom .models import Paper, RecommendationResult, UserReadingHistory\n\n__all__ = [\n    \"PaperRecommendationService\",\n    \"get_paper_recommendation_service\",\n    \"Paper\",\n    \"RecommendationResult\",\n    \"UserReadingHistory\",\n]\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/services/paper_recommendation/models.py",
  "content": "\"\"\"\nPaper Recommendation Models\n===========================\n\nData models for paper recommendations.\n\"\"\"\n\nfrom dataclasses import dataclass, field\nfrom datetime import datetime\nfrom typing import Optional\n\n\n@dataclass\nclass Paper:\n    \"\"\"Represents a research paper.\"\"\"\n\n    paper_id: str\n    title: str\n    authors: list[str]\n    abstract: str\n    year: int\n    url: str\n    source: str  # \"arxiv\", \"semantic_scholar\", \"openalex\"\n\n    # Optional metadata\n    arxiv_id: Optional[str] = None\n    doi: Optional[str] = None\n    citation_count: Optional[int] = None\n    venue: Optional[str] = None\n    fields_of_study: list[str] = field(default_factory=list)\n    references: list[str] = field(default_factory=list)  # Paper IDs\n    citations: list[str] = field(default_factory=list)  # Paper IDs that cite this\n\n    # Computed during recommendation\n    similarity_score: float = 0.0\n    citation_score: float = 0.0\n    recency_score: float = 0.0\n    combined_score: float = 0.0\n    recommendation_reason: str = \"\"\n\n    def to_dict(self) -> dict:\n        \"\"\"Convert to dictionary for JSON serialization.\"\"\"\n        return {\n            \"paper_id\": self.paper_id,\n            \"title\": self.title,\n            \"authors\": self.authors,\n            \"abstract\": self.abstract,\n            \"year\": self.year,\n            \"url\": self.url,\n            \"source\": self.source,\n            \"arxiv_id\": self.arxiv_id,\n            \"doi\": self.doi,\n            \"citation_count\": self.citation_count,\n            \"venue\": self.venue,\n            \"fields_of_study\": self.fields_of_study,\n            \"similarity_score\": round(self.similarity_score, 4),\n            \"citation_score\": round(self.citation_score, 4),\n            \"recency_score\": round(self.recency_score, 4),\n            \"combined_score\": round(self.combined_score, 4),\n            \"recommendation_reason\": self.recommendation_reason,\n        }\n\n\n@dataclass\nclass UserReadingHistory:\n    \"\"\"User's reading history for personalized recommendations.\"\"\"\n\n    user_id: str\n    read_papers: list[str] = field(default_factory=list)  # Paper IDs\n    saved_papers: list[str] = field(default_factory=list)  # Paper IDs\n    search_queries: list[str] = field(default_factory=list)\n    preferred_topics: list[str] = field(default_factory=list)\n    last_updated: Optional[datetime] = None\n\n    def to_dict(self) -> dict:\n        return {\n            \"user_id\": self.user_id,\n            \"read_papers\": self.read_papers,\n            \"saved_papers\": self.saved_papers,\n            \"search_queries\": self.search_queries,\n            \"preferred_topics\": self.preferred_topics,\n            \"last_updated\": self.last_updated.isoformat() if self.last_updated else None,\n        }\n\n    @classmethod\n    def from_dict(cls, data: dict) -> \"UserReadingHistory\":\n        return cls(\n            user_id=data.get(\"user_id\", \"default\"),\n            read_papers=data.get(\"read_papers\", []),\n            saved_papers=data.get(\"saved_papers\", []),\n            search_queries=data.get(\"search_queries\", []),\n            preferred_topics=data.get(\"preferred_topics\", []),\n            last_updated=datetime.fromisoformat(data[\"last_updated\"]) if data.get(\"last_updated\") else None,\n        )\n\n\n@dataclass\nclass RecommendationResult:\n    \"\"\"Result of paper recommendation request.\"\"\"\n\n    query: str\n    papers: list[Paper]\n    total_candidates: int\n    recommendation_type: str  # \"semantic\", \"citation\", \"hybrid\"\n    processing_time_ms: float\n\n    def to_dict(self) -> dict:\n        return {\n            \"query\": self.query,\n            \"papers\": [p.to_dict() for p in self.papers],\n            \"total_candidates\": self.total_candidates,\n            \"recommendation_type\": self.recommendation_type,\n            \"processing_time_ms\": round(self.processing_time_ms, 2),\n        }\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/services/paper_recommendation/api_clients.py",
  "content": "\"\"\"\nExternal API Clients for Paper Data\n====================================\n\nClients for:\n- Semantic Scholar API (citation networks, paper metadata)\n- OpenAlex API (open access papers, citations)\n- arXiv API (preprints)\n\"\"\"\n\nimport asyncio\nfrom typing import Optional\nimport aiohttp\nfrom datetime import datetime\n\nfrom src.logging import get_logger\nfrom .models import Paper\n\n\nclass SemanticScholarClient:\n    \"\"\"Client for Semantic Scholar API.\"\"\"\n\n    BASE_URL = \"https://api.semanticscholar.org/graph/v1\"\n\n    def __init__(self, api_key: Optional[str] = None):\n        self.api_key = api_key\n        self.logger = get_logger(\"SemanticScholarClient\")\n        self._session: Optional[aiohttp.ClientSession] = None\n\n    async def _get_session(self) -> aiohttp.ClientSession:\n        if self._session is None or self._session.closed:\n            headers = {\"Accept\": \"application/json\"}\n            if self.api_key:\n                headers[\"x-api-key\"] = self.api_key\n            self._session = aiohttp.ClientSession(headers=headers)\n        return self._session\n\n    async def close(self):\n        if self._session and not self._session.closed:\n            await self._session.close()\n\n    async def search_papers(\n        self,\n        query: str,\n        limit: int = 10,\n        fields: Optional[list[str]] = None,\n        year_range: Optional[tuple[int, int]] = None,\n    ) -> list[Paper]:\n        \"\"\"Search for papers by query.\"\"\"\n        if fields is None:\n            fields = [\n                \"paperId\",\n                \"title\",\n                \"abstract\",\n                \"authors\",\n                \"year\",\n                \"url\",\n                \"citationCount\",\n                \"venue\",\n                \"fieldsOfStudy\",\n                \"externalIds\",\n                \"references\",\n                \"citations\",\n            ]\n\n        session = await self._get_session()\n        params = {\n            \"query\": query,\n            \"limit\": limit,\n            \"fields\": \",\".join(fields),\n        }\n\n        if year_range:\n            params[\"year\"] = f\"{year_range[0]}-{year_range[1]}\"\n\n        try:\n            async with session.get(f\"{self.BASE_URL}/paper/search\", params=params) as resp:\n                if resp.status == 200:\n                    data = await resp.json()\n                    return [self._parse_paper(p) for p in data.get(\"data\", []) if p.get(\"title\")]\n                else:\n                    self.logger.warning(f\"Semantic Scholar API error: {resp.status}\")\n                    return []\n        except Exception as e:\n            self.logger.error(f\"Semantic Scholar search failed: {e}\")\n            return []\n\n    async def get_paper(self, paper_id: str) -> Optional[Paper]:\n        \"\"\"Get paper by Semantic Scholar ID or DOI.\"\"\"\n        fields = [\n            \"paperId\",\n            \"title\",\n            \"abstract\",\n            \"authors\",\n            \"year\",\n            \"url\",\n            \"citationCount\",\n            \"venue\",\n            \"fieldsOfStudy\",\n            \"externalIds\",\n            \"references.paperId\",\n            \"citations.paperId\",\n        ]\n\n        session = await self._get_session()\n        try:\n            async with session.get(\n                f\"{self.BASE_URL}/paper/{paper_id}\",\n                params={\"fields\": \",\".join(fields)},\n            ) as resp:\n                if resp.status == 200:\n                    data = await resp.json()\n                    return self._parse_paper(data)\n                return None\n        except Exception as e:\n            self.logger.error(f\"Failed to get paper {paper_id}: {e}\")\n            return None\n\n    async def get_citations(self, paper_id: str, limit: int = 50) -> list[Paper]:\n        \"\"\"Get papers that cite the given paper.\"\"\"\n        session = await self._get_session()\n        fields = [\"paperId\", \"title\", \"abstract\", \"authors\", \"year\", \"url\", \"citationCount\"]\n\n        try:\n            async with session.get(\n                f\"{self.BASE_URL}/paper/{paper_id}/citations\",\n                params={\"fields\": \",\".join(fields), \"limit\": limit},\n            ) as resp:\n                if resp.status == 200:\n                    data = await resp.json()\n                    return [self._parse_paper(c.get(\"citingPaper\", {})) for c in data.get(\"data\", []) if c.get(\"citingPaper\", {}).get(\"title\")]\n                return []\n        except Exception as e:\n            self.logger.error(f\"Failed to get citations for {paper_id}: {e}\")\n            return []\n\n    async def get_references(self, paper_id: str, limit: int = 50) -> list[Paper]:\n        \"\"\"Get papers referenced by the given paper.\"\"\"\n        session = await self._get_session()\n        fields = [\"paperId\", \"title\", \"abstract\", \"authors\", \"year\", \"url\", \"citationCount\"]\n\n        try:\n            async with session.get(\n                f\"{self.BASE_URL}/paper/{paper_id}/references\",\n                params={\"fields\": \",\".join(fields), \"limit\": limit},\n            ) as resp:\n                if resp.status == 200:\n                    data = await resp.json()\n                    return [self._parse_paper(r.get(\"citedPaper\", {})) for r in data.get(\"data\", []) if r.get(\"citedPaper\", {}).get(\"title\")]\n                return []\n        except Exception as e:\n            self.logger.error(f\"Failed to get references for {paper_id}: {e}\")\n            return []\n\n    async def get_recommended_papers(self, paper_id: str, limit: int = 10) -> list[Paper]:\n        \"\"\"Get Semantic Scholar's recommended papers based on a paper.\"\"\"\n        session = await self._get_session()\n        fields = [\"paperId\", \"title\", \"abstract\", \"authors\", \"year\", \"url\", \"citationCount\", \"venue\"]\n\n        try:\n            async with session.get(\n                f\"{self.BASE_URL}/recommendations/v1/papers/forpaper/{paper_id}\",\n                params={\"fields\": \",\".join(fields), \"limit\": limit},\n            ) as resp:\n                if resp.status == 200:\n                    data = await resp.json()\n                    return [self._parse_paper(p) for p in data.get(\"recommendedPapers\", []) if p.get(\"title\")]\n                return []\n        except Exception as e:\n            self.logger.error(f\"Failed to get recommendations for {paper_id}: {e}\")\n            return []\n\n    def _parse_paper(self, data: dict) -> Paper:\n        \"\"\"Parse Semantic Scholar paper data into Paper model.\"\"\"\n        authors = [a.get(\"name\", \"\") for a in data.get(\"authors\", [])]\n        external_ids = data.get(\"externalIds\", {}) or {}\n\n        references = []\n        if isinstance(data.get(\"references\"), list):\n            references = [r.get(\"paperId\") for r in data[\"references\"] if r and r.get(\"paperId\")]\n\n        citations = []\n        if isinstance(data.get(\"citations\"), list):\n            citations = [c.get(\"paperId\") for c in data[\"citations\"] if c and c.get(\"paperId\")]\n\n        return Paper(\n            paper_id=data.get(\"paperId\", \"\"),\n            title=data.get(\"title\", \"\"),\n            authors=authors,\n            abstract=data.get(\"abstract\", \"\") or \"\",\n            year=data.get(\"year\") or datetime.now().year,\n            url=data.get(\"url\", \"\") or f\"https://www.semanticscholar.org/paper/{data.get('paperId', '')}\",\n            source=\"semantic_scholar\",\n            arxiv_id=external_ids.get(\"ArXiv\"),\n            doi=external_ids.get(\"DOI\"),\n            citation_count=data.get(\"citationCount\"),\n            venue=data.get(\"venue\"),\n            fields_of_study=data.get(\"fieldsOfStudy\") or [],\n            references=references,\n            citations=citations,\n        )\n\n\nclass OpenAlexClient:\n    \"\"\"Client for OpenAlex API.\"\"\"\n\n    BASE_URL = \"https://api.openalex.org\"\n\n    def __init__(self, email: Optional[str] = None):\n        self.email = email  # Polite pool access\n        self.logger = get_logger(\"OpenAlexClient\")\n        self._session: Optional[aiohttp.ClientSession] = None\n\n    async def _get_session(self) -> aiohttp.ClientSession:\n        if self._session is None or self._session.closed:\n            self._session = aiohttp.ClientSession()\n        return self._session\n\n    async def close(self):\n        if self._session and not self._session.closed:\n            await self._session.close()\n\n    async def search_papers(\n        self,\n        query: str,\n        limit: int = 10,\n        year_range: Optional[tuple[int, int]] = None,\n    ) -> list[Paper]:\n        \"\"\"Search for papers by query.\"\"\"\n        session = await self._get_session()\n\n        params = {\n            \"search\": query,\n            \"per_page\": limit,\n            \"select\": \"id,doi,title,display_name,publication_year,cited_by_count,authorships,abstract_inverted_index,primary_location,concepts\",\n        }\n\n        if self.email:\n            params[\"mailto\"] = self.email\n\n        if year_range:\n            params[\"filter\"] = f\"publication_year:{year_range[0]}-{year_range[1]}\"\n\n        try:\n            async with session.get(f\"{self.BASE_URL}/works\", params=params) as resp:\n                if resp.status == 200:\n                    data = await resp.json()\n                    return [self._parse_paper(w) for w in data.get(\"results\", []) if w.get(\"title\")]\n                else:\n                    self.logger.warning(f\"OpenAlex API error: {resp.status}\")\n                    return []\n        except Exception as e:\n            self.logger.error(f\"OpenAlex search failed: {e}\")\n            return []\n\n    async def get_paper(self, work_id: str) -> Optional[Paper]:\n        \"\"\"Get paper by OpenAlex ID.\"\"\"\n        session = await self._get_session()\n        params = {}\n        if self.email:\n            params[\"mailto\"] = self.email\n\n        try:\n            async with session.get(f\"{self.BASE_URL}/works/{work_id}\", params=params) as resp:\n                if resp.status == 200:\n                    data = await resp.json()\n                    return self._parse_paper(data)\n                return None\n        except Exception as e:\n            self.logger.error(f\"Failed to get work {work_id}: {e}\")\n            return None\n\n    async def get_cited_by(self, work_id: str, limit: int = 50) -> list[Paper]:\n        \"\"\"Get papers that cite the given paper.\"\"\"\n        session = await self._get_session()\n\n        params = {\n            \"filter\": f\"cites:{work_id}\",\n            \"per_page\": limit,\n            \"select\": \"id,doi,title,display_name,publication_year,cited_by_count,authorships,abstract_inverted_index\",\n        }\n        if self.email:\n            params[\"mailto\"] = self.email\n\n        try:\n            async with session.get(f\"{self.BASE_URL}/works\", params=params) as resp:\n                if resp.status == 200:\n                    data = await resp.json()\n                    return [self._parse_paper(w) for w in data.get(\"results\", []) if w.get(\"title\")]\n                return []\n        except Exception as e:\n            self.logger.error(f\"Failed to get citations for {work_id}: {e}\")\n            return []\n\n    async def get_related_works(self, work_id: str, limit: int = 10) -> list[Paper]:\n        \"\"\"Get related works based on OpenAlex's concept matching.\"\"\"\n        # First get the paper's concepts\n        paper = await self.get_paper(work_id)\n        if not paper or not paper.fields_of_study:\n            return []\n\n        # Search for papers with similar concepts\n        session = await self._get_session()\n        concept_filter = \"|\".join(paper.fields_of_study[:3])\n\n        params = {\n            \"filter\": f\"concepts.id:{concept_filter}\",\n            \"per_page\": limit,\n            \"select\": \"id,doi,title,display_name,publication_year,cited_by_count,authorships,abstract_inverted_index\",\n        }\n        if self.email:\n            params[\"mailto\"] = self.email\n\n        try:\n            async with session.get(f\"{self.BASE_URL}/works\", params=params) as resp:\n                if resp.status == 200:\n                    data = await resp.json()\n                    # Filter out the original paper\n                    return [self._parse_paper(w) for w in data.get(\"results\", []) if w.get(\"id\") != work_id and w.get(\"title\")]\n                return []\n        except Exception as e:\n            self.logger.error(f\"Failed to get related works: {e}\")\n            return []\n\n    def _parse_paper(self, data: dict) -> Paper:\n        \"\"\"Parse OpenAlex work data into Paper model.\"\"\"\n        # Extract authors\n        authors = []\n        for authorship in data.get(\"authorships\", []):\n            author = authorship.get(\"author\", {})\n            if author.get(\"display_name\"):\n                authors.append(author[\"display_name\"])\n\n        # Reconstruct abstract from inverted index\n        abstract = \"\"\n        abstract_index = data.get(\"abstract_inverted_index\")\n        if abstract_index:\n            word_positions = []\n            for word, positions in abstract_index.items():\n                for pos in positions:\n                    word_positions.append((pos, word))\n            word_positions.sort()\n            abstract = \" \".join([word for _, word in word_positions])\n\n        # Extract URL\n        url = \"\"\n        primary_location = data.get(\"primary_location\", {})\n        if primary_location:\n            url = primary_location.get(\"landing_page_url\", \"\") or \"\"\n        if not url:\n            url = f\"https://openalex.org/works/{data.get('id', '').replace('https://openalex.org/', '')}\"\n\n        # Extract concepts as fields of study\n        fields = []\n        for concept in data.get(\"concepts\", [])[:5]:\n            if concept.get(\"display_name\"):\n                fields.append(concept[\"display_name\"])\n\n        # Extract DOI\n        doi = data.get(\"doi\", \"\")\n        if doi and doi.startswith(\"https://doi.org/\"):\n            doi = doi.replace(\"https://doi.org/\", \"\")\n\n        return Paper(\n            paper_id=data.get(\"id\", \"\").replace(\"https://openalex.org/\", \"\"),\n            title=data.get(\"title\") or data.get(\"display_name\", \"\"),\n            authors=authors,\n            abstract=abstract,\n            year=data.get(\"publication_year\") or datetime.now().year,\n            url=url,\n            source=\"openalex\",\n            doi=doi if doi else None,\n            citation_count=data.get(\"cited_by_count\"),\n            fields_of_study=fields,\n        )\n\n\nclass ArxivClient:\n    \"\"\"Enhanced arXiv client for paper recommendations.\"\"\"\n\n    def __init__(self):\n        self.logger = get_logger(\"ArxivClient\")\n\n    async def search_papers(\n        self,\n        query: str,\n        max_results: int = 10,\n        sort_by: str = \"relevance\",\n    ) -> list[Paper]:\n        \"\"\"Search arXiv papers.\"\"\"\n        import arxiv\n\n        try:\n            sort_criterion = (\n                arxiv.SortCriterion.Relevance\n                if sort_by == \"relevance\"\n                else arxiv.SortCriterion.SubmittedDate\n            )\n\n            search = arxiv.Search(\n                query=query,\n                max_results=max_results,\n                sort_by=sort_criterion,\n                sort_order=arxiv.SortOrder.Descending,\n            )\n\n            client = arxiv.Client()\n            papers = []\n\n            # Run in executor since arxiv library is synchronous\n            loop = asyncio.get_event_loop()\n            results = await loop.run_in_executor(None, lambda: list(client.results(search)))\n\n            for result in results:\n                arxiv_id = result.entry_id.split(\"/\")[-1]\n                if \"v\" in arxiv_id:\n                    arxiv_id = arxiv_id.split(\"v\")[0]\n\n                paper = Paper(\n                    paper_id=f\"arxiv:{arxiv_id}\",\n                    title=result.title,\n                    authors=[a.name for a in result.authors],\n                    abstract=result.summary,\n                    year=result.published.year,\n                    url=result.entry_id,\n                    source=\"arxiv\",\n                    arxiv_id=arxiv_id,\n                    fields_of_study=[cat for cat in result.categories],\n                )\n                papers.append(paper)\n\n            return papers\n\n        except Exception as e:\n            self.logger.error(f\"arXiv search failed: {e}\")\n            return []\n\n    async def get_paper(self, arxiv_id: str) -> Optional[Paper]:\n        \"\"\"Get paper by arXiv ID.\"\"\"\n        import arxiv\n\n        try:\n            search = arxiv.Search(id_list=[arxiv_id])\n            client = arxiv.Client()\n\n            loop = asyncio.get_event_loop()\n            results = await loop.run_in_executor(None, lambda: list(client.results(search)))\n\n            if results:\n                result = results[0]\n                clean_id = arxiv_id\n                if \"v\" in clean_id:\n                    clean_id = clean_id.split(\"v\")[0]\n\n                return Paper(\n                    paper_id=f\"arxiv:{clean_id}\",\n                    title=result.title,\n                    authors=[a.name for a in result.authors],\n                    abstract=result.summary,\n                    year=result.published.year,\n                    url=result.entry_id,\n                    source=\"arxiv\",\n                    arxiv_id=clean_id,\n                    fields_of_study=[cat for cat in result.categories],\n                )\n            return None\n\n        except Exception as e:\n            self.logger.error(f\"Failed to get arXiv paper {arxiv_id}: {e}\")\n            return None\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/services/paper_recommendation/service.py",
  "content": "\"\"\"\nPaper Recommendation Service\n============================\n\nML-based paper recommendation combining:\n- Semantic similarity (embeddings)\n- Citation network analysis\n- User reading history\n\"\"\"\n\nimport asyncio\nimport json\nimport os\nimport time\nfrom datetime import datetime\nfrom pathlib import Path\nfrom typing import Optional\n\nimport numpy as np\n\nfrom src.logging import get_logger\nfrom src.services.embedding import get_embedding_client\n\nfrom .api_clients import ArxivClient, OpenAlexClient, SemanticScholarClient\nfrom .models import Paper, RecommendationResult, UserReadingHistory\n\n\nclass PaperRecommendationService:\n    \"\"\"\n    ML-based paper recommendation service.\n\n    Combines multiple signals:\n    1. Semantic similarity - embedding-based similarity between papers\n    2. Citation networks - papers cited by or citing similar papers\n    3. User history - personalized based on reading patterns\n    \"\"\"\n\n    def __init__(\n        self,\n        semantic_scholar_api_key: Optional[str] = None,\n        openalex_email: Optional[str] = None,\n        cache_dir: Optional[str] = None,\n    ):\n        self.logger = get_logger(\"PaperRecommendation\")\n\n        # Initialize API clients\n        self.semantic_scholar = SemanticScholarClient(api_key=semantic_scholar_api_key)\n        self.openalex = OpenAlexClient(email=openalex_email)\n        self.arxiv = ArxivClient()\n\n        # Initialize embedding client (singleton)\n        self._embedding_client = None\n\n        # Cache directory for paper embeddings\n        if cache_dir is None:\n            project_root = Path(__file__).parent.parent.parent.parent\n            cache_dir = str(project_root / \"data\" / \"user\" / \"paper_cache\")\n        self.cache_dir = Path(cache_dir)\n        self.cache_dir.mkdir(parents=True, exist_ok=True)\n\n        # User history file\n        self.history_file = self.cache_dir / \"reading_history.json\"\n\n        # Weights for combining scores\n        self.weights = {\n            \"semantic\": 0.4,\n            \"citation\": 0.3,\n            \"recency\": 0.2,\n            \"user_preference\": 0.1,\n        }\n\n    @property\n    def embedding_client(self):\n        \"\"\"Lazy-load embedding client.\"\"\"\n        if self._embedding_client is None:\n            self._embedding_client = get_embedding_client()\n        return self._embedding_client\n\n    async def close(self):\n        \"\"\"Close API clients.\"\"\"\n        await self.semantic_scholar.close()\n        await self.openalex.close()\n\n    async def recommend_papers(\n        self,\n        query: str,\n        seed_papers: Optional[list[str]] = None,\n        max_results: int = 10,\n        recommendation_type: str = \"hybrid\",\n        year_range: Optional[tuple[int, int]] = None,\n        use_history: bool = True,\n    ) -> RecommendationResult:\n        \"\"\"\n        Get paper recommendations based on query and/or seed papers.\n\n        Args:\n            query: Search query or topic description\n            seed_papers: Optional list of paper IDs to base recommendations on\n            max_results: Maximum number of recommendations to return\n            recommendation_type: \"semantic\", \"citation\", or \"hybrid\"\n            year_range: Optional (start_year, end_year) filter\n            use_history: Whether to incorporate user reading history\n\n        Returns:\n            RecommendationResult with ranked papers\n        \"\"\"\n        start_time = time.time()\n        all_candidates: list[Paper] = []\n\n        # Step 1: Gather candidate papers from multiple sources\n        gather_tasks = []\n\n        # Search by query\n        if query:\n            gather_tasks.append(self._search_all_sources(query, max_results * 3, year_range))\n\n        # Get related papers from seeds\n        if seed_papers:\n            for paper_id in seed_papers[:3]:  # Limit to avoid too many API calls\n                gather_tasks.append(self._get_related_papers(paper_id))\n\n        results = await asyncio.gather(*gather_tasks, return_exceptions=True)\n\n        for result in results:\n            if isinstance(result, list):\n                all_candidates.extend(result)\n\n        # Deduplicate by paper_id\n        seen_ids = set()\n        unique_candidates = []\n        for paper in all_candidates:\n            if paper.paper_id and paper.paper_id not in seen_ids:\n                seen_ids.add(paper.paper_id)\n                unique_candidates.append(paper)\n\n        if not unique_candidates:\n            return RecommendationResult(\n                query=query,\n                papers=[],\n                total_candidates=0,\n                recommendation_type=recommendation_type,\n                processing_time_ms=(time.time() - start_time) * 1000,\n            )\n\n        # Step 2: Score papers\n        scored_papers = await self._score_papers(\n            candidates=unique_candidates,\n            query=query,\n            seed_papers=seed_papers,\n            recommendation_type=recommendation_type,\n            use_history=use_history,\n        )\n\n        # Step 3: Rank and return top results\n        scored_papers.sort(key=lambda p: p.combined_score, reverse=True)\n        top_papers = scored_papers[:max_results]\n\n        # Generate recommendation reasons\n        for paper in top_papers:\n            paper.recommendation_reason = self._generate_reason(paper, recommendation_type)\n\n        processing_time = (time.time() - start_time) * 1000\n\n        return RecommendationResult(\n            query=query,\n            papers=top_papers,\n            total_candidates=len(unique_candidates),\n            recommendation_type=recommendation_type,\n            processing_time_ms=processing_time,\n        )\n\n    async def _search_all_sources(\n        self,\n        query: str,\n        limit: int,\n        year_range: Optional[tuple[int, int]] = None,\n    ) -> list[Paper]:\n        \"\"\"Search papers from all sources in parallel.\"\"\"\n        per_source_limit = limit // 3 + 1\n\n        tasks = [\n            self.semantic_scholar.search_papers(query, per_source_limit, year_range=year_range),\n            self.openalex.search_papers(query, per_source_limit, year_range=year_range),\n            self.arxiv.search_papers(query, per_source_limit),\n        ]\n\n        results = await asyncio.gather(*tasks, return_exceptions=True)\n        papers = []\n\n        for result in results:\n            if isinstance(result, list):\n                papers.extend(result)\n\n        return papers\n\n    async def _get_related_papers(self, paper_id: str) -> list[Paper]:\n        \"\"\"Get papers related to a seed paper via citations.\"\"\"\n        papers = []\n\n        try:\n            # Get citing papers\n            citations = await self.semantic_scholar.get_citations(paper_id, limit=20)\n            papers.extend(citations)\n\n            # Get referenced papers\n            references = await self.semantic_scholar.get_references(paper_id, limit=20)\n            papers.extend(references)\n\n            # Get Semantic Scholar's recommendations\n            recommendations = await self.semantic_scholar.get_recommended_papers(paper_id, limit=10)\n            papers.extend(recommendations)\n\n        except Exception as e:\n            self.logger.warning(f\"Failed to get related papers for {paper_id}: {e}\")\n\n        return papers\n\n    async def _score_papers(\n        self,\n        candidates: list[Paper],\n        query: str,\n        seed_papers: Optional[list[str]],\n        recommendation_type: str,\n        use_history: bool,\n    ) -> list[Paper]:\n        \"\"\"Score papers based on multiple factors.\"\"\"\n\n        # Compute semantic similarity scores\n        if recommendation_type in [\"semantic\", \"hybrid\"] and query:\n            await self._compute_semantic_scores(candidates, query)\n\n        # Compute citation scores\n        if recommendation_type in [\"citation\", \"hybrid\"]:\n            self._compute_citation_scores(candidates)\n\n        # Compute recency scores\n        self._compute_recency_scores(candidates)\n\n        # Compute user preference scores if history available\n        if use_history:\n            await self._compute_user_preference_scores(candidates)\n\n        # Combine scores\n        for paper in candidates:\n            if recommendation_type == \"semantic\":\n                paper.combined_score = paper.similarity_score\n            elif recommendation_type == \"citation\":\n                paper.combined_score = paper.citation_score\n            else:  # hybrid\n                paper.combined_score = (\n                    self.weights[\"semantic\"] * paper.similarity_score\n                    + self.weights[\"citation\"] * paper.citation_score\n                    + self.weights[\"recency\"] * paper.recency_score\n                )\n\n        return candidates\n\n    async def _compute_semantic_scores(self, candidates: list[Paper], query: str):\n        \"\"\"Compute semantic similarity between query and paper abstracts.\"\"\"\n        try:\n            # Get query embedding\n            query_embedding = await self.embedding_client.embed([query])\n            query_vec = np.array(query_embedding[0])\n\n            # Get paper abstract embeddings\n            abstracts = [p.abstract if p.abstract else p.title for p in candidates]\n            paper_embeddings = await self.embedding_client.embed(abstracts)\n\n            # Compute cosine similarity\n            for i, paper in enumerate(candidates):\n                paper_vec = np.array(paper_embeddings[i])\n                similarity = self._cosine_similarity(query_vec, paper_vec)\n                paper.similarity_score = max(0.0, similarity)  # Ensure non-negative\n\n        except Exception as e:\n            self.logger.warning(f\"Failed to compute semantic scores: {e}\")\n            # Fallback: all papers get neutral score\n            for paper in candidates:\n                paper.similarity_score = 0.5\n\n    def _compute_citation_scores(self, candidates: list[Paper]):\n        \"\"\"Compute citation-based scores using citation count and network position.\"\"\"\n        max_citations = max((p.citation_count or 0 for p in candidates), default=1)\n        max_citations = max(max_citations, 1)  # Avoid division by zero\n\n        for paper in candidates:\n            # Normalize citation count (log scale to handle high variance)\n            citation_count = paper.citation_count or 0\n            if citation_count > 0:\n                log_citations = np.log1p(citation_count)\n                log_max = np.log1p(max_citations)\n                paper.citation_score = log_citations / log_max\n            else:\n                paper.citation_score = 0.0\n\n    def _compute_recency_scores(self, candidates: list[Paper]):\n        \"\"\"Compute recency scores favoring recent papers.\"\"\"\n        current_year = datetime.now().year\n\n        for paper in candidates:\n            years_old = current_year - paper.year\n            # Exponential decay with half-life of 3 years\n            paper.recency_score = np.exp(-years_old / 3)\n\n    async def _compute_user_preference_scores(self, candidates: list[Paper]):\n        \"\"\"Compute scores based on user reading history.\"\"\"\n        history = self._load_user_history()\n\n        if not history.preferred_topics and not history.read_papers:\n            # No history, neutral scores\n            for paper in candidates:\n                paper.combined_score += 0  # No preference boost\n            return\n\n        # Match against preferred topics\n        if history.preferred_topics:\n            topic_set = set(t.lower() for t in history.preferred_topics)\n            for paper in candidates:\n                paper_fields = set(f.lower() for f in paper.fields_of_study)\n                topic_overlap = len(topic_set & paper_fields)\n                if topic_overlap > 0:\n                    paper.combined_score += self.weights[\"user_preference\"] * (topic_overlap / len(topic_set))\n\n    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:\n        \"\"\"Compute cosine similarity between two vectors.\"\"\"\n        dot_product = np.dot(vec1, vec2)\n        norm1 = np.linalg.norm(vec1)\n        norm2 = np.linalg.norm(vec2)\n\n        if norm1 == 0 or norm2 == 0:\n            return 0.0\n\n        return dot_product / (norm1 * norm2)\n\n    def _generate_reason(self, paper: Paper, recommendation_type: str) -> str:\n        \"\"\"Generate human-readable recommendation reason.\"\"\"\n        reasons = []\n\n        if paper.similarity_score > 0.7:\n            reasons.append(\"highly relevant to your query\")\n        elif paper.similarity_score > 0.5:\n            reasons.append(\"relevant to your query\")\n\n        if paper.citation_count and paper.citation_count > 100:\n            reasons.append(f\"well-cited ({paper.citation_count} citations)\")\n        elif paper.citation_count and paper.citation_count > 20:\n            reasons.append(f\"moderately cited ({paper.citation_count} citations)\")\n\n        if paper.recency_score > 0.8:\n            reasons.append(\"recent publication\")\n\n        if paper.fields_of_study:\n            reasons.append(f\"in {', '.join(paper.fields_of_study[:2])}\")\n\n        if not reasons:\n            reasons.append(\"matches your search criteria\")\n\n        return \"; \".join(reasons).capitalize()\n\n    # User history management\n\n    def _load_user_history(self, user_id: str = \"default\") -> UserReadingHistory:\n        \"\"\"Load user reading history.\"\"\"\n        try:\n            if self.history_file.exists():\n                with open(self.history_file, encoding=\"utf-8\") as f:\n                    data = json.load(f)\n                    if isinstance(data, dict) and data.get(\"user_id\") == user_id:\n                        return UserReadingHistory.from_dict(data)\n        except Exception as e:\n            self.logger.warning(f\"Failed to load user history: {e}\")\n\n        return UserReadingHistory(user_id=user_id)\n\n    def _save_user_history(self, history: UserReadingHistory):\n        \"\"\"Save user reading history.\"\"\"\n        try:\n            with open(self.history_file, \"w\", encoding=\"utf-8\") as f:\n                json.dump(history.to_dict(), f, indent=2, ensure_ascii=False)\n        except Exception as e:\n            self.logger.error(f\"Failed to save user history: {e}\")\n\n    def record_paper_read(self, paper_id: str, user_id: str = \"default\"):\n        \"\"\"Record that user read a paper.\"\"\"\n        history = self._load_user_history(user_id)\n        if paper_id not in history.read_papers:\n            history.read_papers.append(paper_id)\n            history.last_updated = datetime.now()\n            self._save_user_history(history)\n\n    def record_paper_saved(self, paper_id: str, user_id: str = \"default\"):\n        \"\"\"Record that user saved a paper.\"\"\"\n        history = self._load_user_history(user_id)\n        if paper_id not in history.saved_papers:\n            history.saved_papers.append(paper_id)\n            history.last_updated = datetime.now()\n            self._save_user_history(history)\n\n    def record_search_query(self, query: str, user_id: str = \"default\"):\n        \"\"\"Record user's search query.\"\"\"\n        history = self._load_user_history(user_id)\n        if query not in history.search_queries:\n            history.search_queries.append(query)\n            # Keep only recent queries\n            history.search_queries = history.search_queries[-50:]\n            history.last_updated = datetime.now()\n            self._save_user_history(history)\n\n    def update_preferred_topics(self, topics: list[str], user_id: str = \"default\"):\n        \"\"\"Update user's preferred topics.\"\"\"\n        history = self._load_user_history(user_id)\n        history.preferred_topics = topics\n        history.last_updated = datetime.now()\n        self._save_user_history(history)\n\n    def get_user_history(self, user_id: str = \"default\") -> UserReadingHistory:\n        \"\"\"Get user's reading history.\"\"\"\n        return self._load_user_history(user_id)\n\n\n# Singleton instance\n_service: Optional[PaperRecommendationService] = None\n\n\ndef get_paper_recommendation_service(\n    semantic_scholar_api_key: Optional[str] = None,\n    openalex_email: Optional[str] = None,\n) -> PaperRecommendationService:\n    \"\"\"Get or create the singleton paper recommendation service.\"\"\"\n    global _service\n    if _service is None:\n        # Try to get API key from environment\n        if semantic_scholar_api_key is None:\n            semantic_scholar_api_key = os.getenv(\"SEMANTIC_SCHOLAR_API_KEY\")\n        if openalex_email is None:\n            openalex_email = os.getenv(\"OPENALEX_EMAIL\")\n\n        _service = PaperRecommendationService(\n            semantic_scholar_api_key=semantic_scholar_api_key,\n            openalex_email=openalex_email,\n        )\n    return _service\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing structure",
      "status": "completed",
      "activeForm": "Exploring codebase structure"
    },
    {
      "content": "Plan implementation approach for paper recommendations",
      "status": "completed",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Create paper recommendation service with API clients",
      "status": "completed",
      "activeForm": "Creating paper recommendation service"
    },
    {
      "content": "Implement recommendation agent with similarity scoring",
      "status": "in_progress",
      "activeForm": "Implementing recommendation agent"
    },
    {
      "content": "Create API router for paper recommendations",
      "status": "pending",
      "activeForm": "Creating API router"
    },
    {
      "content": "Create frontend UI for paper recommendations",
      "status": "pending",
      "activeForm": "Creating frontend UI"
    },
    {
      "content": "Verify feature with Playwright test",
      "status": "pending",
      "activeForm": "Verifying with Playwright"
    }
  ]
}
Now let me create the Paper Recommendation Agent that uses LLM for intelligent recommendation explanations:

🔧 Tool: Bash
Input: {
  "command": "mkdir -p /Users/kyin/Projects/praDeep/src/agents/paper_recommender/prompts/en",
  "description": "Create paper recommender agent directory"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/agents/paper_recommender/__init__.py",
  "content": "\"\"\"\nPaper Recommender Agent\n=======================\n\nAgent for intelligent paper recommendations using ML-based similarity\nand LLM-powered explanations.\n\"\"\"\n\nfrom .recommender_agent import PaperRecommenderAgent\nfrom .workflow import PaperRecommendationWorkflow\n\n__all__ = [\n    \"PaperRecommenderAgent\",\n    \"PaperRecommendationWorkflow\",\n]\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/agents/paper_recommender/prompts/en/recommender.yaml",
  "content": "# Paper Recommender Agent Prompts\n\nsystem: |\n  You are an expert research assistant specializing in academic paper recommendations.\n  Your role is to analyze user research interests and explain why specific papers\n  are relevant to their needs.\n\n  You have deep knowledge of academic research across many fields including:\n  - Computer Science (ML, AI, NLP, Systems, Theory)\n  - Medicine and Life Sciences\n  - Physics and Mathematics\n  - Social Sciences\n\n  When explaining recommendations, you should:\n  1. Highlight the key contributions of each paper\n  2. Explain how it relates to the user's query or interests\n  3. Point out connections between recommended papers\n  4. Suggest reading order if appropriate\n\nexplain_recommendations: |\n  The user is interested in: {query}\n\n  Here are the top recommended papers:\n\n  {papers_summary}\n\n  Please provide a brief explanation of why these papers are relevant to the user's\n  research interests. Focus on:\n  1. How each paper addresses the user's query\n  2. Key insights or contributions from each paper\n  3. Any connections or progression between papers\n  4. A suggested reading priority\n\n  Keep your explanation concise but informative (2-3 paragraphs).\n\nanalyze_paper: |\n  Please analyze the following paper and explain its relevance to the research topic: {topic}\n\n  Paper Title: {title}\n  Authors: {authors}\n  Year: {year}\n  Abstract: {abstract}\n\n  Provide:\n  1. A brief summary of the paper's main contribution\n  2. How it relates to the research topic\n  3. Its significance in the field\n  4. Potential limitations or considerations\n\nsuggest_related_topics: |\n  Based on the user's search for: {query}\n\n  And these papers they've shown interest in:\n  {saved_papers}\n\n  Suggest 3-5 related research topics or queries that might help them\n  explore the field further. Be specific and actionable.\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/agents/paper_recommender/recommender_agent.py",
  "content": "\"\"\"\nPaper Recommender Agent\n=======================\n\nAgent for generating intelligent explanations for paper recommendations.\n\"\"\"\n\nfrom typing import Any, Optional\n\nfrom src.agents.base_agent import BaseAgent\nfrom src.services.paper_recommendation import Paper\n\n\nclass PaperRecommenderAgent(BaseAgent):\n    \"\"\"\n    Agent for explaining and enhancing paper recommendations.\n\n    Uses LLM to:\n    - Explain why papers are relevant to user's query\n    - Analyze individual papers in depth\n    - Suggest related research topics\n    \"\"\"\n\n    def __init__(\n        self,\n        api_key: Optional[str] = None,\n        base_url: Optional[str] = None,\n        model: Optional[str] = None,\n        language: str = \"en\",\n        config: Optional[dict[str, Any]] = None,\n        **kwargs,\n    ):\n        super().__init__(\n            module_name=\"paper_recommender\",\n            agent_name=\"recommender\",\n            api_key=api_key,\n            base_url=base_url,\n            model=model,\n            language=language,\n            config=config,\n            **kwargs,\n        )\n\n    async def process(\n        self,\n        query: str,\n        papers: list[Paper],\n        action: str = \"explain\",\n    ) -> dict[str, Any]:\n        \"\"\"\n        Process recommendation request.\n\n        Args:\n            query: User's research query\n            papers: List of recommended papers\n            action: Action to perform - \"explain\", \"analyze\", \"suggest_topics\"\n\n        Returns:\n            Dictionary with explanation or analysis\n        \"\"\"\n        if action == \"explain\":\n            return await self.explain_recommendations(query, papers)\n        elif action == \"analyze\":\n            return await self.analyze_papers(query, papers)\n        elif action == \"suggest_topics\":\n            return await self.suggest_related_topics(query, papers)\n        else:\n            return {\"error\": f\"Unknown action: {action}\"}\n\n    async def explain_recommendations(\n        self,\n        query: str,\n        papers: list[Paper],\n    ) -> dict[str, Any]:\n        \"\"\"Generate explanation for recommended papers.\"\"\"\n        if not papers:\n            return {\"explanation\": \"No papers to explain.\"}\n\n        # Format papers for prompt\n        papers_summary = self._format_papers_summary(papers[:5])  # Top 5\n\n        # Get prompt template\n        system_prompt = self.get_prompt(\"system\", \"You are an expert research assistant.\")\n        user_prompt_template = self.get_prompt(\n            \"explain_recommendations\",\n            \"Please explain why these papers are relevant to: {query}\\n\\n{papers_summary}\",\n        )\n\n        user_prompt = user_prompt_template.format(\n            query=query,\n            papers_summary=papers_summary,\n        )\n\n        try:\n            response = await self.call_llm(\n                user_prompt=user_prompt,\n                system_prompt=system_prompt,\n                temperature=0.7,\n                max_tokens=1000,\n            )\n\n            return {\n                \"query\": query,\n                \"explanation\": response,\n                \"paper_count\": len(papers),\n            }\n        except Exception as e:\n            self.logger.error(f\"Failed to generate explanation: {e}\")\n            return {\n                \"query\": query,\n                \"explanation\": self._generate_fallback_explanation(papers),\n                \"paper_count\": len(papers),\n                \"error\": str(e),\n            }\n\n    async def analyze_papers(\n        self,\n        topic: str,\n        papers: list[Paper],\n    ) -> dict[str, Any]:\n        \"\"\"Analyze papers in depth.\"\"\"\n        analyses = []\n\n        system_prompt = self.get_prompt(\"system\", \"You are an expert research assistant.\")\n        analyze_template = self.get_prompt(\n            \"analyze_paper\",\n            \"Analyze this paper's relevance to {topic}:\\n{title}\\n{abstract}\",\n        )\n\n        for paper in papers[:3]:  # Analyze top 3\n            user_prompt = analyze_template.format(\n                topic=topic,\n                title=paper.title,\n                authors=\", \".join(paper.authors[:3]),\n                year=paper.year,\n                abstract=paper.abstract[:500] if paper.abstract else \"No abstract available\",\n            )\n\n            try:\n                analysis = await self.call_llm(\n                    user_prompt=user_prompt,\n                    system_prompt=system_prompt,\n                    temperature=0.7,\n                    max_tokens=500,\n                )\n                analyses.append({\n                    \"paper_id\": paper.paper_id,\n                    \"title\": paper.title,\n                    \"analysis\": analysis,\n                })\n            except Exception as e:\n                self.logger.warning(f\"Failed to analyze paper {paper.title}: {e}\")\n                analyses.append({\n                    \"paper_id\": paper.paper_id,\n                    \"title\": paper.title,\n                    \"analysis\": f\"Analysis unavailable: {paper.recommendation_reason}\",\n                })\n\n        return {\n            \"topic\": topic,\n            \"analyses\": analyses,\n        }\n\n    async def suggest_related_topics(\n        self,\n        query: str,\n        papers: list[Paper],\n    ) -> dict[str, Any]:\n        \"\"\"Suggest related research topics.\"\"\"\n        system_prompt = self.get_prompt(\"system\", \"You are an expert research assistant.\")\n        suggest_template = self.get_prompt(\n            \"suggest_related_topics\",\n            \"Based on the search for {query} and these papers:\\n{saved_papers}\\n\\nSuggest related topics.\",\n        )\n\n        papers_text = \"\\n\".join([f\"- {p.title}\" for p in papers[:5]])\n\n        user_prompt = suggest_template.format(\n            query=query,\n            saved_papers=papers_text,\n        )\n\n        try:\n            response = await self.call_llm(\n                user_prompt=user_prompt,\n                system_prompt=system_prompt,\n                temperature=0.8,\n                max_tokens=500,\n            )\n\n            return {\n                \"query\": query,\n                \"suggestions\": response,\n            }\n        except Exception as e:\n            self.logger.error(f\"Failed to suggest topics: {e}\")\n            return {\n                \"query\": query,\n                \"suggestions\": \"Unable to generate suggestions at this time.\",\n                \"error\": str(e),\n            }\n\n    def _format_papers_summary(self, papers: list[Paper]) -> str:\n        \"\"\"Format papers into a summary string for prompts.\"\"\"\n        summaries = []\n        for i, paper in enumerate(papers, 1):\n            authors = \", \".join(paper.authors[:3])\n            if len(paper.authors) > 3:\n                authors += \" et al.\"\n\n            abstract_preview = paper.abstract[:300] + \"...\" if len(paper.abstract) > 300 else paper.abstract\n\n            summary = f\"\"\"\n{i}. **{paper.title}**\n   Authors: {authors}\n   Year: {paper.year}\n   Source: {paper.source}\n   Citations: {paper.citation_count or 'N/A'}\n   Relevance Score: {paper.combined_score:.2f}\n   Abstract: {abstract_preview}\n\"\"\"\n            summaries.append(summary)\n\n        return \"\\n\".join(summaries)\n\n    def _generate_fallback_explanation(self, papers: list[Paper]) -> str:\n        \"\"\"Generate a simple explanation when LLM fails.\"\"\"\n        if not papers:\n            return \"No papers found matching your query.\"\n\n        explanation = \"Here are the top recommended papers based on relevance:\\n\\n\"\n\n        for i, paper in enumerate(papers[:5], 1):\n            explanation += f\"{i}. **{paper.title}** ({paper.year})\\n\"\n            explanation += f\"   - {paper.recommendation_reason}\\n\\n\"\n\n        return explanation\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/agents/paper_recommender/workflow.py",
  "content": "\"\"\"\nPaper Recommendation Workflow\n=============================\n\nOrchestrates the paper recommendation process:\n1. Search and retrieve candidate papers\n2. Score and rank papers\n3. Generate explanations\n\"\"\"\n\nimport asyncio\nfrom typing import Any, Callable, Optional\n\nfrom src.logging import get_logger\nfrom src.services.paper_recommendation import (\n    Paper,\n    PaperRecommendationService,\n    RecommendationResult,\n    get_paper_recommendation_service,\n)\n\nfrom .recommender_agent import PaperRecommenderAgent\n\n\nclass PaperRecommendationWorkflow:\n    \"\"\"\n    Orchestrates the full paper recommendation workflow.\n\n    Stages:\n    1. Search - Query multiple paper sources\n    2. Score - Compute similarity and citation scores\n    3. Rank - Combine scores and rank papers\n    4. Explain - Generate LLM explanations (optional)\n    \"\"\"\n\n    def __init__(\n        self,\n        api_key: Optional[str] = None,\n        base_url: Optional[str] = None,\n        model: Optional[str] = None,\n        language: str = \"en\",\n        config: Optional[dict[str, Any]] = None,\n        progress_callback: Optional[Callable[[dict[str, Any]], None]] = None,\n    ):\n        self.logger = get_logger(\"PaperRecommendationWorkflow\")\n\n        # Initialize recommendation service\n        self.service = get_paper_recommendation_service()\n\n        # Initialize agent for explanations\n        self.agent = PaperRecommenderAgent(\n            api_key=api_key,\n            base_url=base_url,\n            model=model,\n            language=language,\n            config=config,\n        )\n\n        self.progress_callback = progress_callback\n        self.config = config or {}\n\n    def _emit_progress(self, stage: str, status: str, **kwargs):\n        \"\"\"Emit progress event.\"\"\"\n        if self.progress_callback:\n            event = {\n                \"type\": \"progress\",\n                \"stage\": stage,\n                \"status\": status,\n                **kwargs,\n            }\n            self.progress_callback(event)\n\n    async def run(\n        self,\n        query: str,\n        seed_papers: Optional[list[str]] = None,\n        max_results: int = 10,\n        recommendation_type: str = \"hybrid\",\n        year_range: Optional[tuple[int, int]] = None,\n        generate_explanation: bool = True,\n        suggest_topics: bool = False,\n    ) -> dict[str, Any]:\n        \"\"\"\n        Run the full recommendation workflow.\n\n        Args:\n            query: User's research query\n            seed_papers: Optional paper IDs to base recommendations on\n            max_results: Number of papers to return\n            recommendation_type: \"semantic\", \"citation\", or \"hybrid\"\n            year_range: Optional (start_year, end_year) filter\n            generate_explanation: Whether to generate LLM explanation\n            suggest_topics: Whether to suggest related topics\n\n        Returns:\n            Dictionary with recommendations and optional explanation\n        \"\"\"\n        self.logger.info(f\"Starting paper recommendation workflow for: {query[:50]}...\")\n\n        # Stage 1: Search and score papers\n        self._emit_progress(\"searching\", \"started\", query=query)\n\n        result = await self.service.recommend_papers(\n            query=query,\n            seed_papers=seed_papers,\n            max_results=max_results,\n            recommendation_type=recommendation_type,\n            year_range=year_range,\n            use_history=True,\n        )\n\n        self._emit_progress(\n            \"searching\",\n            \"completed\",\n            total_candidates=result.total_candidates,\n            returned=len(result.papers),\n        )\n\n        if not result.papers:\n            return {\n                \"query\": query,\n                \"papers\": [],\n                \"total_candidates\": 0,\n                \"recommendation_type\": recommendation_type,\n                \"explanation\": \"No papers found matching your query. Try a different search term.\",\n                \"processing_time_ms\": result.processing_time_ms,\n            }\n\n        # Record search query for personalization\n        self.service.record_search_query(query)\n\n        # Stage 2: Generate explanation (optional)\n        explanation = None\n        if generate_explanation:\n            self._emit_progress(\"explaining\", \"started\")\n\n            explanation_result = await self.agent.explain_recommendations(\n                query=query,\n                papers=result.papers,\n            )\n            explanation = explanation_result.get(\"explanation\", \"\")\n\n            self._emit_progress(\"explaining\", \"completed\")\n\n        # Stage 3: Suggest related topics (optional)\n        suggestions = None\n        if suggest_topics and result.papers:\n            self._emit_progress(\"suggesting\", \"started\")\n\n            suggestions_result = await self.agent.suggest_related_topics(\n                query=query,\n                papers=result.papers,\n            )\n            suggestions = suggestions_result.get(\"suggestions\", \"\")\n\n            self._emit_progress(\"suggesting\", \"completed\")\n\n        # Prepare response\n        response = {\n            \"query\": query,\n            \"papers\": [p.to_dict() for p in result.papers],\n            \"total_candidates\": result.total_candidates,\n            \"recommendation_type\": recommendation_type,\n            \"processing_time_ms\": result.processing_time_ms,\n        }\n\n        if explanation:\n            response[\"explanation\"] = explanation\n\n        if suggestions:\n            response[\"related_topics\"] = suggestions\n\n        self._emit_progress(\"workflow\", \"completed\")\n\n        return response\n\n    async def analyze_paper(self, paper_id: str, query: str) -> dict[str, Any]:\n        \"\"\"\n        Get detailed analysis of a specific paper.\n\n        Args:\n            paper_id: Paper ID to analyze\n            query: Context query for analysis\n\n        Returns:\n            Detailed paper analysis\n        \"\"\"\n        # First, fetch the paper\n        paper = None\n\n        # Try Semantic Scholar first\n        paper = await self.service.semantic_scholar.get_paper(paper_id)\n\n        if not paper and paper_id.startswith(\"arxiv:\"):\n            arxiv_id = paper_id.replace(\"arxiv:\", \"\")\n            paper = await self.service.arxiv.get_paper(arxiv_id)\n\n        if not paper:\n            return {\"error\": f\"Paper not found: {paper_id}\"}\n\n        # Generate analysis\n        result = await self.agent.analyze_papers(query, [paper])\n\n        return result\n\n    def record_paper_interaction(\n        self,\n        paper_id: str,\n        interaction_type: str = \"read\",\n    ):\n        \"\"\"\n        Record user interaction with a paper.\n\n        Args:\n            paper_id: Paper ID\n            interaction_type: \"read\" or \"save\"\n        \"\"\"\n        if interaction_type == \"read\":\n            self.service.record_paper_read(paper_id)\n        elif interaction_type == \"save\":\n            self.service.record_paper_saved(paper_id)\n\n    def get_user_history(self) -> dict[str, Any]:\n        \"\"\"Get user's reading history.\"\"\"\n        history = self.service.get_user_history()\n        return history.to_dict()\n\n    def update_preferences(self, topics: list[str]):\n        \"\"\"Update user's preferred topics.\"\"\"\n        self.service.update_preferred_topics(topics)\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing structure",
      "status": "completed",
      "activeForm": "Exploring codebase structure"
    },
    {
      "content": "Plan implementation approach for paper recommendations",
      "status": "completed",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Create paper recommendation service with API clients",
      "status": "completed",
      "activeForm": "Creating paper recommendation service"
    },
    {
      "content": "Implement recommendation agent with similarity scoring",
      "status": "completed",
      "activeForm": "Implementing recommendation agent"
    },
    {
      "content": "Create API router for paper recommendations",
      "status": "in_progress",
      "activeForm": "Creating API router"
    },
    {
      "content": "Create frontend UI for paper recommendations",
      "status": "pending",
      "activeForm": "Creating frontend UI"
    },
    {
      "content": "Verify feature with Playwright test",
      "status": "pending",
      "activeForm": "Verifying with Playwright"
    }
  ]
}
Now let me create the API router for paper recommendations:

🔧 Tool: Write
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/api/routers/recommendation.py",
  "content": "\"\"\"\nPaper Recommendation API Router\n===============================\n\nREST and WebSocket endpoints for ML-based paper recommendations.\n\"\"\"\n\nimport asyncio\nimport traceback\nfrom pathlib import Path\nfrom typing import Any, Optional\n\nfrom fastapi import APIRouter, HTTPException, WebSocket\nfrom pydantic import BaseModel, Field\n\nfrom src.agents.paper_recommender import PaperRecommendationWorkflow\nfrom src.api.utils.history import ActivityType, history_manager\nfrom src.api.utils.task_id_manager import TaskIDManager\nfrom src.logging import get_logger\nfrom src.services.config import load_config_with_main\nfrom src.services.llm import get_llm_config\nfrom src.services.paper_recommendation import get_paper_recommendation_service\n\nrouter = APIRouter()\n\n\ndef load_config():\n    project_root = Path(__file__).parent.parent.parent.parent\n    return load_config_with_main(\"main.yaml\", project_root)\n\n\nconfig = load_config()\nlog_dir = config.get(\"paths\", {}).get(\"user_log_dir\")\nlogger = get_logger(\"RecommendationAPI\", log_dir=log_dir)\n\n\n# ============================================================================\n# Request/Response Models\n# ============================================================================\n\n\nclass RecommendationRequest(BaseModel):\n    \"\"\"Request model for paper recommendations.\"\"\"\n\n    query: str = Field(..., description=\"Research query or topic\")\n    seed_papers: Optional[list[str]] = Field(\n        default=None, description=\"Paper IDs to base recommendations on\"\n    )\n    max_results: int = Field(default=10, ge=1, le=50, description=\"Maximum number of results\")\n    recommendation_type: str = Field(\n        default=\"hybrid\",\n        description=\"Recommendation type: semantic, citation, or hybrid\",\n    )\n    year_start: Optional[int] = Field(default=None, description=\"Start year filter\")\n    year_end: Optional[int] = Field(default=None, description=\"End year filter\")\n    generate_explanation: bool = Field(default=True, description=\"Generate LLM explanation\")\n    suggest_topics: bool = Field(default=False, description=\"Suggest related topics\")\n\n\nclass PaperInteractionRequest(BaseModel):\n    \"\"\"Request model for paper interactions.\"\"\"\n\n    paper_id: str = Field(..., description=\"Paper ID\")\n    interaction_type: str = Field(\n        default=\"read\", description=\"Interaction type: read or save\"\n    )\n\n\nclass PreferencesRequest(BaseModel):\n    \"\"\"Request model for updating preferences.\"\"\"\n\n    topics: list[str] = Field(..., description=\"Preferred research topics\")\n\n\nclass PaperAnalysisRequest(BaseModel):\n    \"\"\"Request model for paper analysis.\"\"\"\n\n    paper_id: str = Field(..., description=\"Paper ID to analyze\")\n    query: str = Field(..., description=\"Context query for analysis\")\n\n\n# ============================================================================\n# REST Endpoints\n# ============================================================================\n\n\n@router.post(\"/recommend\")\nasync def get_recommendations(request: RecommendationRequest) -> dict[str, Any]:\n    \"\"\"\n    Get paper recommendations based on query.\n\n    This endpoint performs:\n    1. Multi-source paper search (arXiv, Semantic Scholar, OpenAlex)\n    2. ML-based scoring (semantic similarity, citations, recency)\n    3. Optional LLM-powered explanation\n    \"\"\"\n    try:\n        # Get LLM config\n        try:\n            llm_config = get_llm_config()\n            api_key = llm_config.api_key\n            base_url = llm_config.base_url\n        except Exception as e:\n            logger.warning(f\"LLM config not available: {e}\")\n            api_key = None\n            base_url = None\n\n        # Build year range if provided\n        year_range = None\n        if request.year_start or request.year_end:\n            year_range = (\n                request.year_start or 1990,\n                request.year_end or 2030,\n            )\n\n        # Create workflow\n        workflow = PaperRecommendationWorkflow(\n            api_key=api_key,\n            base_url=base_url,\n            config=load_config(),\n        )\n\n        # Run recommendations\n        result = await workflow.run(\n            query=request.query,\n            seed_papers=request.seed_papers,\n            max_results=request.max_results,\n            recommendation_type=request.recommendation_type,\n            year_range=year_range,\n            generate_explanation=request.generate_explanation,\n            suggest_topics=request.suggest_topics,\n        )\n\n        # Save to history\n        history_manager.add_entry(\n            activity_type=ActivityType.RESEARCH,\n            title=f\"Paper Recommendations: {request.query[:50]}\",\n            content={\n                \"query\": request.query,\n                \"recommendation_type\": request.recommendation_type,\n                \"paper_count\": len(result.get(\"papers\", [])),\n            },\n            summary=f\"Found {len(result.get('papers', []))} papers\",\n        )\n\n        return result\n\n    except Exception as e:\n        logger.error(f\"Recommendation error: {e}\")\n        traceback.print_exc()\n        raise HTTPException(status_code=500, detail=str(e))\n\n\n@router.post(\"/analyze\")\nasync def analyze_paper(request: PaperAnalysisRequest) -> dict[str, Any]:\n    \"\"\"Get detailed analysis of a specific paper.\"\"\"\n    try:\n        llm_config = get_llm_config()\n\n        workflow = PaperRecommendationWorkflow(\n            api_key=llm_config.api_key,\n            base_url=llm_config.base_url,\n            config=load_config(),\n        )\n\n        result = await workflow.analyze_paper(\n            paper_id=request.paper_id,\n            query=request.query,\n        )\n\n        return result\n\n    except Exception as e:\n        logger.error(f\"Analysis error: {e}\")\n        raise HTTPException(status_code=500, detail=str(e))\n\n\n@router.post(\"/interaction\")\nasync def record_interaction(request: PaperInteractionRequest) -> dict[str, str]:\n    \"\"\"Record user interaction with a paper (read or save).\"\"\"\n    try:\n        service = get_paper_recommendation_service()\n\n        if request.interaction_type == \"read\":\n            service.record_paper_read(request.paper_id)\n        elif request.interaction_type == \"save\":\n            service.record_paper_saved(request.paper_id)\n        else:\n            raise HTTPException(\n                status_code=400,\n                detail=f\"Invalid interaction type: {request.interaction_type}\",\n            )\n\n        return {\"status\": \"recorded\", \"paper_id\": request.paper_id}\n\n    except HTTPException:\n        raise\n    except Exception as e:\n        logger.error(f\"Interaction error: {e}\")\n        raise HTTPException(status_code=500, detail=str(e))\n\n\n@router.get(\"/history\")\nasync def get_user_history() -> dict[str, Any]:\n    \"\"\"Get user's reading history and preferences.\"\"\"\n    try:\n        service = get_paper_recommendation_service()\n        history = service.get_user_history()\n        return history.to_dict()\n\n    except Exception as e:\n        logger.error(f\"History error: {e}\")\n        raise HTTPException(status_code=500, detail=str(e))\n\n\n@router.post(\"/preferences\")\nasync def update_preferences(request: PreferencesRequest) -> dict[str, str]:\n    \"\"\"Update user's preferred research topics.\"\"\"\n    try:\n        service = get_paper_recommendation_service()\n        service.update_preferred_topics(request.topics)\n        return {\"status\": \"updated\", \"topics_count\": len(request.topics)}\n\n    except Exception as e:\n        logger.error(f\"Preferences error: {e}\")\n        raise HTTPException(status_code=500, detail=str(e))\n\n\n@router.get(\"/search\")\nasync def search_papers(\n    query: str,\n    limit: int = 10,\n    source: str = \"all\",\n) -> dict[str, Any]:\n    \"\"\"\n    Quick paper search without full recommendation scoring.\n\n    Useful for fast lookups and autocomplete.\n    \"\"\"\n    try:\n        service = get_paper_recommendation_service()\n\n        papers = []\n        if source in [\"all\", \"semantic_scholar\"]:\n            ss_papers = await service.semantic_scholar.search_papers(query, limit)\n            papers.extend(ss_papers)\n\n        if source in [\"all\", \"arxiv\"]:\n            arxiv_papers = await service.arxiv.search_papers(query, limit)\n            papers.extend(arxiv_papers)\n\n        if source in [\"all\", \"openalex\"]:\n            oa_papers = await service.openalex.search_papers(query, limit)\n            papers.extend(oa_papers)\n\n        # Deduplicate\n        seen = set()\n        unique_papers = []\n        for p in papers:\n            if p.paper_id not in seen:\n                seen.add(p.paper_id)\n                unique_papers.append(p.to_dict())\n\n        return {\n            \"query\": query,\n            \"papers\": unique_papers[:limit],\n            \"total\": len(unique_papers),\n        }\n\n    except Exception as e:\n        logger.error(f\"Search error: {e}\")\n        raise HTTPException(status_code=500, detail=str(e))\n\n\n# ============================================================================\n# WebSocket Endpoint for Real-time Updates\n# ============================================================================\n\n\n@router.websocket(\"/recommend/stream\")\nasync def websocket_recommendations(websocket: WebSocket):\n    \"\"\"\n    WebSocket endpoint for real-time recommendation updates.\n\n    Streams progress events during the recommendation process.\n    \"\"\"\n    await websocket.accept()\n    task_manager = TaskIDManager.get_instance()\n\n    try:\n        # Receive request\n        data = await websocket.receive_json()\n        query = data.get(\"query\")\n\n        if not query:\n            await websocket.send_json({\"type\": \"error\", \"content\": \"Query is required\"})\n            return\n\n        # Generate task ID\n        task_key = f\"recommendation_{hash(query)}\"\n        task_id = task_manager.generate_task_id(\"recommendation\", task_key)\n\n        await websocket.send_json({\"type\": \"task_id\", \"task_id\": task_id})\n\n        # Get LLM config\n        try:\n            llm_config = get_llm_config()\n            api_key = llm_config.api_key\n            base_url = llm_config.base_url\n        except Exception:\n            api_key = None\n            base_url = None\n\n        # Progress callback\n        progress_queue = asyncio.Queue()\n\n        def progress_callback(event: dict[str, Any]):\n            try:\n                asyncio.get_event_loop().call_soon_threadsafe(\n                    progress_queue.put_nowait, event\n                )\n            except Exception:\n                pass\n\n        # Progress pusher task\n        async def progress_pusher():\n            while True:\n                try:\n                    event = await progress_queue.get()\n                    if event is None:\n                        break\n                    await websocket.send_json(event)\n                except Exception:\n                    break\n\n        pusher_task = asyncio.create_task(progress_pusher())\n\n        # Create workflow with progress callback\n        workflow = PaperRecommendationWorkflow(\n            api_key=api_key,\n            base_url=base_url,\n            config=load_config(),\n            progress_callback=progress_callback,\n        )\n\n        # Build parameters\n        year_range = None\n        if data.get(\"year_start\") or data.get(\"year_end\"):\n            year_range = (\n                data.get(\"year_start\", 1990),\n                data.get(\"year_end\", 2030),\n            )\n\n        # Run workflow\n        await websocket.send_json({\"type\": \"status\", \"content\": \"started\"})\n\n        result = await workflow.run(\n            query=query,\n            seed_papers=data.get(\"seed_papers\"),\n            max_results=data.get(\"max_results\", 10),\n            recommendation_type=data.get(\"recommendation_type\", \"hybrid\"),\n            year_range=year_range,\n            generate_explanation=data.get(\"generate_explanation\", True),\n            suggest_topics=data.get(\"suggest_topics\", False),\n        )\n\n        # Send final result\n        await websocket.send_json({\n            \"type\": \"result\",\n            \"data\": result,\n        })\n\n        # Stop progress pusher\n        await progress_queue.put(None)\n        pusher_task.cancel()\n\n        task_manager.update_task_status(task_id, \"completed\")\n\n    except Exception as e:\n        logger.error(f\"WebSocket error: {e}\")\n        await websocket.send_json({\"type\": \"error\", \"content\": str(e)})\n"
}
Now let me register the router in the main API file:

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/api/main.py"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/api/main.py",
  "old_string": "from src.api.routers import (\n    agent_config,\n    analytics,\n    cache,\n    chat,\n    co_writer,\n    dashboard,\n    embedding_provider,\n    guide,\n    ideagen,\n    knowledge,\n    llm_provider,\n    memory,\n    metrics,\n    notebook,\n    question,\n    research,\n    settings,\n    solve,\n    system,\n)",
  "new_string": "from src.api.routers import (\n    agent_config,\n    analytics,\n    cache,\n    chat,\n    co_writer,\n    dashboard,\n    embedding_provider,\n    guide,\n    ideagen,\n    knowledge,\n    llm_provider,\n    memory,\n    metrics,\n    notebook,\n    question,\n    recommendation,\n    research,\n    settings,\n    solve,\n    system,\n)"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/src/api/main.py",
  "old_string": "app.include_router(analytics.router, prefix=\"/api/v1/analytics\", tags=[\"analytics\"])\napp.include_router(metrics.router, prefix=\"/api/v1/metrics\", tags=[\"metrics\"])",
  "new_string": "app.include_router(analytics.router, prefix=\"/api/v1/analytics\", tags=[\"analytics\"])\napp.include_router(metrics.router, prefix=\"/api/v1/metrics\", tags=[\"metrics\"])\napp.include_router(recommendation.router, prefix=\"/api/v1/recommendation\", tags=[\"recommendation\"])"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand existing structure",
      "status": "completed",
      "activeForm": "Exploring codebase structure"
    },
    {
      "content": "Plan implementation approach for paper recommendations",
      "status": "completed",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Create paper recommendation service with API clients",
      "status": "completed",
      "activeForm": "Creating paper recommendation service"
    },
    {
      "content": "Implement recommendation agent with similarity scoring",
      "status": "completed",
      "activeForm": "Implementing recommendation agent"
    },
    {
      "content": "Create API router for paper recommendations",
      "status": "completed",
      "activeForm": "Creating API router"
    },
    {
      "content": "Create frontend UI for paper recommendations",
      "status": "in_progress",
      "activeForm": "Creating frontend UI"
    },
    {
      "content": "Verify feature with Playwright test",
      "status": "pending",
      "activeForm": "Verifying with Playwright"
    }
  ]
}
Now let me create the frontend UI for paper recommendations. First, let me check the GlobalContext to understand the state pattern:

🔧 Tool: Read
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/web/context/GlobalContext.tsx"
}
The GlobalContext is quite large. Let me create the frontend page for paper recommendations as a standalone page (following the pattern from research page):

🔧 Tool: Write
Input: {
  "file_path": "/Users/kyin/Projects/praDeep/web/app/recommendation/page.tsx",
  "content": "\"use client\";\n\nimport React, { useState, useEffect, useRef } from \"react\";\nimport {\n  Search,\n  BookOpen,\n  ExternalLink,\n  Loader2,\n  Filter,\n  Calendar,\n  Star,\n  Quote,\n  BookmarkPlus,\n  ChevronDown,\n  ChevronUp,\n  Sparkles,\n  RefreshCw,\n} from \"lucide-react\";\nimport ReactMarkdown from \"react-markdown\";\nimport { useGlobal } from \"@/context/GlobalContext\";\nimport { apiUrl, wsUrl } from \"@/lib/api\";\n\ninterface Paper {\n  paper_id: string;\n  title: string;\n  authors: string[];\n  abstract: string;\n  year: number;\n  url: string;\n  source: string;\n  arxiv_id?: string;\n  doi?: string;\n  citation_count?: number;\n  venue?: string;\n  fields_of_study?: string[];\n  similarity_score: number;\n  citation_score: number;\n  recency_score: number;\n  combined_score: number;\n  recommendation_reason: string;\n}\n\ninterface RecommendationResult {\n  query: string;\n  papers: Paper[];\n  total_candidates: number;\n  recommendation_type: string;\n  processing_time_ms: number;\n  explanation?: string;\n  related_topics?: string;\n}\n\nexport default function RecommendationPage() {\n  const { uiSettings } = useGlobal();\n\n  // Search state\n  const [query, setQuery] = useState(\"\");\n  const [isLoading, setIsLoading] = useState(false);\n  const [result, setResult] = useState<RecommendationResult | null>(null);\n  const [error, setError] = useState<string | null>(null);\n\n  // Filter state\n  const [recommendationType, setRecommendationType] = useState(\"hybrid\");\n  const [yearStart, setYearStart] = useState<number | undefined>(undefined);\n  const [yearEnd, setYearEnd] = useState<number | undefined>(undefined);\n  const [maxResults, setMaxResults] = useState(10);\n  const [generateExplanation, setGenerateExplanation] = useState(true);\n  const [suggestTopics, setSuggestTopics] = useState(false);\n  const [showFilters, setShowFilters] = useState(false);\n\n  // Expanded paper state\n  const [expandedPapers, setExpandedPapers] = useState<Set<string>>(new Set());\n  const [savedPapers, setSavedPapers] = useState<Set<string>>(new Set());\n\n  // Progress state for WebSocket\n  const [progress, setProgress] = useState<string | null>(null);\n  const wsRef = useRef<WebSocket | null>(null);\n\n  const togglePaperExpand = (paperId: string) => {\n    setExpandedPapers((prev) => {\n      const next = new Set(prev);\n      if (next.has(paperId)) {\n        next.delete(paperId);\n      } else {\n        next.add(paperId);\n      }\n      return next;\n    });\n  };\n\n  const savePaper = async (paper: Paper) => {\n    try {\n      await fetch(apiUrl(\"/api/v1/recommendation/interaction\"), {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({\n          paper_id: paper.paper_id,\n          interaction_type: \"save\",\n        }),\n      });\n      setSavedPapers((prev) => new Set(prev).add(paper.paper_id));\n    } catch (err) {\n      console.error(\"Failed to save paper:\", err);\n    }\n  };\n\n  const searchPapers = async () => {\n    if (!query.trim()) return;\n\n    setIsLoading(true);\n    setError(null);\n    setProgress(\"Searching...\");\n\n    // Close existing WebSocket\n    if (wsRef.current) {\n      wsRef.current.close();\n    }\n\n    // Use WebSocket for real-time updates\n    const ws = new WebSocket(wsUrl(\"/api/v1/recommendation/recommend/stream\"));\n    wsRef.current = ws;\n\n    ws.onopen = () => {\n      ws.send(\n        JSON.stringify({\n          query,\n          max_results: maxResults,\n          recommendation_type: recommendationType,\n          year_start: yearStart,\n          year_end: yearEnd,\n          generate_explanation: generateExplanation,\n          suggest_topics: suggestTopics,\n        })\n      );\n    };\n\n    ws.onmessage = (event) => {\n      try {\n        const data = JSON.parse(event.data);\n\n        if (data.type === \"progress\") {\n          setProgress(\n            data.status === \"started\"\n              ? `${data.stage}: Starting...`\n              : `${data.stage}: ${data.status}`\n          );\n        } else if (data.type === \"result\") {\n          setResult(data.data);\n          setIsLoading(false);\n          setProgress(null);\n          ws.close();\n        } else if (data.type === \"error\") {\n          setError(data.content);\n          setIsLoading(false);\n          setProgress(null);\n          ws.close();\n        }\n      } catch (e) {\n        console.error(\"Parse error:\", e);\n      }\n    };\n\n    ws.onerror = () => {\n      // Fallback to REST API\n      fetchPapersRest();\n      ws.close();\n    };\n\n    ws.onclose = () => {\n      if (wsRef.current === ws) {\n        wsRef.current = null;\n      }\n    };\n  };\n\n  const fetchPapersRest = async () => {\n    try {\n      const response = await fetch(apiUrl(\"/api/v1/recommendation/recommend\"), {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({\n          query,\n          max_results: maxResults,\n          recommendation_type: recommendationType,\n          year_start: yearStart,\n          year_end: yearEnd,\n          generate_explanation: generateExplanation,\n          suggest_topics: suggestTopics,\n        }),\n      });\n\n      if (!response.ok) {\n        throw new Error(\"Failed to fetch recommendations\");\n      }\n\n      const data = await response.json();\n      setResult(data);\n    } catch (err) {\n      setError(err instanceof Error ? err.message : \"Unknown error\");\n    } finally {\n      setIsLoading(false);\n      setProgress(null);\n    }\n  };\n\n  const getSourceBadgeColor = (source: string) => {\n    switch (source) {\n      case \"arxiv\":\n        return \"bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400\";\n      case \"semantic_scholar\":\n        return \"bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400\";\n      case \"openalex\":\n        return \"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400\";\n      default:\n        return \"bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400\";\n    }\n  };\n\n  const formatAuthors = (authors: string[], max: number = 3) => {\n    if (authors.length <= max) return authors.join(\", \");\n    return `${authors.slice(0, max).join(\", \")} et al.`;\n  };\n\n  return (\n    <div className=\"h-screen flex flex-col p-4 animate-fade-in\">\n      {/* Header */}\n      <div className=\"mb-4\">\n        <h1 className=\"text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2\">\n          <BookOpen className=\"w-7 h-7 text-indigo-600 dark:text-indigo-400\" />\n          Paper Recommendations\n        </h1>\n        <p className=\"text-sm text-slate-500 dark:text-slate-400 mt-1\">\n          ML-based paper recommendations using citation networks, semantic similarity, and your reading history\n        </p>\n      </div>\n\n      {/* Search Bar */}\n      <div className=\"bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-4\">\n        <div className=\"flex gap-3\">\n          <div className=\"flex-1 relative\">\n            <Search className=\"absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400\" />\n            <input\n              type=\"text\"\n              value={query}\n              onChange={(e) => setQuery(e.target.value)}\n              onKeyDown={(e) => e.key === \"Enter\" && searchPapers()}\n              placeholder=\"Enter research topic, keywords, or paper title...\"\n              className=\"w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500\"\n            />\n          </div>\n          <button\n            onClick={() => setShowFilters(!showFilters)}\n            className={`px-4 py-3 rounded-xl border transition-all ${\n              showFilters\n                ? \"bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400\"\n                : \"bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600\"\n            }`}\n          >\n            <Filter className=\"w-5 h-5\" />\n          </button>\n          <button\n            onClick={searchPapers}\n            disabled={isLoading || !query.trim()}\n            className=\"px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2\"\n          >\n            {isLoading ? (\n              <>\n                <Loader2 className=\"w-5 h-5 animate-spin\" />\n                Searching...\n              </>\n            ) : (\n              <>\n                <Sparkles className=\"w-5 h-5\" />\n                Find Papers\n              </>\n            )}\n          </button>\n        </div>\n\n        {/* Filters */}\n        {showFilters && (\n          <div className=\"mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4\">\n            <div>\n              <label className=\"block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1\">\n                Recommendation Type\n              </label>\n              <select\n                value={recommendationType}\n                onChange={(e) => setRecommendationType(e.target.value)}\n                className=\"w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm\"\n              >\n                <option value=\"hybrid\">Hybrid (Recommended)</option>\n                <option value=\"semantic\">Semantic Similarity</option>\n                <option value=\"citation\">Citation-based</option>\n              </select>\n            </div>\n            <div>\n              <label className=\"block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1\">\n                Year Range\n              </label>\n              <div className=\"flex gap-2\">\n                <input\n                  type=\"number\"\n                  placeholder=\"From\"\n                  value={yearStart || \"\"}\n                  onChange={(e) =>\n                    setYearStart(e.target.value ? parseInt(e.target.value) : undefined)\n                  }\n                  className=\"w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm\"\n                />\n                <input\n                  type=\"number\"\n                  placeholder=\"To\"\n                  value={yearEnd || \"\"}\n                  onChange={(e) =>\n                    setYearEnd(e.target.value ? parseInt(e.target.value) : undefined)\n                  }\n                  className=\"w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm\"\n                />\n              </div>\n            </div>\n            <div>\n              <label className=\"block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1\">\n                Max Results\n              </label>\n              <input\n                type=\"number\"\n                min={1}\n                max={50}\n                value={maxResults}\n                onChange={(e) => setMaxResults(parseInt(e.target.value) || 10)}\n                className=\"w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm\"\n              />\n            </div>\n            <div className=\"flex flex-col gap-2\">\n              <label className=\"flex items-center gap-2 text-sm\">\n                <input\n                  type=\"checkbox\"\n                  checked={generateExplanation}\n                  onChange={(e) => setGenerateExplanation(e.target.checked)}\n                  className=\"rounded\"\n                />\n                <span className=\"text-slate-700 dark:text-slate-300\">AI Explanation</span>\n              </label>\n              <label className=\"flex items-center gap-2 text-sm\">\n                <input\n                  type=\"checkbox\"\n                  checked={suggestTopics}\n                  onChange={(e) => setSuggestTopics(e.target.checked)}\n                  className=\"rounded\"\n                />\n                <span className=\"text-slate-700 dark:text-slate-300\">Suggest Topics</span>\n              </label>\n            </div>\n          </div>\n        )}\n      </div>\n\n      {/* Progress indicator */}\n      {progress && (\n        <div className=\"bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3 mb-4 flex items-center gap-3\">\n          <RefreshCw className=\"w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin\" />\n          <span className=\"text-sm text-indigo-700 dark:text-indigo-300\">{progress}</span>\n        </div>\n      )}\n\n      {/* Error message */}\n      {error && (\n        <div className=\"bg-red-50 dark:bg-red-900/30 rounded-xl p-4 mb-4 text-red-700 dark:text-red-300\">\n          {error}\n        </div>\n      )}\n\n      {/* Results */}\n      <div className=\"flex-1 overflow-hidden flex gap-4\">\n        {/* Papers list */}\n        <div className=\"flex-1 overflow-y-auto\">\n          {result && result.papers.length > 0 ? (\n            <div className=\"space-y-4\">\n              {/* Stats bar */}\n              <div className=\"flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 px-2\">\n                <span>\n                  Found {result.papers.length} of {result.total_candidates} candidates\n                </span>\n                <span>Processed in {result.processing_time_ms.toFixed(0)}ms</span>\n              </div>\n\n              {/* Paper cards */}\n              {result.papers.map((paper, index) => (\n                <div\n                  key={paper.paper_id}\n                  className=\"bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow\"\n                >\n                  <div className=\"p-4\">\n                    {/* Header */}\n                    <div className=\"flex items-start justify-between gap-3\">\n                      <div className=\"flex-1\">\n                        <div className=\"flex items-center gap-2 mb-2\">\n                          <span className=\"text-xs font-medium text-slate-500 dark:text-slate-400\">\n                            #{index + 1}\n                          </span>\n                          <span\n                            className={`px-2 py-0.5 rounded text-xs font-medium ${getSourceBadgeColor(\n                              paper.source\n                            )}`}\n                          >\n                            {paper.source === \"semantic_scholar\"\n                              ? \"Semantic Scholar\"\n                              : paper.source === \"openalex\"\n                              ? \"OpenAlex\"\n                              : \"arXiv\"}\n                          </span>\n                          <span className=\"text-xs text-slate-400 flex items-center gap-1\">\n                            <Calendar className=\"w-3 h-3\" />\n                            {paper.year}\n                          </span>\n                          {paper.citation_count !== undefined && paper.citation_count !== null && (\n                            <span className=\"text-xs text-slate-400 flex items-center gap-1\">\n                              <Quote className=\"w-3 h-3\" />\n                              {paper.citation_count} citations\n                            </span>\n                          )}\n                        </div>\n                        <h3 className=\"font-semibold text-slate-800 dark:text-slate-100 leading-snug\">\n                          {paper.title}\n                        </h3>\n                        <p className=\"text-sm text-slate-500 dark:text-slate-400 mt-1\">\n                          {formatAuthors(paper.authors)}\n                        </p>\n                      </div>\n                      <div className=\"flex items-center gap-2\">\n                        <div className=\"text-center\">\n                          <div className=\"text-lg font-bold text-indigo-600 dark:text-indigo-400\">\n                            {(paper.combined_score * 100).toFixed(0)}%\n                          </div>\n                          <div className=\"text-xs text-slate-400\">Match</div>\n                        </div>\n                      </div>\n                    </div>\n\n                    {/* Recommendation reason */}\n                    <div className=\"mt-3 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm text-indigo-700 dark:text-indigo-300\">\n                      {paper.recommendation_reason}\n                    </div>\n\n                    {/* Expandable abstract */}\n                    <div className=\"mt-3\">\n                      <button\n                        onClick={() => togglePaperExpand(paper.paper_id)}\n                        className=\"flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300\"\n                      >\n                        {expandedPapers.has(paper.paper_id) ? (\n                          <>\n                            <ChevronUp className=\"w-4 h-4\" /> Hide abstract\n                          </>\n                        ) : (\n                          <>\n                            <ChevronDown className=\"w-4 h-4\" /> Show abstract\n                          </>\n                        )}\n                      </button>\n                      {expandedPapers.has(paper.paper_id) && (\n                        <p className=\"mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed\">\n                          {paper.abstract || \"No abstract available.\"}\n                        </p>\n                      )}\n                    </div>\n\n                    {/* Actions */}\n                    <div className=\"mt-4 flex items-center gap-3\">\n                      <a\n                        href={paper.url}\n                        target=\"_blank\"\n                        rel=\"noopener noreferrer\"\n                        className=\"flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300\"\n                      >\n                        <ExternalLink className=\"w-4 h-4\" /> View Paper\n                      </a>\n                      <button\n                        onClick={() => savePaper(paper)}\n                        disabled={savedPapers.has(paper.paper_id)}\n                        className={`flex items-center gap-1 text-sm ${\n                          savedPapers.has(paper.paper_id)\n                            ? \"text-green-600 dark:text-green-400\"\n                            : \"text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300\"\n                        }`}\n                      >\n                        {savedPapers.has(paper.paper_id) ? (\n                          <>\n                            <Star className=\"w-4 h-4 fill-current\" /> Saved\n                          </>\n                        ) : (\n                          <>\n                            <BookmarkPlus className=\"w-4 h-4\" /> Save\n                          </>\n                        )}\n                      </button>\n                      {paper.fields_of_study && paper.fields_of_study.length > 0 && (\n                        <div className=\"flex-1 flex flex-wrap gap-1 justify-end\">\n                          {paper.fields_of_study.slice(0, 3).map((field, i) => (\n                            <span\n                              key={i}\n                              className=\"px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-500 dark:text-slate-400\"\n                            >\n                              {field}\n                            </span>\n                          ))}\n                        </div>\n                      )}\n                    </div>\n\n                    {/* Score breakdown */}\n                    {expandedPapers.has(paper.paper_id) && (\n                      <div className=\"mt-4 pt-4 border-t border-slate-100 dark:border-slate-700\">\n                        <div className=\"grid grid-cols-3 gap-4 text-center\">\n                          <div>\n                            <div className=\"text-xs text-slate-400 mb-1\">Semantic</div>\n                            <div className=\"text-sm font-medium text-slate-700 dark:text-slate-300\">\n                              {(paper.similarity_score * 100).toFixed(1)}%\n                            </div>\n                          </div>\n                          <div>\n                            <div className=\"text-xs text-slate-400 mb-1\">Citation</div>\n                            <div className=\"text-sm font-medium text-slate-700 dark:text-slate-300\">\n                              {(paper.citation_score * 100).toFixed(1)}%\n                            </div>\n                          </div>\n                          <div>\n                            <div className=\"text-xs text-slate-400 mb-1\">Recency</div>\n                            <div className=\"text-sm font-medium text-slate-700 dark:text-slate-300\">\n                              {(paper.recency_score * 100).toFixed(1)}%\n                            </div>\n                          </div>\n                        </div>\n                      </div>\n                    )}\n                  </div>\n                </div>\n              ))}\n            </div>\n          ) : result && result.papers.length === 0 ? (\n            <div className=\"flex flex-col items-center justify-center h-full text-slate-400\">\n              <BookOpen className=\"w-16 h-16 mb-4 opacity-50\" />\n              <p>No papers found. Try a different search query.</p>\n            </div>\n          ) : !isLoading ? (\n            <div className=\"flex flex-col items-center justify-center h-full text-slate-400\">\n              <Search className=\"w-16 h-16 mb-4 opacity-50\" />\n              <p>Enter a research topic to find relevant papers</p>\n            </div>\n          ) : null}\n        </div>\n\n        {/* Explanation panel */}\n        {result && (result.explanation || result.related_topics) && (\n          <div className=\"w-96 flex-shrink-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col\">\n            <div className=\"p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30\">\n              <h3 className=\"font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2\">\n                <Sparkles className=\"w-5 h-5 text-indigo-600 dark:text-indigo-400\" />\n                AI Insights\n              </h3>\n            </div>\n            <div className=\"flex-1 overflow-y-auto p-4 space-y-4\">\n              {result.explanation && (\n                <div>\n                  <h4 className=\"text-sm font-medium text-slate-500 dark:text-slate-400 mb-2\">\n                    Why these papers?\n                  </h4>\n                  <div className=\"prose prose-sm dark:prose-invert max-w-none\">\n                    <ReactMarkdown>{result.explanation}</ReactMarkdown>\n                  </div>\n                </div>\n              )}\n              {result.related_topics && (\n                <div>\n                  <h4 className=\"text-sm font-medium text-slate-500 dark:text-slate-400 mb-2\">\n                    Related Topics to Explore\n                  </h4>\n                  <div className=\"prose prose-sm dark:prose-invert max-w-none\">\n                    <ReactMarkdown>{result.related_topics}</ReactMarkdown>\n                  </div>\n                </div>\n              )}\n            </div>\n          </div>\n        )}\n      </div>\n    </div>\n  );\n}\n"
}
You've hit your limit · resets 2pm (America/Los_Angeles)