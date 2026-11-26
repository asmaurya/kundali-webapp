/**
 * Provider-neutral natal chart (Lahiri / whole-sign / mean node).
 * Uses astronomy-engine for planetary longitudes; Meeus for ayanamsa & mean node.
 */
import {
  Body,
  Ecliptic,
  GeoVector,
  MakeTime,
  Observer,
  SiderealTime,
  e_tilt,
} from 'astronomy-engine';

export const RASHIS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

export const NAKSHATRAS = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
];

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

const CITY_COORDS = {
  jaipur: { lat: 26.9124, lon: 75.7873, tzOffsetHours: 5.5 },
  delhi: { lat: 28.6139, lon: 77.209, tzOffsetHours: 5.5 },
  'new delhi': { lat: 28.6139, lon: 77.209, tzOffsetHours: 5.5 },
  mumbai: { lat: 19.076, lon: 72.8777, tzOffsetHours: 5.5 },
  bengaluru: { lat: 12.9716, lon: 77.5946, tzOffsetHours: 5.5 },
  bangalore: { lat: 12.9716, lon: 77.5946, tzOffsetHours: 5.5 },
  hyderabad: { lat: 17.385, lon: 78.4867, tzOffsetHours: 5.5 },
  chennai: { lat: 13.0827, lon: 80.2707, tzOffsetHours: 5.5 },
  kolkata: { lat: 22.5726, lon: 88.3639, tzOffsetHours: 5.5 },
  pune: { lat: 18.5204, lon: 73.8567, tzOffsetHours: 5.5 },
  ahmedabad: { lat: 23.0225, lon: 72.5714, tzOffsetHours: 5.5 },
  lucknow: { lat: 26.8467, lon: 80.9462, tzOffsetHours: 5.5 },
  chandigarh: { lat: 30.7333, lon: 76.7794, tzOffsetHours: 5.5 },
  kanpur: { lat: 26.4499, lon: 80.3319, tzOffsetHours: 5.5 },
  india: { lat: 28.6139, lon: 77.209, tzOffsetHours: 5.5 },
};

