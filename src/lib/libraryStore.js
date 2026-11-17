/** Reports, remedies, and astrologer ratings — local library for beta. */

const KEYS = {
  reports: 'kundali.beta.reports',
  remedies: 'kundali.beta.remedies',
  ratings: 'kundali.beta.astrologerRatings',
  lastUsed: 'kundali.beta.astrologerLastUsed',
};

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadReports() {
  return read(KEYS.reports, []);
}

export function saveReports(reports) {
  write(KEYS.reports, reports);
  return reports;
}

export function addReport(report) {
  const next = [
    {
      id: report.id || `r-${Date.now()}`,
      title: report.title,
      memberId: report.memberId || 'self',
      memberName: report.memberName || 'You',
      kind: report.kind || 'chat',
      createdAt: report.createdAt || new Date().toISOString(),
      summary: report.summary || '',
      source: report.source || 'chat',
    },
    ...loadReports(),
  ].slice(0, 80);
  return saveReports(next);
}

export function loadRemedies() {
  return read(KEYS.remedies, []);
}

export function saveRemedies(remedies) {
  write(KEYS.remedies, remedies);
  return remedies;
}

export function addRemedy(remedy) {
  const next = [
    {
      id: remedy.id || `rm-${Date.now()}`,
      text: remedy.text,
      source: remedy.source || 'ai', // ai | human
      astrologerName: remedy.astrologerName || 'Astro Chat',
      memberId: remedy.memberId || 'self',
      memberName: remedy.memberName || 'You',
      createdAt: remedy.createdAt || new Date().toISOString(),
    },
    ...loadRemedies(),
  ].slice(0, 80);
  return saveRemedies(next);
}

export function loadAstrologerRatings() {
  return read(KEYS.ratings, {});
}

export function setAstrologerRating(astrologerId, rating) {
  const all = loadAstrologerRatings();
  all[astrologerId] = {
    rating: Math.max(1, Math.min(5, Number(rating) || 0)),
    updatedAt: new Date().toISOString(),
  };
  write(KEYS.ratings, all);
  return all[astrologerId];
}

export function loadAstrologerLastUsed() {
  return read(KEYS.lastUsed, {});
}

export function markAstrologerUsed(astrologerId) {
  const all = loadAstrologerLastUsed();
  all[astrologerId] = new Date().toISOString();
  write(KEYS.lastUsed, all);
  return all[astrologerId];
}

/** Seed a few library items once so empty states are not barren after onboarding. */
export function ensureLibrarySeeds({ memberName = 'You' } = {}) {
  if (loadReports().length === 0) {
    saveReports([
      {
        id: 'seed-chart',
        title: 'Lagna Kundali snapshot',
        memberId: 'self',
        memberName,
        kind: 'kundali',
        createdAt: new Date().toISOString(),
        summary: 'North Indian lagna chart generated at onboarding.',
        source: 'chart',
      },
    ]);
  }
  if (loadRemedies().length === 0) {
    saveRemedies([
      {
        id: 'seed-remedy',
        text: 'Keep Saturday evenings quieter; a simple lamp with sesame oil at home supports Saturn themes without overclaiming outcomes.',
        source: 'ai',
        astrologerName: 'Astro Chat',
        memberId: 'self',
        memberName,
        createdAt: new Date().toISOString(),
      },
    ]);
  }
}

export function clearLibrary() {
  Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key));
}

/** Detect remedy-like bot replies and archive them. */
export function maybeCaptureRemedyFromReply({ text, astrologer, memberName }) {
  if (!text) return null;
  if (!/remedy|remedies|donation|mantra|habit|saturday|lamp|upay/i.test(text)) {
    return null;
  }
  return addRemedy({
    text: text.length > 280 ? `${text.slice(0, 277)}…` : text,
    source: astrologer?.type === 'live' ? 'human' : 'ai',
    astrologerName: astrologer?.name || 'Astro Chat',
    memberName: memberName || 'You',
  });
}

export function maybeCaptureReportFromChat({ question, reply, memberName }) {
  if (!question || !reply) return null;
  if (!/report|career|marriage|health|finance|compatibility|timing/i.test(question)) {
    return null;
  }
  return addReport({
    title: question.length > 48 ? `${question.slice(0, 45)}…` : question,
    memberName: memberName || 'You',
    kind: 'chat',
    summary: reply.length > 160 ? `${reply.slice(0, 157)}…` : reply,
    source: 'chat',
  });
}
