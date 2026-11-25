import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import {
  FLAG_LEGEND,
  canonicalPlanetName,
  enrichGrahas,
  planetLabel,
} from '../lib/grahaMeta';
import PlanetGlyph, { GRAHA_ORDER, GRAHA_SANSKRIT, PlanetGlyphMark } from './PlanetGlyph';

/** Classic North Indian diamond layout (viewBox 0 0 300 300). Houses are fixed; lagna sits in house 1. */
export const HOUSE_POLYGONS = {
  1: [
    [150, 0],
    [225, 75],
    [150, 150],
    [75, 75],
  ],
  2: [
    [0, 0],
    [150, 0],
    [75, 75],
  ],
  3: [
    [0, 0],
    [75, 75],
    [0, 150],
  ],
  4: [
    [0, 150],
    [75, 75],
    [150, 150],
    [75, 225],
  ],
  5: [
    [0, 300],
    [0, 150],
    [75, 225],
  ],
  6: [
    [0, 300],
    [150, 300],
    [75, 225],
  ],
  7: [
    [150, 300],
    [225, 225],
    [150, 150],
    [75, 225],
  ],
  8: [
    [300, 300],
    [150, 300],
    [225, 225],
  ],
  9: [
    [300, 300],
    [300, 150],
    [225, 225],
  ],
  10: [
    [300, 150],
    [225, 75],
    [150, 150],
    [225, 225],
  ],
  11: [
    [300, 0],
    [300, 150],
    [225, 75],
  ],
  12: [
    [300, 0],
    [150, 0],
    [225, 75],
  ],
};

const SIGN_SHORT = {
  en: {
    Aries: 'Ar',
    Taurus: 'Ta',
    Gemini: 'Ge',
    Cancer: 'Cn',
    Leo: 'Le',
    Virgo: 'Vi',
    Libra: 'Li',
    Scorpio: 'Sc',
    Sagittarius: 'Sg',
    Capricorn: 'Cp',
    Aquarius: 'Aq',
    Pisces: 'Pi',
  },
  hi: {
    Aries: 'मेष',
    Taurus: 'वृष',
    Gemini: 'मिथु',
    Cancer: 'कर्क',
    Leo: 'सिंह',
    Virgo: 'कन्या',
    Libra: 'तुला',
    Scorpio: 'वृश्च',
    Sagittarius: 'धनु',
    Capricorn: 'मकर',
    Aquarius: 'कुंभ',
    Pisces: 'मीन',
  },
};

