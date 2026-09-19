import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  LoaderCircle,
  Moon,
  Shield,
  Sparkles,
  Sun,
} from 'lucide-react';
import SearchField from '@/components/SearchField';
import { fetchAi, fetchResults, fetchWiki, type SearchResult, type WikiPanel } from '@/lib/api';

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

function AiBox({ query }: { query: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const ctrl = new AbortController();
    setState('loading');
    setAnswer('');
    setError('');
    fetchAi(query, ctrl.signal)
      .then((payload) => {
        if (payload.error) {
          setError(payload.error);
          setState('error');
        } else if (payload.answer) {
          setAnswer(payload.answer);
          setState('ready');
        } else {
          setError('AI returned an empty answer. Try rephrasing the question.');
          setState('error');
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('AI is unavailable right now.');
        setState('error');
      });
    return () => ctrl.abort();
  }, [query]);

  return (
    <aside className="ai-box" aria-label="AI answer">
      <div className="ai-head">
        <Sparkles size={15} />
        <span className="ai-brand">AI Answer</span>
        <span className="ai-provider">Powered by Google Gemini</span>
      </div>

      {state === 'loading' && (
        <div className="ai-loading" role="status" aria-label="Generating AI answer">
          <span />
          <span />
          <span />
        </div>
      )}

      {state === 'ready' && (
        <div className="ai-text">
          {answer.split(/\n{2,}/).map((paragraph, index) => {
            const parts = paragraph
              .split(/(\*\*.*?\*\*)/g)
              .filter(Boolean)
              .map((part, j) =>
                part.startsWith('**') && part.endsWith('**') ? (
                  <strong key={j}>{part.slice(2, -2)}</strong>
                ) : (
                  part
                ),
              );
            return (
              <p key={index}>
                {parts.length === 0 ? null : parts}
              </p>
            );
          })}
        </div>
      )}

      {state === 'error' && <p className="ai-error">{error}</p>}

      <p className="ai-disclaimer">AI-generated answer — always verify with the results above.</p>
    </aside>
  );
}

