import React from 'react';
import { Box, Button, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddCommentIcon from '@mui/icons-material/AddComment';

function AppHeader({ title, onMenuClick, newChat }) {
  return (
    <header className="app-header">
      <IconButton
        aria-label="Open navigation"
        onClick={onMenuClick}
        edge="start"
        size="medium"
        sx={{ color: '#1E1B2E' }}
      >
        <MenuIcon fontSize="medium" />
      </IconButton>
      <span className="app-header__title">{title}</span>
      <Box className="app-header__spacer" />
      {newChat && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddCommentIcon fontSize="small" />}
          onClick={newChat}
          sx={{ borderColor: '#CFC4EA', color: '#3A2F6B', '&:hover': { borderColor: '#6B4FA0' } }}
        >
          New chat
        </Button>
      )}
    </header>
  );
}

export default AppHeader;
