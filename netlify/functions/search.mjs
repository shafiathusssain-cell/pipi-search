import { searchWeb, autocompleteDuckDuckGo, wikiPanel } from './ddg.mjs';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

export default async (request) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') ?? '';
  const type = url.pathname.endsWith('/suggest')
    ? 'suggest'
    : url.pathname.endsWith('/wiki')
      ? 'wiki'
      : url.searchParams.get('type') ?? 'search';
  const start = Number(url.searchParams.get('s') ?? '0') || 0;

  try {
    if (type === 'suggest') {
      return json({ suggests: await autocompleteDuckDuckGo(query) });
    }

    if (type === 'wiki') {
      return json({ wiki: await wikiPanel(query) });
    }

    if (!query.trim()) {
      return json({ results: [], error: null });
    }

    const { results, source } = await searchWeb(query, start);
    return json({ results, source, query, start });
  } catch (error) {
    return json(
      {
        results: [],
        error: error instanceof Error ? error.message : 'Search is unavailable right now.',
      },
      502,
    );
  }
};

export const config = {
  path: ['/api/search', '/api/suggest', '/api/wiki'],
};
