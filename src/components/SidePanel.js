import React from 'react';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import BuildIcon from '@mui/icons-material/Build';
import GroupsIcon from '@mui/icons-material/Groups';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddCommentIcon from '@mui/icons-material/AddComment';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import LogoutIcon from '@mui/icons-material/Logout';
import VerifiedIcon from '@mui/icons-material/Verified';
import { ASTROLOGERS, useChat } from '../chatStore';

const ICONS = {
  chat: ChatIcon,
  services: BuildIcon,
  family: GroupsIcon,
  kundali: AccountBalanceIcon,
  subscription: SubscriptionsIcon,
  support: SupportAgentIcon,
};

const DEFAULT_USER = { name: 'Beta tester', plan: 'Beta', initials: 'B' };

function SidePanel({
  items,
  activePath,
  expanded,
  isDesktop,
  user = DEFAULT_USER,
  onExpand,
  onCollapse,
  onNavigate,
  onLogout,
}) {
  const { conversations, openConversation, startChat } = useChat();
  const account = user || DEFAULT_USER;

  const isActive = (path) =>
    path === '/' ? activePath === '/' || activePath === '/chat' : activePath === path;

  const openChat = (id) => {
    openConversation(id);
    onNavigate('/chat');
  };

  const openAstrologer = (astrologerId) => {
    const existing = conversations.find((item) => item.astrologerId === astrologerId);
    if (existing) {
      openChat(existing.id);
    } else {
      startChat(astrologerId);
      onNavigate('/chat');
    }
  };

  const recent = conversations.slice(0, 3);
  const astrologerList = Object.values(ASTROLOGERS);

  if (!expanded) {
    if (!isDesktop) return null;
    return (
      <nav className="side-rail" aria-label="Main navigation">
        <Box className="side-rail__brand">
          <Box className="side-rail__mark">
            <AutoAwesomeIcon fontSize="small" />
          </Box>
        </Box>

        {isDesktop && (
          <Tooltip title="Expand sidebar" placement="right">
            <button
              type="button"
              className="side-rail__toggle"
              onClick={onExpand}
              aria-label="Expand sidebar"
            >
              <KeyboardDoubleArrowRightIcon fontSize="small" />
            </button>
          </Tooltip>
        )}

        <Box className="side-rail__group">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <Tooltip key={item.path} title={item.label} placement="right">
                <button
                  type="button"
                  className={`side-rail__item${isActive(item.path) ? ' side-rail__item--active' : ''}`}
                  onClick={() => onNavigate(item.path)}
                  aria-label={item.label}
                >
                  <Icon fontSize="small" />
                </button>
              </Tooltip>
            );
          })}
        </Box>

        <Box className="side-rail__footer">
          <Tooltip title={`${account.name} — ${account.plan}`} placement="right">
            <Box className="side-rail__avatar" aria-label={account.name}>
              {account.initials}
            </Box>
          </Tooltip>
          <Tooltip title="Log out" placement="right">
            <button
              type="button"
              className="side-rail__item side-rail__logout"
              onClick={onLogout}
              aria-label="Log out"
            >
              <LogoutIcon fontSize="small" />
            </button>
          </Tooltip>
        </Box>
      </nav>
    );
  }

  return (
    <nav className="side-panel" aria-label="Main navigation">
      <Box className="side-panel__brand">
        <Box className="side-rail__mark">
          <AutoAwesomeIcon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Box className="side-panel__title">Astro Chat</Box>
          <Box className="side-panel__subtitle">Vedic astrology chat</Box>
        </Box>
        {isDesktop && (
          <IconButton
            aria-label="Collapse sidebar"
            onClick={onCollapse}
            size="small"
            sx={{ ml: 'auto', color: '#6A6580' }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Box sx={{ px: 2, pt: 1.5 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddCommentIcon fontSize="small" />}
          onClick={() => {
            startChat('astro-chat');
            onNavigate('/chat');
          }}
          sx={{ bgcolor: '#6B4FA0', '&:hover': { bgcolor: '#5B3FA0' } }}
        >
          New chat
        </Button>
      </Box>

      <Box className="side-panel__scroll">
        <Box className="side-panel__section">Recent chats</Box>
        {recent.map((conversation) => {
          const astrologer = ASTROLOGERS[conversation.astrologerId];
          return (
            <button
              type="button"
              key={conversation.id}
              className="side-panel__chat"
              onClick={() => openChat(conversation.id)}
            >
              <Box
                className="side-panel__chat-avatar"
                style={{ backgroundColor: astrologer.tint, color: astrologer.accent, borderColor: `${astrologer.accent}33` }}
              >
                {astrologer.initials}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Box className="side-panel__chat-title">{conversation.title}</Box>
                <Box className="side-panel__chat-meta">
                  {astrologer.name} · {conversation.updated}
                </Box>
              </Box>
            </button>
          );
        })}

        <Box className="side-panel__section">Astrologers</Box>
        {astrologerList.map((astrologer) => (
          <button
            type="button"
            key={astrologer.id}
            className="side-panel__astrologer"
            onClick={() => openAstrologer(astrologer.id)}
          >
            <Box
              className="side-panel__chat-avatar"
              style={{ backgroundColor: astrologer.tint, color: astrologer.accent, borderColor: `${astrologer.accent}33` }}
            >
              {astrologer.initials}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Box className="side-panel__chat-title" style={{ color: astrologer.accent }}>
                {astrologer.name}
                {astrologer.type === 'live' && (
                  <VerifiedIcon sx={{ ml: 0.5, fontSize: 14, color: '#6B4FA0', verticalAlign: '-2px' }} />
                )}
              </Box>
              <Box className="side-panel__chat-meta">{astrologer.speciality}</Box>
            </Box>
            <Box
              component="span"
              className={`presence-dot${astrologer.online ? ' presence-dot--online' : ''}`}
            />
          </button>
        ))}

        <Box className="side-panel__section">Menu</Box>
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <button
              type="button"
              key={item.path}
              className={`side-panel__item${isActive(item.path) ? ' side-panel__item--active' : ''}`}
              onClick={() => onNavigate(item.path)}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              <span className="side-panel__icon">
                <Icon fontSize="small" />
              </span>
              {item.label}
            </button>
          );
        })}
      </Box>

      <Box className="side-panel__user">
        <Box className="side-panel__user-avatar">{account.initials}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Box className="side-panel__user-name">{account.name}</Box>
          <Box className="side-panel__user-plan">{account.plan}</Box>
        </Box>
        <Tooltip title="Log out">
          <IconButton
            aria-label="Log out"
            onClick={onLogout}
            size="small"
            sx={{ ml: 'auto', color: '#4A4560' }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </nav>
  );
}

export default SidePanel;
