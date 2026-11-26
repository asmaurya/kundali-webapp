import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getChart,
  getSettings,
  loadActiveId,
  loadConversations,
  saveActiveId,
  saveConversations,
} from './betaSession';
import { askOracle } from './api';
import { scriptedReplyFor } from './scriptedReplies';
import { buildLlmChartContext } from './lib/chartEngine';
import {
  chartIdsForTopics,
  normalizeChartTopicMatrix,
  topicIdFromLabel,
} from './lib/chartTopicMatrix';
import { getSelfProfile, listProfiles } from './lib/profiles';
import {
  markAstrologerUsed,
  maybeCaptureRemedyFromReply,
  maybeCaptureReportFromChat,
} from './lib/libraryStore';

/** People map for anonymiser (names → relationship labels). */
function peopleForAnonymize() {
  const self = getSelfProfile();
  const family = listProfiles()
    .filter((p) => !p.isSelf)
    .map((p) => ({ name: p.name, relation: p.relation }));
  return { selfName: self?.name || '', family };
}

/** Family charts mentioned in the question (querent chart is always added separately). */
function familyChartsFromQuestion(question) {
  const profiles = listProfiles().filter((p) => !p.isSelf && p.chart);
  if (!profiles.length) return [];
  const q = String(question || '').toLowerCase();
  return profiles
    .filter(
      (p) =>
        q.includes(String(p.name).toLowerCase()) || q.includes(`@${String(p.name).toLowerCase()}`)
    )
    .map((p) => ({
      // Name kept briefly for anonymiser → relation label; chart JSON has no personal name field.
      label: `${p.name} (${p.relation})`,
      relation: p.relation,
      chart: p.chart,
    }));
}

export const ASTROLOGERS = {
  'astro-chat': {
    id: 'astro-chat',
    name: 'Astro Chat',
    initials: 'AI',
    type: 'ai',
    online: true,
    accent: '#5B3FA0',
    tint: '#F1EBFA',
    speciality: 'Chart-based guidance',
    oneLiner: 'Calm, chart-grounded answers from your Kundali — available anytime.',
    description:
      'Your personal astrology assistant. Answers are generated from your birth chart, dashas and transits.',
  },
  rajiv: {
    id: 'rajiv',
    name: 'Acharya Rajiv Sharma',
    initials: 'RS',
    type: 'live',
    online: true,
    accent: '#2F6B52',
    tint: '#EDF4F0',
    speciality: 'Vedic astrology • Career • Remedies',
    topics: ['career', 'remedies', 'timing'],
    oneLiner: 'Steady career and Saturn-period guidance with practical remedies.',
    description: '18 years of practice. Specialises in career direction, Saturn transits and remedial measures.',
    price: '₹499 / 30 min',
    experience: '18 years',
  },
  meera: {
    id: 'meera',
    name: 'Acharya Meera Verma',
    initials: 'MV',
    type: 'live',
    online: true,
    accent: '#9A4A63',
    tint: '#FAEEF2',
    speciality: 'Vedic astrology • Relationships • Marriage',
    topics: ['relationship', 'timing'],
    oneLiner: 'Marriage timing and family-chart readings with a gentle voice.',
    description: 'Specialises in compatibility, marriage timing and family consultations.',
    price: '₹399 / 30 min',
    experience: '12 years',
  },
  vikram: {
    id: 'vikram',
    name: 'Acharya Vikram Joshi',
    initials: 'VJ',
    type: 'live',
    online: false,
    accent: '#8A6A2F',
    tint: '#F9F3E6',
    speciality: 'Numerology • Health • Career',
    topics: ['health', 'career', 'finance'],
    oneLiner: 'Health and life-path insights blending Vedic chart with numbers.',
    description: 'Works with numerology and health indications alongside classical Vedic charts.',
    price: '₹449 / 30 min',
    experience: '9 years',
  },
};

const GREETING =
  'Namaste. Your birth chart is ready. Ask about your career, relationships, health or remedies, and I will answer from your chart.';

let sequence = 100;
const nextId = () => {
  sequence += 1;
  return `c${sequence}`;
};

