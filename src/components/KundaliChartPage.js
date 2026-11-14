import React from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const HOUSES = [
  { house: 1, sign: 'Aries', planets: ['Sun'] },
  { house: 2, sign: 'Taurus', planets: [] },
  { house: 3, sign: 'Gemini', planets: ['Mercury'] },
  { house: 4, sign: 'Cancer', planets: ['Moon'] },
  { house: 5, sign: 'Leo', planets: [] },
  { house: 6, sign: 'Virgo', planets: ['Venus'] },
  { house: 7, sign: 'Libra', planets: [] },
  { house: 8, sign: 'Scorpio', planets: ['Saturn'] },
  { house: 9, sign: 'Sagittarius', planets: ['Jupiter'] },
  { house: 10, sign: 'Capricorn', planets: [] },
  { house: 11, sign: 'Aquarius', planets: [] },
  { house: 12, sign: 'Pisces', planets: ['Rahu'] },
];

function KundaliChartPage({ onBack }) {
  return (
    <Box className="stack-page">
      <Box className="hill-deco" sx={{ opacity: 0.7 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: 'min(1040px, 100%)', margin: '0 auto', padding: '28px 32px 48px' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ color: '#1E1B2E', pl: 0, mb: 2 }}
        >
          Back to Home
        </Button>

        <Typography component="h2" sx={{ fontSize: 26, fontWeight: 700, color: '#1E1B2E' }}>
          Kundali Chart
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 15, color: '#3A3550' }}>
          North Indian chart for Abhishek • 15 Nov 1985 • 09:41 • Bengaluru, India
        </Typography>

        <Box sx={{ display: 'grid', gap: 3, mt: 3, gridTemplateColumns: { xs: '1fr', md: '360px 1fr' } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              aspectRatio: '1 / 1',
              overflow: 'hidden',
              bgcolor: '#FDFBFF',
              border: '2px solid #3B3050',
              borderRadius: 2,
            }}
          >
            {HOUSES.map((house) => (
              <Box
                key={house.house}
                sx={{
                  p: 1,
                  borderRight: '1px solid #CFC4EA',
                  borderBottom: '1px solid #CFC4EA',
                  '&:nth-of-type(3n)': { borderRight: 'none' },
                  '&:nth-of-type(n+10)': { borderBottom: 'none' },
                }}
              >
                <Typography sx={{ fontSize: 11, color: '#6A6580' }}>{house.sign}</Typography>
                {house.planets.map((planet) => (
                  <Chip
                    key={planet}
                    size="small"
                    label={planet}
                    sx={{
                      mt: 0.5,
                      height: 20,
                      fontSize: 11,
                      color: '#5B3FA0',
                      bgcolor: '#EFE9F7',
                      border: '1px solid #D8CFE6',
                    }}
                  />
                ))}
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'grid', gap: 2, alignContent: 'start' }}>
            <Box className="panel">
              <Typography sx={{ fontWeight: 700, color: '#1E1B2E' }}>Chart summary</Typography>
              <Box sx={{ display: 'grid', gap: 1, mt: 1.5 }}>
                {[
                  ['Lagna', 'Taurus'],
                  ['Moon sign', 'Cancer'],
                  ['Nakshatra', 'Pushya'],
                  ['Current dasha', 'Venus — 4 years 2 months'],
                ].map(([label, value]) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 14, color: '#4A4560' }}>{label}</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1E1B2E' }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #E6DEEF', borderRadius: 3 }}>
              <Typography sx={{ fontWeight: 700, color: '#1E1B2E' }}>Key remedies</Typography>
              <Typography sx={{ mt: 0.5, fontSize: 14, color: '#4A4560' }}>
                Wear a yellow sapphire on Thursday, chant Shani mantra on Saturdays and offer
                sesame oil to the temple lamp for a smoother career phase.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default KundaliChartPage;
