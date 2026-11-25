import { computeGochara } from '../../lib/natal.js';

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error('body_too_large'));
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function authorize(req) {
  const required = String(process.env.CHART_API_KEY || '').trim();
  if (!required) return true;
  const header = String(req.headers.authorization || '');
  const token = header.replace(/^Bearer\s+/i, '').trim();
  return Boolean(token && token === required);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!authorize(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    res.status(400).json({ error: 'invalid_json' });
    return;
  }

  try {
    const result = await computeGochara(body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error: 'gochara_failed',
      detail: String(error?.message || error).slice(0, 240),
    });
  }
}
