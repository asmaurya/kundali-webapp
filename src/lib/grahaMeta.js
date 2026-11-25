/**
 * Planet display names, glyphs, and classical dignity flags for chart UI.
 * Flags are derived from sidereal longitude / rashi (Swiss natal JSON).
 */

/**
 * Legacy Unicode glyphs. Chart/table UI draws SVG marks via PlanetGlyph instead —
 * these strings are kept only for canonicalPlanetName lookups and plain-text fallbacks.
 */
export const PLANET_GLYPH = {
  Sun: '☉\uFE0E',
  Moon: '☽\uFE0E',
  Mars: '♂\uFE0E',
  Mercury: '☿\uFE0E',
  Jupiter: '♃\uFE0E',
  Venus: '♀\uFE0E',
  Saturn: '♄\uFE0E',
  Rahu: '☊\uFE0E',
  Ketu: '☋\uFE0E',
};

export const PLANET_NAME = {
  en: {
    Sun: 'Sun',
    Moon: 'Moon',
    Mars: 'Mars',
    Mercury: 'Mercury',
    Jupiter: 'Jupiter',
    Venus: 'Venus',
    Saturn: 'Saturn',
    Rahu: 'Rahu',
    Ketu: 'Ketu',
  },
  hi: {
    Sun: 'सूर्य',
    Moon: 'चंद्र',
    Mars: 'मंगल',
    Mercury: 'बुध',
    Jupiter: 'गुरु',
    Venus: 'शुक्र',
    Saturn: 'शनि',
    Rahu: 'राहु',
    Ketu: 'केतु',
  },
};

export const PLANET_SHORT = {
  en: {
    Sun: 'Su',
    Moon: 'Mo',
    Mars: 'Ma',
    Mercury: 'Me',
    Jupiter: 'Ju',
    Venus: 'Ve',
    Saturn: 'Sa',
    Rahu: 'Ra',
    Ketu: 'Ke',
  },
  hi: {
    Sun: 'सू',
    Moon: 'चं',
    Mars: 'मं',
    Mercury: 'बु',
    Jupiter: 'गु',
    Venus: 'शु',
    Saturn: 'शनि',
    Rahu: 'रा',
    Ketu: 'के',
  },
};

/** Uchcha (exaltation) rashi numbers 1–12. */
export const EXALTATION = {
  Sun: 1,
  Moon: 2,
  Mars: 10,
  Mercury: 6,
  Jupiter: 4,
  Venus: 12,
  Saturn: 7,
};

/** Neecha (debilitation) = opposite of exaltation. */
export const DEBILITATION = {
  Sun: 7,
  Moon: 8,
  Mars: 4,
  Mercury: 12,
  Jupiter: 10,
  Venus: 6,
  Saturn: 1,
};

/** Combust orbs (degrees from Sun). Moon/nodes not combust. */
export const COMBUST_ORB = {
  Mercury: 14,
  Venus: 10,
  Mars: 17,
  Jupiter: 11,
  Saturn: 15,
};

export const FLAG_MARK = {
  uchcha: '↑',
  neecha: '↓',
  vakri: '*',
  ast: '^',
  vargottam: '◎',
};

export const FLAG_LEGEND = [
  { key: 'uchcha', mark: '↑', en: 'Uchch (exalted)', hi: 'उच्च' },
  { key: 'neecha', mark: '↓', en: 'Neech (debilitated)', hi: 'नीच' },
  { key: 'vakri', mark: '*', en: 'Vakri (retrograde)', hi: 'वक्री' },
  { key: 'ast', mark: '^', en: 'Ast (combust)', hi: 'अस्त' },
  { key: 'vargottam', mark: '◎', en: 'Vargottam (D1=D9)', hi: 'वर्गोत्तम' },
];

