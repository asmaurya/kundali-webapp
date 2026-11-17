import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { buildSecondaryViews } from '../lib/chartViews';
import { planetGlyph, planetLabel } from '../lib/grahaMeta';
import NorthIndianChart from './NorthIndianChart';

function StrengthRows({ rows }) {
  return (
    <Box sx={{ display: 'grid', gap: 1.25 }}>
      {rows.map((row) => (
        <Box key={row.planet}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E1B2E' }}>
              {row.planet}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#6A6580' }}>
              {row.note} · {row.score}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={row.score}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: '#EFE9F7',
              '& .MuiLinearProgress-bar': { bgcolor: '#6B4FA0', borderRadius: 3 },
            }}
          />
        </Box>
      ))}
    </Box>
  );
}

function TableView({ rows, columns }) {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key} sx={{ fontWeight: 700, color: '#3A3550', whiteSpace: 'nowrap' }}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.planet || row.id}>
              {columns.map((col) => (
                <TableCell key={col.key} sx={{ color: '#1E1B2E', fontSize: 13 }}>
                  {typeof col.render === 'function' ? col.render(row) : row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

async function fetchSwissGochara(view) {
  const response = await fetch('/api/gochara', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      lat: view.lat,
      lon: view.lon,
      tzOffsetHours: view.tzOffsetHours,
      lagnaRashi: view.lagnaRashi,
      at: new Date().toISOString(),
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail.slice(0, 120) || `Gochara ${response.status}`);
  }
  return response.json();
}

function ChartSecondaryPanel({ chart, lang = 'en', labelMode = 'planet' }) {
  const views = useMemo(() => buildSecondaryViews(chart, lang), [chart, lang]);
  const [expanded, setExpanded] = useState(false);
  const [gocharaRows, setGocharaRows] = useState(null);
  const [gocharaError, setGocharaError] = useState('');
  const [gocharaLoading, setGocharaLoading] = useState(false);

  useEffect(() => {
    setGocharaRows(null);
    setGocharaError('');
  }, [chart]);

  useEffect(() => {
    if (expanded !== 'gochara' || gocharaRows || gocharaLoading) return undefined;
    const view = views.find((v) => v.id === 'gochara');
    if (!view?.needsSwissGochara) return undefined;
    let cancelled = false;
    setGocharaLoading(true);
    fetchSwissGochara(view)
      .then((data) => {
        if (cancelled) return;
        const natal = view.natalByPlanet || {};
        setGocharaRows(
          (data.rows || []).map((row) => ({
            ...row,
            planetLabel: planetLabel(row.planet, lang),
            natalSign: natal[row.planet] || '—',
          }))
        );
      })
      .catch((error) => {
        if (cancelled) return;
        setGocharaError(String(error.message || error));
      })
      .finally(() => {
        if (!cancelled) setGocharaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [expanded, gocharaRows, gocharaLoading, views, lang]);

  if (!chart || views.length === 0) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography sx={{ fontWeight: 700, color: '#1E1B2E', mb: 1 }}>
        Other charts & tables
      </Typography>
      <Typography sx={{ fontSize: 13, color: '#6A6580', mb: 1.5 }}>
        Tap a row to expand. Lagna Kundali stays above as the primary chart.
      </Typography>

      {views.map((view) => (
        <Accordion
          key={view.id}
          disableGutters
          expanded={expanded === view.id}
          onChange={(_e, isOpen) => setExpanded(isOpen ? view.id : false)}
          sx={{
            mb: 1,
            border: '1px solid #E6DEEF',
            borderRadius: '12px !important',
            bgcolor: '#FFFFFF',
            '&:before': { display: 'none' },
            overflow: 'hidden',
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, color: '#1E1B2E' }}>{view.title}</Typography>
              <Typography sx={{ fontSize: 12, color: '#6A6580' }}>{view.subtitle}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2, pb: 2 }}>
            {view.kind === 'kundali' && (
              <Box sx={{ maxWidth: 360 }}>
                <NorthIndianChart
                  houses={view.houses}
                  grahas={view.grahas || chart.grahas || []}
                  lagnaRashi={view.lagnaRashi}
                  lang={lang}
                  labelMode={labelMode}
                  ariaLabel={`${view.title} north Indian chart`}
                />
              </Box>
            )}
            {view.kind === 'table' && view.id === 'grah-sthiti' && (
              <TableView
                rows={view.rows}
                columns={[
                  {
                    key: 'planet',
                    label: lang === 'hi' ? 'ग्रह' : 'Graha',
                    render: (row) => (
                      <span>
                        <span style={{ marginRight: 6 }}>{planetGlyph(row.glyph || row.planet)}</span>
                        {row.planet}
                      </span>
                    ),
                  },
                  { key: 'sign', label: lang === 'hi' ? 'राशि' : 'Rashi' },
                  { key: 'degree', label: lang === 'hi' ? 'अंश' : 'Degree' },
                  { key: 'house', label: lang === 'hi' ? 'भाव' : 'Bhava' },
                  { key: 'nakshatra', label: lang === 'hi' ? 'नक्षत्र' : 'Nakshatra' },
                  { key: 'marks', label: lang === 'hi' ? 'संकेत' : 'Flags' },
                ]}
              />
            )}
            {view.kind === 'table' && view.id === 'gochara' && (
              <>
                {gocharaLoading && <LinearProgress sx={{ mb: 1 }} />}
                {gocharaError && (
                  <Typography sx={{ color: '#8A4A4A', fontSize: 13 }}>{gocharaError}</Typography>
                )}
                {gocharaRows && (
                  <TableView
                    rows={gocharaRows}
                    columns={[
                      {
                        key: 'planet',
                        label: lang === 'hi' ? 'ग्रह' : 'Graha',
                        render: (row) => (
                          <span>
                            <span style={{ marginRight: 6 }}>{planetGlyph(row.planet)}</span>
                            {row.planetLabel || planetLabel(row.planet, lang)}
                          </span>
                        ),
                      },
                      { key: 'sign', label: lang === 'hi' ? 'गोचर' : 'Transit' },
                      { key: 'degree', label: lang === 'hi' ? 'अंश' : 'Deg' },
                      { key: 'house', label: lang === 'hi' ? 'लग्न से' : 'From lagna' },
                      { key: 'natalSign', label: lang === 'hi' ? 'जन्म' : 'Natal' },
                    ]}
                  />
                )}
              </>
            )}
            {view.kind === 'strength' && <StrengthRows rows={view.rows} />}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

export default ChartSecondaryPanel;
