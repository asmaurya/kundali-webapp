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
 * North Indian whole-sign chart.
 * @param {{ houses: Array<{house:number,sign:string,planets:string[]}>, lagnaRashi?: number, lang?: 'en'|'hi' }} props
 */
function NorthIndianChart({ houses = [], lagnaRashi = 1, lang = 'en' }) {
  const short = PLANET_SHORT[lang] || PLANET_SHORT.en;

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
      aria-label={lang === 'hi' ? 'उत्तर भारतीय कुंडली' : 'North Indian natal chart'}
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
            {row.planets.length > 0 && (
              <text
                x={center.x}
                y={center.y + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#5B3FA0"
                fontSize="12"
                fontWeight="700"
                fontFamily="inherit"
              >
                {row.planets.map((name) => short[name] || name.slice(0, 2)).join(' ')}
              </text>
            )}
          </g>
        ))}
      </svg>
      <Typography sx={{ px: 1.5, pb: 1, fontSize: 11, color: '#6A6580', textAlign: 'center' }}>
        {lang === 'hi'
          ? 'घर 1 = लग्न · राशियाँ संख्या में · ग्रह संक्षेप में'
          : 'House 1 = Lagna · numbers are rashis · planets abbreviated'}
      </Typography>
    </Box>
  );
}

export default NorthIndianChart;
