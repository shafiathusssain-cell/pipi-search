const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const HTML_ENDPOINT = 'https://html.duckduckgo.com/html/';
const LITE_ENDPOINT = 'https://lite.duckduckgo.com/lite/';
const AUTOCOMPLETE_ENDPOINT = 'https://duckduckgo.com/ac/';
const BING_ENDPOINT = 'https://www.bing.com/search';

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
};

const RATE_LIMITED =
  'Search engines are verifying we are not a bot right now. Please try again in a few seconds.';

function decodeEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

function textFromHtml(html) {
  return decodeEntities(String(html ?? '').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function hostnameOf(target) {
  try {
    return new URL(target).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function displayUrl(target) {
  try {
    const parsed = new URL(target);
    const path = parsed.pathname === '/' ? '' : parsed.pathname;
    return `${parsed.hostname.replace(/^www\./, '')}${path}`.replace(/\/$/, '');
  } catch {
    return target;
  }
}

/* ---------------- DuckDuckGo ---------------- */

function resolveDdgTargetUrl(href) {
  if (!href) return null;
  let url = href.trim();
  if (url.startsWith('//')) url = `https:${url}`;

  if (url.includes('uddg=')) {
    try {
      const target = new URL(url).searchParams.get('uddg');
      if (target) return target;
    } catch {
      const match = url.match(/[?&]uddg=([^&]+)/);
      if (match) {
        try {
          return decodeURIComponent(match[1]);
        } catch {
          return null;
        }
      }
    }
  }

  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return null;
}

export function parseHtmlResults(html) {
  const chunks = String(html).split('<h2 class="result__title">').slice(1);
  const results = [];
  const seen = new Set();

  for (const chunk of chunks) {
    const anchorMatch = chunk.match(/<a\b[^>]*class="result__a"[^>]*>[\s\S]*?<\/a>/);
    if (!anchorMatch) continue;

    const hrefMatch = anchorMatch[0].match(/href="([^"]*)"/);
    const target = resolveDdgTargetUrl(hrefMatch ? hrefMatch[1] : '');
    if (!target) continue;

    const title = textFromHtml(anchorMatch[0]);
    if (!title) continue;

    const key = `${title}|${target}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const snippetMatch = chunk.match(/<a\b[^>]*class="result__snippet"[^>]*>[\s\S]*?<\/a>/);
    const urlMatch = chunk.match(/class="result__url"[^>]*>([\s\S]*?)<\/a>/);

    results.push({
      title,
      url: target,
      displayUrl: urlMatch ? textFromHtml(urlMatch[1]) : displayUrl(target),
      hostname: hostnameOf(target),
      snippet: snippetMatch ? textFromHtml(snippetMatch[0]) : '',
    });
  }

  return results;
}

export function parseLiteResults(html) {
  const chunks = String(html).split(/<tr\b/i).slice(1);
  const results = [];
  const seen = new Set();

  for (const chunk of chunks) {
    const anchorMatch = chunk.match(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
    if (!anchorMatch) continue;

    const target = resolveDdgTargetUrl(anchorMatch[1]);
    if (!target) continue;

    const title = textFromHtml(anchorMatch[2]);
    if (!title) continue;

    const key = `${title}|${target}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const snippetMatch = chunk.match(/class="result-snippet"[^>]*>([\s\S]*?)<\/td>/);

    results.push({
      title,
      url: target,
      displayUrl: displayUrl(target),
      hostname: hostnameOf(target),
      snippet: snippetMatch ? textFromHtml(snippetMatch[1]) : '',
    });
  }

  return results;
}

/* ---------------- Bing (fallback engine) ---------------- */

function decodeBingPayload(payload) {
  const options = new Set();
  if (payload.startsWith('a1a2')) {
    try {
      options.add(decodeURIComponent(payload));
    } catch {
      // keep going with raw forms
    }
  }
  options.add(payload);
  for (const option of [...options]) {
    for (let cut = 0; cut <= 5; cut += 1) {
      const candidate = option.slice(cut);
      if (!candidate) continue;
      try {
        const decoded = Buffer.from(candidate, 'base64').toString('utf-8');
        if (decoded.startsWith('http://') || decoded.startsWith('https://')) return decoded;
      } catch {
        // try next slice
      }
      try {
        const safe = candidate.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = Buffer.from(safe, 'base64').toString('utf-8');
        if (decoded.startsWith('http://') || decoded.startsWith('https://')) return decoded;
      } catch {
        // try next slice
      }
    }
  }
  return null;
}

function resolveBingTargetUrl(href) {
  if (!href?.startsWith('http')) return null;
  try {
    const parsed = new URL(decodeEntities(href));
    const payload = parsed.searchParams.get('u');
    if (payload) {
      const decoded = decodeBingPayload(payload);
      if (decoded) return decoded;
    }
    if (href.startsWith('https://') && !parsed.hostname.includes('bing.com')) return href;
  } catch {
    // fall through
  }
  return null;
}

export function parseBingResults(html) {
  const chunks = String(html).split('class="b_algo"').slice(1);
  const results = [];
  const seen = new Set();

  for (const chunk of chunks) {
    const anchorMatch = chunk.match(/<h2[^>]*>\s*<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
    if (!anchorMatch) continue;

    const target = resolveBingTargetUrl(anchorMatch[1]);
    if (!target) continue;

    const title = textFromHtml(anchorMatch[2]);
    if (!title) continue;

    const hostname = hostnameOf(target);
    if (!hostname || hostname.endsWith('.bing.com') || hostname === 'go.microsoft.com') continue;

    const key = `${title}|${target}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const citeMatch = chunk.match(/<cite[^>]*>([\s\S]*?)<\/cite>/);
    const snippetMatch = chunk.match(/<p[^>]*class="[^"]*b_lineclamp[^"]*"[^>]*>([\s\S]*?)<\/p>/);

    results.push({
      title,
      url: target,
      displayUrl: citeMatch ? textFromHtml(citeMatch[1]) : displayUrl(target),
      hostname,
      snippet: snippetMatch ? textFromHtml(snippetMatch[1]) : '',
    });
  }

  return results;
}

/* ---------------- Engine fetchers ---------------- */

async function fetchHtml(endpoint, query, start = 0) {
  const params = new URLSearchParams({ q: query });
  if (start > 0) params.set('s', String(start));
  params.set('kl', 'us-en');

  const response = await fetch(`${endpoint}?${params.toString()}`, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Search engine responded with ${response.status}`);
  }

  return response.text();
}

async function fetchBing(query, start = 0) {
  const params = new URLSearchParams({ q: query, setlang: 'en', count: '20' });
  if (start > 0) params.set('first', String(start));

  const response = await fetch(`${BING_ENDPOINT}?${params.toString()}`, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Fallback search engine responded with ${response.status}`);
  }

  return response.text();
}

const CHALLENGE_PATTERN = /anomaly|challenge|unusual traffic/i;

function looksChallenged(content) {
  return Boolean(content && CHALLENGE_PATTERN.test(content));
}

export async function searchWeb(query, start = 0) {
  const trimmed = String(query ?? '').trim();
  if (!trimmed) return { results: [], source: 'duckduckgo' };

  let htmlContent = null;
  let liteBody = null;
  let bingBody = null;
  try {
    htmlContent = await fetchHtml(HTML_ENDPOINT, trimmed, start);
  } catch {
    // primary failed; move to fallbacks
  }

  let results = htmlContent ? parseHtmlResults(htmlContent) : [];
  let source = 'duckduckgo';

  if (!results.length) {
    try {
      liteBody = await fetchHtml(LITE_ENDPOINT, trimmed, start);
    } catch {
      // lite failed
    }
    results = liteBody ? parseLiteResults(liteBody) : [];

    if (!results.length) {
      try {
        bingBody = await fetchBing(trimmed, start);
      } catch {
        // bing failed
      }
      results = bingBody ? parseBingResults(bingBody) : [];
      if (results.length) source = 'bing';
    }
  }

  if (!results.length) {
    const anyEngineResponsive = [htmlContent, liteBody, bingBody].some(
      (body) => body && !looksChallenged(body),
    );
    if (!anyEngineResponsive) {
      throw new Error(RATE_LIMITED);
    }
  }

  return { results, source };
}

/* ---------------- Autocomplete ---------------- */

function extractAcPhrases(data) {
  if (!Array.isArray(data)) return [];
  for (const item of data) {
    if (Array.isArray(item)) {
      const phrases = item.filter((entry) => typeof entry === 'string' && entry.trim());
      if (phrases.length) return phrases;
    }
  }
  if (data.every((entry) => typeof entry === 'string')) return data;
  return [];
}

export async function autocompleteDuckDuckGo(query) {
  const trimmed = String(query ?? '').trim();
  if (!trimmed) return [];

  try {
    const response = await fetch(
      `${AUTOCOMPLETE_ENDPOINT}?q=${encodeURIComponent(trimmed)}&type=list`,
      {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        redirect: 'follow',
      },
    );
    if (!response.ok) return [];
    const data = await response.json();
    return extractAcPhrases(data).slice(0, 8);
  } catch {
    return [];
  }
}