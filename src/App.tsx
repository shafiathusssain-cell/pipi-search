import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  LoaderCircle,
  Moon,
  Shield,
  Sun,
} from 'lucide-react';
import SearchField from '@/components/SearchField';
import { fetchResults, fetchWiki, type SearchResult, type WikiPanel } from '@/lib/api';

type Theme = 'light' | 'dark';

function readInitialQuery(): string {
  return new URLSearchParams(window.location.search).get('q') ?? '';
}

function readInitialTheme(): Theme {
  const stored = localStorage.getItem('pipi-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const SHORTCUTS: { label: string; query: string }[] = [
  { label: 'News', query: 'latest news today' },
  { label: 'Weather', query: 'weather today' },
  { label: 'Movies', query: 'movies in theaters' },
  { label: 'Recipes', query: 'easy dinner recipes' },
  { label: 'Travel', query: 'best travel destinations' },
  { label: 'Jobs', query: 'remote jobs' },
];

function PokedexMark({ variant = 'lens', id }: { variant?: 'lens' | 'favicon'; id: string }) {
  const ballCx = variant === 'favicon' ? 31 : 30;
  const ballCy = variant === 'favicon' ? 29 : 30;
  const ballR = variant === 'favicon' ? 15 : 13;
  const lensR = variant === 'favicon' ? 20 : 18;

  return (
    <svg width="100%" height="100%" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={`ball-top-${id}`}>
          <rect x="0" y="0" width="64" height={ballCy} rx="6" />
        </clipPath>
      </defs>

      <circle cx={ballCx} cy={ballCy} r={ballR} fill="#fafafa" />
      <circle cx={ballCx} cy={ballCy} r={ballR} fill="#e5402b" clipPath={`url(#ball-top-${id})`} />
      <rect
        x={ballCx - ballR}
        y={ballCy - 1.7}
        width={ballR * 2}
        height="3.4"
        rx="1.7"
        fill="#1d1d1d"
      />
      <circle
        cx={ballCx}
        cy={ballCy}
        r={ballR * 0.32}
        fill="#ffffff"
        stroke="#1d1d1d"
        strokeWidth="1.6"
      />

      <circle cx={ballCx + 2} cy={ballCy + 2} r={lensR} fill="none" stroke="#ffffff" strokeWidth="3.4" />
      <path
        d={`M ${ballCx + lensR - 2} ${ballCy + lensR - 2} L ${Math.min(ballCx + lensR + 6, 57)} ${Math.min(ballCy + lensR + 6, 57)}`}
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Logo({ size = 'sm' }: { size?: 'lg' | 'sm' }) {
  return (
    <span className={size === 'lg' ? 'pipi-logo logo-lg' : 'pipi-logo logo-sm'} aria-label="Pokdex Search">
      <span className="logo-badge">
        <PokedexMark id={size} />
      </span>
      <span className="logo-word">
        <b>Pokdex</b>
        <i>search</i>
      </span>
    </span>
  );
}

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button className="theme-toggle" onClick={onToggle} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title="Change theme">
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

function ResultCard({ result }: { result: SearchResult }) {
  return (
    <li className="pipi-result">
      <a className="result-link" href={result.url} target="_blank" rel="noopener noreferrer">
        <span className="result-url">
          <span className="result-favicon">
            <img src={`https://external-content.duckduckgo.com/ip3/${result.hostname}.ico`} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
          </span>
          <span>{result.displayUrl}</span>
        </span>
        <h3 className="result-title">{result.title}</h3>
      </a>
      <p className="result-snippet">{result.snippet}</p>
    </li>
  );
}

function WikiBox({ wiki }: { wiki: WikiPanel }) {
  return (
    <aside className="wiki-panel" aria-label="Wikipedia">
      <div className="wiki-head">
        {wiki.thumbnail && (
          <span className="wiki-thumb">
            <img src={wiki.thumbnail} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
          </span>
        )}
        <div className="wiki-head-text">
          <span className="wiki-brand">Wikipedia</span>
          <a className="wiki-title" href={wiki.pageUrl} target="_blank" rel="noopener noreferrer">
            {wiki.title}
          </a>
          {wiki.description && <p className="wiki-desc">{wiki.description}</p>}
        </div>
      </div>
      {wiki.extract && <p className="wiki-extract">{wiki.extract}</p>}
      {wiki.links.length > 0 && (
        <nav className="wiki-links">
          <h4>Wikipedia links</h4>
          <ul>
            {wiki.links.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">{link.title}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <a className="wiki-more" href={wiki.pageUrl} target="_blank" rel="noopener noreferrer">
        Read the full article on Wikipedia
      </a>
    </aside>
  );
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);
  const [input, setInput] = useState<string>(() => readInitialQuery());
  const [query, setQuery] = useState<string>(() => readInitialQuery());
  const [offset, setOffset] = useState<number>(() => Number(new URLSearchParams(window.location.search).get('s') ?? '0') || 0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [source, setSource] = useState<'duckduckgo' | 'bing'>('duckduckgo');
  const [wiki, setWiki] = useState<WikiPanel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const luckyRef = useRef(false);

  const view = query ? 'results' : 'home';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('pipi-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.title = query ? `${query} - Pokdex Search` : "Pokdex Search - the search engine that doesn't track you";
  }, [query]);

  useEffect(() => {
    function handlePopState() {
      const url = new URL(window.location.href);
      const nextQuery = url.searchParams.get('q') ?? '';
      const nextOffset = Number(url.searchParams.get('s') ?? '0') || 0;
      setQuery(nextQuery);
      setInput(nextQuery);
      setOffset(nextOffset);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const started = performance.now();
    setLoading(true);
    setError(null);

    fetchResults(query, offset, controller.signal)
      .then((payload) => {
        setResults(payload.results);
        setSource(payload.source ?? 'duckduckgo');
        setElapsed(Math.round(performance.now() - started));
        if (payload.error) setError(payload.error);
        if (luckyRef.current && payload.results.length > 0) {
          luckyRef.current = false;
          window.open(payload.results[0].url, '_blank', 'noopener');
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [query, offset]);

  useEffect(() => {
    if (!query.trim() || offset > 0) {
      setWiki(null);
      return;
    }

    const controller = new AbortController();
    fetchWiki(query, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setWiki(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setWiki(null);
      });

    return () => controller.abort();
  }, [query, offset]);

  function goToSearch(nextQuery: string, nextOffset = 0) {
    const url = nextQuery ? `/?q=${encodeURIComponent(nextQuery)}${nextOffset > 0 ? `&s=${nextOffset}` : ''}` : '/';
    if (window.location.pathname + window.location.search !== url) {
      window.history.pushState({}, '', url);
    }
    setQuery(nextQuery);
    setInput(nextQuery);
    setOffset(nextOffset);
    window.scrollTo({ top: 0 });
  }

  function goHome() {
    if (window.location.pathname !== '/') window.history.pushState({}, '', '/');
    setQuery('');
    setInput('');
    setOffset(0);
    window.scrollTo({ top: 0 });
  }

  function handleLucky() {
    const trimmed = input.trim();
    if (!trimmed) return;
    luckyRef.current = true;
    goToSearch(trimmed);
  }

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  if (view === 'home') {
    return (
      <div className="pipi-home">
        <header className="home-top">
          <button className="home-logo" onClick={goHome} aria-label="Pokdex Search home">
            <Logo size="sm" />
          </button>
          <nav className="home-nav">
            <a href="#privacy" className="home-link">
              <Shield size={14} />
              Privacy, simplified
            </a>
            <div className="home-nav-secondary">
              <a href="#about" className="home-link">About</a>
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </nav>
        </header>

        <main className="home-center">
          <Logo size="lg" />
          <p className="home-tagline">The search engine that doesn't track you.</p>

          <div className="home-search">
            <SearchField
              size="lg"
              autoFocus
              value={input}
              onChange={setInput}
              onSearch={goToSearch}
              actions={
                <>
                  <button type="submit" className="cta cta-primary">Pokdex Search</button>
                  <button type="button" className="cta cta-lucky" onClick={handleLucky}>I'm Feeling Lucky</button>
                </>
              }
            />
          </div>

          <div className="home-shortcuts" aria-label="Popular searches">
            {SHORTCUTS.map((shortcut) => (
              <button key={shortcut.label} className="shortcut-chip" onClick={() => goToSearch(shortcut.query)}>
                {shortcut.label}
              </button>
            ))}
          </div>
        </main>

        <footer className="home-footer" id="privacy">
          <div className="footer-inner">
            <p className="footer-blurb">
              <strong>Pokdex Search</strong> is a private search engine. Your searches are never tracked, your history is never
              saved, and we never build a profile about you. Results come straight from DuckDuckGo — no sign-up, no cookies, no drama.
            </p>
            <nav className="footer-links">
              <a href="#about">About Pokdex Search</a>
              <a href="#privacy">Privacy</a>
              <span>© {new Date().getFullYear()} Pokdex Search</span>
            </nav>
            <p className="footer-note" id="about">
              Pokdex Search taps into DuckDuckGo's web index and serves the same URLs you trust — with a fresh look and a
              simpler promise: browse in private.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="pipi-results">
      <header className="results-header">
        <button className="results-logo" onClick={goHome} aria-label="Pokdex Search home">
          <Logo size="sm" />
        </button>
        <div className="results-search">
          <SearchField size="sm" value={input} onChange={setInput} onSearch={(q) => goToSearch(q)} />
        </div>
        <nav className="results-nav">
          <a href="#privacy" className="home-link"><Shield size={14} /> Private</a>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </nav>
      </header>

      <main className="results-main">
        <p className="results-meta">
          {offset > 0 ? `Page ${offset / 15 + 1} · ` : ''}Results for <strong>{query}</strong> · {(elapsed / 1000).toFixed(1)} seconds
          {source === 'bing' && <span className="meta-source"> · fallback search engine</span>}
        </p>

        {loading ? (
          <div className="results-state" role="status">
            <LoaderCircle className="spin" size={24} />
            <span>Searching…</span>
          </div>
        ) : error ? (
          <div className="results-state">
            <p className="state-title">We hit a snag</p>
            <p className="state-text">{error}</p>
            <button className="cta cta-primary" onClick={() => goToSearch(query, offset)}>Try again</button>
          </div>
        ) : results.length === 0 ? (
          <div className="results-state">
            <p className="state-title">No results for “{query}”</p>
            <p className="state-text">Check the spelling or try different, broader keywords. Pokdex Search still keeps
            this search private.</p>
            {offset > 0 && (
              <button className="cta cta-primary" onClick={() => goToSearch(query, 0)}><ArrowLeft size={15} /> Back to first page</button>
            )}
          </div>
        ) : (
          <div className="results-layout">
            <div className="results-col">
              <ol className="results-list">
                {results.map((result, index) => (
                  <ResultCard key={`${result.url}-${index}`} result={result} />
                ))}
              </ol>

              <nav className="results-pagination" aria-label="Results pages">
                {offset > 0 && (
                  <button className="cta cta-secondary" onClick={() => goToSearch(query, Math.max(offset - 15, 0))}>
                    <ArrowLeft size={15} /> Previous
                  </button>
                )}
                <button className="cta cta-secondary" onClick={() => goToSearch(query, offset + 15)}>
                  Next <ChevronRight size={15} />
                </button>
              </nav>
            </div>

            {wiki && <WikiBox wiki={wiki} />}
          </div>
        )}

        <section className="private-strip" id="privacy" aria-label="Why Pokdex Search">
          <p><strong>No tracking.</strong> We don't store or sell your searches.</p>
          <p><strong>No filter bubble.</strong> Everyone sees the same results.</p>
          <p><strong>No ad profile.</strong> Search privately, stay under the radar.</p>
        </section>

        <footer className="results-footer">
          <span>Powered by {source === 'bing' ? 'Bing (fallback)' : 'DuckDuckGo'}</span>
          <a href="#privacy">Privacy</a>
          <span>© {new Date().getFullYear()} Pokdex Search</span>
        </footer>
      </main>
    </div>
  );
}