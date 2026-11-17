import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import VerifiedIcon from '@mui/icons-material/Verified';
import WorkIcon from '@mui/icons-material/Work';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import SpaIcon from '@mui/icons-material/Spa';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { ASTROLOGERS, useChat } from '../chatStore';
import { useLocale } from '../i18n/LocaleContext';

function ChatInterface() {
  const location = useLocation();
  const { t } = useLocale();
  const { conversations, active, openConversation, startChat, sendMessage } = useChat();
  const [draft, setDraft] = useState('');
  const requested = location.state && location.state.astrologerId;
  const requestedHandled = useRef(false);

  const SUGGESTIONS = [
    { label: t('career'), icon: WorkIcon },
    { label: t('relationships'), icon: FavoriteBorderIcon },
    { label: t('health'), icon: HealthAndSafetyIcon },
    { label: t('remedies'), icon: SpaIcon },
    { label: t('generalGuidance'), icon: StarBorderIcon },
  ];

  useEffect(() => {
    if (!requested || requestedHandled.current) return;
    requestedHandled.current = true;
    const existing = conversations.find((item) => item.astrologerId === requested);
    if (existing) {
      openConversation(existing.id);
    } else {
      startChat(requested);
    }
  }, [requested, conversations, openConversation, startChat]);

  const astrologer = ASTROLOGERS[active.astrologerId] || ASTROLOGERS['astro-chat'];
  const showSuggestions = !active.messages.some((message) => message.role === 'user');
  const groups = Object.values(ASTROLOGERS).map((item) => ({
    astrologer: item,
    chats: conversations.filter((conversation) => conversation.astrologerId === item.id),
  }));

  const submit = (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft('');
  };

  return (
    <Box className="chat-page">
      <aside className="chats-rail" aria-label="Chat history">
        <Box className="chats-rail__head">
          <span className="chats-rail__label">{t('chats')}</span>
          <Tooltip title="Start a new chat with the AI astrologer">
            <IconButton
              size="small"
              aria-label="Start a new chat with the AI astrologer"
              onClick={() => startChat('astro-chat')}
              sx={{ color: '#5B3FA0' }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {groups.map((group) => (
          <Box
            className="chats-group"
            key={group.astrologer.id}
            style={{
              backgroundColor: group.astrologer.tint,
              borderColor: `${group.astrologer.accent}1f`,
            }}
          >
            <Box className="chats-group__head">
              <span
                className="chats-group__dot"
                style={{ backgroundColor: group.astrologer.accent }}
                aria-hidden="true"
              />
              <span className="chats-group__name" style={{ color: group.astrologer.accent }}>
                {group.astrologer.name}
              </span>
              <Tooltip title={`New chat with ${group.astrologer.name}`}>
                <IconButton
                  size="small"
                  aria-label={`New chat with ${group.astrologer.name}`}
                  onClick={() => startChat(group.astrologer.id)}
                  sx={{ color: group.astrologer.accent }}
                >
                  <AddIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            </Box>
            {group.chats.length === 0 && (
              <Box className="chats-group__empty">No conversations yet</Box>
            )}
            {group.chats.map((conversation) => (
              <button
                type="button"
                key={conversation.id}
                className={`chat-item${conversation.id === active.id ? ' chat-item--active' : ''}`}
                onClick={() => openConversation(conversation.id)}
                style={
                  conversation.id === active.id
                    ? { boxShadow: `inset 2px 0 0 ${group.astrologer.accent}` }
                    : undefined
                }
              >
                <span className="chat-item__title">{conversation.title}</span>
                <span className="chat-item__meta">{conversation.updated}</span>
              </button>
            ))}
          </Box>
        ))}
      </aside>

      <section className="conversation" aria-label="Conversation">
        <header className="conversation__header">
          <span className="conversation__avatar">{astrologer.initials}</span>
          <Box sx={{ minWidth: 0 }}>
            <Box className="conversation__name">
              {astrologer.name}
              {astrologer.type === 'live' && (
                <VerifiedIcon sx={{ ml: 0.5, fontSize: 15, color: '#6B4FA0', verticalAlign: '-2px' }} />
              )}
            </Box>
            <Box className="conversation__status">
              <span
                className={`presence-dot${astrologer.online ? ' presence-dot--online' : ''}`}
                style={{ display: 'inline-block', marginRight: 6, verticalAlign: '1px' }}
              />
              {astrologer.online ? 'Online' : 'Offline'} · {astrologer.speciality}
            </Box>
          </Box>

          {astrologer.type === 'live' && (
            <Box className="conversation__actions">
              <Box className="conversation__price">{astrologer.price}</Box>
              <Button variant="contained" size="small" disabled={!astrologer.online}>
                Book live session
              </Button>
            </Box>
          )}
        </header>

        <Box className="conversation__messages">
          <Box className="conversation__inner">
            <Box className="conversation__date">Today</Box>

            {active.messages.map((message, index) => (
              <Box
                key={`${message.role}-${index}`}
                className={`msg${message.role === 'user' ? ' msg--user' : ''}`}
              >
                {message.role === 'bot' && (
                  <span className="msg__avatar">{astrologer.initials}</span>
                )}
                <Box className={`msg__bubble msg__bubble--${message.role === 'user' ? 'user' : 'bot'}`}>
                  {message.text.split('\n').map((line, lineIndex) => (
                    <React.Fragment key={lineIndex}>
                      {lineIndex > 0 && <br />}
                      {line}
                    </React.Fragment>
                  ))}
                </Box>
              </Box>
            ))}

            {showSuggestions && (
              <Box className="suggestions">
                {SUGGESTIONS.map(({ label, icon: Icon }) => (
                  <button
                    type="button"
                    key={label}
                    className="suggestion"
                    onClick={() => sendMessage(label)}
                  >
                    <Icon fontSize="inherit" />
                    {label}
                  </button>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        <Box className="composer-wrap">
          <form className="composer" onSubmit={submit}>
            <Tooltip title="Attach a file">
              <IconButton
                size="small"
                aria-label="Attach a file"
                sx={{ color: '#6A6580' }}
                type="button"
              >
                <AttachFileIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <input
              className="composer__input"
              placeholder={t('askPlaceholder')}
              aria-label="Message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              type="submit"
              className="composer__send"
              aria-label="Send message"
              disabled={!draft.trim()}
            >
              <SendIcon sx={{ fontSize: 17 }} />
            </button>
          </form>
          <Typography className="composer-note">
            Astro Chat can make mistakes. For important decisions, consult a live astrologer.
          </Typography>
        </Box>
      </section>
    </Box>
  );
}

export default ChatInterface;
