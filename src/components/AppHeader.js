import React from 'react';
import { Badge, Box, Button, IconButton, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddCommentIcon from '@mui/icons-material/AddComment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

function AppHeader({ title, onMenuClick, newChat, memoryCount = null, onMemoryClick = null }) {
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
      {onMemoryClick && (
        <Tooltip title="Memory">
          <IconButton
            aria-label={
              typeof memoryCount === 'number'
                ? `Open memory, ${memoryCount} remembered details`
                : 'Open memory'
            }
            onClick={onMemoryClick}
            size="medium"
            sx={{ color: '#B7791F', mr: newChat ? 0.5 : 0 }}
          >
            <Badge
              badgeContent={memoryCount > 0 ? memoryCount : 0}
              color="warning"
              max={99}
              invisible={!memoryCount}
            >
              <AutoAwesomeIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>
      )}
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
