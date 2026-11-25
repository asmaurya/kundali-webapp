export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type, authorization',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      ...headers,
    },
  });
}

export function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type, authorization',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-max-age': '86400',
    },
  });
}

/** Optional bearer auth. Disabled when CHART_API_KEY is unset (local smoke). */
export function authorize(request, env = process.env) {
  const required = String(env.CHART_API_KEY || '').trim();
  if (!required) return { ok: true };
  const header = request.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (token && token === required) return { ok: true };
  return { ok: false, response: json({ error: 'unauthorized' }, 401) };
}