function norm360(deg) {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

function formatTzOffset(hours) {
  const sign = hours < 0 ? '-' : '+';
  const abs = Math.abs(hours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function julianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

/** Lahiri ayanamsa (Meeus-style polynomial around J2000). */
export function lahiriAyanamsa(date) {
  const T = (julianDay(date) - 2451545.0) / 36525;
  return 23.85 + 1.396971 * T - 0.000013 * T * T;
}

/** Mean lunar ascending node (Meeus). */
export function meanNodeLongitude(date) {
  const T = (julianDay(date) - 2451545.0) / 36525;
  return norm360(
    125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441
  );
}

/**
 * Resolve lat/lon/tz for a birth place.
 * Prefer explicit coordinates from Google Places (or Nominatim) when provided.
 */
export function resolvePlace(place, coords) {
  if (
    coords &&
    Number.isFinite(Number(coords.lat)) &&
    Number.isFinite(Number(coords.lon))
  ) {
    const lat = Number(coords.lat);
    const lon = Number(coords.lon);
    const tzOffsetHours = Number.isFinite(Number(coords.tzOffsetHours))
      ? Number(coords.tzOffsetHours)
      : estimateTzOffsetHours(lat, lon, coords.countryCode);
    return {
      lat,
      lon,
      tzOffsetHours,
      label: place || coords.label || 'Selected place',
      approx: false,
      placeId: coords.placeId || null,
      source: coords.source || 'places',
    };
  }

  const key = String(place || '')
    .toLowerCase()
    .split(',')[0]
    .trim();
  if (CITY_COORDS[key]) return { ...CITY_COORDS[key], label: place };
  const matched = Object.keys(CITY_COORDS).find((city) =>
    String(place || '')
      .toLowerCase()
      .includes(city)
  );
  if (matched) return { ...CITY_COORDS[matched], label: place };
  return { ...CITY_COORDS.delhi, label: place || 'Delhi, India', approx: true };
}

/** Rough timezone when Places Time Zone API is unavailable. */
export function estimateTzOffsetHours(lat, lon, countryCode) {
  const cc = String(countryCode || '').toUpperCase();
  if (cc === 'IN' || cc === 'IND') return 5.5;
  if (cc === 'NP') return 5.75;
  if (cc === 'LK') return 5.5;
  if (cc === 'BD') return 6;
  if (cc === 'PK') return 5;
  if (cc === 'AE') return 4;
  if (cc === 'GB') return 0;
  if (cc === 'US') {
    // Contiguous US approximation from longitude.
    if (lon < -112.5) return -8;
    if (lon < -97.5) return -7;
    if (lon < -82.5) return -6;
    return -5;
  }
  const rough = Math.round((Number(lon) || 0) / 15);
  return Math.max(-12, Math.min(14, rough));
}

/** Parse HTML date/time values and common locale variants into a valid UTC Date. */
export function parseBirthDateTime(dateInput, timeInput) {
  const dateStr = String(dateInput || '').trim();
  const rawTime = String(timeInput || '12:00').trim();

  let year;
  let month;
  let day;
  const iso = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const slash = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else if (slash) {
    // Prefer DD/MM/YYYY for India; if first > 12 it's definitely day-first.
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    year = Number(slash[3]);
    if (a > 12) {
      day = a;
      month = b;
    } else if (b > 12) {
      month = a;
      day = b;
    } else {
      // Ambiguous — assume DD/MM/YYYY (India).
      day = a;
      month = b;
    }
  } else {
    throw new Error('Enter date of birth as YYYY-MM-DD.');
  }

  let timeStr = rawTime.toLowerCase().replace(/\s+/g, '');
  let hour;
  let minute;
  const ampm = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(am|pm)?$/);
  if (!ampm) {
    throw new Error('Enter time of birth as HH:MM.');
  }
  hour = Number(ampm[1]);
  minute = Number(ampm[2]);
  const meridiem = ampm[3];
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error('Birth date or time looks invalid.');
  }

  return { year, month, day, hour, minute };
}

export function birthToUtcDate({ date, time, place, lat, lon, tzOffsetHours, countryCode, placeId, source }) {
  const loc = resolvePlace(place, {
    lat,
    lon,
    tzOffsetHours,
    countryCode,
    placeId,
    source,
    label: place,
  });
  const parts = parseBirthDateTime(date, time);
  const utcMs =
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) -
    loc.tzOffsetHours * 3600 * 1000;
  const utc = new Date(utcMs);
  if (Number.isNaN(utc.getTime())) {
    throw new Error('Could not understand that birth date and time.');
  }
  return { utc, loc };
}

function tropicalLongitude(body, time) {
  const vec = GeoVector(body, time, true);
  return norm360(Ecliptic(vec).elon);
}

function obliquityDeg(time) {
  return e_tilt(time).tobl;
}

/** Tropical ascendant longitude (degrees). */
export function tropicalAscendant(time, observer) {
  const lstHours = SiderealTime(time) + observer.longitude / 15;
  const ramc = norm360(lstHours * 15) * (Math.PI / 180);
  const eps = obliquityDeg(time) * (Math.PI / 180);
  const lat = observer.latitude * (Math.PI / 180);
  const y = -Math.cos(ramc);
  const x = Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps);
  return norm360((Math.atan2(y, x) * 180) / Math.PI);
}

function placementFromSidereal(siderealLon) {
  const lon = norm360(siderealLon);
  const rashi = Math.floor(lon / 30) + 1;
  const degree = lon % 30;
  const nakIndex = Math.floor(lon / (360 / 27));
  const pada = Math.floor((lon % (360 / 27)) / (360 / 108)) + 1;
  return {
    rashi,
    rashiName: RASHIS[rashi - 1],
    degree: Number(degree.toFixed(2)),
    nakshatra: nakIndex + 1,
    nakshatraName: NAKSHATRAS[nakIndex],
    pada,
    longitude: Number(lon.toFixed(4)),
  };
}

function wholeSignHouse(planetRashi, lagnaRashi) {
  return ((planetRashi - lagnaRashi + 12) % 12) + 1;
}