function DetailShell({ theme, onToggle, wide, children }: { theme: Theme; onToggle: () => void; wide?: boolean; children: ReactNode }) {
  return (
    <div className="pipi-home detail-page">
      <header className="home-top">
        <a className="home-logo" href="/" aria-label="Pokdex Search home">
          <Logo size="sm" />
        </a>
        <nav className="home-nav">
          <div className="home-nav-secondary detail-nav">
            <a className="home-link" href="/">Home</a>
            <a className="home-link" href="/wiki">Wiki</a>
            <a className="home-link" href="/about">About</a>
            <a className="home-link" href="/privacy">Privacy</a>
            <ThemeToggle theme={theme} onToggle={onToggle} />
          </div>
        </nav>
      </header>
      <main className={wide ? 'detail-main wiki-main' : 'detail-main'}>{children}</main>
      <footer className="home-footer">
        <div className="footer-inner">
          <nav className="footer-links">
            <a href="/wiki">Wiki</a>
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

      <section className="detail-section wiki-infobox">
        <h2>Quick facts</h2>
        <dl className="infobox">
          <div><dt>Name</dt><dd>Pokdex Search</dd></div>
          <div><dt>Type</dt><dd>Private web search</dd></div>
          <div><dt>Powered by</dt><dd>DuckDuckGo (Bing fallback)</dd></div>
          <div><dt>Built with</dt><dd>React · Vite · TypeScript</dd></div>
          <div><dt>Hosted on</dt><dd>Netlify</dd></div>
          <div><dt>Available at</dt><dd><a href="https://www.pokdex.co.uk" target="_blank" rel="noopener noreferrer">www.pokdex.co.uk</a></dd></div>
          <div><dt>Source</dt><dd><a href="https://github.com/shafiathusssain-cell/pipi-search" target="_blank" rel="noopener noreferrer">github.com/shafiathusssain-cell/pipi-search</a></dd></div>
        </dl>
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
        <h2>Screenshots</h2>
        <div className="screenshots">
          <figure>
            <a href="/screenshots/home-light.png" target="_blank" rel="noopener noreferrer">
              <img src="/screenshots/home-light.png" alt="Pokdex Search home page" loading="lazy" />
            </a>
            <figcaption>The Pokdex Search home page</figcaption>
          </figure>
          <figure>
            <a href="/screenshots/results.png" target="_blank" rel="noopener noreferrer">
              <img src="/screenshots/results.png" alt="Pokdex Search results with Wikipedia knowledge panel" loading="lazy" />
            </a>
            <figcaption>Results page with the Wikipedia knowledge panel</figcaption>
          </figure>
        </div>
      </section>

      <section className="detail-section">
        <h2>Features</h2>
        <ul className="detail-list">
          <li>Private by default — no account, no cookies, no tracking.</li>
          <li>Clean, ad-free results with redirect wrappers removed.</li>
          <li>Live search suggestions as you type.</li>
          <li>Wikipedia knowledge panel next to matching results.</li>
          <li>Light and dark themes.</li>
          <li>Bing automatic fallback if DuckDuckGo is unavailable.</li>
        </ul>
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
        <h2>Links</h2>
        <ul className="detail-list detail-links">
          <li><a href="https://www.pokdex.co.uk" target="_blank" rel="noopener noreferrer">Live site — www.pokdex.co.uk</a></li>
          <li><a href="https://github.com/shafiathusssain-cell/pipi-search" target="_blank" rel="noopener noreferrer">Source code on GitHub</a></li>
          <li><a href="/privacy">Privacy policy</a></li>
          <li><a href="https://pookdex.netlify.app" target="_blank" rel="noopener noreferrer">Netlify copy — pookdex.netlify.app</a></li>
          <li><a href="https://html.duckduckgo.com/html/" target="_blank" rel="noopener noreferrer">DuckDuckGo — results index</a></li>
          <li><a href="https://en.wikipedia.org" target="_blank" rel="noopener noreferrer">Wikipedia — knowledge panel</a></li>
        </ul>
      </section>

      <section className="detail-section">
        <h2>Frequently asked questions</h2>
        <details>
          <summary>Is Pokdex Search really private?</summary>
          <p>Yes. There are no accounts, no cookies, and no tracking scripts. Searches are made from our server, not your browser, and we don't store them.</p>
        </details>
        <details>
          <summary>Do you save my searches?</summary>
          <p>No. We never log search terms, IP addresses, or click history. Only your light/dark theme preference is saved, and it stays in your own browser.</p>
        </details>
        <details>
          <summary>Which search engines do you use?</summary>
          <p>Results come from DuckDuckGo's index. If DuckDuckGo is unreachable, we automatically fall back to Bing.</p>
        </details>
        <details>
          <summary>Can I use it on my phone?</summary>
          <p>Yes. The site is responsive and works on any modern browser, desktop or mobile.</p>
        </details>
        <details>
          <summary>Is it free?</summary>
          <p>Yes — free to use, with no sign-up. The project is open source under a permissive license.</p>
        </details>
        <details>
          <summary>Why is it called Pokdex?</summary>
          <p>“Pokdex” is a nod to the Pokédex: a catalogue that fills in as you discover. Here each search is catalogued only in your memory — never written down.</p>
        </details>
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

function CopyButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText('https://www.pokdex.co.uk');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <button type="button" className="share-btn share-link" onClick={copy}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10.6 13.4a5.2 5.2 0 0 0 7.4.4l2.2-2.2a5.2 5.2 0 0 0-7.4-7.4l-1.5 1.5" />
        <path d="M13.4 10.6a5.2 5.2 0 0 0-7.4-.4l-2.2 2.2a5.2 5.2 0 0 0 7.4 7.4l1.5-1.5" />
      </svg>
      {copied ? 'Link copied!' : 'Copy link'}
    </button>
  );
}