const demoConversations = [
  {
    id: 'c1',
    astrologerId: 'astro-chat',
    title: 'Career transition guidance',
    updated: 'Just now',
    executiveSummary:
      'Querent feels stuck at work. Guidance: Saturn aspect on the 10th favours durable, gradual progress over abrupt moves; remedies or a live consult were offered as next steps.',
    messages: [
      { role: 'bot', text: GREETING },
      { role: 'user', text: 'I am feeling stuck in my career. Can you guide me?' },
      {
        role: 'bot',
        text:
          'Your chart shows a transition phase in the 10th house. Saturn is aspecting your career house for a while longer, which usually means slower but more durable progress. I can prepare a detailed insight, suggest remedies, or connect you with a live astrologer.',
      },
    ],
  },
  {
    id: 'c2',
    astrologerId: 'astro-chat',
    title: 'Marriage compatibility',
    updated: 'Yesterday',
    messages: [
      { role: 'bot', text: GREETING },
      { role: 'user', text: 'How compatible am I with a Capricorn moon sign?' },
      {
        role: 'bot',
        text:
          'Your Moon in Cancer and a Capricorn Moon form a classic opposite-sign pairing. It brings stability through contrast, but both partners need clear emotional communication. A full compatibility reading would compare both charts.',
      },
    ],
  },
  {
    id: 'c3',
    astrologerId: 'astro-chat',
    title: 'Weekly horoscope',
    updated: '3 days ago',
    messages: [
      { role: 'bot', text: GREETING },
      { role: 'user', text: 'What does this week look like for me?' },
      {
        role: 'bot',
        text:
          'This week favours planning rather than launching. Mercury turning direct should clear the delays you have felt recently. Keep financial decisions for the calmer days later in the week.',
      },
    ],
  },
  {
    id: 'c4',
    astrologerId: 'rajiv',
    title: 'Remedies for Saturn transit',
    updated: 'Yesterday',
    messages: [
      {
        role: 'bot',
        text:
          'Namaste, this is Acharya Rajiv Sharma. I have reviewed your chart. Ask your question and I will reply here; for a live session you can book 30 minutes from the panel above.',
      },
      { role: 'user', text: 'Which remedies help during the Saturn transit?' },
      {
        role: 'bot',
        text:
          'For your chart, a Saturday practice is most suitable: a sesame oil lamp and donating black gram. Avoid beginning major contracts on Saturdays until the transit eases.',
      },
    ],
  },
  {
    id: 'c5',
    astrologerId: 'rajiv',
    title: 'Career switch timing',
    updated: '4 days ago',
    messages: [
      {
        role: 'bot',
        text:
          'Namaste, this is Acharya Rajiv Sharma. I have reviewed your chart. Ask your question and I will reply here; for a live session you can book 30 minutes from the panel above.',
      },
      { role: 'user', text: 'When is a good time to change jobs?' },
      {
        role: 'bot',
        text:
          'The window after the next new moon is more supportive than the present one. Aim for offers in the calmer part of the coming lunar cycle; the 10th house lord is better placed then.',
      },
    ],
  },
  {
    id: 'c6',
    astrologerId: 'meera',
    title: 'Marriage timing',
    updated: '5 days ago',
    messages: [
      {
        role: 'bot',
        text:
          'Namaste, this is Acharya Meera Verma. I have reviewed your chart. Ask your question and I will reply here; for a live session you can book 30 minutes from the panel above.',
      },
      { role: 'user', text: 'When is marriage likely for me?' },
      {
        role: 'bot',
        text:
          'Your 7th lord is well placed, and the current sub-period supports a serious alliance within roughly the next year to year-and-a-half. Family introductions are more likely to succeed than self-initiated ones.',
      },
    ],
  },
  {
    id: 'c7',
    astrologerId: 'vikram',
    title: 'Health and numerology',
    updated: 'Last week',
    messages: [
      {
        role: 'bot',
        text:
          'Namaste, this is Acharya Vikram Joshi. I have reviewed your chart. Ask your question and I will reply here; for a live session you can book 30 minutes from the panel above.',
      },
      { role: 'user', text: 'Does my numerology number affect my health?' },
      {
        role: 'bot',
        text:
          'Your life-path number points to a nervous disposition, which matches the Moon–Mercury combination in your chart. Regular sleep and a lighter evening meal will help more than any gemstone.',
      },
    ],
  },
];

