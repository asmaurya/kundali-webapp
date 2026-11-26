/**
 * Topic → chart submission matrix for LLM context.
 * Topics align with chat composer chips; chart ids match Kundali views.
 */

export const LLM_TOPICS = [
  { id: 'career', label: 'Career / job' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'health', label: 'Health' },
  { id: 'remedies', label: 'Remedies' },
  { id: 'general', label: 'General guidance' },
];

export const LLM_CHART_OPTIONS = [
  { id: 'lagna', label: 'Lagna (D1)' },
  { id: 'chandra', label: 'Chandra Kundali' },
  { id: 'navamsa', label: 'Navamsa (D9)' },
  { id: 'chalit', label: 'Chalit' },
  { id: 'grah-sthiti', label: 'Grah Sthiti' },
  { id: 'gochara', label: 'Gochara (transits)' },
  { id: 'shadbala', label: 'Shadbala' },
  { id: 'vimshottari', label: 'Vimshottari dasha' },
  { id: 'yogini', label: 'Yogini dasha' },
  { id: 'family', label: 'Family charts (@mention)' },
];

/** Default: lagna always; family available when mentioned; dasha for career/timing-ish topics. */
export const DEFAULT_CHART_TOPIC_MATRIX = {
  career: ['lagna', 'vimshottari', 'shadbala', 'family'],
  relationships: ['lagna', 'navamsa', 'chandra', 'family'],
  health: ['lagna', 'chalit', 'shadbala', 'family'],
  remedies: ['lagna', 'vimshottari', 'yogini', 'family'],
  general: ['lagna', 'vimshottari', 'family'],
};

/** Map i18n / display chip labels → stable topic ids. */
export function topicIdFromLabel(label) {
  const s = String(label || '')
    .toLowerCase()
    .trim();
  if (/career|job|कार्य|नौकरी|करियर/.test(s)) return 'career';
  if (/relationship|love|विवाह|रिश्ता|संबंध/.test(s)) return 'relationships';
  if (/health|स्वास्थ्य/.test(s)) return 'health';
  if (/remed|उपाय/.test(s)) return 'remedies';
  if (/general|guidance|सामान्य|मार्गदर्शन/.test(s)) return 'general';
  return null;
}

export function normalizeChartTopicMatrix(raw) {
  const base = { ...DEFAULT_CHART_TOPIC_MATRIX };
  if (!raw || typeof raw !== 'object') return base;
  const validCharts = new Set(LLM_CHART_OPTIONS.map((c) => c.id));
  LLM_TOPICS.forEach(({ id }) => {
    const list = Array.isArray(raw[id]) ? raw[id] : base[id];
    const cleaned = [...new Set(list.map(String).filter((c) => validCharts.has(c)))];
    base[id] = cleaned.length ? cleaned : ['lagna'];
  });
  return base;
}

/** Union of chart ids enabled for the given topic ids (empty topics → general). */
export function chartIdsForTopics(matrix, topicIds = []) {
  const m = normalizeChartTopicMatrix(matrix);
  const topics = (topicIds || []).filter(Boolean);
  const keys = topics.length ? topics : ['general'];
  const out = new Set();
  keys.forEach((t) => {
    (m[t] || m.general || ['lagna']).forEach((id) => out.add(id));
  });
  if (!out.has('lagna')) out.add('lagna');
  return [...out];
}
