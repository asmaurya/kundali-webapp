/**
 * Swiss Ephemeris natal chart → Kundali canonical JSON.
 * Uses @kuntay/swisseph (WASM, Moshier fallback when .se1 files absent).
 */
import {
  Ayanamsa,
  Body,
  Flag,
  HouseSystem,
  createSwissEph,
} from '@kuntay/swisseph';
import { formatTzOffset, parseBirthDateTime, resolvePlace } from './place.js';

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

const PLANETS = [
  ['sun', Body.Sun, 'Sun'],
  ['moon', Body.Moon, 'Moon'],
  ['mars', Body.Mars, 'Mars'],
  ['mercury', Body.Mercury, 'Mercury'],
  ['jupiter', Body.Jupiter, 'Jupiter'],
  ['venus', Body.Venus, 'Venus'],
  ['saturn', Body.Saturn, 'Saturn'],
];

function norm360(deg) {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

function placementFromSidereal(lon) {
  const longitude = norm360(lon);
  const rashi = Math.floor(longitude / 30) + 1;
  const degree = longitude % 30;
  const nakIndex = Math.floor(longitude / (360 / 27));
  const pada = Math.floor((longitude % (360 / 27)) / (360 / 108)) + 1;
  return {
    rashi,
    rashiName: RASHIS[rashi - 1],
    degree: Number(degree.toFixed(2)),
    nakshatra: nakIndex + 1,
    nakshatraName: NAKSHATRAS[nakIndex],
    pada,
    longitude: Number(longitude.toFixed(4)),
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
  const elapsedYears = DASHA_YEARS[lordIndex] - yearsRemaining;
  const mahadashaStart = new Date(
    birthDate.getTime() - elapsedYears * 365.25 * 24 * 3600 * 1000
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

let swePromise = null;

async function getSwe() {
  if (!swePromise) {
    swePromise = createSwissEph().then((swe) => {
      swe.setSiderealMode(Ayanamsa.Lahiri);
      return swe;
    });
  }
  return swePromise;
}

/**
 * @param {{ date: string, time: string, place: string, lat?: number, lon?: number, tzOffsetHours?: number, countryCode?: string, placeId?: string, source?: string }} birth
 */
export async function computeNatalChart(birth) {
  if (!birth || !birth.date || !birth.time || !birth.place) {
    throw new Error('Birth date, time and place are all required.');
  }

  const loc = resolvePlace(birth.place, birth);
  const parts = parseBirthDateTime(birth.date, birth.time);
  const utcMs =
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) -
    loc.tzOffsetHours * 3600 * 1000;
  const utc = new Date(utcMs);
  if (Number.isNaN(utc.getTime())) {
    throw new Error('Could not understand that birth date and time.');
  }

  const utHour =
    utc.getUTCHours() +
    utc.getUTCMinutes() / 60 +
    utc.getUTCSeconds() / 3600 +
    utc.getUTCMilliseconds() / 3600000;

  const swe = await getSwe();
  const jd = swe.julianDay(
    utc.getUTCFullYear(),
    utc.getUTCMonth() + 1,
    utc.getUTCDate(),
    utHour
  );

  const sidereal = { flags: Flag.Sidereal };
  const ayanamsaDeg = swe.ayanamsa(jd);
  const houses = swe.houses(
    jd,
    loc.lat,
    loc.lon,
    HouseSystem.EqualWholeSign,
    sidereal
  );

  const lagna = placementFromSidereal(houses.ascendant);
  const ephemerisModels = new Set();

  const grahas = PLANETS.map(([id, body, name]) => {
    const pos = swe.calcWithSign(jd, body, sidereal);
    ephemerisModels.add(pos.ephemeris);
    const place = placementFromSidereal(pos.longitude);
    return {
      id,
      name,
      ...place,
      house: wholeSignHouse(place.rashi, lagna.rashi),
      retrograde: Boolean(pos.retrograde),
    };
  });

  const rahuPos = swe.calcWithSign(jd, Body.MeanNode, sidereal);
  ephemerisModels.add(rahuPos.ephemeris);
  const rahu = placementFromSidereal(rahuPos.longitude);
  const ketu = placementFromSidereal(rahuPos.longitude + 180);
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
    ayanamsa_deg: Number(ayanamsaDeg.toFixed(4)),
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
      provider: 'swiss-ephemeris-wasm',
      provider_version: 'kuntay-swisseph-0.2',
      ephemeris: [...ephemerisModels].join('+') || 'moshier',
      ayanamsa: 'lahiri',
      computed_at: new Date().toISOString(),
      runtime: 'vercel',
    },
  };
}
