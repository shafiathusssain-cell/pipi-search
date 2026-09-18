export type SearchResult = {
  title: string;
  url: string;
  displayUrl: string;
  hostname: string;
  snippet: string;
};

export type SearchPayload = {
  results: SearchResult[];
  query: string;
  start: number;
  source?: 'duckduckgo' | 'bing';
  error: string | null;
};

export type SuggestPayload = {
  suggests: string[];
};

const SEARCH_ENDPOINT = '/api/search';
const SUGGEST_ENDPOINT = '/api/suggest';

export async function fetchResults(
  query: string,
  offset = 0,
  signal?: AbortSignal,
): Promise<SearchPayload> {
  const params = new URLSearchParams({ q: query });
  if (offset > 0) params.set('s', String(offset));
  const response = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error('Search is unavailable right now.');
  }
  return (await response.json()) as SearchPayload;
}

export async function fetchSuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const response = await fetch(
    `${SUGGEST_ENDPOINT}?q=${encodeURIComponent(query)}`,
    { signal, headers: { Accept: 'application/json' } },
  );
  if (!response.ok) return [];
  const payload = (await response.json()) as SuggestPayload;
  return Array.isArray(payload.suggests) ? payload.suggests : [];
}