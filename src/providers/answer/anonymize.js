/**
 * Strip identity from text + chart context before any LLM / answer provider call.
 * Aligns with ARCHITECTURE §8.3 (names → relationship labels; no emails/phones/ids).
 */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?:\+?\d[\d\s\-()]{8,}\d)/g;

/**
 * @param {string} text
 * @param {{ selfName?: string, family?: Array<{name:string,relation:string}> }} [people]
 */
export function anonymizeText(text, people = {}) {
  let out = String(text || '');
  out = out.replace(EMAIL_RE, '[email]');
  out = out.replace(PHONE_RE, '[phone]');

  const replacements = [];
  if (people.selfName) {
    replacements.push({
      from: people.selfName,
      to: 'the querent',
    });
  }
  (people.family || []).forEach((member) => {
    if (!member?.name) return;
    const relation = String(member.relation || 'relative').toLowerCase();
    replacements.push({
      from: member.name,
      to: `the querent's ${relation}`,
    });
  });

  // Longer names first so "Ramesh Sharma" wins over "Ramesh".
  replacements
    .sort((a, b) => b.from.length - a.from.length)
    .forEach(({ from, to }) => {
      const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(escaped, 'gi'), to);
      out = out.replace(new RegExp(`@${escaped}`, 'gi'), to);
    });

  return out;
}

/** Chart prompt context without birth place string / coords that identify a home. */
export function anonymizeChartContext(chartContext) {
  let out = String(chartContext || '');
  out = out.replace(/^Birth place:.*$/gim, 'Birth place: [redacted]');
  out = out.replace(/\b(?:lat|lon|longitude|latitude)\s*[:=]\s*-?\d+(\.\d+)?/gi, '[coords]');
  return out;
}

export function makeAnonymousRequestId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `anon_${crypto.randomUUID()}`;
  }
  return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
