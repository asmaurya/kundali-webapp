import React from 'react';
import { Box, Chip, IconButton, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function FamilyMemberCard({ member, onEdit, onPrepare }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        p: 2,
        mb: 1.5,
        bgcolor: '#FFFFFF',
        border: '1px solid #E6DEEF',
        borderRadius: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flex: '0 0 46px',
          alignItems: 'center',
          justifyContent: 'center',
          width: 46,
          height: 46,
          fontSize: 15,
          fontWeight: 700,
          color: '#5B3FA0',
          bgcolor: '#EFE9F7',
          borderRadius: '50%',
        }}
      >
        {initials(member.name)}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, color: '#1E1B2E' }}>{member.name}</Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
          <Chip
            size="small"
            label={member.relation}
            sx={{ bgcolor: '#F1ECF6', border: '1px solid #D8CFE6', color: '#3A3550' }}
          />
          <Chip
            size="small"
            label={member.chartReady ? 'Chart ready' : 'Chart pending'}
            sx={{
              bgcolor: member.chartReady ? '#D9F0DC' : '#FBEFC9',
              color: member.chartReady ? '#1E7A36' : '#8A6212',
              fontWeight: 600,
            }}
          />
        </Box>
      </Box>

      <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
        {!member.chartReady && (
          <IconButton
            aria-label={`Prepare chart for ${member.name}`}
            onClick={() => onPrepare(member)}
            sx={{ color: '#6B4FA0', bgcolor: '#EFE9F7', borderRadius: '50%' }}
          >
            <AutoAwesomeIcon fontSize="small" />
          </IconButton>
        )}
        <IconButton
          aria-label={`Edit ${member.name}`}
          onClick={() => onEdit(member)}
          sx={{ color: '#3A3550', bgcolor: '#F6F1F8', borderRadius: '50%' }}
        >
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}

export default FamilyMemberCard;
