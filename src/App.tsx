import { useEffect, useRef, useState, type ReactNode } from 'react';
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
        <b>POKDEX</b>
        <i>SEARCH</i>
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

function DetailShell({ theme, onToggle, children }: { theme: Theme; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="pipi-home detail-page">
      <header className="home-top">
        <a className="home-logo" href="/" aria-label="Pokdex Search home">
          <Logo size="sm" />
        </a>
        <nav className="home-nav">
          <div className="home-nav-secondary detail-nav">
            <a className="home-link" href="/">Home</a>
            <a className="home-link" href="/about">About</a>
            <a className="home-link" href="/privacy">Privacy</a>
            <ThemeToggle theme={theme} onToggle={onToggle} />
          </div>
        </nav>
      </header>
      <main className="detail-main">{children}</main>
      <footer className="home-footer">
        <div className="footer-inner">
          <nav className="footer-links">
            <a href="/about">About Pokdex Search</a>
            <a href="/privacy">Privacy</a>
            <span>© {new Date().getFullYear()} Pokdex Search</span>
          </nav>
          <p className="footer-note">Pokdex Search never tracks, stores, or sells your searches.</p>
        </div>
      </footer>
    </div>
  );
}

function PrivacyPage() {
  return (
    <>
      <section className="detail-hero">
        <h1>Privacy, simplified</h1>
        <p className="detail-lede">
          Pokdex Search exists for one reason: let you search the web without being watched.
          No accounts, no trackers, no ad profiles, no saved history.
        </p>
      </section>

      <section className="detail-section">
        <h2>What we never collect</h2>
        <ul className="detail-list">
          <li>Your search terms or the pages you open.</li>
          <li>Your IP address or location.</li>
          <li>Cookies that follow you around the web.</li>
          <li>An account, profile, or browsing history.</li>
          <li>Anything we could sell — there is nothing to sell.</li>
        </ul>
      </section>

      <section className="detail-section">
        <h2>How it works</h2>
        <p>
          When you search, your query goes from your browser to our server. The server asks
          DuckDuckGo (and falls back to Bing if needed), then returns the results to you.
          Search engines see a request from our server — not from you. We don't log or store the query.
        </p>
        <p>
          Suggestions come from DuckDuckGo's autocomplete, never from your history.
          The knowledge panel on results pages uses Wikipedia's public API.
        </p>
      </section>

      <section className="detail-section">
        <h2>What we do store</h2>
        <ul className="detail-list">
          <li>Your light/dark theme preference — saved in your own browser, it stays on your device.</li>
          <li>Anonymous hosting logs from Netlify — standard server logs with no search data attached.</li>
        </ul>
      </section>

      <section className="detail-section">
        <h2>What about DuckDuckGo?</h2>
        <p>
          Pokdex Search isn't DuckDuckGo, and we can't guarantee what any third-party engine keeps.
          DuckDuckGo states it doesn't track you — you can read its privacy policy for the details.
          If an engine ever misbehaves, we'll stop using it.
        </p>
      </section>

      <section className="detail-section detail-cta">
        <p><strong>In short:</strong> your searches are yours. Browsing in private stays private.</p>
        <a className="cta cta-primary" href="/">Search privately</a>
      </section>
    </>
  );
}

function AboutPage() {
  return (
    <>
      <section className="detail-hero">
        <h1>About Pokdex Search</h1>
        <p className="detail-lede">
          A small, fast, privacy-first search page with a Pokédex-sized personality.
          It looks playful, but it's serious about leaving no trail.
        </p>
      </section>

      <section className="detail-section">
        <h2>Why it exists</h2>
        <p>
          Most search experiences are built to watch you: track clicks, build a profile, feed you ads.
          Pokdex Search flips that. There's no account, no history, and no filter bubble —
          everyone gets the same results for the same query.
        </p>
      </section>

      <section className="detail-section">
        <h2>How it works</h2>
        <ul className="detail-list">
          <li>Your query goes to our server, which fetches results from DuckDuckGo with a Bing fallback.</li>
          <li>Ad links and redirect wrappers are stripped, so you go straight to the page you wanted.</li>
          <li>A Wikipedia knowledge box appears beside results when a matching article exists.</li>
          <li>Suggestions are powered by DuckDuckGo's public autocomplete.</li>
        </ul>
      </section>

      <section className="detail-section">
        <h2>The name</h2>
        <p>
          “Pokdex” nods to the Pokédex — a catalogue that fills in as you discover. Every search is
          a fresh page in your own private catalog, and none of it is ever written down.
        </p>
      </section>

      <section className="detail-section">
        <h2>Built with</h2>
        <p>
          React + Vite + TypeScript on the front end, Node.js serverless functions on Netlify.
          The whole project is open source and lives on GitHub — read it, run it, improve it.
        </p>
        <ul className="detail-list detail-links">
          <li>
            <a href="https://github.com/shafiathusssain-cell/pipi-search" target="_blank" rel="noopener noreferrer">
              github.com/shafiathusssain-cell/pipi-search
            </a>
          </li>
        </ul>
      </section>

      <section className="detail-section">
        <h2>Not affiliated</h2>
        <p>
          Pokdex Search is an original project and isn't affiliated with, endorsed by, or connected to
          Nintendo, The Pokémon Company, or Game Freak. The name and Poké Ball-style badge are this
          project's own playful take — Pokédex and Pokémon belong to their respective owners.
        </p>
      </section>

      <section className="detail-section detail-cta">
        <a className="cta cta-primary" href="/">Start a private search</a>
      </section>
    </>
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

  const path = window.location.pathname;
  const page: 'home' | 'results' | 'privacy' | 'about' =
    path === '/privacy' ? 'privacy' : path === '/about' ? 'about' : query ? 'results' : 'home';
  const view = query ? 'results' : 'home';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('pipi-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (page === 'privacy') document.title = 'Privacy - Pokdex Search';
    else if (page === 'about') document.title = 'About - Pokdex Search';
    else document.title = query ? `${query} - Pokdex Search` : "Pokdex Search - the search engine that doesn't track you";
  }, [page, query]);

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
    function handleAnchorClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute('href')?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      try {
        history.replaceState(null, '', `#${id}`);
      } catch {
        // ignore
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.classList.add('anchor-flash');
      window.setTimeout(() => target.classList.remove('anchor-flash'), 1250);
      const previousTabIndex = target.getAttribute('tabindex');
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      if (previousTabIndex === null) target.removeAttribute('tabindex');
    }
    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
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

  if (page === 'privacy') {
    return (
      <DetailShell theme={theme} onToggle={toggleTheme}>
        <PrivacyPage />
      </DetailShell>
    );
  }

  if (page === 'about') {
    return (
      <DetailShell theme={theme} onToggle={toggleTheme}>
        <AboutPage />
      </DetailShell>
    );
  }

  if (view === 'home') {
    return (
      <div className="pipi-home">
        <header className="home-top">
          <button className="home-logo" onClick={goHome} aria-label="Pokdex Search home">
            <Logo size="sm" />
          </button>
          <nav className="home-nav">
            <a href="/privacy" className="home-link">
              <Shield size={14} />
              Privacy, simplified
            </a>
            <div className="home-nav-secondary">
              <a href="/about" className="home-link">About</a>
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
              <a href="/about">About Pokdex Search</a>
              <a href="/privacy">Privacy</a>
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
          <a href="/privacy" className="home-link"><Shield size={14} /> Private</a>
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
          <a href="/privacy">Privacy</a>
          <span>© {new Date().getFullYear()} Pokdex Search</span>
        </footer>
      </main>
    </div>
  );
}