// RAG advanced search & filtering types (frontend)

export interface RagDateRange {
  from?: string; // ISO8601 date/time
  to?: string; // ISO8601 date/time
}

export interface RagFilters {
  similarity_threshold?: number; // 0..1
  date_range?: RagDateRange;
  document_types?: string[];
  entities?: string[];
  relations?: string[];
}

export interface RagSearchResult {
  id?: string;
  content: string;
  score?: number;
  similarity?: number;
  metadata?: Record<string, any>;
}

export interface RagFacetValueCount {
  value: string;
  count: number;
}

export interface RagSearchFacets {
  document_types?: RagFacetValueCount[];
  entities?: RagFacetValueCount[];
  relations?: RagFacetValueCount[];
  date_range?: { min?: string; max?: string };
}

export interface RagSearchResponse {
  results: RagSearchResult[];
  facets: RagSearchFacets;
}

export interface RagChatSourceItem {
  kb_name: string;
  content: string;
  score?: number;
  provider?: string;
  mode?: string;
  metadata?: Record<string, any>;
  applied_filters?: RagFilters | Record<string, any> | null;
}
