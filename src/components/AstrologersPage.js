import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  Rating,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedIcon from '@mui/icons-material/Verified';
import { ASTROLOGERS, useChat } from '../chatStore';
import {
  astrologerTagOptions,
  getAstrologerAverage,
  loadAstrologerLastUsed,
  loadAstrologerRatings,
  loadAstrologerTags,
  setAstrologerRating,
  toggleAstrologerTag,
} from '../lib/libraryStore';

const TOPIC_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'career', label: 'Career' },
  { id: 'relationship', label: 'Relationship' },
  { id: 'health', label: 'Health' },
  { id: 'finance', label: 'Finance' },
  { id: 'remedies', label: 'Remedies' },
  { id: 'timing', label: 'Timing' },
];

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

function matchesTopic(person, topic) {
  if (!topic || topic === 'all') return true;
  const topics = person.topics || [];
  if (topics.includes(topic)) return true;
  const hay = `${person.speciality || ''} ${person.oneLiner || ''} ${person.description || ''}`.toLowerCase();
  return hay.includes(topic.toLowerCase());
}

function matchesSearch(person, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  return (
    person.name.toLowerCase().includes(q) ||
    (person.speciality || '').toLowerCase().includes(q) ||
    (person.oneLiner || '').toLowerCase().includes(q) ||
    (person.topics || []).some((t) => t.includes(q))
  );
}

function AstrologerCard({ person, ratings, tags, tagOptions, lastUsed, onOpen, onRate, onToggleTag }) {
  const average = getAstrologerAverage(person.id);
  const myTags = tags[person.id] || [];

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        aspectRatio: { sm: '1 / 1.05' },
        p: 2.5,
        bgcolor: '#FFFFFF',
        border: '1px solid #E6DEEF',
        borderRadius: 3,
        minHeight: 300,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: '#EFE9F7',
          border: '1px solid #CFC4EA',
          color: '#5B3FA0',
          fontWeight: 700,
          fontSize: 13,
        }}
        title="Overall rating out of 5"
        aria-label={`Overall rating ${average} out of 5`}
      >
        {average}
      </Box>

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

      <Typography sx={{ fontWeight: 700, color: person.accent, lineHeight: 1.3, pr: 5 }}>
        {person.name}
        <VerifiedIcon sx={{ ml: 0.5, fontSize: 16, color: '#6B4FA0', verticalAlign: '-2px' }} />
      </Typography>
      <Typography sx={{ mt: 0.75, fontSize: 14, color: '#3A3550', flexGrow: 1 }}>
        {person.oneLiner}
      </Typography>
      <Typography sx={{ mt: 1, fontSize: 12, color: person.online ? '#2F6B52' : '#8A6212' }}>
        {person.online ? 'Online now' : 'Offline'} · {person.price}
      </Typography>
      <Typography sx={{ mt: 0.35, fontSize: 12, color: '#8A849E' }}>
        {formatRelative(lastUsed[person.id])}
      </Typography>
      {(person.topics || []).length > 0 && (
        <Typography sx={{ mt: 0.5, fontSize: 11, color: '#6A6580', textTransform: 'capitalize' }}>
          Focus: {(person.topics || []).join(' · ')}
        </Typography>
      )}

      <Box sx={{ mt: 1.25, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {tagOptions.map((tag) => {
          const on = myTags.includes(tag);
          return (
            <Chip
              key={tag}
              size="small"
              label={tag}
              onClick={() => onToggleTag(person.id, tag)}
              sx={{
                textTransform: 'capitalize',
                bgcolor: on ? '#EFE9F7' : '#F7F4FB',
                color: on ? '#5B3FA0' : '#6A6580',
                border: on ? '1px solid #5B3FA0' : '1px solid #E6DEEF',
                height: 24,
              }}
            />
          );
        })}
      </Box>

      <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: 12, color: '#6A6580' }}>Your rating</Typography>
        <Rating
          size="small"
          value={Number(ratings[person.id]?.rating || 0)}
          onChange={(_e, value) => {
            if (!value) return;
            onRate(person.id, value);
          }}
        />
      </Box>
      <Button
        fullWidth
        variant="contained"
        onClick={() => onOpen(person.id)}
        disabled={!person.online}
        sx={{ mt: 2, bgcolor: '#6B4FA0', '&:hover': { bgcolor: '#5B3FA0' } }}
      >
        {person.online ? 'Chat' : 'Unavailable'}
      </Button>
    </Box>
  );
}

