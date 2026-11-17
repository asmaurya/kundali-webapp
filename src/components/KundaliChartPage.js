import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Tab, Tabs, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { useLocale } from '../i18n/LocaleContext';
import { ensureMemberChart, listProfiles, persistFamilyMembers, SELF_ID } from '../lib/profiles';
import NorthIndianChart from './NorthIndianChart';
import ChartSecondaryPanel from './ChartSecondaryPanel';
import DashaPanel from './DashaPanel';

function printKundali({ profile, chart }) {
  const houses = (chart.houses || [])
    .map((h) => `H${h.house} ${h.sign}: ${(h.planets || []).join(', ') || '—'}`)
    .join('\n');
  const grahas = (chart.grahas || [])
    .map((g) => `${g.name}: ${g.rashiName} ${g.degree}° · house ${g.house} · ${g.nakshatraName}`)
    .join('\n');
  const html = `<!doctype html><html><head><title>${profile.name} Kundali</title>
    <style>
      body{font-family:Georgia,serif;color:#1E1B2E;padding:32px;line-height:1.45}
      h1{font-size:22px;margin:0 0 4px} .meta{color:#4A4560;margin-bottom:20px}
      h2{font-size:15px;margin:18px 0 6px} pre{white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:12px}
    </style></head><body>
    <h1>${profile.name}${profile.isSelf ? ' (You)' : ''} · Lagna Kundali</h1>
    <div class="meta">${profile.relation} · ${profile.place || '—'} · ${profile.date || '—'} · ${profile.time || '—'}</div>
    <h2>Summary</h2>
    <div>Lagna: ${chart.summary?.lagna || '—'} · Moon: ${chart.summary?.moonSign || '—'} ·
    Nakshatra: ${chart.summary?.nakshatra || '—'} · Dasha: ${chart.summary?.currentDasha || '—'}</div>
    <h2>Houses</h2><pre>${houses}</pre>
    <h2>Grahas</h2><pre>${grahas}</pre>
    <script>window.onload=()=>window.print()</script>
    </body></html>`;
  const win = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

function KundaliChartPage({ onBack }) {
  const { t, locale } = useLocale();
  const [profiles, setProfiles] = useState(() => listProfiles());
  const [activeId, setActiveId] = useState(SELF_ID);
  const [labelMode, setLabelMode] = useState('planet');

  useEffect(() => {
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

  return (
    <Box className="stack-page">
      <Box className="hill-deco" sx={{ opacity: 0.7 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: 'min(1040px, 100%)', margin: '0 auto', padding: '28px 32px 48px' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: '#1E1B2E', pl: 0 }}>
            {t('backHome')}
          </Button>
          {chart && (
            <Button
              startIcon={<PrintOutlinedIcon />}
              onClick={() => printKundali({ profile: active, chart })}
              sx={{ ml: 'auto', color: '#5B3FA0' }}
            >
              Print Kundali
            </Button>
          )}
        </Box>

        <Typography component="h2" sx={{ fontSize: 26, fontWeight: 700, color: '#1E1B2E' }}>
          {t('chartTitle')}
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 15, color: '#3A3550' }}>
          {t('chartSubtitle')}
        </Typography>

        <Tabs
          value={String(active?.id || SELF_ID)}
          onChange={(_event, value) => setActiveId(value)}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#6A6580' }}>
                  Lagna Kundali
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={labelMode}
                  onChange={(_e, value) => value && setLabelMode(value)}
                  sx={{ ml: 'auto' }}
                >
                  <ToggleButton value="planet" sx={{ textTransform: 'none', px: 1.5 }}>
                    Planet
                  </ToggleButton>
                  <ToggleButton value="sign" sx={{ textTransform: 'none', px: 1.5 }}>
                    Sign
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Typography sx={{ fontSize: 13, color: '#4A4560', mb: 1.5 }}>{birthLabel}</Typography>
              <NorthIndianChart
                houses={chart.houses || []}
                grahas={chart.grahas || []}
                lagnaRashi={chart.lagna?.rashi || 1}
                lang={locale}
                labelMode={labelMode}
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
              <ChartSecondaryPanel chart={chart} lang={locale} labelMode={labelMode} />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default KundaliChartPage;
