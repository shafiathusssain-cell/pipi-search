# Pokdex Search — ready-to-paste wiki article

Works on **Fandom** and **Miraheze** (both run MediaWiki). Copy the whole article below into the
wiki's editor, then:

1. **Upload the 3 screenshots** first.
   Files are in this repo at `public/screenshots/` (`home-light.png`, `home-dark.png`,
   `results.png`) and on the live site at:
   - https://pookdex.netlify.app/screenshots/home-light.png
   - https://pookdex.netlify.app/screenshots/home-dark.png
   - https://pookdex.netlify.app/screenshots/results.png
   In the editor use **Upload file** to upload each as `Home-light.png`, `Home-dark.png`,
   `Results.png` (they must match the `[[File:...]]` names below, including capital letters).

2. **Paste the article** into the page.

3. Save — done.

---

## Article

```wikitext
{{Infobox website
| name = Pokdex Search
| logo = Home-light.png
| logo_size = 150px
| caption = Pokdex Search home page
| url = {{URL|www.pokdex.co.uk}}
| commercial = No
| type = Search engine
| registration = None
| language = English
| owner = Shafiat Hussain
| author = Shafiat Hussain
| launch_date = 2026
| current_status = Active
}}

'''Pokdex Search''' is a free, open-source [[web search engine]] that presents itself as a
privacy-focused alternative to mainstream search engines. It performs searches from its own
server rather than the visitor's browser, so the search provider never receives the user's
IP address, and it stores no accounts, no search history, and no tracking cookies. Results
are drawn from [[DuckDuckGo]]'s index with an automatic [[Microsoft Bing|Bing]] fallback, and
a [[Wikipedia]] knowledge panel is shown beside matching queries. The name and the Poké
Ball-style badge are a deliberate homage to the ''[[Pokémon]]'' franchise, and the project is
not affiliated with Nintendo, The Pokémon Company, or Game Freak.

== History ==
Pokdex Search began in 2026 as a DuckDuckGo-inspired homepage under the working name
"pipi search". Its core design — a server-side proxy that scrapes DuckDuckGo's HTML endpoints
— was present from the first build, alongside live search suggestions, light and dark themes,
and an "I'm Feeling Lucky" shortcut.

The project was later rebranded to "Pikachuu Search", gaining a custom domain and verification
through Google Search Console. It was then renamed again to its current identity, Pokdex
Search, which added the Poké Ball-and-lens badge, the brand orange color (#f46308), a Wikipedia
knowledge panel, and a set of documentation pages covering the wiki, about, and privacy
details.

== Features ==
* '''Private by default''' — no account, no tracking cookies, and no analytics of any kind.
* '''Server-side proxying''' — queries run on the site's own servers, hiding the visitor's IP
  from the upstream search engine.
* '''Ad-free results''' — advertisements and redirect wrappers are stripped before results are
  rendered.
* '''Live suggestions''' — DuckDuckGo-powered autocomplete as the user types.
* '''Wikipedia knowledge panel''' — a sidebar box with an article summary and links when the
  query matches a Wikipedia article.
* '''AI answers''' — optional Google Gemini–powered answer panel beside the organic results.
* '''Light and dark themes''' — the choice is remembered locally and respects system
  preference.
* '''Shareable deep links''' — every search is addressable via <code>/?q=…</code>, with working
  back/forward navigation.

== How it works ==
The browser sends the query to a [[serverless computing|serverless function]], which requests
DuckDuckGo's HTML index (falling back to DuckDuckGo Lite, then Bing). The returned HTML is
parsed into structured results; ad links and redirect wrappers are discarded. In parallel, a
Wikipedia lookup supplies the knowledge panel when a matching article exists. Because the
browser never talks to DuckDuckGo directly, the engine sees only the shared server address.

The front end is a [[React (JavaScript library)|React]] single-page application written in
[[TypeScript]] and bundled with [[Vite]]. Hosting, functions, and continuous deployment are
provided by [[Netlify]], and the source code is published on [[GitHub]].

== Privacy ==
The project describes its privacy model as "no tracking, no saved history, no ad profile".
There are no accounts to create, no session tracking, and the only value stored on a device is
a local theme preference. The site openly states its limits: it issues queries on the user's
behalf, so DuckDuckGo or Bing observe the question itself, but they cannot associate it with
the asking user.

== Screenshots ==
[[File:Home-light.png|thumb|left|300px|Pokdex Search home page in the light theme]]
[[File:Home-dark.png|thumb|300px|Pokdex Search home page in the dark theme]]
[[File:Results.png|thumb|300px|Results page with a Wikipedia knowledge panel]]
The interface uses a sparse, centered search pill with a large orange search button. Light and
dark themes are implemented with CSS variables, and the results layout shows organic links on
the left with the Wikipedia knowledge panel anchored to the right — the same layout as the
upstream DuckDuckGo search page that inspired it.
{{-}}

== References ==
{{reflist}}
```

---

## Tips before you publish

- **Notability:** On Wikipedia (not Fandom/Miraheze) this article would be deleted — the site
  needs "significant coverage in independent reliable sources" (news articles, reviews) that
  don't exist yet. Fandom/Miraheze have their own community rules and generally allow
  project/site pages.
- **Conflict of interest:** On Fandom/Miraheze, clearly tag the page or your user page so the
  community knows you built the site (e.g. add `{{User:.../COI}}` or a note in the article
  summary: "Created by the project's author").
- **License:** Screenshots of your own site are fine to upload; if you reuse the Pokémon-style
  badge artwork it is your own work, so tag files as {{Own work}}.
- **Hotlinking off:** always upload the PNG files instead of linking to the live site, since
  some wikis block external images.

## Need it for [Fandom] or [Miraheze] specifically?
The template markup is identical (both are MediaWiki). Everything above works on both out of
the box.