function initialState() {
  const stored = loadConversations();
  if (Array.isArray(stored) && stored.length > 0) {
    const storedActive = loadActiveId();
    const activeId =
      storedActive && stored.some((item) => item.id === storedActive)
        ? storedActive
        : stored[0].id;
    return { conversations: stored, activeId };
  }
  return { conversations: demoConversations, activeId: 'c1' };
}

const ChatContext = createContext(null);

function isEmptyUserChat(conversation) {
  if (!conversation) return false;
  return !conversation.messages?.some((m) => m.role === 'user');
}

function buildLocalSummary(messages = []) {
  const userTurns = messages.filter((m) => m.role === 'user').map((m) => m.text);
  const botTurns = messages.filter((m) => m.role === 'bot').map((m) => m.text);
  if (!userTurns.length) return 'No user messages in this chat yet.';
  const topics = [];
  [
    [/career|job|work|promotion|business/i, 'career'],
    [/marriage|relationship|partner|love|compatibility/i, 'relationships'],
    [/health|sleep|stress|anxiety/i, 'health'],
    [/remedy|remedies|donation|mantra|dasha/i, 'remedies / dasha'],
  ].forEach(([re, label]) => {
    if (userTurns.some((t) => re.test(t)) && !topics.includes(label)) topics.push(label);
  });
  return [
    topics.length ? `Topics: ${topics.join(', ')}.` : null,
    `Questions asked: ${userTurns.length}.`,
    `Latest question: ${userTurns[userTurns.length - 1]}`,
    botTurns.length ? `Latest guidance: ${botTurns[botTurns.length - 1].slice(0, 220)}` : null,
  ]
    .filter(Boolean)
    .join(' ');
}

