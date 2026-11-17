import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

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

const PLANET_SHORT = {
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

const SIGN_SHORT = {
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
 *   grahas?: Array<{name:string,rashiName?:string}>,
 *   lagnaRashi?: number,
 *   lang?: 'en'|'hi',
 *   labelMode?: 'planet'|'sign',
 *   ariaLabel?: string,
 * }} props
 */
function NorthIndianChart({
  houses = [],
  grahas = [],
  lagnaRashi = 1,
  lang = 'en',
  labelMode = 'planet',
  ariaLabel,
}) {
  const short = PLANET_SHORT[lang] || PLANET_SHORT.en;
  const label =
    ariaLabel || (lang === 'hi' ? 'उत्तर भारतीय कुंडली' : 'North Indian natal chart');

  const grahaByName = useMemo(() => {
    const map = {};
    (grahas || []).forEach((g) => {
      map[g.name] = g;
    });
    return map;
  }, [grahas]);

  const cells = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const house = index + 1;
      const row = houses.find((item) => item.house === house) || {
        house,
        sign: '',
        planets: [],
      };
      const rashiNumber = ((lagnaRashi - 1 + house - 1) % 12) + 1;
      const poly = HOUSE_POLYGONS[house];
      const center = centroid(poly);
      return { house, row, rashiNumber, poly, center };
    });
  }, [houses, lagnaRashi]);

  const formatPlanet = (name, houseSign) => {
    const graha = grahaByName[name];
    const signName = graha?.rashiName || houseSign || '';
    if (labelMode === 'sign') {
      return SIGN_SHORT[signName] || signName.slice(0, 2) || short[name] || name.slice(0, 2);
    }
    return short[name] || name.slice(0, 2);
  };

  const hoverTitle = (name, houseSign) => {
    const graha = grahaByName[name];
    const signName = graha?.rashiName || houseSign || '';
    return signName ? `${name} · ${signName}` : name;
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 420,
        aspectRatio: '1 / 1',
        bgcolor: '#FDFBFF',
        border: '2px solid #3B3050',
        borderRadius: 2,
        overflow: 'hidden',
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
              y={center.y - (row.planets.length ? 10 : 0)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#6A6580"
              fontSize="11"
              fontFamily="inherit"
            >
              {rashiNumber}
            </text>
            {row.planets.map((name, index) => {
              const count = row.planets.length;
              const offset = (index - (count - 1) / 2) * 14;
              return (
                <text
                  key={`${house}-${name}`}
                  x={center.x + offset}
                  y={center.y + 12}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#5B3FA0"
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="inherit"
                  style={{ cursor: 'default' }}
                >
                  <title>{hoverTitle(name, row.sign)}</title>
                  {formatPlanet(name, row.sign)}
                </text>
              );
            })}
          </g>
        ))}
      </svg>
      <Typography sx={{ px: 1.5, pb: 1, fontSize: 11, color: '#6A6580', textAlign: 'center' }}>
        {labelMode === 'sign'
          ? 'House 1 = Lagna · numbers are rashis · glyphs show planet signs · hover for name'
          : 'House 1 = Lagna · numbers are rashis · planet abbrev · hover for full name + sign'}
      </Typography>
    </Box>
  );
}

export default NorthIndianChart;
