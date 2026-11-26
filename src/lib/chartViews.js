/**
 * Derived kundali views + dasha cascades from a base Lagna chart.
 * Natal longitudes must come from Swiss Ephemeris; gochara is loaded via /api/gochara.
 */
import { RASHIS } from './chartEngine';
import { enrichGrahas, formatDegreeDms, planetLabel } from './grahaMeta';

const DASHA_LORDS = [
  'Ketu',
  'Venus',
  'Sun',
  'Moon',
  'Mars',
  'Rahu',
  'Jupiter',
  'Saturn',
  'Mercury',
];
const DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];

const YOGINI = [
  { name: 'Mangala', years: 1 },
  { name: 'Pingala', years: 2 },
  { name: 'Dhanya', years: 3 },
  { name: 'Bhramari', years: 4 },
  { name: 'Bhadrika', years: 5 },
  { name: 'Ulka', years: 6 },
  { name: 'Siddha', years: 7 },
  { name: 'Sankata', years: 8 },
];

const OWN_SIGNS = {
  Sun: [5],
  Moon: [4],
  Mars: [1, 8],
  Mercury: [3, 6],
  Jupiter: [9, 12],
  Venus: [2, 7],
  Saturn: [10, 11],
  Rahu: [11],
  Ketu: [8],
};

const EXALTATION = {
  Sun: 1,
  Moon: 2,
  Mars: 10,
  Mercury: 6,
  Jupiter: 4,
  Venus: 12,
  Saturn: 7,
};

function norm360(deg) {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

function wholeSignHouse(planetRashi, lagnaRashi) {
  return ((planetRashi - lagnaRashi + 12) % 12) + 1;
}

function housesFromLagna(grahas, lagnaRashi) {
  const remapped = grahas.map((g) => ({
    ...g,
    house: wholeSignHouse(g.rashi, lagnaRashi),
  }));
  const houses = Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const signIndex = (lagnaRashi - 1 + i) % 12;
    return {
      house,
      sign: RASHIS[signIndex],
      planets: remapped.filter((g) => g.house === house).map((g) => g.name),
    };
  });
  return { grahas: remapped, houses, lagnaRashi };
}

function dateOnly(d) {
  return d.toISOString().slice(0, 10);
}

function addYears(date, years) {
  return new Date(date.getTime() + years * 365.25 * 24 * 3600 * 1000);
}

function subPeriods(parent, startLordIndex, depthLabel) {
  const parentYears =
    (new Date(parent.end).getTime() - new Date(parent.start).getTime()) /
    (365.25 * 24 * 3600 * 1000);
  const periods = [];
  let cursor = new Date(parent.start);
  for (let i = 0; i < 9; i += 1) {
    const idx = (startLordIndex + i) % 9;
    const share = (DASHA_YEARS[idx] / 120) * parentYears;
    const end = addYears(cursor, share);
    periods.push({
      level: depthLabel,
      lord: DASHA_LORDS[idx].toLowerCase(),
      lordName: DASHA_LORDS[idx],
      start: dateOnly(cursor),
      end: dateOnly(end),
    });
    cursor = end;
  }
  return periods;
}

function lordIndex(name) {
  return DASHA_LORDS.findIndex((l) => l.toLowerCase() === String(name).toLowerCase());
}

function pickCurrent(periods, at = new Date()) {
  return (
    periods.find((p) => new Date(p.start) <= at && at < new Date(p.end)) ||
    periods[periods.length - 1] ||
    null
  );
}

