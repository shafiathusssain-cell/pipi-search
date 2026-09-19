function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

export async function generateAiAnswer(query, key, model) {
  const prompt = [
    'You give concise, factual AI search answers.',
    `Question: "${query}"`,
    'Write a short answer of 3-6 paragraphs or a tight bullet list (max ~450 words).',
    'Use **bold** only for the core answer at the start of the first paragraph.',
    'Stay neutral, cite sources by name where meaningful, and state uncertainty when information is disputed or unknown.',
    'Do not mention that you are an AI model.',
  ].join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 700, temperature: 0.3 },
        }),
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`AI provider error (${response.status}).`);
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
    return text.trim();
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

export default async (request) => {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') ?? '').trim();

  if (!query) {
    return json({ answer: '', error: null });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return json(
      { answer: '', error: 'AI is not configured yet — add a GEMINI_API_KEY in the Netlify dashboard.' },
      501,
    );
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  try {
    const answer = await generateAiAnswer(query, key, model);
    return json({ answer, error: null });
  } catch (error) {
    return json(
      { answer: '', error: error instanceof Error ? error.message : 'AI is unavailable right now.' },
      502,
    );
  }
};

export const config = {
  path: ['/api/ai'],
};