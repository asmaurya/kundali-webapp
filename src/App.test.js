import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import App from './App';
import theme from './theme';

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

test('homepage renders the chat interface with a composer', () => {
  renderApp('/');
  expect(screen.getByPlaceholderText(/ask about your chart/i)).toBeInTheDocument();
  expect(screen.getByRole('complementary', { name: /chat history/i })).toBeInTheDocument();
});

test('several conversations are filed under each astrologer', () => {
  renderApp('/chat');
  const history = screen.getByRole('complementary', { name: /chat history/i });
  // AI astrologer keeps more than one separate chat.
  expect(within(history).getByText('Career transition guidance')).toBeInTheDocument();
  expect(within(history).getByText('Marriage compatibility')).toBeInTheDocument();
  expect(within(history).getByText('Weekly horoscope')).toBeInTheDocument();
  // Live astrologers have their own threads too.
  expect(within(history).getByText('Remedies for Saturn transit')).toBeInTheDocument();
  expect(within(history).getByText('Marriage timing')).toBeInTheDocument();
});

test('the chat history rail can start another chat with the same astrologer', () => {
  renderApp('/chat');
  fireEvent.click(screen.getByLabelText(/new chat with astro chat/i));
  const history = screen.getByRole('complementary', { name: /chat history/i });
  expect(within(history).getByText('New chat')).toBeInTheDocument();
  expect(within(conversation()).getByText('Astro Chat')).toBeInTheDocument();
});

test('a new chat defaults to the AI astrologer', () => {
  renderApp('/chat');
  fireEvent.click(screen.getByRole('button', { name: /^new chat$/i }));
  expect(within(conversation()).getByText('Astro Chat')).toBeInTheDocument();
  expect(within(conversation()).queryByText(/book live session/i)).not.toBeInTheDocument();
});

test('side panel lists every destination and puts Services above Subscription', () => {
  renderApp('/');
  const nav = openSidePanel();
  const labels = ['Chat', 'Services', 'Family Members', 'Kundali Chart', 'Subscription', 'Support'];
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
  ['/services', '/family', '/kundali', '/subscription', '/support'].forEach((path) => {
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
  fireEvent.click(screen.getByLabelText(/new chat with acharya rajiv sharma/i));
  const region = conversation();
  expect(within(region).getByText('Acharya Rajiv Sharma')).toBeInTheDocument();
  expect(within(region).getByRole('button', { name: /book live session/i })).toBeInTheDocument();
  expect(within(region).getAllByText(/namaste/i).length).toBeGreaterThan(0);
});

test('family page can start adding a member with a relation', () => {
  renderApp('/family');
  fireEvent.click(screen.getByRole('button', { name: /add family member/i }));
  expect(screen.getByLabelText(/relation/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
});