/** Expand Vimshottari into Maha → Antar → Pratyantar → Sookshma for "now". */
export function expandVimshottariCascade(dasha, at = new Date()) {
  if (!dasha?.periods?.length) return null;
  const maha = pickCurrent(dasha.periods, at) || dasha.current;
  if (!maha) return null;
  const mahaIdx = lordIndex(maha.lordName ?? maha.lord);
  if (mahaIdx < 0) return { maha, antar: null, pratyantar: null, sookshma: null };
  const antarPeriods = subPeriods(maha, mahaIdx, 'antar');
  const antar = pickCurrent(antarPeriods, at);
  if (!antar) {
    return { maha, antar: null, pratyantar: null, sookshma: null, antarPeriods };
  }
  const antarIdx = lordIndex(antar.lordName ?? antar.lord);
  if (antarIdx < 0) {
    return { maha, antar, pratyantar: null, sookshma: null, antarPeriods };
  }
  const pratyantarPeriods = subPeriods(antar, antarIdx, 'pratyantar');
  const pratyantar = pickCurrent(pratyantarPeriods, at);
  if (!pratyantar) {
    return { maha, antar, pratyantar: null, sookshma: null, antarPeriods, pratyantarPeriods };
  }
  const pratyIdx = lordIndex(pratyantar.lordName ?? pratyantar.lord);
  if (pratyIdx < 0) {
    return { maha, antar, pratyantar, sookshma: null, antarPeriods, pratyantarPeriods };
  }
  const sookshmaPeriods = subPeriods(pratyantar, pratyIdx, 'sookshma');
  const sookshma = pickCurrent(sookshmaPeriods, at);

  return {
    maha,
    antar,
    pratyantar,
    sookshma,
    antarPeriods,
    pratyantarPeriods,
    sookshmaPeriods,
  };
}

/** Yogini dasha from Moon nakshatra (36-year cycle). */
export function yoginiDasha(moonLongitude, birthDate, at = new Date()) {
  const nakIndex = Math.floor(norm360(moonLongitude) / (360 / 27));
  const startIdx = nakIndex % 8;
  const portion = (norm360(moonLongitude) % (360 / 27)) / (360 / 27);
  const firstYears = YOGINI[startIdx].years;
  const remaining = firstYears * (1 - portion);
  const elapsed = firstYears - remaining;
  let cursor = new Date(birthDate.getTime() - elapsed * 365.25 * 24 * 3600 * 1000);
  const periods = [];
  for (let i = 0; i < 16; i += 1) {
    const y = YOGINI[(startIdx + i) % 8];
    const end = addYears(cursor, y.years);
    periods.push({
      lord: y.name.toLowerCase(),
      lordName: y.name,
      start: dateOnly(cursor),
      end: dateOnly(end),
      years: y.years,
    });
    cursor = end;
  }
  const current = pickCurrent(periods, at) || periods[0];
  return { system: 'yogini', current, periods };
}

export function deriveChandraChart(chart) {
  const moon = chart.grahas.find((g) => g.id === 'moon');
  if (!moon) return null;
  const { grahas, houses, lagnaRashi } = housesFromLagna(chart.grahas, moon.rashi);
  return {
    id: 'chandra',
    title: 'Chandra Kundali',
    subtitle: `Moon lagna · ${moon.rashiName}`,
    kind: 'kundali',
    lagnaRashi,
    houses,
    grahas,
  };
}

export function deriveNavamsaChart(chart) {
  const navGrahas = chart.grahas.map((g) => {
    const navIndex = Math.floor(norm360(g.longitude) / (30 / 9));
    const rashi = (navIndex % 12) + 1;
    return {
      ...g,
      rashi,
      rashiName: RASHIS[rashi - 1],
      degree: Number(((norm360(g.longitude) % (30 / 9)) * 3.3333).toFixed(2)),
    };
  });
  const lagnaLon = (chart.lagna.rashi - 1) * 30 + chart.lagna.degree;
  const lagnaNav = Math.floor(norm360(lagnaLon) / (30 / 9));
  const lagnaRashi = (lagnaNav % 12) + 1;
  const { grahas, houses } = housesFromLagna(navGrahas, lagnaRashi);
  return {
    id: 'navamsa',
    title: 'Navamansh (D9)',
    subtitle: `Navamsa lagna · ${RASHIS[lagnaRashi - 1]}`,
    kind: 'kundali',
    lagnaRashi,
    houses,
    grahas,
  };
}

