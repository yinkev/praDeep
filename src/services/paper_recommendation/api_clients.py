"""
External API Clients for Paper Data
====================================

Clients for:
- Semantic Scholar API (citation networks, paper metadata)
- OpenAlex API (open access papers, citations)
- arXiv API (preprints)
"""

import asyncio
from typing import Optional
import aiohttp
from datetime import datetime

from src.logging import get_logger
from .models import Paper


class SemanticScholarClient:
    """Client for Semantic Scholar API."""

    BASE_URL = "https://api.semanticscholar.org/graph/v1"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.logger = get_logger("SemanticScholarClient")
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            headers = {"Accept": "application/json"}
            if self.api_key:
                headers["x-api-key"] = self.api_key
            self._session = aiohttp.ClientSession(headers=headers)
        return self._session

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()

    async def search_papers(
        self,
        query: str,
        limit: int = 10,
        fields: Optional[list[str]] = None,
        year_range: Optional[tuple[int, int]] = None,
    ) -> list[Paper]:
        """Search for papers by query."""
        if fields is None:
            fields = [
                "paperId",
                "title",
                "abstract",
                "authors",
                "year",
                "url",
                "citationCount",
                "venue",
                "fieldsOfStudy",
                "externalIds",
                "references",
                "citations",
            ]

        session = await self._get_session()
        params = {
            "query": query,
            "limit": limit,
            "fields": ",".join(fields),
        }

        if year_range:
            params["year"] = f"{year_range[0]}-{year_range[1]}"

        try:
            async with session.get(f"{self.BASE_URL}/paper/search", params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return [self._parse_paper(p) for p in data.get("data", []) if p.get("title")]
                else:
                    self.logger.warning(f"Semantic Scholar API error: {resp.status}")
                    return []
        except Exception as e:
            self.logger.error(f"Semantic Scholar search failed: {e}")
            return []

    async def get_paper(self, paper_id: str) -> Optional[Paper]:
        """Get paper by Semantic Scholar ID or DOI."""
        fields = [
            "paperId",
            "title",
            "abstract",
            "authors",
            "year",
            "url",
            "citationCount",
            "venue",
            "fieldsOfStudy",
            "externalIds",
            "references.paperId",
            "citations.paperId",
        ]

        session = await self._get_session()
        try:
            async with session.get(
                f"{self.BASE_URL}/paper/{paper_id}",
                params={"fields": ",".join(fields)},
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return self._parse_paper(data)
                return None
        except Exception as e:
            self.logger.error(f"Failed to get paper {paper_id}: {e}")
            return None

    async def get_citations(self, paper_id: str, limit: int = 50) -> list[Paper]:
        """Get papers that cite the given paper."""
        session = await self._get_session()
        fields = ["paperId", "title", "abstract", "authors", "year", "url", "citationCount"]

        try:
            async with session.get(
                f"{self.BASE_URL}/paper/{paper_id}/citations",
                params={"fields": ",".join(fields), "limit": limit},
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return [self._parse_paper(c.get("citingPaper", {})) for c in data.get("data", []) if c.get("citingPaper", {}).get("title")]
                return []
        except Exception as e:
            self.logger.error(f"Failed to get citations for {paper_id}: {e}")
            return []

    async def get_references(self, paper_id: str, limit: int = 50) -> list[Paper]:
        """Get papers referenced by the given paper."""
        session = await self._get_session()
        fields = ["paperId", "title", "abstract", "authors", "year", "url", "citationCount"]

        try:
            async with session.get(
                f"{self.BASE_URL}/paper/{paper_id}/references",
                params={"fields": ",".join(fields), "limit": limit},
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return [self._parse_paper(r.get("citedPaper", {})) for r in data.get("data", []) if r.get("citedPaper", {}).get("title")]
                return []
        except Exception as e:
            self.logger.error(f"Failed to get references for {paper_id}: {e}")
            return []

    async def get_recommended_papers(self, paper_id: str, limit: int = 10) -> list[Paper]:
        """Get Semantic Scholar's recommended papers based on a paper."""
        session = await self._get_session()
        fields = ["paperId", "title", "abstract", "authors", "year", "url", "citationCount", "venue"]

        try:
            async with session.get(
                f"{self.BASE_URL}/recommendations/v1/papers/forpaper/{paper_id}",
                params={"fields": ",".join(fields), "limit": limit},
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return [self._parse_paper(p) for p in data.get("recommendedPapers", []) if p.get("title")]
                return []
        except Exception as e:
            self.logger.error(f"Failed to get recommendations for {paper_id}: {e}")
            return []

    def _parse_paper(self, data: dict) -> Paper:
        """Parse Semantic Scholar paper data into Paper model."""
        authors = [a.get("name", "") for a in data.get("authors", [])]
        external_ids = data.get("externalIds", {}) or {}

        references = []
        if isinstance(data.get("references"), list):
            references = [r.get("paperId") for r in data["references"] if r and r.get("paperId")]

        citations = []
        if isinstance(data.get("citations"), list):
            citations = [c.get("paperId") for c in data["citations"] if c and c.get("paperId")]

        return Paper(
            paper_id=data.get("paperId", ""),
            title=data.get("title", ""),
            authors=authors,
            abstract=data.get("abstract", "") or "",
            year=data.get("year") or datetime.now().year,
            url=data.get("url", "") or f"https://www.semanticscholar.org/paper/{data.get('paperId', '')}",
            source="semantic_scholar",
            arxiv_id=external_ids.get("ArXiv"),
            doi=external_ids.get("DOI"),
            citation_count=data.get("citationCount"),
            venue=data.get("venue"),
            fields_of_study=data.get("fieldsOfStudy") or [],
            references=references,
            citations=citations,
        )


class OpenAlexClient:
    """Client for OpenAlex API."""

    BASE_URL = "https://api.openalex.org"

    def __init__(self, email: Optional[str] = None):
        self.email = email  # Polite pool access
        self.logger = get_logger("OpenAlexClient")
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()

    async def search_papers(
        self,
        query: str,
        limit: int = 10,
        year_range: Optional[tuple[int, int]] = None,
    ) -> list[Paper]:
        """Search for papers by query."""
        session = await self._get_session()

        params = {
            "search": query,
            "per_page": limit,
            "select": "id,doi,title,display_name,publication_year,cited_by_count,authorships,abstract_inverted_index,primary_location,concepts",
        }

        if self.email:
            params["mailto"] = self.email

        if year_range:
            params["filter"] = f"publication_year:{year_range[0]}-{year_range[1]}"

        try:
            async with session.get(f"{self.BASE_URL}/works", params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return [self._parse_paper(w) for w in data.get("results", []) if w.get("title")]
                else:
                    self.logger.warning(f"OpenAlex API error: {resp.status}")
                    return []
        except Exception as e:
            self.logger.error(f"OpenAlex search failed: {e}")
            return []

    async def get_paper(self, work_id: str) -> Optional[Paper]:
        """Get paper by OpenAlex ID."""
        session = await self._get_session()
        params = {}
        if self.email:
            params["mailto"] = self.email

        try:
            async with session.get(f"{self.BASE_URL}/works/{work_id}", params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return self._parse_paper(data)
                return None
        except Exception as e:
            self.logger.error(f"Failed to get work {work_id}: {e}")
            return None

    async def get_cited_by(self, work_id: str, limit: int = 50) -> list[Paper]:
        """Get papers that cite the given paper."""
        session = await self._get_session()

        params = {
            "filter": f"cites:{work_id}",
            "per_page": limit,
            "select": "id,doi,title,display_name,publication_year,cited_by_count,authorships,abstract_inverted_index",
        }
        if self.email:
            params["mailto"] = self.email

        try:
            async with session.get(f"{self.BASE_URL}/works", params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return [self._parse_paper(w) for w in data.get("results", []) if w.get("title")]
                return []
        except Exception as e:
            self.logger.error(f"Failed to get citations for {work_id}: {e}")
            return []

    async def get_related_works(self, work_id: str, limit: int = 10) -> list[Paper]:
        """Get related works based on OpenAlex's concept matching."""
        # First get the paper's concepts
        paper = await self.get_paper(work_id)
        if not paper or not paper.fields_of_study:
            return []

        # Search for papers with similar concepts
        session = await self._get_session()
        concept_filter = "|".join(paper.fields_of_study[:3])

        params = {
            "filter": f"concepts.id:{concept_filter}",
            "per_page": limit,
            "select": "id,doi,title,display_name,publication_year,cited_by_count,authorships,abstract_inverted_index",
        }
        if self.email:
            params["mailto"] = self.email

        try:
            async with session.get(f"{self.BASE_URL}/works", params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    # Filter out the original paper
                    return [self._parse_paper(w) for w in data.get("results", []) if w.get("id") != work_id and w.get("title")]
                return []
        except Exception as e:
            self.logger.error(f"Failed to get related works: {e}")
            return []

    def _parse_paper(self, data: dict) -> Paper:
        """Parse OpenAlex work data into Paper model."""
        # Extract authors
        authors = []
        for authorship in data.get("authorships", []):
            author = authorship.get("author", {})
            if author.get("display_name"):
                authors.append(author["display_name"])

        # Reconstruct abstract from inverted index
        abstract = ""
        abstract_index = data.get("abstract_inverted_index")
        if abstract_index:
            word_positions = []
            for word, positions in abstract_index.items():
                for pos in positions:
                    word_positions.append((pos, word))
            word_positions.sort()
            abstract = " ".join([word for _, word in word_positions])

        # Extract URL
        url = ""
        primary_location = data.get("primary_location", {})
        if primary_location:
            url = primary_location.get("landing_page_url", "") or ""
        if not url:
            url = f"https://openalex.org/works/{data.get('id', '').replace('https://openalex.org/', '')}"

        # Extract concepts as fields of study
        fields = []
        for concept in data.get("concepts", [])[:5]:
            if concept.get("display_name"):
                fields.append(concept["display_name"])

        # Extract DOI
        doi = data.get("doi", "")
        if doi and doi.startswith("https://doi.org/"):
            doi = doi.replace("https://doi.org/", "")

        return Paper(
            paper_id=data.get("id", "").replace("https://openalex.org/", ""),
            title=data.get("title") or data.get("display_name", ""),
            authors=authors,
            abstract=abstract,
            year=data.get("publication_year") or datetime.now().year,
            url=url,
            source="openalex",
            doi=doi if doi else None,
            citation_count=data.get("cited_by_count"),
            fields_of_study=fields,
        )


class ArxivClient:
    """Enhanced arXiv client for paper recommendations."""

    def __init__(self):
        self.logger = get_logger("ArxivClient")

    async def search_papers(
        self,
        query: str,
        max_results: int = 10,
        sort_by: str = "relevance",
    ) -> list[Paper]:
        """Search arXiv papers."""
        import arxiv

        try:
            sort_criterion = (
                arxiv.SortCriterion.Relevance
                if sort_by == "relevance"
                else arxiv.SortCriterion.SubmittedDate
            )

            search = arxiv.Search(
                query=query,
                max_results=max_results,
                sort_by=sort_criterion,
                sort_order=arxiv.SortOrder.Descending,
            )

            client = arxiv.Client()
            papers = []

            # Run in executor since arxiv library is synchronous
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(None, lambda: list(client.results(search)))

            for result in results:
                arxiv_id = result.entry_id.split("/")[-1]
                if "v" in arxiv_id:
                    arxiv_id = arxiv_id.split("v")[0]

                paper = Paper(
                    paper_id=f"arxiv:{arxiv_id}",
                    title=result.title,
                    authors=[a.name for a in result.authors],
                    abstract=result.summary,
                    year=result.published.year,
                    url=result.entry_id,
                    source="arxiv",
                    arxiv_id=arxiv_id,
                    fields_of_study=[cat for cat in result.categories],
                )
                papers.append(paper)

            return papers

        except Exception as e:
            self.logger.error(f"arXiv search failed: {e}")
            return []

    async def get_paper(self, arxiv_id: str) -> Optional[Paper]:
        """Get paper by arXiv ID."""
        import arxiv

        try:
            search = arxiv.Search(id_list=[arxiv_id])
            client = arxiv.Client()

            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(None, lambda: list(client.results(search)))

            if results:
                result = results[0]
                clean_id = arxiv_id
                if "v" in clean_id:
                    clean_id = clean_id.split("v")[0]

                return Paper(
                    paper_id=f"arxiv:{clean_id}",
                    title=result.title,
                    authors=[a.name for a in result.authors],
                    abstract=result.summary,
                    year=result.published.year,
                    url=result.entry_id,
                    source="arxiv",
                    arxiv_id=clean_id,
                    fields_of_study=[cat for cat in result.categories],
                )
            return None

        except Exception as e:
            self.logger.error(f"Failed to get arXiv paper {arxiv_id}: {e}")
            return None