function centroid(points) {
  const sum = points.reduce(
    (acc, [x, y]) => ({ x: acc.x + x, y: acc.y + y }),
    { x: 0, y: 0 }
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function pointsAttr(points) {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

/**
 * @param {{
 *   houses: Array<{house:number,sign:string,planets:string[]}>,
 *   grahas?: Array<object>,
 *   lagnaRashi?: number,
 *   lang?: 'en'|'hi',
 *   labelMode?: 'planet'|'sign',
 *   ariaLabel?: string,
 *   showLegend?: boolean,
 * }} props
 */
function NorthIndianChart({
  houses = [],
  grahas = [],
  lagnaRashi = 1,
  lang = 'en',
  labelMode = 'planet',
  ariaLabel,
  showLegend = true,
}) {
  const label =
    ariaLabel || (lang === 'hi' ? 'उत्तर भारतीय कुंडली' : 'North Indian natal chart');
  const signShort = SIGN_SHORT[lang] || SIGN_SHORT.en;

  const enriched = useMemo(() => enrichGrahas(grahas || []), [grahas]);

  const grahaByName = useMemo(() => {
    const map = {};
    enriched.forEach((g) => {
      const key = canonicalPlanetName(g.name || g.id);
      if (key) map[key] = g;
      if (g.name) map[g.name] = g;
    });
    return map;
  }, [enriched]);

  const cells = useMemo(() => {
    const planetsFromGrahas = (house) =>
      enriched
        .filter((g) => Number(g.house) === house)
        .map((g) => canonicalPlanetName(g.name || g.id))
        .filter(Boolean);

    return Array.from({ length: 12 }, (_, index) => {
      const house = index + 1;
      const row = houses.find((item) => item.house === house) || {
        house,
        sign: '',
        planets: [],
      };
      let planets = (row.planets || [])
        .map((entry) => canonicalPlanetName(entry))
        .filter(Boolean);
      // If house rows lack names (older saves / partial API payloads), rebuild from grahas.
      if (!planets.length && enriched.length) {
        planets = planetsFromGrahas(house);
      }
      const rashiNumber = ((lagnaRashi - 1 + house - 1) % 12) + 1;
      const poly = HOUSE_POLYGONS[house];
      const center = centroid(poly);
      return {
        house,
        row: { ...row, planets },
        rashiNumber,
        poly,
        center,
      };
    });
  }, [houses, lagnaRashi, enriched]);

  const formatSignLabel = (name, houseSign) => {
    const key = canonicalPlanetName(name);
    const graha = grahaByName[key] || grahaByName[name];
    const signName = graha?.rashiName || houseSign || '';
    const marks = graha?.marks || '';
    const abbr = signShort[signName] || signName.slice(0, 2) || '?';
    return `${abbr}${marks}`;
  };

  const hoverTitle = (name, houseSign) => {
    const key = canonicalPlanetName(name);
    const graha = grahaByName[key] || grahaByName[name];
    const display = planetLabel(key || name, lang);
    const signName = graha?.rashiName || houseSign || '';
    const bits = [display];
    if (signName) bits.push(signName);
    if (graha?.degree != null) bits.push(`${graha.degree}°`);
    if (graha?.uchcha) bits.push(lang === 'hi' ? 'उच्च' : 'Uchch');
    if (graha?.neecha) bits.push(lang === 'hi' ? 'नीच' : 'Neech');
    if (graha?.vakri) bits.push(lang === 'hi' ? 'वक्री' : 'Vakri');
    if (graha?.ast) bits.push(lang === 'hi' ? 'अस्त' : 'Ast');
    if (graha?.vargottam) bits.push(lang === 'hi' ? 'वर्गोत्तम' : 'Vargottam');
    return bits.join(' · ');
  };

  return (
    <Box>
      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
          aspectRatio: '1 / 1',
          bgcolor: '#FDFBFF',
          border: '2px solid #3B3050',
          borderRadius: 2,
          overflow: 'visible',
        }}
        aria-label={label}
      >
        <svg viewBox="0 0 300 300" width="100%" height="100%" role="img">
          <rect x="0" y="0" width="300" height="300" fill="#FDFBFF" />
          {cells.map(({ house, row, rashiNumber, poly, center }) => (
            <g key={house}>
              <polygon
                points={pointsAttr(poly)}
                fill={house === 1 ? '#F3EEFA' : '#FDFBFF'}
                stroke="#3B3050"
                strokeWidth="1.25"
              />
              <text
                x={center.x}
                y={center.y - (row.planets.length ? 14 : 0)}
                dy="0.35em"
                textAnchor="middle"
                fill="#6A6580"
                fontSize="10"
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
              >
                {rashiNumber}
              </text>
              {row.planets.map((name, index) => {
                const count = row.planets.length;
                // Extra spacing: stack when crowded, otherwise spread horizontally.
                const stack = count > 2;
                const x = stack
                  ? center.x
                  : center.x + (index - (count - 1) / 2) * 34;
                const y = stack
                  ? center.y + 4 + index * 15
                  : center.y + 16;
                const planetKey = canonicalPlanetName(name);
                const graha = grahaByName[planetKey] || grahaByName[name];
                const marks = graha?.marks || '';
                const short = planetLabel(planetKey || name, lang, { short: true });
                if (labelMode === 'sign') {
                  return (
                    <text
                      key={`${house}-${planetKey || name}-${index}`}
                      x={x}
                      y={y}
                      dy="0.35em"
                      textAnchor="middle"
                      fill="#5B3FA0"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                      style={{ cursor: 'default' }}
                    >
                      <title>{hoverTitle(planetKey || name, row.sign)}</title>
                      {formatSignLabel(planetKey || name, row.sign)}
                    </text>
                  );
                }
                return (
                  <g
                    key={`${house}-${planetKey || name}-${index}`}
                    transform={`translate(${x - 16}, ${y - 7})`}
                    style={{ cursor: 'default' }}
                  >
                    <title>{hoverTitle(planetKey || name, row.sign)}</title>
                    <PlanetGlyphMark planet={planetKey || name} size={13} />
                    <text
                      x="15"
                      y="10"
                      fill="#5B3FA0"
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                    >
                      {short}
                      {marks}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </Box>

      {showLegend && (
        <Box sx={{ mt: 1.25, maxWidth: 420 }}>
          <Typography sx={{ fontSize: 11, color: '#6A6580', mb: 0.75, textAlign: 'center' }}>
            {lang === 'hi'
              ? 'भाव 1 = लग्न · अंक = राशि · हिन्दू ग्रह चिह्न + नाम'
              : 'House 1 = Lagna · numbers = rashis · Hindu graha glyph + name'}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 0.75,
              mb: 1.25,
              px: 0.5,
            }}
            aria-label={lang === 'hi' ? 'ग्रह चिह्न' : 'Planet symbols'}
          >
            {GRAHA_ORDER.map((planet) => (
              <Box
                key={planet}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  color: '#1E1B2E',
                  minWidth: 0,
                }}
              >
                <PlanetGlyph planet={planet} size={18} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1.15 }}>
                    {GRAHA_SANSKRIT[planet]}
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: '#6A6580', lineHeight: 1.15 }}>
                    {planetLabel(planet, lang, { short: true })}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              justifyContent: 'center',
              px: 0.5,
            }}
            aria-label={lang === 'hi' ? 'कुंडली संकेत' : 'Chart legend'}
          >
            {FLAG_LEGEND.map((item) => (
              <Typography
                key={item.key}
                component="span"
                sx={{
                  fontSize: 11,
                  color: '#3A3550',
                  bgcolor: '#F7F4FB',
                  border: '1px solid #E6DEEF',
                  borderRadius: 1,
                  px: 0.75,
                  py: 0.25,
                  whiteSpace: 'nowrap',
                }}
              >
                <strong>{item.mark}</strong> {lang === 'hi' ? item.hi : item.en}
              </Typography>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default NorthIndianChart;
