import React from 'react';
import { Box, Typography } from '@mui/material';

// A modal that stays inside the application rectangle (no body portal),
// so it never covers the browser outside the app shell.
function AppModal({ open, onClose, title, children, actions }) {
  if (!open) return null;

  return (
    <Box className="app-modal-backdrop" onClick={onClose}>
      <Box
        className="app-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <Typography component="h3" sx={{ fontSize: 20, fontWeight: 700, color: '#1E1B2E', mb: 2 }}>
          {title}
        </Typography>
        {children}
        {actions && <Box className="app-modal__actions">{actions}</Box>}
      </Box>
    </Box>
  );
}

export default AppModal;
