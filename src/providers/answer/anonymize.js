/**
 * Identity scrub for LLM payloads.
 *
 * Keep for Jyotish: birth date, time, place, lat/lon, chart placements, query text.
 * Scrub only what links a reply to a real person: display names, emails, phones.
 */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
/** Prefer +country / spaced groups; avoid eating ISO dates like 1962-03-12. */
const PHONE_RE =
  /(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)\d{3,5}[\s-]?\d{4,6}\b/g;
const ISO_DATE_RE = /\b\d{4}-\d{2}-\d{2}\b/g;
const CLOCK_RE = /\b\d{1,2}:\d{2}(?::\d{2})?\b/g;

function protectJyotishStamps(text, store) {
  return String(text || '')
    .replace(ISO_DATE_RE, (match) => {
      const token = `__JYOTISH_${store.length}__`;
      store.push(match);
      return token;
    })
    .replace(CLOCK_RE, (match) => {
      const token = `__JYOTISH_${store.length}__`;
      store.push(match);
      return token;
    });
}

function restoreJyotishStamps(text, store) {
  let out = text;
  store.forEach((value, index) => {
    out = out.replace(`__JYOTISH_${index}__`, value);
  });
  return out;
}

/**
 * @param {string} text
 * @param {{ selfName?: string, family?: Array<{name:string,relation:string}> }} [people]
 */
export function anonymizeText(text, people = {}) {
  const stamps = [];
  let out = protectJyotishStamps(text, stamps);
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

  return restoreJyotishStamps(out, stamps);
}

/**
 * Chart / birth context for the model.
 * Does NOT redact place, time, date, or coordinates — those are required for Jyotish.
 * Names in the blob should already be handled via anonymizeText(..., people).
 */
export function anonymizeChartContext(chartContext) {
  return String(chartContext || '');
}

export function makeAnonymousRequestId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `anon_${crypto.randomUUID()}`;
  }
  return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
