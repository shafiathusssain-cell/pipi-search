import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { searchWeb, autocompleteDuckDuckGo, wikiPanel } from './netlify/functions/ddg.mjs';
import { generateAiAnswer } from './netlify/functions/ai.mjs';

function sendJson(res: import('node:http').ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

// Serves the same DuckDuckGo proxy endpoints that Netlify Functions provide in
// production, so `npm run dev` works without the Netlify CLI.
function pipiSearchApi(options: { env: Record<string, string> }) {
  const env = options?.env ?? {};
  return {
    name: 'pipi-search-api',
    configureServer(server) {
      server.middlewares.use('/api/search', async (req, res, next) => {
        if (req.method !== 'GET') return next();
        try {
          const url = new URL(req.url ?? '/', 'http://localhost');
          const query = url.searchParams.get('q') ?? '';
          const start = Number(url.searchParams.get('s') ?? '0') || 0;
          const { results, source } = query.trim()
            ? await searchWeb(query, start)
            : { results: [], source: 'duckduckgo' };
          sendJson(res, 200, { results, source, query, start });
        } catch (error) {
          sendJson(res, 502, {
            results: [],
            error: error instanceof Error ? error.message : 'Search is unavailable right now.',
          });
        }
      });

      server.middlewares.use('/api/suggest', async (req, res, next) => {
        if (req.method !== 'GET') return next();
        try {
          const url = new URL(req.url ?? '/', 'http://localhost');
          const query = url.searchParams.get('q') ?? '';
          sendJson(res, 200, { suggests: await autocompleteDuckDuckGo(query) });
        } catch {
          sendJson(res, 200, { suggests: [] });
        }
      });

      server.middlewares.use('/api/wiki', async (req, res, next) => {
        if (req.method !== 'GET') return next();
        try {
          const url = new URL(req.url ?? '/', 'http://localhost');
          const query = url.searchParams.get('q') ?? '';
          sendJson(res, 200, { wiki: await wikiPanel(query) });
        } catch {
          sendJson(res, 200, { wiki: null });
        }
      });

      server.middlewares.use('/api/ai', async (req, res, next) => {
        if (req.method !== 'GET') return next();
        const url = new URL(req.url ?? '/', 'http://localhost');
        const query = (url.searchParams.get('q') ?? '').trim();
        if (!query) return sendJson(res, 200, { answer: '', error: null });
        const key = env.GEMINI_API_KEY;
        if (!key) {
          return sendJson(res, 501, {
            answer: '',
            error: 'AI is not configured yet — set GEMINI_API_KEY in your .env file.',
          });
        }
        const model = env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
        try {
          sendJson(res, 200, { answer: await generateAiAnswer(query, key, model), error: null });
        } catch (error) {
          sendJson(res, 502, {
            answer: '',
            error: error instanceof Error ? error.message : 'AI is unavailable right now.',
          });
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), pipiSearchApi({ env })],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
