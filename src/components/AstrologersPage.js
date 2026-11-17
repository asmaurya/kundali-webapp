import React, { useMemo, useState } from 'react';
import { Box, Button, Rating, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedIcon from '@mui/icons-material/Verified';
import { ASTROLOGERS, useChat } from '../chatStore';
import {
  loadAstrologerLastUsed,
  loadAstrologerRatings,
  setAstrologerRating,
} from '../lib/libraryStore';

function formatRelative(iso) {
  if (!iso) return 'Not used yet';
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const hours = Math.round(diff / 3600000);
  if (hours < 1) return 'Used just now';
  if (hours < 24) return `Last used ${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Last used yesterday';
  if (days < 14) return `Last used ${days}d ago`;
  return `Last used ${new Date(iso).toLocaleDateString()}`;
}

function AstrologersPage({ onBack, onOpenChat }) {
  const { startChat } = useChat();
  const [ratings, setRatings] = useState(() => loadAstrologerRatings());
  const lastUsed = loadAstrologerLastUsed();

  const people = useMemo(
    () =>
      Object.values(ASTROLOGERS)
        .filter((a) => a.type === 'live')
        .sort((a, b) => {
          const aT = lastUsed[a.id] ? new Date(lastUsed[a.id]).getTime() : 0;
          const bT = lastUsed[b.id] ? new Date(lastUsed[b.id]).getTime() : 0;
          return bT - aT;
        }),
    [lastUsed]
  );

  const open = (astrologerId) => {
    startChat(astrologerId);
    onOpenChat?.(astrologerId);
  };

  return (
    <Box className="stack-page">
      <Box className="hill-deco" sx={{ opacity: 0.7 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: 'min(1040px, 100%)', margin: '0 auto', padding: '28px 32px 48px' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: '#1E1B2E', pl: 0, mb: 2 }}>
          Back to Services
        </Button>

        <Typography component="h2" sx={{ fontSize: 26, fontWeight: 700, color: '#1E1B2E' }}>
          Chat with an Astrologer
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 15, color: '#3A3550' }}>
          Verified human readers. Rate them privately for your own reference.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            mt: 3,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {people.map((person) => (
            <Box
              key={person.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                aspectRatio: { sm: '1 / 1.05' },
                p: 2.5,
                bgcolor: '#FFFFFF',
                border: '1px solid #E6DEEF',
                borderRadius: 3,
                minHeight: 280,
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: 20,
                  bgcolor: person.tint,
                  color: person.accent,
                  border: `1px solid ${person.accent}33`,
                  mb: 1.5,
                }}
              >
                {person.initials}
              </Box>

              <Typography sx={{ fontWeight: 700, color: person.accent, lineHeight: 1.3 }}>
                {person.name}
                <VerifiedIcon sx={{ ml: 0.5, fontSize: 16, color: '#6B4FA0', verticalAlign: '-2px' }} />
              </Typography>
              <Typography sx={{ mt: 0.75, fontSize: 14, color: '#3A3550', flexGrow: 1 }}>
                {person.oneLiner}
              </Typography>
              <Typography sx={{ mt: 1, fontSize: 12, color: '#6A6580' }}>
                {person.online ? 'Online now' : 'Offline'} · {person.price}
              </Typography>
              <Typography sx={{ mt: 0.35, fontSize: 12, color: '#8A849E' }}>
                {formatRelative(lastUsed[person.id])}
              </Typography>
              <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: 12, color: '#6A6580' }}>Your rating</Typography>
                <Rating
                  size="small"
                  value={Number(ratings[person.id]?.rating || 0)}
                  onChange={(_e, value) => {
                    if (!value) return;
                    setAstrologerRating(person.id, value);
                    setRatings(loadAstrologerRatings());
                  }}
                />
              </Box>
              <Button
                fullWidth
                variant="contained"
                onClick={() => open(person.id)}
                disabled={!person.online}
                sx={{ mt: 2, bgcolor: '#6B4FA0', '&:hover': { bgcolor: '#5B3FA0' } }}
              >
                {person.online ? 'Chat' : 'Unavailable'}
              </Button>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default AstrologersPage;
