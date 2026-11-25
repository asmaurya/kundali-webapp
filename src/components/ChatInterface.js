import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { ensureFamilySeeds, listProfiles } from '../lib/profiles';

function readFamilyChips() {
  ensureFamilySeeds();
  return listProfiles().filter((p) => !p.isSelf);
}

function ChatInterface() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLocale();
  const { conversations, active, openConversation, startChat, sendMessage } = useChat();
  const [draft, setDraft] = useState('');
  const [familyChips, setFamilyChips] = useState(() => readFamilyChips());
  const inputRef = useRef(null);
  const requested = location.state && location.state.astrologerId;
  const requestedHandled = useRef(false);

  const refreshFamilyChips = useCallback(() => {
    setFamilyChips(readFamilyChips());
  }, []);

  useEffect(() => {
    refreshFamilyChips();
  }, [refreshFamilyChips, location.pathname, conversations.length]);

  useEffect(() => {
    const onFocus = () => refreshFamilyChips();
    const onStorage = (event) => {
      if (!event.key || event.key.includes('family')) refreshFamilyChips();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, [refreshFamilyChips]);

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

  const submit = (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft('');
  };

  const insertTopic = (label) => {
    setDraft((current) => {
      const next = current.trim() ? `${current.trim()} ${label}` : label;
      return next;
    });
    inputRef.current?.focus();
  };

  const insertMember = (member) => {
    const token = `@${member.name}`;
    setDraft((current) => {
      if (current.includes(token)) return current;
      const prefix = current.trim();
      return prefix ? `${prefix} ${token}` : `${token} `;
    });
    inputRef.current?.focus();
  };

  return (
    <Box className="chat-page">
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
                aria-hidden="true"
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
          </Box>
        </Box>

        <Box className="composer-wrap">
          <Box
            className="composer-context"
            aria-label="Add context to your question"
          >
            <Box className="composer-context__row">
              <Typography className="composer-context__label">Topics</Typography>
              {SUGGESTIONS.map(({ label, icon: Icon }) => (
                <button
                  type="button"
                  key={label}
                  className="suggestion"
                  onClick={() => insertTopic(label)}
                >
                  <Icon fontSize="inherit" />
                  {label}
                </button>
              ))}
            </Box>
            <Box className="composer-context__row" aria-label="Family members">
              <Typography className="composer-context__label">Family</Typography>
              {familyChips.length > 0 ? (
                familyChips.map((member) => (
                  <button
                    type="button"
                    key={member.id}
                    className={`suggestion suggestion--family${
                      draft.includes(`@${member.name}`) ? ' suggestion--on' : ''
                    }`}
                    onClick={() => insertMember(member)}
                    title={`Include ${member.name} (${member.relation}) in this question`}
                  >
                    {member.name}
                    <span className="suggestion__meta">{member.relation}</span>
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  className="suggestion suggestion--family"
                  onClick={() => navigate('/family')}
                >
                  Add family members
                </button>
              )}
            </Box>
          </Box>
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
              ref={inputRef}
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
            Tap a family name to include their chart in context. Astro Chat can make mistakes.
          </Typography>
        </Box>
      </section>
    </Box>
  );
}

export default ChatInterface;