function norm360(deg) {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

/** Navamsa rashi (1–12) from sidereal longitude. */
export function navamsaRashi(longitude) {
  const lon = norm360(Number(longitude) || 0);
  const sign = Math.floor(lon / 30); // 0–11
  const part = Math.floor((lon % 30) / (30 / 9)); // 0–8
  const elementStarts = [0, 9, 6, 3]; // fire, earth, air, water → Aries, Cap, Libra, Cancer
  const start = elementStarts[sign % 4];
  return ((start + part) % 12) + 1;
}

export function formatDegreeDms(degreeInSign) {
  const d = Math.max(0, Number(degreeInSign) || 0);
  const deg = Math.floor(d);
  const minFloat = (d - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = Math.round((minFloat - min) * 60);
  return `${deg}° ${String(min).padStart(2, '0')}′ ${String(sec).padStart(2, '0')}″`;
}

/**
 * Enrich grahas with dignity / combust / vargottam flags.
 * Safe to call repeatedly; preserves existing fields.
 */
export function enrichGrahas(grahas = []) {
  const sun = grahas.find((g) => g.id === 'sun' || g.name === 'Sun');
  const sunLon = sun != null ? Number(sun.longitude) : null;

  return grahas.map((g) => {
    const name = g.name;
    const rashi = Number(g.rashi) || 0;
    const uchcha = EXALTATION[name] != null && EXALTATION[name] === rashi;
    const neecha = DEBILITATION[name] != null && DEBILITATION[name] === rashi;
    const vakri = Boolean(g.retrograde);
    let ast = false;
    if (sunLon != null && COMBUST_ORB[name] != null) {
      let delta = Math.abs(norm360(Number(g.longitude) - sunLon));
      if (delta > 180) delta = 360 - delta;
      ast = delta <= COMBUST_ORB[name];
    }
    const d9 = navamsaRashi(g.longitude);
    const vargottam = d9 === rashi;
    const marks = [
      uchcha ? FLAG_MARK.uchcha : '',
      neecha ? FLAG_MARK.neecha : '',
      vakri ? FLAG_MARK.vakri : '',
      ast ? FLAG_MARK.ast : '',
      vargottam ? FLAG_MARK.vargottam : '',
    ].join('');

    return {
      ...g,
      uchcha,
      neecha,
      vakri,
      ast,
      vargottam,
      navamsaRashi: d9,
      marks,
    };
  });
}

export function planetLabel(name, lang = 'en', { short = false } = {}) {
  const table = short ? PLANET_SHORT : PLANET_NAME;
  const pack = table[lang] || table.en;
  return pack[name] || name;
}

const PLANET_ALIASES = {
  sun: 'Sun',
  moon: 'Moon',
  mars: 'Mars',
  mercury: 'Mercury',
  jupiter: 'Jupiter',
  venus: 'Venus',
  saturn: 'Saturn',
  rahu: 'Rahu',
  ketu: 'Ketu',
  su: 'Sun',
  mo: 'Moon',
  ma: 'Mars',
  me: 'Mercury',
  ju: 'Jupiter',
  ve: 'Venus',
  sa: 'Saturn',
  ra: 'Rahu',
  ke: 'Ketu',
  सूर्य: 'Sun',
  चंद्र: 'Moon',
  मंगल: 'Mars',
  बुध: 'Mercury',
  गुरु: 'Jupiter',
  शुक्र: 'Venus',
  शनि: 'Saturn',
  राहु: 'Rahu',
  केतु: 'Ketu',
};

/** Canonical English planet id for glyphs / dignity lookups. */
export function canonicalPlanetName(name) {
  if (!name) return '';
  if (typeof name === 'object') {
    return canonicalPlanetName(name.name || name.id || name.planet || '');
  }
  const raw = String(name).trim();
  if (PLANET_GLYPH[raw] || PLANET_NAME.en[raw]) return raw;
  const lower = raw.toLowerCase();
  if (PLANET_ALIASES[lower]) return PLANET_ALIASES[lower];
  const titled = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  if (PLANET_GLYPH[titled] || PLANET_NAME.en[titled]) return titled;
  return raw;
}

export function planetGlyph(name) {
  const key = canonicalPlanetName(name);
  return PLANET_GLYPH[key] || String(key || name || '?').slice(0, 1);
}

export function chartLabelForPlanet(name, lang = 'en') {
  const key = canonicalPlanetName(name);
  const glyph = planetGlyph(key);
  const short = planetLabel(key, lang, { short: true });
  // Always include a readable short name; glyph alone can disappear in Safari SVG.
  return `${glyph} ${short}`;
}
