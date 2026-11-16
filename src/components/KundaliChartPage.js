import React, { useMemo } from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getBirthDetails, getChart } from '../betaSession';

function KundaliChartPage({ onBack }) {
  const chart = useMemo(() => getChart(), []);
  const birth = useMemo(() => getBirthDetails(), []);

  const houses = chart?.houses || [];
  const subtitle = chart
    ? `${birth?.place || 'Birth place'} • ${birth?.date || '—'} • ${birth?.time || '—'}`
    : 'Generate a chart from Birth Details to see placements here.';

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
          North Indian whole-sign chart (Lahiri) • {subtitle}
        </Typography>

        {!chart ? (
          <Box className="panel" sx={{ mt: 3 }}>
            <Typography sx={{ color: '#4A4560' }}>
              No chart is saved on this device yet. Complete onboarding or re-enter birth details to
              compute one.
            </Typography>
          </Box>
        ) : (
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
              aria-label="Natal chart houses"
            >
              {houses.map((house) => (
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
                  <Typography sx={{ fontSize: 11, color: '#6A6580' }}>
                    {house.house}. {house.sign}
                  </Typography>
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
                    ['Lagna', chart.summary.lagna],
                    ['Moon sign', chart.summary.moonSign],
                    ['Nakshatra', chart.summary.nakshatra],
                    ['Current dasha', chart.summary.currentDasha],
                  ].map(([label, value]) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <Typography sx={{ fontSize: 14, color: '#4A4560' }}>{label}</Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1E1B2E', textAlign: 'right' }}>
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #E6DEEF', borderRadius: 3 }}>
                <Typography sx={{ fontWeight: 700, color: '#1E1B2E' }}>Reading notes</Typography>
                <Typography sx={{ mt: 0.5, fontSize: 14, color: '#4A4560' }}>
                  Computed locally with Lahiri ayanamsa and whole-sign houses. Ask the oracle about
                  career, relationships or remedies — answers use these placements
                  {chart.birth.place_approx ? ' (place was approximated to a known city)' : ''}.
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default KundaliChartPage;
