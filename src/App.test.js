import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import App from './App';
import theme from './theme';
import {
  BETA_INVITE_CODE,
  STORAGE_KEYS,
  clearBetaSession,
  seedCompletedBetaSession,
} from './betaSession';

function renderApp(path = '/') {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </ThemeProvider>
  );
}

function openSidePanel() {
  fireEvent.click(screen.getByLabelText(/open navigation/i));
  return screen.getByRole('navigation', { name: /main navigation/i });
}

const conversation = () => screen.getByRole('region', { name: /conversation/i });

beforeEach(() => {
  clearBetaSession();
  seedCompletedBetaSession({ email: 'abhishek@example.com' });
  const { saveFamilyMembers } = require('./betaSession');
  saveFamilyMembers([
    {
      id: 1,
      name: 'Ramesh Sharma',
      relation: 'Father',
      date: '1962-03-12',
      time: '06:15',
      place: 'Jaipur, Rajasthan, India',
      chartReady: true,
    },
  ]);
  try {
    require('./providers').getUsageMeter().resetDemo();
  } catch {
    /* ignore */
  }
  global.fetch = jest.fn(async (input, init) => {
    const url = String(input);
    if (url.includes('/api/chat')) {
      const body = JSON.parse(init.body);
      return {
        ok: true,
        async json() {
          return {
            text: `From the chart: gradual progress rather than a sudden breakthrough for “${body.question}”.`,
            provider: 'test',
            used_llm: false,
          };
        },
      };
    }
    if (url.includes('/api/health')) {
      return { ok: true, async json() { return { ok: true, llm: false, places: false }; } };
    }
    if (url.includes('/api/settings') || url.includes('/api/account')) {
      return {
        ok: true,
        async json() {
          return { settings: { locale: 'en' }, account: null };
        },
      };
    }
    if (url.includes('/api/admin/llm')) {
      const body = init?.body ? JSON.parse(init.body) : {};
      if (body.action === 'probe') {
        return {
          ok: true,
          async json() {
            return {
              ok: true,
              reply: { text: 'Steady skill-building.', provider: 'nvidia', used_llm: true },
              trace: {
                at: new Date().toISOString(),
                ok: true,
                provider: 'nvidia',
                model: 'nvidia/nemotron-3.5-bolt-e4b',
                baseUrl: 'https://integrate.api.nvidia.com/v1',
                masterPrompt: 'Ground every answer…',
                context: 'Lagna: Mesha',
                question: body.question || 'probe',
                thinking: 'Consider 10th house…',
                output: 'Steady skill-building.',
                usage: { promptTokens: 120, completionTokens: 40, totalTokens: 160 },
                params: { topP: 1 },
              },
            };
          },
        };
      }
      return {
        ok: true,
        async json() {
          return {
            ok: true,
            lab: {
              masterPrompt: '',
              provider: 'nvidia',
              providerLabel: 'NVIDIA NIM',
              baseUrl: 'https://integrate.api.nvidia.com/v1',
              secretName: 'NVIDIA_API_KEY',
              model: 'nvidia/nemotron-3.5-bolt-e4b',
              apiKeySet: true,
              apiKeyRequired: false,
              keyLocked: true,
              providerCustom: false,
              apiKeyMasked: '•••• permanent Cloudflare secret (NVIDIA_API_KEY)',
              cloudflareSecretsWritable: true,
              customProviders: [],
              topP: 1,
              frequencyPenalty: 0,
              presencePenalty: 0,
              maxTokens: 280,
              captureThinking: true,
              showThinking: false,
              providers: [
                {
                  id: 'nvidia',
                  label: 'NVIDIA NIM',
                  baseUrl: 'https://integrate.api.nvidia.com/v1',
                  secretName: 'NVIDIA_API_KEY',
                  defaultModel: 'nvidia/nemotron-3.5-bolt-e4b',
                  apiKeySet: true,
                },
                {
                  id: 'openai',
                  label: 'OpenAI',
                  baseUrl: 'https://api.openai.com/v1',
                  secretName: 'OPENAI_API_KEY',
                  defaultModel: 'gpt-4o-mini',
                  apiKeySet: false,
                },
                {
                  id: 'claude',
                  label: 'Claude (Anthropic)',
                  baseUrl: 'https://api.anthropic.com/v1',
                  secretName: 'ANTHROPIC_API_KEY',
                  defaultModel: 'claude-sonnet-4-20250514',
                  apiKeySet: false,
                },
              ],
              defaults: { masterPrompt: 'Ground every answer…', provider: 'nvidia' },
            },
            trace: null,
          };
        },
      };
    }
    if (url.includes('/api/places/autocomplete')) {
      return {
        ok: true,
        async json() {
          return {
            provider: 'nominatim',
            predictions: [
              {
                placeId: 'nominatim:1',
                description: 'Jaipur, Rajasthan, India',
                lat: 26.91,
                lon: 75.79,
                countryCode: 'IN',
                provider: 'nominatim',
              },
            ],
          };
        },
      };
    }
    if (url.includes('/api/places/details')) {
      return {
        ok: true,
        async json() {
          return {
            place: {
              placeId: 'nominatim:1',
              label: 'Jaipur, Rajasthan, India',
              lat: 26.91,
              lon: 75.79,
              countryCode: 'IN',
              tzOffsetHours: 5.5,
              source: 'nominatim',
            },
          };
        },
      };
    }
    return { ok: false, status: 404, async json() { return {}; } };
  });
});

