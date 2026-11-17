import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getBirthDetails, getChart } from '../betaSession';
import { useLocale } from '../i18n/LocaleContext';
import NorthIndianChart from './NorthIndianChart';

function KundaliChartPage({ onBack }) {
  const { t, locale } = useLocale();
  const [chart, setChart] = useState(() => getChart());
  const [birth, setBirth] = useState(() => getBirthDetails());

  useEffect(() => {
    setChart(getChart());
    setBirth(getBirthDetails());
  }, []);

  const houses = chart?.houses || [];
  const subtitle = chart
    ? `${birth?.place || '—'} • ${birth?.date || '—'} • ${birth?.time || '—'}`
    : t('chartEmpty');

  return (
    <Box className="stack-page">
      <Box className="hill-deco" sx={{ opacity: 0.7 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: 'min(1040px, 100%)', margin: '0 auto', padding: '28px 32px 48px' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: '#1E1B2E', pl: 0, mb: 2 }}>
          {t('backHome')}
        </Button>

        <Typography component="h2" sx={{ fontSize: 26, fontWeight: 700, color: '#1E1B2E' }}>
          {t('chartTitle')}
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 15, color: '#3A3550' }}>
          {t('chartSubtitle')} • {subtitle}
        </Typography>

        {!chart ? (
          <Box className="panel" sx={{ mt: 3 }}>
            <Typography sx={{ color: '#4A4560' }}>{t('chartEmpty')}</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 3, mt: 3, gridTemplateColumns: { xs: '1fr', md: '420px 1fr' } }}>
            <NorthIndianChart houses={houses} lagnaRashi={chart.lagna?.rashi || 1} lang={locale} />

            <Box sx={{ display: 'grid', gap: 2, alignContent: 'start' }}>
              <Box className="panel">
                <Typography sx={{ fontWeight: 700, color: '#1E1B2E' }}>{t('chartSummary')}</Typography>
                <Box sx={{ display: 'grid', gap: 1, mt: 1.5 }}>
                  {[
                    [t('lagna'), chart.summary.lagna],
                    [t('moonSign'), chart.summary.moonSign],
                    [t('nakshatra'), chart.summary.nakshatra],
                    [t('currentDasha'), chart.summary.currentDasha],
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
                <Typography sx={{ fontWeight: 700, color: '#1E1B2E' }}>{t('readingNotes')}</Typography>
                <Typography sx={{ mt: 0.5, fontSize: 14, color: '#4A4560' }}>
                  {t('readingNotesBody')}
                  {chart.birth.place_approx ? t('placeApprox') : ''}.
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
