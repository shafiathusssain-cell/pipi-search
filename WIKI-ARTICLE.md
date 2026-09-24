# Pokdex Search — ready-to-paste Wikipedia article (full version)

Works on **Fandom** and **Miraheze** (MediaWiki). If you are editing English Wikipedia,
re-read the tips at the bottom first — this draft is intended for a community/Fandom/Miraheze
wiki, not Wikipedia proper.

## Step 1 — upload the screenshots

Upload these 3 PNG files (name them exactly as shown, capitals included) so the
`[[File:...]]` markup below resolves:

| Upload as | File location |
|-----------|---------------|
| `Pokdex-home-light.png` | `public/screenshots/home-light.png` |
| `Pokdex-home-dark.png` | `public/screenshots/home-dark.png` |
| `Pokdex-results.png` | `public/screenshots/results.png` |

Live copies for reference:
- https://pookdex.netlify.app/screenshots/home-light.png
- https://pookdex.netlify.app/screenshots/home-dark.png
- https://pookdex.netlify.app/screenshots/results.png

## Step 2 — paste the article

```wikitext
{{Infobox website
| name = Pokdex Search
| logo = Pokdex-home-light.png
| logo_size = 140px
| screenshot = Pokdex-results.png
| screenshot_size = 300px
| caption = Results page with a Wikipedia knowledge panel
| url = {{URL|www.pokdex.co.uk}}
| commercial = No
| slogan = The search engine that doesn't track you
| type = Search engine
| registration = None
| languages = English
| owner = Shafiat Hussain
| author = Shafiat Hussain
| launch_date = {{start date and age|2026}}
| current_status = Active
}}

'''Pokdex Search''' is a free and open-source [[search engine|web search engine]] that
emphasizes privacy, ad-free result pages, and a playful Pokémon-inspired identity. It made no
accounts, stores no search history, and runs every query from its own server so that the
underlying search provider never receives the visitor's IP address. Results are drawn from
[[DuckDuckGo]]'s index by default, with an automatic fallback to [[Microsoft Bing|Bing]] when
DuckDuckGo is unreachable, and a [[Wikipedia]] knowledge panel appears beside queries that
match a Wikipedia article. The service is a single-page web application built with
[[React (JavaScript library)|React]] and [[TypeScript]], deployed on [[Netlify]], with its
source code published on [[GitHub]]. The wordmark and the magnifier-inside-a-Poké-Ball badge
are an homage to the [[Pokédex]] from the [[Pokémon]] franchise; the project is independent of
and not affiliated with Nintendo, The Pokémon Company, or Game Freak.

== Overview ==
Pokdex Search positions itself as an answer to surveillance-style search, in which every click
is tracked, profiled, and re-sold as advertising. The homepage is intentionally sparse: a
centered search pill, a large orange search button, and shortcut chips for popular queries such
as news, weather, movies, recipes, travel, and jobs. There is no sign-up, no dashboard, and no
profile to manage — the product is simply the search itself.

The service describes three core promises: no tracking, no saved history, and no ad profile.
Because queries are executed server-side, the search engine observes the question but cannot
associate it with the asking user; the site therefore behaves, from the engine's point of view,
as a single highly active user rather than as each visitor individually.

== History ==
The project began in early 2026 as '''pipi search''', a DuckDuckGo-inspired homepage whose
defining feature — a server-side proxy that scrapes DuckDuckGo's HTML index — was present from
the first version, together with live search suggestions, light and dark themes, and an
"I'm Feeling Lucky" shortcut.

It was first renamed '''Pikachuu Search''', gaining a custom domain registered as
<code>pikachuu.co.uk</code> and verification through Google Search Console, which gave the
project a public address and early crawl traffic. The second rebrand produced the current
identity, '''Pokdex Search''', which introduced the Poké Ball-and-lens badge, the brand orange
color (<code>#f46308</code>), ad-link removal, a Wikipedia knowledge panel, and a set of
documentation pages (Wiki, About, Privacy). The canonical address moved to
<code>www.pokdex.co.uk</code>.

== Features ==
* '''Private by default''' — no account required, no tracking cookies, no analytics.
* '''Server-side proxying''' — queries run on the site's own servers, concealing the visitor's
  IP from the upstream engine.
* '''Ad-free results''' — advertisements and redirect wrappers are removed before the results
  are rendered.
* '''Live search suggestions''' — DuckDuckGo-powered autocomplete while typing.
* '''Wikipedia knowledge panel''' — a summary box with thumbnails and links beside matching
  queries.
* '''AI answers''' — an optional panel, powered by [[Google Gemini]], that writes a concise
  answer above the organic results.
* '''Light and dark themes''' — remembered locally, defaulting to the system preference.
* '''Shareable deep links''' — every search is a plain URL (<code>/?q=…</code>) with working
  browser back/forward navigation.
* '''Full result URLs''' — each result shows its real destination address rather than a
  shortened label.

== How it works ==
The browser sends the query to a [[serverless computing|serverless function]] at
<code>/api/search</code>. The server requests DuckDuckGo's HTML index, falling back to
DuckDuckGo Lite and then Bing if needed, parses the returned HTML into structured results
(title, URL, snippet, favicon), and discards ad links and redirect wrappers. In parallel, a
Wikipedia lookup supplies the knowledge panel when a matching article exists. The front end
renders the results, knowledge box, and pagination from JSON, and the visitor's IP, user agent,
and query history are never retained.

Because the browser cannot call DuckDuckGo directly (due to [[cross-origin resource sharing]]
restrictions), the proxy converts a technical limitation into a privacy feature: the upstream
engine sees a single shared server address rather than individual visitors.

== Technology ==
The front end is a React single-page application written in TypeScript and bundled with Vite,
styled with hand-written CSS variables that implement the light and dark themes. Search
scraping, suggestions, and the Wikipedia and AI lookups run as Node.js serverless functions on
Netlify. Pages are served with <code>no-cache</code> cache headers and a pass-through service
worker that never caches content, so updates land immediately. Continuous deployment rebuilds
and ships the site automatically on every push. The production bundle ships at roughly
200&nbsp;KB raw (~62&nbsp;KB gzipped) with no third-party requests on the homepage.

== Privacy and security ==
The privacy model rests on eight concrete properties: no accounts; no tracking cookies (the
only stored value is a local theme preference); no analytics or session replay; server-side
proxying of every query; no stored history; open-source code that anyone can audit; no-log
serverless functions; and hosting infrastructure that is not used to fingerprint visitors. The
documentation also states the honest limits of the model: DuckDuckGo or Bing observe the query
itself, but they cannot tie it to the asking user.

== Design and branding ==
The visual identity fuses search and Pokédex: a magnifying glass merged with a Poké Ball,
reading as "a Pokédex for the whole web". The wordmark sets a blocky uppercase POKDEX against
a lighter italic SEARCH, evoking the Pokédex display. The layout follows DuckDuckGo's calm,
airy style — a centered search pill, generous whitespace, and a sparse homepage — while the
brand orange (<code>#f46308</code>) differentiates it. Screenshots of the interface are shown
below.

== Screenshots ==
[[File:Pokdex-home-light.png|thumb|thumb|left|300px|The Pokdex Search home page in the light theme]]
[[File:Pokdex-home-dark.png|thumb|300px|The Pokdex Search home page in the dark theme]]
[[File:Pokdex-results.png|thumb|300px|Results page showing organic links and the Wikipedia knowledge panel]]
The home page centers a single search pill with a large orange search button and shortcut chips
for common queries. The results layout follows the two-column pattern popularized by
DuckDuckGo: organic results with favicons, full URLs, and snippets run down the left, while a
Wikipedia knowledge panel (and, when enabled, an AI answer box) occupies the right. Dark mode
uses the same components with a single data-theme switch.
{{-}}

== See also ==
* [[DuckDuckGo]]
* [[Search engine privacy]]
* [[Startpage]]
* [[Internet privacy]]

== References ==
{{reflist}}
```

## Step 3 — reference links you can cite

If you add a References section with inline citations, the following are the primary sources
(the site's own pages and code):
- Live site — https://www.pokdex.co.uk
- Wiki/about/privacy pages — https://www.pokdex.co.uk/wiki, https://www.pokdex.co.uk/about, https://www.pokdex.co.uk/privacy
- Source code — https://github.com/shafiathusssain-cell/pipi-search
- Netlify-hosted copy — https://pookdex.netlify.app

Examples (MediaWiki syntax):
```wikitext
<ref>{{cite web |url=https://www.pokdex.co.uk |title=Pokdex Search homepage |access-date=...}}</ref>
<ref>{{cite web |url=https://github.com/shafiathusssain-cell/pipi-search |title=Pokdex Search source code on GitHub}}</ref>
```

## Tips before publishing on Wikipedia itself
- Wikipedia requires [[wp:notability|notability]]: significant, independent, reliable coverage
  (news articles, reviews). With none published yet, a Wikipedia article will be deleted —
  this draft is intended for Fandom/Miraheze or a project wiki instead.
- Declare the conflict of interest on your user page ("I created this site") if publishing on
  any community wiki.
- Upload the screenshots as your own work (<code>{{Own work}}</code>) — they are captures of
  your own site.