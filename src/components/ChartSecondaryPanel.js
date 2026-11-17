import React, { useMemo, useState } from 'react';
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

function ChartSecondaryPanel({ chart, lang = 'en' }) {
  const views = useMemo(() => buildSecondaryViews(chart), [chart]);
  const [expanded, setExpanded] = useState(false);

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
              <Box sx={{ maxWidth: 320 }}>
                <NorthIndianChart
                  houses={view.houses}
                  lagnaRashi={view.lagnaRashi}
                  lang={lang}
                  ariaLabel={`${view.title} north Indian chart`}
                />
              </Box>
            )}
            {view.kind === 'table' && view.id === 'grah-sthiti' && (
              <TableView
                rows={view.rows}
                columns={[
                  { key: 'planet', label: 'Graha' },
                  { key: 'sign', label: 'Rashi' },
                  { key: 'degree', label: 'Deg' },
                  { key: 'house', label: 'Bhava' },
                  { key: 'nakshatra', label: 'Nakshatra' },
                  {
                    key: 'retrograde',
                    label: 'R',
                    render: (row) => (row.retrograde ? 'R' : '—'),
                  },
                ]}
              />
            )}
            {view.kind === 'table' && view.id === 'gochara' && (
              <TableView
                rows={view.rows}
                columns={[
                  { key: 'planet', label: 'Graha' },
                  { key: 'sign', label: 'Transit' },
                  { key: 'degree', label: 'Deg' },
                  { key: 'house', label: 'From lagna' },
                  { key: 'natalSign', label: 'Natal' },
                ]}
              />
            )}
            {view.kind === 'strength' && <StrengthRows rows={view.rows} />}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

export default ChartSecondaryPanel;
