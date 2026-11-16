/**
 * Cloudflare Worker: SPA assets + /api/chat (LLM if OPENAI_API_KEY is set).
 * Chart math runs in the browser; the Worker only answers with chart context.
 */

const TONE = `Be accurate and neutral. State only what the chart supports. Do not add reassurance or positivity the chart does not support. Do not give exact dates, amounts, scores or exact outcomes; give periods and tendencies. Do not discuss death, lifespan, pregnancy, medical or psychological diagnoses. Do not promise outcomes. Religion-neutral: no deities or temple prescriptions; practical habits are fine. Keep answers under 120 words.`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'POST, OPTIONS, GET',
    },
  });
}

function crisisReply() {
  return {
    text:
      'I hear that this feels heavy. I am not the right place for crisis support. Please contact local emergency services or a trusted person now. In India you can call iCall at 9152987821. When you are safer, we can talk about the chart again.',
    provider: 'guardrail',
    used_llm: false,
  };
}

function chartAwareFallback(question, chartContext) {
  const q = String(question || '').toLowerCase();
  const ctx = String(chartContext || '');
  const lagna = (ctx.match(/Lagna:\s*(.+)/i) || [])[1] || 'your lagna';
  const moon = (ctx.match(/Moon:\s*(.+)/i) || [])[1] || 'your Moon sign';
  const dasha = (ctx.match(/Current dasha:\s*(.+)/i) || [])[1] || 'the current dasha';

  if (/career|job|work|promotion|business/.test(q)) {
    return `From the chart (${lagna} lagna; ${dasha}), the 10th-house picture favours steady skill-building over abrupt leaps. Progress is likely to feel gradual while this dasha runs. I can speak to remedies or timing themes next if you want.`;
  }
  if (/marriage|relationship|partner|love|compatibility/.test(q)) {
    return `With Moon as ${moon} and lagna in ${lagna}, the 7th-house themes favour clear communication over haste. Compatibility improves when both charts are compared. Family introductions often land better than rushed self-driven moves in this stretch.`;
  }
  if (/health|sleep|stress|anxiety/.test(q)) {
    return `Moon as ${moon} often marks a sensitive nervous system. Regular sleep and a lighter evening meal help more than speculative gemstones. This is chart guidance, not a medical diagnosis.`;
  }
  if (/remedy|remedies|donation|mantra|gemstone/.test(q)) {
    return `For this chart, calm Saturday habits and a simple act of giving (dark grains or oil for a lamp at home) are suitable starter remedies. Treat them as discipline supports, not guaranteed outcomes.`;
  }
  return `Noted against your chart (${lagna} lagna; Moon ${moon}; ${dasha}). Ask about career, relationships, health, or remedies for a more focused reading grounded in these placements.`;
}

async function openAiReply(env, question, chartContext, history) {
  const key = env.OPENAI_API_KEY;
  if (!key) return null;

  const messages = [
    {
      role: 'system',
      content: `${TONE}\n\nNatal chart context:\n${chartContext}`,
    },
    ...(Array.isArray(history) ? history.slice(-8) : []),
    { role: 'user', content: question },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 280,
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI ${response.status}: ${detail.slice(0, 200)}`);
  }
  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty OpenAI response');
  return { text, provider: 'openai', used_llm: true };
}

async function handleChat(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !body.question) {
    return json({ error: 'question is required' }, 400);
  }

  const question = String(body.question).trim();
  if (/suicide|kill myself|self-harm|end my life|want to die/i.test(question)) {
    return json(crisisReply());
  }

  const chartContext = body.chartContext || 'No chart provided.';
  try {
    const llm = await openAiReply(env, question, chartContext, body.history);
    if (llm) return json(llm);
  } catch (error) {
    // Fall through to chart-aware local reply
    return json({
      text: chartAwareFallback(question, chartContext),
      provider: 'chart-fallback',
      used_llm: false,
      warning: String(error.message || error),
    });
  }

  return json({
    text: chartAwareFallback(question, chartContext),
    provider: 'chart-local',
    used_llm: false,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return json({ ok: true });
    }

    if (url.pathname === '/api/health') {
      return json({
        ok: true,
        llm: Boolean(env.OPENAI_API_KEY),
        service: 'kundali-webapp',
      });
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ error: 'not found' }, 404);
    }

    // SPA + static assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response('Assets binding missing', { status: 500 });
  },
};
