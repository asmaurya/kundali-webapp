import React, { useMemo } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { buildDashaPanel } from '../lib/chartViews';

function PeriodRow({ label, period }) {
  if (!period) return null;
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 2,
        alignItems: 'baseline',
        py: 0.75,
        borderBottom: '1px solid #F0EAF6',
      }}
    >
      <Typography sx={{ fontSize: 13, color: '#6A6580', minWidth: 92 }}>{label}</Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1E1B2E', textAlign: 'right' }}>
        {period.lordName}
      </Typography>
      <Typography sx={{ fontSize: 12, color: '#4A4560', textAlign: 'right', whiteSpace: 'nowrap' }}>
        {period.start} → {period.end}
      </Typography>
    </Box>
  );
}

function DashaPanel({ chart }) {
  const panel = useMemo(() => buildDashaPanel(chart), [chart]);
  if (!panel) return null;

  const { vimshottari, yogini } = panel;
  const cascade = vimshottari.cascade;

  return (
    <Box className="panel" sx={{ mt: 2 }}>
      <Typography sx={{ fontWeight: 700, color: '#1E1B2E' }}>Vimshottari Dasha</Typography>
      <Typography sx={{ mt: 0.5, fontSize: 13, color: '#6A6580' }}>
        Current cascade from Moon nakshatra. Nested periods update with time.
      </Typography>

      <Box sx={{ mt: 1.5 }}>
        <PeriodRow label="Maha" period={cascade?.maha} />
        <PeriodRow label="Antar" period={cascade?.antar} />
        <PeriodRow label="Pratyantar" period={cascade?.pratyantar} />
        <PeriodRow label="Sookshma" period={cascade?.sookshma} />
      </Box>

      <Typography sx={{ mt: 2.5, mb: 1, fontSize: 13, fontWeight: 600, color: '#3A3550' }}>
        Mahadasha sequence
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {(vimshottari.periods || []).map((period) => {
          const active = cascade?.maha?.lordName === period.lordName;
          return (
            <Chip
              key={`${period.lordName}-${period.start}`}
              size="small"
              label={`${period.lordName}`}
              sx={{
                bgcolor: active ? '#EFE9F7' : '#F7F4FB',
                color: active ? '#5B3FA0' : '#4A4560',
                border: active ? '1px solid #5B3FA0' : '1px solid #E6DEEF',
                fontWeight: active ? 700 : 500,
              }}
            />
          );
        })}
      </Box>

      {yogini && (
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ fontWeight: 700, color: '#1E1B2E' }}>Yogini Dasha</Typography>
          <Typography sx={{ mt: 0.5, fontSize: 13, color: '#6A6580' }}>
            Current: {yogini.current.lordName} ({yogini.current.start} → {yogini.current.end})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
            {yogini.periods.slice(0, 8).map((period) => {
              const active = yogini.current.lordName === period.lordName;
              return (
                <Chip
                  key={`${period.lordName}-${period.start}`}
                  size="small"
                  label={period.lordName}
                  sx={{
                    bgcolor: active ? '#FBEFC9' : '#F7F4FB',
                    color: active ? '#8A6212' : '#4A4560',
                    border: active ? '1px solid #E0C58A' : '1px solid #E6DEEF',
                  }}
                />
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default DashaPanel;