afterEach(() => {
  clearBetaSession();
  jest.resetAllMocks();
});

test('homepage renders the chat interface with a composer', () => {
  renderApp('/');
  expect(screen.getByPlaceholderText(/ask about your chart/i)).toBeInTheDocument();
  expect(screen.getByRole('complementary', { name: /chat history/i })).toBeInTheDocument();
});

test('several conversations are filed under each astrologer', () => {
  renderApp('/chat');
  const history = screen.getByRole('complementary', { name: /chat history/i });
  expect(within(history).getByText('Career transition guidance')).toBeInTheDocument();
  expect(within(history).getByText('Marriage compatibility')).toBeInTheDocument();
  expect(within(history).getByText('Weekly horoscope')).toBeInTheDocument();
  expect(within(history).getByText('Remedies for Saturn transit')).toBeInTheDocument();
  expect(within(history).getByText('Marriage timing')).toBeInTheDocument();
});

test('the chat history rail can start another chat with the AI astrologer', () => {
  renderApp('/chat');
  fireEvent.click(screen.getByLabelText(/^new chat$/i));
  const history = screen.getByRole('complementary', { name: /chat history/i });
  expect(within(history).getByText('New chat')).toBeInTheDocument();
  expect(within(conversation()).getByText('Astro Chat')).toBeInTheDocument();
});

test('a new chat defaults to the AI astrologer', () => {
  renderApp('/chat');
  fireEvent.click(screen.getByLabelText(/^new chat$/i));
  expect(within(conversation()).getByText('Astro Chat')).toBeInTheDocument();
  expect(within(conversation()).queryByText(/book live session/i)).not.toBeInTheDocument();
});

test('side panel lists every destination and puts Services above Subscription', () => {
  renderApp('/');
  const nav = openSidePanel();
  const labels = [
    'Chat',
    'Services',
    'Family Members',
    'Kundali Chart',
    'Subscription',
    'Support',
    'Settings',
  ];
  labels.forEach((label) => {
    expect(within(nav).getByRole('button', { name: label })).toBeInTheDocument();
  });

  const services = within(nav).getByRole('button', { name: 'Services' });
  const subscription = within(nav).getByRole('button', { name: 'Subscription' });
  const position = services.compareDocumentPosition(subscription);
  expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test('the account block with a logout option sits at the bottom of the side panel', () => {
  renderApp('/');
  const nav = openSidePanel();
  expect(within(nav).getByText('Abhishek')).toBeInTheDocument();
  expect(within(nav).getByRole('button', { name: /log out/i })).toBeInTheDocument();
});

test('side panel is available on every page', () => {
  ['/services', '/family', '/kundali', '/subscription', '/support', '/reports', '/astrologers', '/remedies'].forEach((path) => {
    const { unmount } = renderApp(path);
    expect(screen.getByLabelText(/open navigation/i)).toBeInTheDocument();
    unmount();
  });
});

test('side panel navigation moves to the services screen', () => {
  renderApp('/');
  const nav = openSidePanel();
  fireEvent.click(within(nav).getByRole('button', { name: 'Services' }));
  expect(screen.getByRole('heading', { name: /our services/i })).toBeInTheDocument();
});

test('kundali page back link returns to the chat home page', () => {
  renderApp('/kundali');
  fireEvent.click(screen.getByRole('button', { name: /back to home/i }));
  expect(screen.getByPlaceholderText(/ask about your chart/i)).toBeInTheDocument();
});

test('a live astrologer conversation is not blank and offers a live session', () => {
  renderApp('/chat');
  fireEvent.click(screen.getByRole('button', { name: /remedies for saturn transit/i }));
  const region = conversation();
  expect(within(region).getByText('Acharya Rajiv Sharma')).toBeInTheDocument();
  expect(within(region).getByRole('button', { name: /book live session/i })).toBeInTheDocument();
  expect(within(region).getAllByText(/namaste/i).length).toBeGreaterThan(0);
});

test('family page can start adding a member with a relation', () => {
  renderApp('/family');
  expect(screen.getByText(/\(You\)/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /add family member/i }));
  expect(screen.getByLabelText(/relation/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
});

test('services open dedicated reports, astrologers and remedies pages', () => {
  renderApp('/services');
  fireEvent.click(screen.getByText(/detailed reports/i));
  expect(screen.getByRole('heading', { name: /detailed reports/i })).toBeInTheDocument();
  expect(screen.getAllByRole('columnheader', { name: /prepared by/i }).length).toBeGreaterThan(0);
});

test('chat composer exposes family context chips', () => {
  renderApp('/chat');
  // Seeded family names appear as insertable context near the composer.
  expect(screen.getByRole('button', { name: /ramesh sharma/i })).toBeInTheDocument();
});

test('unguarded routes redirect to splash when there is no invite', () => {
  clearBetaSession();
  renderApp('/chat');
  expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
});

test('a valid invite code unlocks birth details', async () => {
  clearBetaSession();
  renderApp('/invite');
  fireEvent.change(screen.getByLabelText(/invite code/i), {
    target: { value: BETA_INVITE_CODE },
  });
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'tester@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: /enter beta/i }));
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /your birth details/i })).toBeInTheDocument();
  });
});