/** Equal-bhava Chalit approximation from lagna degree (not Sripati cusps). */
export function deriveChalitChart(chart) {
  const lagnaLon = (chart.lagna.rashi - 1) * 30 + chart.lagna.degree;
  const remapped = chart.grahas.map((g) => {
    const offset = norm360(g.longitude - lagnaLon);
    const house = Math.floor(offset / 30) + 1;
    return { ...g, house };
  });
  const houses = Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const cusp = norm360(lagnaLon + i * 30);
    const signIndex = Math.floor(cusp / 30);
    return {
      house,
      sign: RASHIS[signIndex],
      planets: remapped.filter((g) => g.house === house).map((g) => g.name),
    };
  });
  return {
    id: 'chalit',
    title: 'Chalit Kundali',
    subtitle: 'Equal-bhava from lagna degree',
    kind: 'kundali',
    lagnaRashi: chart.lagna.rashi,
    houses,
    grahas: remapped,
  };
}

export function deriveGrahSthiti(chart, lang = 'en') {
  const rows = enrichGrahas(chart.grahas || []).map((g) => ({
    planet: planetLabel(g.name, lang),
    glyph: g.name,
    sign: g.rashiName,
    degree: formatDegreeDms(g.degree),
    house: g.house,
    nakshatra: g.nakshatraName,
    pada: g.pada,
    marks: g.marks || '—',
    retrograde: Boolean(g.retrograde),
  }));
  return {
    id: 'grah-sthiti',
    title: 'Grah Sthiti',
    subtitle: 'Planetary positions at birth (Swiss Ephemeris)',
    kind: 'table',
    rows,
  };
}

/** Placeholder — ChartSecondaryPanel loads Swiss gochara via /api/gochara. */
export function deriveGochara(chart) {
  return {
    id: 'gochara',
    title: 'Gochara (Transits)',
    subtitle: 'Swiss Ephemeris · opens to load current transits',
    kind: 'table',
    rows: [],
    needsSwissGochara: true,
    natalByPlanet: Object.fromEntries(
      (chart.grahas || []).map((g) => [g.name, g.rashiName || '—'])
    ),
    lagnaRashi: chart.lagna?.rashi || 1,
    lat: chart.birth?.lat,
    lon: chart.birth?.lon,
    tzOffsetHours: chart.birth?.tzOffsetHours,
  };
}

/** Simplified Shadbala-style scores (dignities + house strength), not classical Shadbala units. */
export function deriveShadbala(chart) {
  const rows = chart.grahas
    .filter((g) => !['rahu', 'ketu'].includes(g.id))
    .map((g) => {
      let score = 40;
      if ((OWN_SIGNS[g.name] || []).includes(g.rashi)) score += 25;
      if (EXALTATION[g.name] === g.rashi) score += 30;
      if ([1, 4, 7, 10].includes(g.house)) score += 15;
      if ([6, 8, 12].includes(g.house)) score -= 10;
      if (g.retrograde) score -= 5;
      score = Math.max(5, Math.min(100, score));
      return {
        planet: g.name,
        score,
        note:
          score >= 75 ? 'Strong' : score >= 50 ? 'Moderate' : 'Needs support',
      };
    });
  return {
    id: 'shadbala',
    title: 'Shadbala (simplified)',
    subtitle: 'Relative strength sketch — not classical Shadbala units',
    kind: 'strength',
    rows,
  };
}

export function buildSecondaryViews(chart, lang = 'en') {
  if (!chart) return [];
  return [
    deriveChandraChart(chart),
    deriveNavamsaChart(chart),
    deriveChalitChart(chart),
    deriveGrahSthiti(chart, lang),
    deriveGochara(chart),
    deriveShadbala(chart),
  ].filter(Boolean);
}

export function buildDashaPanel(chart) {
  if (!chart?.dasha || !chart.grahas) return null;
  const moon = chart.grahas.find((g) => g.id === 'moon');
  const birth = new Date(chart.birth?.utc || Date.now());
  const cascade = expandVimshottariCascade(chart.dasha);
  const yogini = moon ? yoginiDasha(moon.longitude, birth) : null;
  return {
    vimshottari: {
      periods: chart.dasha.periods,
      cascade,
    },
    yogini,
  };
}