function vimshottariFromMoon(moonLon, birthDate) {
  const portion = (norm360(moonLon) % (360 / 27)) / (360 / 27);
  const nakIndex = Math.floor(norm360(moonLon) / (360 / 27));
  const lordIndex = nakIndex % 9;
  const yearsRemaining = DASHA_YEARS[lordIndex] * (1 - portion);
  const start = new Date(birthDate.getTime());
  const elapsedYears = DASHA_YEARS[lordIndex] - yearsRemaining;
  const mahadashaStart = new Date(
    start.getTime() - elapsedYears * 365.25 * 24 * 3600 * 1000
  );
  const periods = [];
  let cursor = new Date(mahadashaStart.getTime());
  for (let i = 0; i < 9; i += 1) {
    const idx = (lordIndex + i) % 9;
    const years = DASHA_YEARS[idx];
    const end = new Date(cursor.getTime() + years * 365.25 * 24 * 3600 * 1000);
    periods.push({
      lord: DASHA_LORDS[idx].toLowerCase(),
      lordName: DASHA_LORDS[idx],
      start: cursor.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      level: 'maha',
    });
    cursor = end;
  }
  const now = new Date();
  const current =
    periods.find((p) => new Date(p.start) <= now && now < new Date(p.end)) || periods[0];
  return { system: 'vimshottari', current, periods };
}

export { DASHA_LORDS, DASHA_YEARS };

/**
 * @param {{ date: string, time: string, place: string, lat?: number, lon?: number, tzOffsetHours?: number, countryCode?: string, placeId?: string }} birth
 */
export function generateChart(birth) {
  if (!birth || !birth.date || !birth.time || !birth.place) {
    throw new Error('Birth date, time and place are all required.');
  }

  const { utc, loc } = birthToUtcDate(birth);
  const time = MakeTime(utc);
  const observer = new Observer(loc.lat, loc.lon, 0);
  const ayanamsa = lahiriAyanamsa(utc);

  const bodies = [
    ['sun', Body.Sun],
    ['moon', Body.Moon],
    ['mars', Body.Mars],
    ['mercury', Body.Mercury],
    ['jupiter', Body.Jupiter],
    ['venus', Body.Venus],
    ['saturn', Body.Saturn],
  ];

  const tropicalLagna = tropicalAscendant(time, observer);
  const lagna = placementFromSidereal(tropicalLagna - ayanamsa);

  const grahas = bodies.map(([id, body]) => {
    const trop = tropicalLongitude(body, time);
    const place = placementFromSidereal(trop - ayanamsa);
    return {
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      ...place,
      house: wholeSignHouse(place.rashi, lagna.rashi),
      retrograde: false,
    };
  });

  const rahuTrop = meanNodeLongitude(utc);
  const rahu = placementFromSidereal(rahuTrop - ayanamsa);
  const ketu = placementFromSidereal(rahuTrop + 180 - ayanamsa);
  grahas.push(
    {
      id: 'rahu',
      name: 'Rahu',
      ...rahu,
      house: wholeSignHouse(rahu.rashi, lagna.rashi),
      retrograde: true,
    },
    {
      id: 'ketu',
      name: 'Ketu',
      ...ketu,
      house: wholeSignHouse(ketu.rashi, lagna.rashi),
      retrograde: true,
    }
  );

  const moon = grahas.find((g) => g.id === 'moon');
  const dasha = vimshottariFromMoon(moon.longitude, utc);

  const houseRows = Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const signIndex = (lagna.rashi - 1 + i) % 12;
    return {
      house,
      sign: RASHIS[signIndex],
      planets: grahas.filter((g) => g.house === house).map((g) => g.name),
    };
  });

  return {
    schema_version: 1,
    ayanamsa: 'lahiri',
    ayanamsa_deg: Number(ayanamsa.toFixed(4)),
    house_system: 'whole_sign',
    node_type: 'mean',
    birth: {
      date: birth.date,
      time: birth.time,
      place: birth.place,
      utc: utc.toISOString(),
      lat: loc.lat,
      lon: loc.lon,
      tz: formatTzOffset(loc.tzOffsetHours),
      tzOffsetHours: loc.tzOffsetHours,
      place_approx: Boolean(loc.approx),
      placeId: loc.placeId || birth.placeId || null,
      source: loc.source || null,
    },
    lagna: {
      rashi: lagna.rashi,
      rashiName: lagna.rashiName,
      degree: lagna.degree,
      nakshatra: lagna.nakshatra,
      nakshatraName: lagna.nakshatraName,
      pada: lagna.pada,
    },
    grahas,
    houses: houseRows,
    dasha,
    summary: {
      lagna: lagna.rashiName,
      moonSign: moon.rashiName,
      nakshatra: moon.nakshatraName,
      currentDasha: `${dasha.current.lordName} — until ${dasha.current.end}`,
    },
    provenance: {
      provider: 'astronomy-engine+lahiri',
      provider_version: 'web-beta-1',
      computed_at: new Date().toISOString(),
    },
  };
}