test('returning users with a completed session land on chat from splash', () => {
  renderApp('/splash');
  expect(screen.getByPlaceholderText(/ask about your chart/i)).toBeInTheDocument();
});

test('chats persist across remounts', async () => {
  const { unmount } = renderApp('/chat');
  fireEvent.click(screen.getByRole('button', { name: /^new chat$/i }));
  const input = screen.getByPlaceholderText(/ask about your chart/i);
  fireEvent.change(input, {
    target: { value: 'Career advice for a switch' },
  });
  fireEvent.submit(input.closest('form'));
  await waitFor(() => {
    expect(
      within(conversation()).getByText(/gradual progress rather than a sudden breakthrough/i)
    ).toBeInTheDocument();
  });
  unmount();

  renderApp('/chat');
  expect(
    within(screen.getByRole('complementary', { name: /chat history/i })).getByText(
      'Career advice for a switch'
    )
  ).toBeInTheDocument();
});

test('logout clears the invite and returns to splash', () => {
  const first = renderApp('/');
  const nav = openSidePanel();
  fireEvent.click(within(nav).getByRole('button', { name: /log out/i }));
  expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
  expect(window.localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
  first.unmount();

  renderApp('/chat');
  expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
});

test('first-run onboarding reaches chat after creating a chart', async () => {
  clearBetaSession();
  renderApp('/invite');

  fireEvent.change(screen.getByLabelText(/invite code/i), {
    target: { value: BETA_INVITE_CODE },
  });
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'first@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: /enter beta/i }));

  await waitFor(() => {
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
  });

  fireEvent.change(screen.getByLabelText(/date of birth/i), {
    target: { value: '1988-08-14' },
  });
  fireEvent.change(screen.getByLabelText(/time of birth/i), {
    target: { value: '12:45' },
  });
  fireEvent.change(screen.getByLabelText(/place of birth/i), {
    target: { value: 'Jaipur, Rajasthan, India' },
  });
  fireEvent.click(screen.getByRole('button', { name: /create my chart/i }));

  expect(screen.getByText(/creating your/i)).toBeInTheDocument();

  await waitFor(
    () => {
      expect(screen.getByPlaceholderText(/ask about your chart/i)).toBeInTheDocument();
    },
    { timeout: 8000 }
  );
});

test('settings page can switch language to Hindi', async () => {
  renderApp('/settings');
  expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'हिन्दी' }));
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'सेटिंग्स' })).toBeInTheDocument();
  });
});

test(
  'LLM lab is reachable from settings',
  async () => {
    renderApp('/settings/llm');
    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: /^llm lab$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save llm settings/i })).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
    expect(screen.getByRole('button', { name: /reset defaults/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /llm console/i })).toBeInTheDocument();
  },
  15000
);

test('astrologers marketplace shows recommendations tab and topic filters', () => {
  renderApp('/astrologers');
  expect(screen.getByRole('heading', { name: /chat with an astrologer/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /recommendations/i })).toBeInTheDocument();
  const topicFilters = screen.getByRole('group', { name: /topic filter/i });
  expect(within(topicFilters).getByRole('button', { name: /^career$/i })).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/search jyotish/i)).toBeInTheDocument();
});

test('kundali page shows the North Indian diamond chart when a chart exists', () => {
  const { generateChart } = require('./lib/chartEngine');
  const { saveChart } = require('./betaSession');
  saveChart(
    generateChart({
      date: '1988-08-14',
      time: '12:45',
      place: 'Jaipur, Rajasthan, India',
    })
  );
  renderApp('/kundali');
  expect(screen.getByLabelText(/lagna kundali north indian chart/i)).toBeInTheDocument();
  expect(screen.getByText(/north indian whole-sign chart/i)).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /abhishek \(you\)/i })).toBeInTheDocument();
});
