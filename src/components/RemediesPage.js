import React, { useMemo, useState } from 'react';
import { Box, Button, Chip, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ensureLibrarySeeds, loadRemedies } from '../lib/libraryStore';
import { getSelfProfile } from '../lib/profiles';

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function RemediesPage({ onBack }) {
  const self = getSelfProfile();
  ensureLibrarySeeds({ memberName: self.name });
  const [remedies] = useState(() => loadRemedies());
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    const list =
      filter === 'all' ? remedies : remedies.filter((item) => item.source === filter);
    return [...list].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [remedies, filter]);

  return (
    <Box className="stack-page">
      <Box className="hill-deco" sx={{ opacity: 0.7 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: 'min(880px, 100%)', margin: '0 auto', padding: '28px 32px 48px' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: '#1E1B2E', pl: 0, mb: 2 }}>
          Back to Services
        </Button>

        <Typography component="h2" sx={{ fontSize: 26, fontWeight: 700, color: '#1E1B2E' }}>
          Remedies
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 15, color: '#3A3550' }}>
          Practical suggestions from Astro Chat and human astrologers, newest first.
        </Typography>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={filter}
          onChange={(_e, value) => value && setFilter(value)}
          sx={{ mt: 2.5 }}
        >
          <ToggleButton value="all" sx={{ textTransform: 'none' }}>
            All
          </ToggleButton>
          <ToggleButton value="ai" sx={{ textTransform: 'none' }}>
            AI astro
          </ToggleButton>
          <ToggleButton value="human" sx={{ textTransform: 'none' }}>
            Human astro
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: 'grid', gap: 1.5, mt: 3 }}>
          {filtered.length === 0 ? (
            <Box className="panel">
              <Typography sx={{ color: '#4A4560' }}>
                No remedies saved yet. Ask about remedies in chat and they will collect here with a
                timestamp.
              </Typography>
            </Box>
          ) : (
            filtered.map((item) => (
              <Box
                key={item.id}
                sx={{
                  p: 2,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E6DEEF',
                  borderRadius: 3,
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Chip
                    size="small"
                    label={item.source === 'human' ? 'Human astro' : 'AI astro'}
                    sx={{
                      bgcolor: item.source === 'human' ? '#D9F0DC' : '#EFE9F7',
                      color: item.source === 'human' ? '#1E7A36' : '#5B3FA0',
                      fontWeight: 600,
                    }}
                  />
                  <Typography sx={{ fontSize: 13, color: '#6A6580' }}>
                    {item.astrologerName} · {formatWhen(item.createdAt)}
                  </Typography>
                </Box>
                <Typography sx={{ mt: 1.25, fontSize: 15, color: '#1E1B2E', lineHeight: 1.55 }}>
                  {item.text}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default RemediesPage;