function ShareButtons() {
  const shareUrl = 'https://www.pokdex.co.uk';
  const text = `Pokdex Search — the private search engine that doesn't track you`;
  const enc = encodeURIComponent;

  return (
    <div className="share-bar">
      <span className="share-label">Share</span>
      <a
        className="share-btn"
        href={`https://wa.me/?text=${enc(`${text} ${shareUrl}`)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        WhatsApp
      </a>
      <a
        className="share-btn"
        href={`https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        Facebook
      </a>
      <a
        className="share-btn"
        href={`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        X
      </a>
      <a
        className="share-btn"
        href={`https://t.me/share/url?url=${enc(shareUrl)}&text=${enc(text)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
        Telegram
      </a>
      <CopyButton />
      <button type="button" className="share-btn share-link" onClick={() => window.print()}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9V3h12v6" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <path d="M6 14h12v8H6z" />
        </svg>
        Save as PDF
      </button>
    </div>
  );
}

const WIKI_TOC = [
  { id: 'wiki-overview', label: 'Overview' },
  { id: 'wiki-history', label: 'History' },
  { id: 'wiki-design', label: 'Design and branding' },
  { id: 'wiki-screenshots', label: 'Screenshots' },
  { id: 'wiki-features', label: 'Features' },
  { id: 'wiki-privacy', label: 'Privacy model' },
  { id: 'wiki-how', label: 'How the engine works' },
  { id: 'wiki-tech', label: 'Technology' },
  { id: 'wiki-performance', label: 'Performance and availability' },
  { id: 'wiki-faq', label: 'FAQ' },
  { id: 'wiki-seealso', label: 'See also' },
  { id: 'wiki-references', label: 'References' },
];

function WikiPage() {
  return (
    <>
      <div className="article-layout">
        <nav className="wiki-toc" aria-label="Wiki contents">
          <span className="toc-title">Contents</span>
          <ol>
            {WIKI_TOC.map((item) => (
              <li key={item.id}><a href={`#${item.id}`}>{item.label}</a></li>
            ))}
          </ol>
        </nav>

        <article className="article-body">
          <header className="article-title">
            <h1 id="wiki-overview">Pokdex Search</h1>
            <p className="article-lede">From Pokdex, the search encyclopedia</p>
            <aside className="article-infobox">
              <h3>Pokdex Search</h3>
              <dl>
                <div><dt>Type</dt><dd>Private web search</dd></div>
                <div><dt>Founded</dt><dd>2026</dd></div>
                <div><dt>Engine</dt><dd>DuckDuckGo, Bing fallback</dd></div>
                <div><dt>Written in</dt><dd>TypeScript</dd></div>
                <div><dt>Front end</dt><dd>React · Vite</dd></div>
                <div><dt>Host</dt><dd>Netlify</dd></div>
                <div><dt>URL</dt><dd><a href="https://www.pokdex.co.uk" target="_blank" rel="noopener noreferrer">www.pokdex.co.uk</a></dd></div>
                <div><dt>Source</dt><dd><a href="https://github.com/shafiathusssain-cell/pipi-search" target="_blank" rel="noopener noreferrer">GitHub</a></dd></div>
              </dl>
            </aside>
          </header>

          <p>
            <strong>Pokdex Search</strong> is a private, ad-free web search engine presented as a
            single-page web application. It keeps no accounts, stores no search history, and makes
            every query from its own server so third-party search engines never see the visitor's IP.
            The service fetches results from DuckDuckGo with an automatic Bing fallback and shows a
            Wikipedia knowledge panel beside matching results. The name and Poké Ball-style badge are
            a playful nod to the Pokédex from the Pokémon franchise. The project is open source.
          </p>

          <p>
            Because queries are run server-side, Pokdex Search behaves like the search engine's own
            user: nobody upstream can tell who is asking. There is no logging, no analytics, and the
            only thing stored on a visitor's device is a single local preference for the theme. The
            project was built to counter the modern pattern of surveillance-style search — where
            every click is tracked, profiled, and re-sold as ad inventory — with a small, fast page
            that simply answers the question asked.
          </p>

          <ShareButtons />

          <section id="wiki-history">
            <h2>History</h2>
            <ul className="timeline">
              <li><strong>Early 2026 — pipi search (v0).</strong> The project began as a DuckDuckGo-inspired homepage with a distinctive <em>pipi</em> logo. The core idea shipped on day one: a server-side proxy that scrapes DuckDuckGo's HTML endpoints so the browser never talks to a tracking search engine directly. The first build already included live suggestions, light/dark themes, and an "I'm Feeling Lucky" shortcut.</li>
              <li><strong>2026 — Pikachuu Search.</strong> First rebrand. A custom domain (<code>pikachuu.co.uk</code>) was registered and verified with Google Search Console, giving the project a real public address and its first organic crawl traffic. The visual identity moved toward the Pokémon-inspired motif that later became Pokdex.</li>
              <li><strong>2026 — Pokdex Search.</strong> The current name and identity. The Poké Ball-and-magnifier badge and the blocky <code>POKDEX SEARCH</code> wordmark replaced the earlier artwork, and a cleaner brand orange (<code>#f46308</code>) was set. This release added the Wikipedia knowledge panel, ad-link stripping, the Wiki / About / Privacy detail pages, and moved the canonical address to <code>www.pokdex.co.uk</code>.</li>
            </ul>
          </section>

          <section id="wiki-design">
            <h2>Design and branding</h2>
            <p>
              The identity is a playful fusion of search and Pokédex. The logo fuses a magnifying
              glass with a Poké Ball-style badge — the red dome, the white sweep, the central ring —
              marking the brand as "a Pokédex for the whole web". The wordmark sets a blocky
              uppercase <strong>POKDEX</strong> against a lighter italic <em>SEARCH</em>, echoing the
              pitch of the Pokédex display while reading clearly as a search engine.
            </p>
            <p>
              The interface follows DuckDuckGo's calm, airy layout: a centered search pill with a
              large red-orange search button, generous whitespace, and a sparse homepage. The brand
              color is a warm orange (<code>#f46308</code>), and the whole theme is defined through
              CSS variables, so the same components switch between light and dark schemes with a
              single data attribute. Users choose a theme once; the choice is remembered locally, and
              the default respects the operating system's preference. The favicon doubles as the
              share icon on every page, and each detail page carries the same header-and-footer
              rhythm for a consistent, low-noise reading experience.
            </p>
          </section>

          <section id="wiki-screenshots">
            <h2>Screenshots</h2>
            <p>Captured live from the production site (Netlify copy):</p>
            <div className="screenshots article-screens">
              <figure>
                <a href="/screenshots/home-light.png" target="_blank" rel="noopener noreferrer">
                  <img src="/screenshots/home-light.png" alt="Pokdex Search home page in light theme" loading="lazy" />
                </a>
                <figcaption>Home page, light theme</figcaption>
              </figure>
              <figure>
                <a href="/screenshots/home-dark.png" target="_blank" rel="noopener noreferrer">
                  <img src="/screenshots/home-dark.png" alt="Pokdex Search home page in dark theme" loading="lazy" />
                </a>
                <figcaption>Home page, dark theme</figcaption>
              </figure>
              <figure>
                <a href="/screenshots/results.png" target="_blank" rel="noopener noreferrer">
                  <img src="/screenshots/results.png" alt="Pokdex Search results with Wikipedia knowledge panel" loading="lazy" />
                </a>
                <figcaption>Results page with the Wikipedia knowledge panel</figcaption>
              </figure>
            </div>
            <p className="article-note">
              The screenshots show the two-column results layout: organic links on the left and the
              Wikipedia knowledge panel anchored to the right with a matching article.
            </p>
          </section>

          <section id="wiki-features">
            <h2>Features</h2>
            <ul className="detail-list">
              <li>Private by default — no account, no cookies, no tracking.</li>
              <li>Clean, ad-free results with redirect wrappers stripped server-side.</li>
              <li>Live search suggestions shown as you type (DuckDuckGo-powered).</li>
              <li>Wikipedia knowledge panel beside organically matching results.</li>
              <li>Light and dark themes, remembered locally per device.</li>
              <li>“I'm Feeling Lucky” shortcut that jumps straight to the top result.</li>
              <li>Bing automatic fallback if DuckDuckGo is unreachable.</li>
              <li>Favicons enriched onto every result for quick visual scanning.</li>
              <li>Shareable deep links — <code>/?q=javascript</code> restores any search, and back/forward works.</li>
              <li>Pagination without reloading, preserving the page state.</li>
            </ul>
            <p>
              Two of these deserve emphasis. The <strong>knowledge panel</strong> runs an extra
              Wikipedia API lookup: when the query resembles an article title, a box appears with a
              summary, an image, and a link, so close-but-unclear queries still land somewhere
              useful. And the <strong>server-side proxy</strong> is the heart of the privacy story —
              the browser hands the query to Pokdex, and Pokdex does the searching; the upstream
              engine never sees the visitor's address.
            </p>
          </section>

          <section id="wiki-privacy">
            <h2>Privacy model</h2>
            <ul className="detail-list">
              <li><strong>No accounts.</strong> There is nothing to sign up for and nothing to log in to.</li>
              <li><strong>No tracking cookies.</strong> The only stored value is a theme preference in <code>localStorage</code>; it never leaves the device.</li>
              <li><strong>No analytics.</strong> The site ships without Google Analytics, without session replay, without ad beacons of any kind.</li>
              <li><strong>Server-side proxying.</strong> Every query is executed from Pokdex's own server function, so the upstream engine sees one shared IP — never the visitor's.</li>
              <li><strong>No history.</strong> Searches appear only in the URL bar and are wiped when you close the tab or clear the URL.</li>
              <li><strong>Open source.</strong> The code is public on GitHub, so the "no tracking" claim can be inspected rather than trusted.</li>
              <li><strong>No-log functions.</strong> The serverless functions return results but retain nothing about who asked or what was asked.</li>
              <li><strong>Termination-respecting.</strong> Serving happens on Netlify's infrastructure, which is never used to fingerprint visitors.</li>
            </ul>
            <p>
              It is worth stating the honest limits: Pokdex makes a request to DuckDuckGo or Bing on
              your behalf, and those services may observe the query itself. What they cannot do is
              tie that query to you. The trade — handing over the question but shielding the asker —
              is the same trade DuckDuckGo and Startpage advertise, and it happens free of charge,
              because there is no company selling the answers.
            </p>
          </section>

          <section id="wiki-how">
            <h2>How the engine works</h2>
            <ol className="detail-list wiki-ordered">
              <li>The browser sends the query to Pokdex Search's serverless function (<code>/api/search</code>).</li>
              <li>The server requests DuckDuckGo's HTML index (falling back to DuckDuckGo Lite, then Bing).</li>
              <li>The response HTML is parsed into structured results: title, URL, snippet, favicon.</li>
              <li>Ad links and DuckDuckGo redirect wrappers are filtered out, leaving clean destination URLs.</li>
              <li>In parallel, a Wikipedia search finds the closest matching article for the query.</li>
              <li>If a match exists, the article summary and thumbnail are pulled from the Wikipedia API.</li>
              <li>Results are returned as JSON; the front end renders the list, knowledge box, and pagination.</li>
              <li>Nothing about the visitor — IP, user agent, or query history — is stored at any point.</li>
            </ol>
            <p>
              The browser can't call DuckDuckGo directly because of CORS, which is exactly why the
              proxy exists: it converts a front-end-only limitation into a privacy feature. In
              development the proxy runs as a Vite middleware; in production it becomes a Netlify
              Function reaching the exact same code paths through <code>netlify.toml</code>'s
              <code>config.path</code> for <code>/api/*</code>.
            </p>
          </section>

          <section id="wiki-tech">
            <h2>Technology</h2>
            <p>
              The front end is a React 18 single-page application written in TypeScript and bundled
              with Vite, with hand-written CSS variables driving the theme system — no UI framework,
              no heavyweight dependencies. Search proxying, suggestions, and the Wikipedia lookup are
              Node.js serverless functions on Netlify (<code>netlify/functions/ddg.mjs</code> for the
              scrapers, <code>search.mjs</code> for the API handler). The single-page bundle stays
              around 57&nbsp;KB gzipped, keeping first paint fast even on slow connections.
            </p>
            <p>
              Supporting pieces: a pass-through service worker that never caches content (so updates
              land immediately), <code>Cache-Control</code> headers that tell CDNs and browsers the
              page must be revalidated on every visit, a static <code>sitemap.xml</code> and
              <code>robots.txt</code> for crawlers, and Netlify's worldwide CDN for edge delivery.
              Development is scripted end-to-end — <code>npm run typecheck</code>,
              <code>npm run lint</code>, <code>npm run build</code>, then a one-command
              <code>netlify deploy --prod</code> that ships to the live site.
            </p>
            <p>Code: <a href="https://github.com/shafiathusssain-cell/pipi-search" target="_blank" rel="noopener noreferrer">github.com/shafiathusssain-cell/pipi-search</a></p>
          </section>

          <section id="wiki-performance">
            <h2>Performance and availability</h2>
            <p>
              Pokdex Search is a static SPA delivered from Netlify's CDN, which means the shell loads
              instantly from wherever the visitor is closest to in the world; the only network work
              after that is the single <code>/api/search</code> call. The production bundle is under
              200&nbsp;KB raw (about 57&nbsp;KB gzipped), and the homepage needs no font downloads
              and no third-party requests — a single orange favicon apart. Results render client-side
              within a few hundred milliseconds of the API response, and pagination depth is
              preserved in the URL (<code>&amp;s=…</code>) so browsing feels continuous.
            </p>
            <p>
              For availability, the site runs on Netlify's global edge network with automatic TLS and
              continuous deployment: every push triggers a build, and every build that passes lands
              on the same URL. Because pages are served with <code>no-cache</code> headers and the
              service worker is deliberately stateless, users never get stuck on stale versions after
              an update — a deliberate choice over aggressive caching. The upstream search engines
              may occasionally block or rate-limit the shared server IP; the DuckDuckGo → Lite → Bing
              ladder swallows most of those cases and the API reports which source served the results.
            </p>
          </section>

          <section id="wiki-faq">
            <h2>FAQ</h2>
            <details>
              <summary>Is Pokdex Search really private?</summary>
              <p>Yes. No accounts, no tracking cookies, no analytics, and no stored searches. Queries are made from the site's server, not your browser, so the search engine never sees your IP.</p>
            </details>
            <details>
              <summary>Where do the results come from?</summary>
              <p>From DuckDuckGo's index by default. If DuckDuckGo is unavailable, results automatically fall back to Bing.</p>
            </details>
            <details>
              <summary>Does it cost anything?</summary>
              <p>No. It is free and open source under the MIT license.</p>
            </details>
            <details>
              <summary>Why the name “Pokdex”?</summary>
              <p>It fuses “Pokédex” — the encyclopedia that identifies any creature — with “index” and “search”. The badge is a magnifier merged into a Poké Ball as a playful tribute, not a licensed product.</p>
            </details>
            <details>
              <summary>How are ads removed?</summary>
              <p>Server-side. The results parser recognizes DuckDuckGo ad blocks and redirect-wrapped ad links and drops them before anything reaches the browser, leaving only organic results.</p>
            </details>
            <details>
              <summary>What does the knowledge panel do?</summary>
              <p>When your query matches a Wikipedia article, a sidebar box appears beside the results with a short summary, a thumbnail, and a link to the full article — handy for people, places, and Pokémon.</p>
            </details>
            <details>
              <summary>Is there a mobile app?</summary>
              <p>No native app, but the site is fully responsive and can be installed as a homescreen shortcut from the browser's menu on any phone or tablet.</p>
            </details>
            <details>
              <summary>Can I host my own copy?</summary>
              <p>Yes. Clone the repo, run <code>npm install</code> and <code>npm run dev</code>, and you have your own private search endpoint. The license is MIT.</p>
            </details>
            <details>
              <summary>Is Pokdex Search affiliated with Pokémon?</summary>
              <p>No. It is an independent open-source project. Pokémon, the Pokédex, and related marks belong to their respective owners.</p>
            </details>
          </section>

          <section id="wiki-seealso">
            <h2>See also</h2>
            <ul className="refs">
              <li><a href="/about">About Pokdex Search</a></li>
              <li><a href="/privacy">Privacy — details of the no-tracking model</a></li>
              <li><a href="/">Home — start a private search</a></li>
            </ul>
            <p className="article-note">
              Related privacy-first choices: <a href="https://duckduckgo.com" target="_blank" rel="noopener noreferrer">DuckDuckGo</a>,
              <a href="https://search.brave.com" target="_blank" rel="noopener noreferrer">Brave Search</a>, and
              <a href="https://www.startpage.com" target="_blank" rel="noopener noreferrer">Startpage</a>.
            </p>
          </section>

          <section id="wiki-references">
            <h2>References</h2>
            <ul className="refs">
              <li>Live site — <a href="https://www.pokdex.co.uk" target="_blank" rel="noopener noreferrer">www.pokdex.co.uk</a></li>
              <li>Source code — <a href="https://github.com/shafiathusssain-cell/pipi-search" target="_blank" rel="noopener noreferrer">github.com/shafiathusssain-cell/pipi-search</a></li>
              <li>Netlify copy — <a href="https://pookdex.netlify.app" target="_blank" rel="noopener noreferrer">pookdex.netlify.app</a></li>
              <li>Results index — <a href="https://html.duckduckgo.com/html/" target="_blank" rel="noopener noreferrer">DuckDuckGo</a></li>
              <li>Knowledge panel — <a href="https://en.wikipedia.org" target="_blank" rel="noopener noreferrer">Wikipedia</a></li>
              <li>Hosting — <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer">Netlify</a></li>
            </ul>
          </section>
        </article>
      </div>
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
  const page: 'home' | 'results' | 'privacy' | 'about' | 'wiki' =
    path === '/privacy' ? 'privacy' : path === '/about' ? 'about' : path === '/wiki' ? 'wiki' : query ? 'results' : 'home';
  const view = query ? 'results' : 'home';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('pipi-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (page === 'privacy') document.title = 'Privacy - Pokdex Search';
    else if (page === 'about') document.title = 'About - Pokdex Search';
    else if (page === 'wiki') document.title = 'Pokdex Search wiki';
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

  if (page === 'wiki') {
    return (
      <DetailShell theme={theme} onToggle={toggleTheme} wide>
        <WikiPage />
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
              <a href="/wiki" className="home-link">Wiki</a>
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
              <a href="/wiki">Wiki</a>
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
              <AiBox query={query} />
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