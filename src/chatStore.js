import React, { createContext, useContext, useMemo, useState } from 'react';

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

const initialConversations = [
  {
    id: 'c1',
    astrologerId: 'astro-chat',
    title: 'Career transition guidance',
    updated: 'Just now',
    messages: [
      { role: 'bot', text: GREETING },
      { role: 'user', text: 'I am feeling stuck in my career. Can you guide me?' },
      {
        role: 'bot',
        text:
          'Your chart shows a transition phase in the 10th house. Saturn is aspecting your career house until late next year, which usually means slower but more durable progress. I can prepare a detailed insight, suggest remedies, or connect you with a live astrologer.',
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
          'This week favours planning rather than launching. Mercury turns direct on Thursday, which should clear the delays you have felt since the start of the month. Keep financial decisions for the weekend.',
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
          'For your chart, a Saturday practice is most suitable: sesame oil lamp at a Shani temple, and donating black gram. Avoid beginning major contracts on Saturdays until the transit ends.',
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
          'The window after the next new moon is more supportive than the present one. Aim for offers between the 18th and the 27th; the 10th house lord is better placed then.',
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
          'Your 7th lord is well placed, and the current sub-period supports a serious alliance within the next 12 to 16 months. Family introductions are more likely to succeed than self-initiated ones.',
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

const REPLY =
  'Thank you. I have noted this against your chart. Give me a moment to check the relevant houses and dashas, and I will follow up with a specific answer.';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState('c1');

  const value = useMemo(() => {
    const active = conversations.find((item) => item.id === activeId) || conversations[0];

    const openConversation = (id) => setActiveId(id);

    const startChat = (astrologerId = 'astro-chat') => {
      const astrologer = ASTROLOGERS[astrologerId] || ASTROLOGERS['astro-chat'];
      const id = nextId();
      const conversation = {
        id,
        astrologerId: astrologer.id,
        title: 'New chat',
        updated: 'Just now',
        messages: [
          {
            role: 'bot',
            text:
              astrologer.type === 'ai'
                ? GREETING
                : `Namaste, this is ${astrologer.name}. I have reviewed your chart. Ask your question and I will reply here; for a live session you can book 30 minutes from the panel above.`,
          },
        ],
      };
      setConversations((current) => [conversation, ...current]);
      setActiveId(id);
      return id;
    };

    const sendMessage = (text) => {
      const trimmed = (text || '').trim();
      if (!trimmed || !active) return;
      setConversations((current) =>
        current.map((conversation) => {
          if (conversation.id !== active.id) return conversation;
          const isFirstUserMessage = !conversation.messages.some((m) => m.role === 'user');
          return {
            ...conversation,
            title:
              conversation.title === 'New chat' || isFirstUserMessage
                ? trimmed.length > 42
                  ? `${trimmed.slice(0, 42)}…`
                  : trimmed
                : conversation.title,
            updated: 'Just now',
            messages: [
              ...conversation.messages,
              { role: 'user', text: trimmed },
              { role: 'bot', text: REPLY },
            ],
          };
        })
      );
    };

    return {
      conversations,
      active,
      activeId,
      openConversation,
      startChat,
      sendMessage,
      byAstrologer: (astrologerId) => conversations.filter((c) => c.astrologerId === astrologerId),
    };
  }, [conversations, activeId]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used inside ChatProvider');
  return context;
}
