import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Tab, Tabs, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLocale } from '../i18n/LocaleContext';
import { ensureMemberChart, listProfiles, persistFamilyMembers, SELF_ID } from '../lib/profiles';
import { addReport } from '../lib/libraryStore';
import NorthIndianChart from './NorthIndianChart';
import ChartSecondaryPanel from './ChartSecondaryPanel';
import DashaPanel from './DashaPanel';

function KundaliChartPage({ onBack }) {
  const { t, locale } = useLocale();
  const [profiles, setProfiles] = useState(() => listProfiles());
  const [activeId, setActiveId] = useState(SELF_ID);

  useEffect(() => {
    // Ensure family members with birth details have real charts available for tabs.
    const nextFamily = listProfiles()
      .filter((p) => !p.isSelf)
      .map((member) => ensureMemberChart(member));
    persistFamilyMembers(nextFamily);
    setProfiles(listProfiles());
  }, []);

  const active = useMemo(
    () => profiles.find((p) => String(p.id) === String(activeId)) || profiles[0],
    [profiles, activeId]
  );

  const chart = active?.isSelf ? active.chart : active?.chart || null;
  const birthLabel = active
    ? `${active.place || '—'} • ${active.date || '—'} • ${active.time || '—'}`
    : '';

  useEffect(() => {
    if (chart && active) {
      // Soft-touch: keep a kundali snapshot in the reports library per member.
      // Deduping by title+member keeps noise down.
    }
  }, [chart, active]);

  const onTabChange = (_event, value) => {
    setActiveId(value);
    const profile = profiles.find((p) => String(p.id) === String(value));
    if (profile?.chart) {
      addReport({
        title: `${profile.name} · Lagna Kundali`,
        memberId: String(profile.id),
        memberName: profile.name,
        kind: 'kundali',
        summary: `Opened ${profile.relation} chart (${profile.chart.summary?.lagna || 'lagna'}).`,
        source: 'kundali',
      });
    }
  };

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
          {t('chartSubtitle')}
        </Typography>

        <Tabs
          value={String(active?.id || SELF_ID)}
          onChange={onTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mt: 2,
            borderBottom: '1px solid #E6DEEF',
            '& .MuiTab-root': { textTransform: 'none', minHeight: 44, fontWeight: 600 },
            '& .Mui-selected': { color: '#5B3FA0' },
            '& .MuiTabs-indicator': { bgcolor: '#5B3FA0' },
          }}
        >
          {profiles.map((profile) => (
            <Tab
              key={profile.id}
              value={String(profile.id)}
              label={
                profile.isSelf
                  ? `${profile.name} (You)`
                  : `${profile.name} · ${profile.relation}`
              }
            />
          ))}
        </Tabs>

        {!chart ? (
          <Box className="panel" sx={{ mt: 3 }}>
            <Typography sx={{ color: '#4A4560' }}>
              {active?.isSelf
                ? t('chartEmpty')
                : `${active?.name || 'This member'} does not have birth details yet. Add them on the Family page to prepare a chart.`}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 3, mt: 3, gridTemplateColumns: { xs: '1fr', md: '420px 1fr' } }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#6A6580', mb: 1 }}>
                Lagna Kundali
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#4A4560', mb: 1.5 }}>{birthLabel}</Typography>
              <NorthIndianChart
                houses={chart.houses || []}
                lagnaRashi={chart.lagna?.rashi || 1}
                lang={locale}
                ariaLabel="Lagna Kundali north Indian chart"
              />
            </Box>

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
                  {chart.birth?.place_approx ? t('placeApprox') : ''}.
                </Typography>
              </Box>

              <DashaPanel chart={chart} />
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <ChartSecondaryPanel chart={chart} lang={locale} />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default KundaliChartPage;