/**
 * Compact kundali JSON for LLM context (preferred over XML — matches our canonical chart).
 * Keeps birth stamp + placements; drops internal provenance / place ids.
 */
export function chartJsonForPrompt(chart) {
  if (!chart) return null;
  const birth = chart.birth || {};
  return {
    ayanamsa: chart.ayanamsa || 'lahiri',
    house_system: chart.house_system || 'whole_sign',
    birth: {
      date: birth.date || null,
      time: birth.time || null,
      place: birth.place || null,
      lat: birth.lat ?? null,
      lon: birth.lon ?? null,
      tz: birth.tz || null,
      tzOffsetHours: birth.tzOffsetHours ?? null,
    },
    lagna: chart.lagna
      ? {
          rashi: chart.lagna.rashiName || chart.lagna.rashi,
          degree: chart.lagna.degree,
          nakshatra: chart.lagna.nakshatraName || chart.lagna.nakshatra,
          pada: chart.lagna.pada,
        }
      : null,
    summary: chart.summary || null,
    grahas: (chart.grahas || []).map((g) => ({
      name: g.name,
      rashi: g.rashiName || g.rashi,
      degree: g.degree,
      house: g.house,
      nakshatra: g.nakshatraName || g.nakshatra,
      pada: g.pada,
      retrograde: Boolean(g.retrograde),
    })),
    houses: (chart.houses || []).map((h) => ({
      house: h.house,
      sign: h.sign,
      planets: h.planets || [],
    })),
    dasha: chart.dasha
      ? {
          current: chart.dasha.current
            ? {
                lord: chart.dasha.current.lordName || chart.dasha.current.lord,
                end: chart.dasha.current.end,
              }
            : null,
        }
      : null,
  };
}

/** Human-readable lines (legacy / fallbacks). Prefer chartJsonForPrompt for LLM. */
export function chartContextForPrompt(chart) {
  if (!chart) return 'No chart available.';
  const birth = chart.birth || {};
  const lines = [
    // Birth stamp stays for Jyotish; personal names are stripped elsewhere.
    birth.date || birth.time || birth.place
      ? `Birth: ${birth.date || '?'} ${birth.time || '?'} at ${birth.place || '?'}${
          birth.lat != null && birth.lon != null
            ? ` (lat ${birth.lat}, lon ${birth.lon}${birth.tz ? `, ${birth.tz}` : ''})`
            : ''
        }`
      : null,
    `Lagna: ${chart.summary.lagna}`,
    `Moon: ${chart.summary.moonSign} (${chart.summary.nakshatra})`,
    `Current dasha: ${chart.summary.currentDasha}`,
    'Grahas:',
    ...chart.grahas.map(
      (g) =>
        `- ${g.name}: ${g.rashiName} ${g.degree}°, house ${g.house}, ${g.nakshatraName} pada ${g.pada}`
    ),
  ].filter(Boolean);
  return lines.join('\n');
}

/**
 * Sync builder used by chat. Webpack resolves the static re-export; do not use
 * CommonJS require() — it is undefined in the browser bundle and broke replies.
 */
export { buildLlmChartContextFromMatrix as buildLlmChartContext } from './chartLlmSlices';
