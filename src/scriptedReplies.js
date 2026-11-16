/** Keyword-based scripted replies for the beta (no provider key in the client). */

const FALLBACK =
  'Thank you. I have noted this against your chart. From the placements I can see, this is a period for steady choices rather than sudden leaps. Ask about career, relationships, health, or remedies for a more focused reading.';

const RULES = [
  {
    keys: ['career', 'job', 'work', 'promotion', 'business'],
    reply:
      'Your 10th-house indications point to gradual progress rather than a sudden breakthrough. Keep building visible skill; a clearer opportunity window opens once the current Saturn pressure eases. I can outline remedies or timing themes if you want to go deeper.',
  },
  {
    keys: ['marriage', 'relationship', 'partner', 'compatibility', 'love'],
    reply:
      'The 7th-house picture favours careful communication over haste. Compatibility improves when both charts are compared side by side. Family introductions tend to land better than rushed self-driven moves in the near term.',
  },
  {
    keys: ['health', 'sleep', 'stress', 'anxiety'],
    reply:
      'Moon–Mercury patterns in charts like yours often show a sensitive nervous system. Regular sleep and a lighter evening meal help more than speculative gemstones. This is general chart guidance, not a medical diagnosis.',
  },
  {
    keys: ['remedy', 'remedies', 'donation', 'mantra', 'gemstone'],
    reply:
      'For this chart, calm Saturday habits and a simple act of giving (dark grains or sesame oil for a lamp) are the most suitable starter remedies. Avoid treating remedies as guaranteed outcomes; they support discipline, they do not force results.',
  },
  {
    keys: ['week', 'today', 'transit', 'horoscope'],
    reply:
      'This stretch favours planning over launching. Keep financial decisions for the calmer days later in the week, and use the quieter days for review rather than new commitments.',
  },
];

export function scriptedReplyFor(text) {
  const lower = String(text || '').toLowerCase();
  const match = RULES.find((rule) => rule.keys.some((key) => lower.includes(key)));
  return match ? match.reply : FALLBACK;
}