function AstrologersPage({ onBack, onOpenChat }) {
  const { startChat } = useChat();
  const [tab, setTab] = useState(0);
  const [topic, setTopic] = useState('all');
  const [search, setSearch] = useState('');
  const [ratings, setRatings] = useState(() => loadAstrologerRatings());
  const [tags, setTags] = useState(() => loadAstrologerTags());
  const lastUsed = loadAstrologerLastUsed();
  const tagOptions = astrologerTagOptions();

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

  const recommended = useMemo(() => {
    const filtered = people.filter(
      (person) => matchesTopic(person, topic) && matchesSearch(person, search)
    );
    return [...filtered].sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      const aScore = Number(getAstrologerAverage(a.id)) || 0;
      const bScore = Number(getAstrologerAverage(b.id)) || 0;
      if (bScore !== aScore) return bScore - aScore;
      const aT = lastUsed[a.id] ? new Date(lastUsed[a.id]).getTime() : 0;
      const bT = lastUsed[b.id] ? new Date(lastUsed[b.id]).getTime() : 0;
      return bT - aT;
    });
  }, [people, topic, search, lastUsed]);

  const browse = useMemo(
    () => people.filter((person) => matchesSearch(person, search)),
    [people, search]
  );

  const open = (astrologerId) => {
    startChat(astrologerId);
    onOpenChat?.(astrologerId);
  };

  const list = tab === 0 ? recommended : browse;

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
          Pick a topic for recommended Jyotish readers, or search for someone by name.
        </Typography>

        <Tabs
          value={tab}
          onChange={(_e, value) => setTab(value)}
          sx={{
            mt: 2,
            minHeight: 40,
            '& .MuiTab-root': { textTransform: 'none', minHeight: 40, fontWeight: 600 },
            '& .Mui-selected': { color: '#5B3FA0' },
            '& .MuiTabs-indicator': { bgcolor: '#5B3FA0' },
          }}
        >
          <Tab label="Recommendations" />
          <Tab label="All astrologers" />
        </Tabs>

        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search Jyotish by name or focus…"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: '#8A849E' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: '1 1 240px',
              maxWidth: 420,
              '& .MuiOutlinedInput-root': { bgcolor: '#FFFFFF', borderRadius: 2 },
            }}
          />
          {tab === 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }} role="group" aria-label="Topic filter">
              {TOPIC_FILTERS.map((item) => {
                const on = topic === item.id;
                return (
                  <Chip
                    key={item.id}
                    label={item.label}
                    onClick={() => setTopic(item.id)}
                    sx={{
                      bgcolor: on ? '#EFE9F7' : '#FFFFFF',
                      color: on ? '#5B3FA0' : '#4A4560',
                      border: on ? '1px solid #5B3FA0' : '1px solid #E6DEEF',
                      fontWeight: on ? 600 : 500,
                    }}
                  />
                );
              })}
            </Box>
          )}
        </Box>

        {tab === 0 && (
          <Typography sx={{ mt: 2, fontSize: 13, color: '#6A6580' }}>
            {topic === 'all'
              ? 'Showing readers ranked by availability and rating.'
              : `Recommended for ${TOPIC_FILTERS.find((t) => t.id === topic)?.label || topic}.`}
          </Typography>
        )}

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            mt: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {list.length === 0 && (
            <Typography sx={{ color: '#6A6580', gridColumn: '1 / -1' }}>
              No Jyotish readers match this filter. Try another topic or clear the search.
            </Typography>
          )}
          {list.map((person) => (
            <AstrologerCard
              key={person.id}
              person={person}
              ratings={ratings}
              tags={tags}
              tagOptions={tagOptions}
              lastUsed={lastUsed}
              onOpen={open}
              onRate={(id, value) => {
                setAstrologerRating(id, value);
                setRatings(loadAstrologerRatings());
              }}
              onToggleTag={(id, tag) => {
                toggleAstrologerTag(id, tag);
                setTags(loadAstrologerTags());
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default AstrologersPage;