export function ChatProvider({ children }) {
  const boot = initialState();
  const [conversations, setConversations] = useState(() =>
    boot.conversations.filter((c) => !isEmptyUserChat(c) || c.id === boot.activeId)
  );
  const [activeId, setActiveId] = useState(boot.activeId);
  const [pendingUndo, setPendingUndo] = useState(null);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveActiveId(activeId);
  }, [activeId]);

  // Drop unused empty shells when leaving them.
  useEffect(() => {
    setConversations((current) => {
      const pruned = current.filter((c) => c.id === activeId || !isEmptyUserChat(c));
      return pruned.length === current.length ? current : pruned;
    });
  }, [activeId]);

  const value = useMemo(() => {
    const active = conversations.find((item) => item.id === activeId) || conversations[0];

    const openConversation = (id) => setActiveId(id);

    const startChat = (astrologerId = 'astro-chat', options = {}) => {
      const astrologer = ASTROLOGERS[astrologerId] || ASTROLOGERS['astro-chat'];
      markAstrologerUsed(astrologer.id);
      const id = nextId();
      const greeting =
        options.seedBotText ||
        (astrologer.type === 'ai'
          ? GREETING
          : `Namaste, this is ${astrologer.name}. I have reviewed your chart. Ask your question and I will reply here; for a live session you can book 30 minutes from the panel above.`);
      const conversation = {
        id,
        astrologerId: astrologer.id,
        title: options.title || 'New chat',
        updated: 'Just now',
        lockedPrefix: options.lockedPrefix || '',
        handoffFromId: options.handoffFromId || null,
        messages: options.messages || [{ role: 'bot', text: greeting }],
      };
      setConversations((current) => {
        const pruned = current.filter((c) => !isEmptyUserChat(c));
        return [conversation, ...pruned];
      });
      setActiveId(id);
      return id;
    };

    const deleteConversation = (id) => {
      const target = conversations.find((c) => c.id === id);
      if (!target) return null;
      const remaining = conversations.filter((c) => c.id !== id);
      const nextActive =
        id === activeId ? remaining[0]?.id || null : activeId;
      setPendingUndo({ conversation: target, index: conversations.findIndex((c) => c.id === id) });
      setConversations(remaining.length ? remaining : demoConversations);
      setActiveId(nextActive || (remaining[0]?.id ?? 'c1'));
      return target;
    };

    const undoDelete = () => {
      if (!pendingUndo?.conversation) return false;
      const { conversation, index } = pendingUndo;
      setConversations((current) => {
        const next = [...current];
        next.splice(Math.min(index, next.length), 0, conversation);
        return next;
      });
      setActiveId(conversation.id);
      setPendingUndo(null);
      return true;
    };

    const dismissUndo = () => setPendingUndo(null);

    const renameConversation = (id, title) => {
      setConversations((current) =>
        current.map((c) => (c.id === id ? { ...c, title, updated: 'Just now' } : c))
      );
    };

    const attachExecutiveSummary = (id, summary) => {
      setConversations((current) =>
        current.map((c) =>
          c.id === id
            ? {
                ...c,
                executiveSummary: summary,
                summaryUpdatedAt: new Date().toISOString(),
                updated: 'Just now',
              }
            : c
        )
      );
    };

    const clearLockedPrefix = (id) => {
      setConversations((current) =>
        current.map((c) => (c.id === id ? { ...c, lockedPrefix: '' } : c))
      );
    };

    const sendMessage = async (text, { skipLockedPrefix, topics = [] } = {}) => {
      if (!active) return;
      const prefix = skipLockedPrefix ? '' : active.lockedPrefix || '';
      const userPart = String(text || '').trim();
      const trimmed = `${prefix}${userPart}`.trim();
      if (!trimmed) return;
      const targetId = active.id;
      const astrologer = ASTROLOGERS[active.astrologerId] || ASTROLOGERS['astro-chat'];
      markAstrologerUsed(astrologer.id);
      const priorMessages = active.messages;
      const wasUntitled = active.title === 'New chat' || !priorMessages.some((m) => m.role === 'user');
      const topicIds = (Array.isArray(topics) ? topics : [])
        .map((t) => topicIdFromLabel(t) || t)
        .filter(Boolean);

      setConversations((current) =>
        current.map((conversation) => {
          if (conversation.id !== targetId) return conversation;
          return {
            ...conversation,
            title: wasUntitled
              ? userPart.length > 42
                ? `${userPart.slice(0, 42)}…`
                : userPart || conversation.title
              : conversation.title,
            updated: 'Just now',
            lockedPrefix: conversation.lockedPrefix || '',
            messages: [...conversation.messages, { role: 'user', text: trimmed, topics: topicIds }],
          };
        })
      );

      let replyText = scriptedReplyFor(trimmed);
      let botMeta = null;
      if (astrologer.type === 'ai') {
        const settings = getSettings() || {};
        const locale = settings.locale === 'hi' ? 'hi' : 'en';
        const chart = getChart();
        const matrix = normalizeChartTopicMatrix(settings.chartTopicMatrix);
        const chartIds = chartIdsForTopics(matrix, topicIds);
        const familyCharts = chartIds.includes('family')
          ? familyChartsFromQuestion(trimmed)
          : [];
        let chartContext = '';
        try {
          chartContext = buildLlmChartContext({
            querentChart: chart,
            familyCharts,
            chartIds,
          });
          const result = await askOracle({
            question: trimmed,
            chart,
            chartContext,
            history: priorMessages,
            locale,
            people: peopleForAnonymize(),
          });
          replyText = result.text;
          const packet = result.llmPacket || {};
          botMeta = {
            provider: result.provider,
            usage: result.usage || null,
            thinking: result.thinking || '',
            model: result.model || null,
            llmPacket: {
              ...packet,
              at: packet.at || new Date().toISOString(),
              topics: topicIds,
              chartIds,
              // One chart copy: prefer worker context (already anonymised); else local.
              context: packet.context || chartContext || '',
              chartContext: undefined,
              system: undefined,
              systemInstructions: packet.systemInstructions || packet.system || '',
              question: packet.question || trimmed,
              history: packet.history?.length
                ? packet.history
                : priorMessages.slice(-8).map((m) => ({
                    role: m.role === 'bot' ? 'assistant' : 'user',
                    content: m.text,
                  })),
              output: packet.output || result.text,
              thinking: packet.thinking || result.thinking || '',
              usage: packet.usage || result.usage || null,
              provider: result.provider,
              model: result.model || packet.model || null,
              note:
                packet.note ||
                'Chart JSON appears once under CHART_CONTEXT. SYSTEM_INSTRUCTIONS has rules only.',
            },
          };
        } catch (error) {
          // Scripted fallback still gets a downloadable packet so the control is visible.
          botMeta = {
            provider: 'local-scripted',
            usage: null,
            thinking: '',
            model: null,
            llmPacket: {
              at: new Date().toISOString(),
              provider: 'local-scripted',
              topics: topicIds,
              chartIds,
              chartContext,
              context: chartContext,
              question: trimmed,
              history: priorMessages.slice(-8).map((m) => ({
                role: m.role === 'bot' ? 'assistant' : 'user',
                content: m.text,
              })),
              thinking: '',
              output: replyText,
              usage: null,
              error: String(error?.message || error).slice(0, 400),
              note: 'LLM call failed; this packet is the local scripted fallback plus the chart context that would have been sent.',
            },
          };
        }
      }

      maybeCaptureRemedyFromReply({ text: replyText, astrologer });
      maybeCaptureReportFromChat({
        question: trimmed,
        reply: replyText,
        astrologer,
        conversationId: targetId,
      });

      setConversations((current) =>
        current.map((conversation) => {
          if (conversation.id !== targetId) return conversation;
          return {
            ...conversation,
            updated: 'Just now',
            messages: [
              ...conversation.messages,
              {
                role: 'bot',
                text: replyText,
                ...(botMeta || {}),
              },
            ],
          };
        })
      );

      // LLM topic title after the first real user turn.
      if (wasUntitled && astrologer.type === 'ai') {
        try {
          const { suggestChatTitle } = await import('./api');
          const title = await suggestChatTitle({
            question: trimmed,
            reply: replyText,
            history: priorMessages,
          });
          if (title) {
            setConversations((current) =>
              current.map((c) => (c.id === targetId ? { ...c, title, updated: 'Just now' } : c))
            );
          }
        } catch {
          /* keep provisional title */
        }
      }
    };

    const requestExecutiveSummary = async (id) => {
      const conversation = conversations.find((c) => c.id === id) || active;
      if (!conversation) return '';
      const local = buildLocalSummary(conversation.messages);
      try {
        const { summarizeConversation } = await import('./api');
        const summary = await summarizeConversation({
          messages: conversation.messages,
          chart: getChart(),
        });
        const text = summary || local;
        attachExecutiveSummary(conversation.id, text);
        return text;
      } catch {
        attachExecutiveSummary(conversation.id, local);
        return local;
      }
    };

    const handoffToHuman = async (astrologerId) => {
      if (!active) return null;
      const summary =
        active.executiveSummary || buildLocalSummary(active.messages);
      return startChat(astrologerId, {
        title: `Handoff · ${active.title}`.slice(0, 48),
        handoffFromId: active.id,
        seedBotText: `Namaste. I have the summary of your Astro Chat so far:\n\n${summary}\n\nAsk what you would like me to focus on next.`,
        messages: [
          {
            role: 'bot',
            text: `Namaste. I have the summary of your Astro Chat so far:\n\n${summary}\n\nAsk what you would like me to focus on next.`,
          },
        ],
      });
    };

    /** Start a fresh chat with the current thread's summary as seed context. */
    const continueInNewChat = async () => {
      if (!active) return null;
      const summary =
        active.executiveSummary ||
        (await requestExecutiveSummary(active.id)) ||
        buildLocalSummary(active.messages);
      return startChat(active.astrologerId || 'astro-chat', {
        title: `Continued · ${active.title}`.slice(0, 48),
        handoffFromId: active.id,
        seedBotText: `Namaste. Carrying forward from your previous chat:\n\n${summary}\n\nAsk what you would like to focus on next.`,
        messages: [
          {
            role: 'bot',
            text: `Namaste. Carrying forward from your previous chat:\n\n${summary}\n\nAsk what you would like to focus on next.`,
          },
        ],
      });
    };

    const resetToDemo = () => {
      setConversations(demoConversations);
      setActiveId('c1');
      setPendingUndo(null);
    };

    return {
      conversations,
      active,
      activeId,
      pendingUndo,
      openConversation,
      startChat,
      sendMessage,
      deleteConversation,
      undoDelete,
      dismissUndo,
      renameConversation,
      requestExecutiveSummary,
      handoffToHuman,
      continueInNewChat,
      clearLockedPrefix,
      resetToDemo,
      byAstrologer: (astrologerId) => conversations.filter((c) => c.astrologerId === astrologerId),
    };
  }, [conversations, activeId, pendingUndo]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used inside ChatProvider');
  return context;
}
