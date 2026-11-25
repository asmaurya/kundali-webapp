import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  MEMORY_AREAS,
  MEMORY_TYPES,
  clearMemory,
  deleteMemoryFact,
  ensureMemorySeeds,
  groupFactsByArea,
  isExpired,
  loadSharedLog,
  upsertMemoryFact,
} from '../lib/memoryStore';

const AREA_LABELS = {
  career: 'Career',
  relationships: 'Relationships',
  finance: 'Finance',
  remedies: 'Remedies',
  vitality: 'Vitality',
  general: 'General',
};

const TYPE_LABELS = {
  decision: 'Decision',
  concern: 'Concern',
  remedy: 'Remedy',
  event: 'Event',
  preference: 'Preference',
};

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function MemoryPage({ onBack, profileId = 'self' }) {
  const [facts, setFacts] = useState(() => ensureMemorySeeds(profileId));
  const [shared, setShared] = useState(() => loadSharedLog(profileId));
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ summary: '', area: 'general', type: 'preference' });

  const groups = useMemo(() => groupFactsByArea(facts), [facts]);
  const activeCount = facts.filter((fact) => fact.status === 'active' && !isExpired(fact)).length;

  const refresh = () => {
    setFacts(ensureMemorySeeds(profileId));
    setShared(loadSharedLog(profileId));
  };

  const startEdit = (fact) => {
    setEditingId(fact.id);
    setDraft({
      summary: fact.summary,
      area: fact.area,
      type: fact.type,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ summary: '', area: 'general', type: 'preference' });
  };

  const saveEdit = () => {
    if (!editingId || !draft.summary.trim()) return;
    upsertMemoryFact(
      {
        id: editingId,
        summary: draft.summary,
        area: draft.area,
        type: draft.type,
        origin: 'user_edited',
        status: 'active',
      },
      profileId
    );
    cancelEdit();
    refresh();
  };

  const onDelete = (id) => {
    deleteMemoryFact(id, profileId);
    if (editingId === id) cancelEdit();
    refresh();
  };

  const onDeleteAll = () => {
    if (!window.confirm('Delete all remembered details for this profile? This cannot be undone.')) {
      return;
    }
    clearMemory(profileId);
    cancelEdit();
    setFacts([]);
    setShared(loadSharedLog(profileId));
  };

  return (
    <Box className="stack-page">
      <Box className="hill-deco" sx={{ opacity: 0.7 }} />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: 'min(720px, 100%)',
          margin: '0 auto',
          padding: '28px 32px 48px',
        }}
      >
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: '#1E1B2E', pl: 0, mb: 2 }}>
          Back to Home
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: '#F3E6C8',
              color: '#B7791F',
              display: 'grid',
              placeItems: 'center',
            }}
            aria-hidden="true"
          >
            <AutoAwesomeIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h2" sx={{ fontSize: 26, fontWeight: 700, color: '#1E1B2E' }}>
              Memory
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: 15, color: '#3A3550' }}>
              Remembered details for your chart readings · {activeCount} active
            </Typography>
          </Box>
        </Box>

        <Typography sx={{ mt: 2, fontSize: 14, color: '#4A4560' }}>
          Only confirmed facts you save are used in later answers. Health details are never stored —
          at most a vitality life-area label.
        </Typography>

        {MEMORY_AREAS.map((area) => {
          const items = groups[area] || [];
          if (!items.length) return null;
          return (
            <Box key={area} className="panel" sx={{ mt: 2.5 }}>
              <Typography sx={{ fontWeight: 700, color: '#1E1B2E', mb: 1.5 }}>
                {AREA_LABELS[area] || area}
              </Typography>
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                {items.map((fact) => {
                  const expired = isExpired(fact);
                  const editing = editingId === fact.id;
                  return (
                    <Box
                      key={fact.id}
                      sx={{
                        border: '1px solid #E6DEEF',
                        borderRadius: 2,
                        bgcolor: expired ? '#FAF7F2' : '#FFFFFF',
                        p: 1.5,
                      }}
                    >
                      {editing ? (
                        <Box sx={{ display: 'grid', gap: 1.25 }}>
                          <TextField
                            label="Remembered detail"
                            value={draft.summary}
                            onChange={(event) =>
                              setDraft((prev) => ({ ...prev, summary: event.target.value }))
                            }
                            multiline
                            minRows={2}
                            fullWidth
                            inputProps={{ maxLength: 280 }}
                          />
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <TextField
                              select
                              label="Area"
                              size="small"
                              value={draft.area}
                              onChange={(event) =>
                                setDraft((prev) => ({ ...prev, area: event.target.value }))
                              }
                              sx={{ minWidth: 140 }}
                            >
                              {MEMORY_AREAS.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {AREA_LABELS[option]}
                                </MenuItem>
                              ))}
                            </TextField>
                            <TextField
                              select
                              label="Type"
                              size="small"
                              value={draft.type}
                              onChange={(event) =>
                                setDraft((prev) => ({ ...prev, type: event.target.value }))
                              }
                              sx={{ minWidth: 140 }}
                            >
                              {MEMORY_TYPES.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {TYPE_LABELS[option]}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button variant="contained" onClick={saveEdit} disabled={!draft.summary.trim()}>
                              Save
                            </Button>
                            <Button onClick={cancelEdit}>Cancel</Button>
                          </Box>
                        </Box>
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <Typography sx={{ flex: 1, color: '#1E1B2E', fontSize: 15 }}>
                              {fact.summary}
                            </Typography>
                            <IconButton
                              aria-label={`Edit memory: ${fact.summary}`}
                              size="small"
                              onClick={() => startEdit(fact)}
                              sx={{ color: '#6A6580' }}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              aria-label={`Delete memory: ${fact.summary}`}
                              size="small"
                              onClick={() => onDelete(fact.id)}
                              sx={{ color: '#8A849E' }}
                            >
                              <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            <Chip size="small" label={TYPE_LABELS[fact.type] || fact.type} />
                            <Chip
                              size="small"
                              label={expired ? `Expired ${formatDate(fact.expiresAt)}` : `Expires ${formatDate(fact.expiresAt)}`}
                              sx={{
                                bgcolor: expired ? '#F3E6C8' : '#EFE9F7',
                                color: expired ? '#8A6A2F' : '#5B3FA0',
                              }}
                            />
                            <Chip
                              size="small"
                              variant="outlined"
                              label={fact.origin === 'astrologer' ? 'From astrologer' : 'Saved by you'}
                            />
                          </Box>
                        </>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })}

        {!facts.length && (
          <Box className="panel" sx={{ mt: 2.5 }}>
            <Typography sx={{ fontWeight: 700, color: '#1E1B2E' }}>No remembered details yet</Typography>
            <Typography sx={{ mt: 0.75, fontSize: 14, color: '#4A4560' }}>
              When Astro Chat suggests something to remember after an answer, you can save it here.
            </Typography>
          </Box>
        )}

        <Box className="panel" sx={{ mt: 2.5 }}>
          <Typography component="h3" sx={{ fontWeight: 700, color: '#1E1B2E' }}>
            What I shared
          </Typography>
          <Typography sx={{ mt: 0.5, mb: 1.5, fontSize: 14, color: '#4A4560' }}>
            Log of details sent to live astrologers from this profile.
          </Typography>
          {shared.length === 0 && (
            <Typography sx={{ fontSize: 14, color: '#8A849E' }}>Nothing shared yet.</Typography>
          )}
          <Box sx={{ display: 'grid', gap: 1 }}>
            {shared.map((entry) => (
              <Box
                key={entry.id}
                sx={{ borderTop: '1px solid #EFE9F7', pt: 1, '&:first-of-type': { borderTop: 0, pt: 0 } }}
              >
                <Typography sx={{ fontSize: 14, color: '#1E1B2E' }}>{entry.summary}</Typography>
                <Typography sx={{ fontSize: 12, color: '#8A849E', mt: 0.25 }}>
                  {entry.astrologerName} · {formatDate(entry.at)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Button
            color="error"
            variant="outlined"
            disabled={!facts.length}
            onClick={onDeleteAll}
            sx={{ textTransform: 'none' }}
          >
            Delete all memory
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default MemoryPage;
