import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SendIcon from '@mui/icons-material/Send';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import VerifiedIcon from '@mui/icons-material/Verified';
import WorkIcon from '@mui/icons-material/Work';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import SpaIcon from '@mui/icons-material/Spa';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { ASTROLOGERS, useChat } from '../chatStore';
import { useLocale } from '../i18n/LocaleContext';
import { listProfiles } from '../lib/profiles';

function ChatInterface() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLocale();
  const {
    conversations,
    active,
    openConversation,
    startChat,
    sendMessage,
    deleteConversation,
    undoDelete,
    dismissUndo,
    pendingUndo,
    requestExecutiveSummary,
    handoffToHuman,
  } = useChat();
  const [draft, setDraft] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [summarizing, setSummarizing] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const inputRef = useRef(null);
  const requested = location.state && location.state.astrologerId;
  const draftPrefix = location.state && location.state.lockedPrefix;
  const openConversationId = location.state && location.state.conversationId;
  const requestedHandled = useRef(false);
  const prefixHandled = useRef(false);
  const familyChips = useMemo(
    () => listProfiles().filter((p) => !p.isSelf),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversations.length]
  );

  const SUGGESTIONS = [
    { label: t('career'), icon: WorkIcon },
    { label: t('relationships'), icon: FavoriteBorderIcon },
    { label: t('health'), icon: HealthAndSafetyIcon },
    { label: t('remedies'), icon: SpaIcon },
    { label: t('generalGuidance'), icon: StarBorderIcon },
  ];

  useEffect(() => {
    if (!openConversationId) return;
    openConversation(openConversationId);
  }, [openConversationId, openConversation]);

  useEffect(() => {
    if (!requested || requestedHandled.current) return;
    requestedHandled.current = true;
    const existing = conversations.find((item) => item.astrologerId === requested);
    if (existing && !location.state?.forceNew) {
      openConversation(existing.id);
    } else {
      startChat(requested, {
        lockedPrefix: location.state?.lockedPrefix || '',
        title: location.state?.title,
      });
    }
  }, [requested, conversations, openConversation, startChat, location.state]);

  useEffect(() => {
    if (!draftPrefix || prefixHandled.current) return;
    prefixHandled.current = true;
    if (!requested) {
      startChat('astro-chat', { lockedPrefix: draftPrefix, title: location.state?.title || 'Dasha reading' });
    }
    navigate('/chat', { replace: true, state: {} });
  }, [draftPrefix, requested, startChat, navigate, location.state]);

  useEffect(() => {
    setDraft('');
    setSelectedTopics([]);
    setSelectedMembers([]);
  }, [active?.id]);

  const astrologer = ASTROLOGERS[active?.astrologerId] || ASTROLOGERS['astro-chat'];
  const groups = Object.values(ASTROLOGERS).map((item) => ({
    astrologer: item,
    chats: conversations.filter((conversation) => conversation.astrologerId === item.id),
  }));
  const lockedPrefix = active?.lockedPrefix || '';
  const liveAstrologers = Object.values(ASTROLOGERS).filter((a) => a.type === 'live');

  const composeText = () => {
    const topicBit = selectedTopics.join(' ');
    const memberBit = selectedMembers.map((m) => `@${m.name}`).join(' ');
    return [topicBit, memberBit, draft.trim()].filter(Boolean).join(' ').trim();
  };

  const submit = (event) => {
    event.preventDefault();
    const body = composeText();
    if (!body && !lockedPrefix) return;
    sendMessage(body || '');
    setDraft('');
    setSelectedTopics([]);
    setSelectedMembers([]);
  };

  const toggleTopic = (label) => {
    setSelectedTopics((current) =>
      current.includes(label) ? current.filter((t) => t !== label) : [...current, label]
    );
  };

  const toggleMember = (member) => {
    setSelectedMembers((current) => {
      const exists = current.some((m) => m.id === member.id);
      return exists ? current.filter((m) => m.id !== member.id) : [...current, member];
    });
  };

  const onDelete = () => {
    if (!active) return;
    deleteConversation(active.id);
  };

  const onSummary = async () => {
    if (!active || summarizing) return;
    setSummarizing(true);
    try {
      await requestExecutiveSummary(active.id);
    } finally {
      setSummarizing(false);
    }
  };

  if (!active) {
    return (
      <Box className="chat-page" sx={{ p: 4 }}>
        <Typography>No chats yet.</Typography>
        <Button onClick={() => startChat('astro-chat')}>New chat</Button>
      </Box>
    );
  }

  return (
    <Box className="chat-page">
      <aside className="chats-rail" aria-label="Chat history">
        <Box className="chats-rail__head">
          <span className="chats-rail__label">{t('chats')}</span>
          <Tooltip title="New chat">
            <IconButton
              size="small"
              aria-label="New chat"
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
          <Box sx={{ minWidth: 0, flex: 1 }}>
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

          <Box className="conversation__actions" sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
            {astrologer.type === 'live' && (
              <>
                <Box className="conversation__price">{astrologer.price}</Box>
                <Button variant="contained" size="small" disabled={!astrologer.online}>
                  Book live session
                </Button>
              </>
            )}
            <Tooltip title="Executive summary">
              <span>
                <IconButton
                  size="small"
                  aria-label="Generate executive summary"
                  onClick={onSummary}
                  disabled={summarizing}
                  sx={{ color: '#5B3FA0' }}
                >
                  <SummarizeOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            {astrologer.type === 'ai' && (
              <Tooltip title="Continue with a human astrologer">
                <IconButton
                  size="small"
                  aria-label="Continue with a human astrologer"
                  onClick={() => setHandoffOpen((v) => !v)}
                  sx={{ color: '#5B3FA0' }}
                >
                  <SwapHorizIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete chat">
              <IconButton
                size="small"
                aria-label="Delete chat"
                onClick={onDelete}
                sx={{ color: '#8A849E' }}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </header>

        {handoffOpen && astrologer.type === 'ai' && (
          <Box
            sx={{
              px: 2,
              py: 1,
              borderBottom: '1px solid #E6DEEF',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              bgcolor: '#F7F4FB',
            }}
          >
            <Typography sx={{ fontSize: 12, color: '#6A6580', width: '100%' }}>
              Hand off this chat — summary is shared with the human reader.
            </Typography>
            {liveAstrologers.map((person) => (
              <Button
                key={person.id}
                size="small"
                variant="outlined"
                disabled={!person.online}
                onClick={async () => {
                  setHandoffOpen(false);
                  await handoffToHuman(person.id);
                }}
                sx={{ borderColor: person.accent, color: person.accent, textTransform: 'none' }}
              >
                {person.name}
              </Button>
            ))}
          </Box>
        )}

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
          <Box sx={{ display: 'grid', gap: 0.75, px: 0.5, pb: 1 }} aria-label="Add context to your question">
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
              <Typography sx={{ fontSize: 11, color: '#8A849E', mr: 0.5, minWidth: 52 }}>Topics</Typography>
              {SUGGESTIONS.map(({ label, icon: Icon }) => {
                const on = selectedTopics.includes(label);
                return (
                  <button
                    type="button"
                    key={label}
                    className="context-box"
                    onClick={() => toggleTopic(label)}
                    aria-pressed={on}
                    style={{
                      borderColor: on ? '#5B3FA0' : '#E6DEEF',
                      background: on ? '#EFE9F7' : '#FFFFFF',
                    }}
                  >
                    <Icon sx={{ fontSize: 14 }} />
                    {label}
                  </button>
                );
              })}
            </Box>
            {familyChips.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
                <Typography sx={{ fontSize: 11, color: '#8A849E', mr: 0.5, minWidth: 52 }}>Family</Typography>
                {familyChips.map((member) => {
                  const on = selectedMembers.some((m) => m.id === member.id);
                  return (
                    <button
                      type="button"
                      key={member.id}
                      className="context-box"
                      onClick={() => toggleMember(member)}
                      aria-pressed={on}
                      title={`Include ${member.name} (${member.relation})`}
                      style={{
                        borderColor: on ? '#5B3FA0' : '#E6DEEF',
                        background: on ? '#EFE9F7' : '#FFFFFF',
                      }}
                    >
                      {member.name}
                      <span style={{ color: '#8A849E', marginLeft: 6 }}>{member.relation}</span>
                    </button>
                  );
                })}
              </Box>
            )}
          </Box>
          <form className="composer" onSubmit={submit}>
            <Tooltip title="Attach a file">
              <IconButton size="small" aria-label="Attach a file" sx={{ color: '#6A6580' }} type="button">
                <AttachFileIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {lockedPrefix ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flex: 1,
                  minWidth: 0,
                  bgcolor: '#F7F4FB',
                  borderRadius: 2,
                  px: 1,
                  py: 0.5,
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontSize: 13,
                    color: '#6A6580',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '42%',
                  }}
                  title={lockedPrefix}
                >
                  {lockedPrefix}
                </Typography>
                <input
                  ref={inputRef}
                  className="composer__input"
                  placeholder="Add your question…"
                  aria-label="Message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  style={{ background: 'transparent' }}
                />
              </Box>
            ) : (
              <input
                ref={inputRef}
                className="composer__input"
                placeholder={t('askPlaceholder')}
                aria-label="Message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            )}
            <button
              type="submit"
              className="composer__send"
              aria-label="Send message"
              disabled={!composeText() && !lockedPrefix}
            >
              <SendIcon sx={{ fontSize: 17 }} />
            </button>
          </form>
          <Typography className="composer-note">
            Select topics or family above to include context. Astro Chat can make mistakes.
          </Typography>
        </Box>
      </section>

      <Snackbar
        open={Boolean(pendingUndo)}
        autoHideDuration={6000}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return;
          dismissUndo();
        }}
        message="Chat deleted"
        action={
          <Button color="secondary" size="small" onClick={() => undoDelete()}>
            Undo
          </Button>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

export default ChatInterface;
