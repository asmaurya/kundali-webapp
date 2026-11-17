import React, { useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  enrichGrahas,
  formatDegreeDms,
  planetGlyph,
  planetLabel,
} from '../lib/grahaMeta';

function GrahaDegreeTable({ chart, lang = 'en' }) {
  const rows = useMemo(() => enrichGrahas(chart?.grahas || []), [chart]);

  if (!rows.length) return null;

  return (
    <Box
      sx={{
        mt: 2,
        bgcolor: '#FFFFFF',
        border: '1px solid #E6DEEF',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <Typography sx={{ px: 2, pt: 1.75, pb: 1, fontWeight: 700, color: '#1E1B2E' }}>
        {lang === 'hi' ? 'जन्म काल ग्रह स्थिति (अंश)' : 'Birth-time planetary degrees'}
      </Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>
                {lang === 'hi' ? 'ग्रह' : 'Planet'}
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                {lang === 'hi' ? 'राशि' : 'Sign'}
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                {lang === 'hi' ? 'अंश' : 'Degree'}
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                {lang === 'hi' ? 'नक्षत्र' : 'Nakshatra'}
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Pada</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                {lang === 'hi' ? 'भाव' : 'House'}
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                {lang === 'hi' ? 'संकेत' : 'Flags'}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((g) => (
              <TableRow key={g.id || g.name} hover>
                <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                  <span style={{ marginRight: 6 }}>{planetGlyph(g.name)}</span>
                  {planetLabel(g.name, lang)}
                </TableCell>
                <TableCell>{g.rashiName}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                  {formatDegreeDms(g.degree)}
                </TableCell>
                <TableCell>{g.nakshatraName}</TableCell>
                <TableCell>{g.pada}</TableCell>
                <TableCell>{g.house}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#5B3FA0', letterSpacing: 0.5 }}>
                  {g.marks || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}

export default GrahaDegreeTable;
