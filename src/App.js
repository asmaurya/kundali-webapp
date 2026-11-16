import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import './App.css';

import AppHeader from './components/AppHeader';
import SidePanel from './components/SidePanel';
import SplashScreen from './components/SplashScreen';
import InviteGateScreen from './components/InviteGateScreen';
import BirthDetailsScreen from './components/BirthDetailsScreen';
import CreatingChartScreen from './components/CreatingChartScreen';
import ChatInterface from './components/ChatInterface';
import ServicesPage from './components/ServicesPage';
import FamilyListPage from './components/FamilyListPage';
import KundaliChartPage from './components/KundaliChartPage';
import SubscriptionPage from './components/SubscriptionPage';
import SupportPage from './components/SupportPage';
import { ChatProvider, useChat } from './chatStore';
import {
  clearBetaSession,
  getBirthDetails,
  getSession,
  isInvited,
  isOnboardingComplete,
  markOnboardingComplete,
  saveBirthDetails,
  saveSession,
} from './betaSession';

const NAV_ITEMS = [
  { label: 'Chat', path: '/', icon: 'chat' },
  { label: 'Kundali Chart', path: '/kundali', icon: 'kundali' },
  { label: 'Family Members', path: '/family', icon: 'family' },
  { label: 'Services', path: '/services', icon: 'services' },
  { label: 'Subscription', path: '/subscription', icon: 'subscription' },
  { label: 'Support', path: '/support', icon: 'support' },
];

const PAGE_TITLES = {
  '/': 'Chat',
  '/chat': 'Chat',
  '/splash': 'Astro Chat',
  '/invite': 'Beta access',
  '/birth-details': 'Your Birth Details',
  '/creating-chart': 'Creating Chart',
  '/services': 'Our Services',
  '/family': 'Family Members',
  '/kundali': 'Kundali Chart',
  '/subscription': 'Subscription',
  '/support': 'Support',
};

const ONBOARDING_PATHS = new Set(['/splash', '/invite', '/birth-details', '/creating-chart']);
const PUBLIC_PATHS = new Set(['/splash', '/invite']);

function displayNameFromEmail(email) {
  if (!email) return 'Beta tester';
  const local = String(email).split('@')[0] || 'Beta tester';
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function RequireInvite({ children }) {
  if (!isInvited()) {
    return <Navigate to="/splash" replace />;
  }
  return children;
}

function RequireOnboarding({ children }) {
  if (!isInvited() || !isOnboardingComplete()) {
    return <Navigate to="/splash" replace />;
  }
  return children;
}

function AppShell() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { startChat, resetToDemo } = useChat();
  const [expanded, setExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [session, setSession] = useState(() => getSession());
  const [onboarded, setOnboarded] = useState(() => isOnboardingComplete());

  const sidebarExpanded = isDesktop ? expanded : drawerOpen;
  const isChatPage = location.pathname === '/' || location.pathname === '/chat';
  const isOnboarding = ONBOARDING_PATHS.has(location.pathname);
  const title = PAGE_TITLES[location.pathname] || 'Astro Chat';
  const user = useMemo(() => {
    const email = session?.email || '';
    const name = displayNameFromEmail(email);
    return {
      name,
      email,
      plan: 'Beta',
      initials: (name.charAt(0) || 'B').toUpperCase(),
    };
  }, [session]);

  useEffect(() => {
    if (!isInvited() && !PUBLIC_PATHS.has(location.pathname)) {
      navigate('/splash', { replace: true });
      return;
    }
    if (
      isInvited() &&
      isOnboardingComplete() &&
      (location.pathname === '/splash' || location.pathname === '/invite')
    ) {
      navigate('/chat', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleMenuClick = () => {
    if (isDesktop) {
      setExpanded((value) => !value);
    } else {
      setDrawerOpen(true);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = useCallback(() => {
    clearBetaSession();
    resetToDemo();
    setSession(null);
    setOnboarded(false);
    setDrawerOpen(false);
    setExpanded(false);
    navigate('/splash', { replace: true });
  }, [navigate, resetToDemo]);

  const handleInviteSuccess = useCallback(
    ({ email, inviteCode }) => {
      const next = saveSession({ email, inviteCode });
      setSession(next);
      navigate('/birth-details', { replace: true });
    },
    [navigate]
  );

  const handleBirthSubmit = useCallback(
    (details) => {
      saveBirthDetails(details);
      navigate('/creating-chart');
    },
    [navigate]
  );

  const handleChartReady = useCallback(
    (_chart) => {
      markOnboardingComplete();
      setOnboarded(true);
      startChat('astro-chat');
      navigate('/chat', { replace: true });
    },
    [navigate, startChat]
  );

  const handleNewChat = () => {
    startChat('astro-chat');
    navigate('/chat');
    setDrawerOpen(false);
  };

  const handleSplashNext = () => {
    if (!isInvited()) {
      navigate('/invite');
      return;
    }
    if (!isOnboardingComplete()) {
      navigate(getBirthDetails() ? '/creating-chart' : '/birth-details');
      return;
    }
    navigate('/chat');
  };

  const showChrome = onboarded && !isOnboarding;

  return (
    <Box
      className={`app-shell${sidebarExpanded ? ' sidebar-expanded' : ''}${drawerOpen ? ' drawer-open' : ''}${
        isOnboarding ? ' app-shell--onboarding' : ''
      }`}
    >
      {showChrome && !isDesktop && drawerOpen && (
        <Box className="side-panel-backdrop" onClick={() => setDrawerOpen(false)} />
      )}

      {showChrome && (
        <SidePanel
          items={NAV_ITEMS}
          activePath={location.pathname}
          expanded={sidebarExpanded}
          isDesktop={isDesktop}
          user={user}
          onExpand={() => setExpanded(true)}
          onCollapse={() => setExpanded(false)}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      <Box className="app-main">
        {showChrome && (
          <AppHeader
            title={title}
            onMenuClick={handleMenuClick}
            newChat={isChatPage ? handleNewChat : null}
          />
        )}
        <Box
          component="main"
          className={`app-content${isChatPage ? ' app-content--flush' : ''}${
            isOnboarding ? ' app-content--onboarding' : ''
          }`}
        >
          <Routes>
            <Route path="/splash" element={<SplashScreen onNext={handleSplashNext} />} />
            <Route path="/invite" element={<InviteGateScreen onSuccess={handleInviteSuccess} />} />
            <Route
              path="/birth-details"
              element={
                <RequireInvite>
                  <BirthDetailsScreen
                    onSubmit={handleBirthSubmit}
                    onBack={() => navigate('/splash')}
                  />
                </RequireInvite>
              }
            />
            <Route
              path="/creating-chart"
              element={
                <RequireInvite>
                  <CreatingChartScreen onNext={handleChartReady} />
                </RequireInvite>
              }
            />
            <Route
              path="/"
              element={
                <RequireOnboarding>
                  <ChatInterface />
                </RequireOnboarding>
              }
            />
            <Route
              path="/chat"
              element={
                <RequireOnboarding>
                  <ChatInterface />
                </RequireOnboarding>
              }
            />
            <Route
              path="/services"
              element={
                <RequireOnboarding>
                  <ServicesPage onNavigate={handleNavigate} />
                </RequireOnboarding>
              }
            />
            <Route
              path="/family"
              element={
                <RequireOnboarding>
                  <FamilyListPage />
                </RequireOnboarding>
              }
            />
            <Route
              path="/kundali"
              element={
                <RequireOnboarding>
                  <KundaliChartPage onBack={() => navigate('/')} />
                </RequireOnboarding>
              }
            />
            <Route
              path="/subscription"
              element={
                <RequireOnboarding>
                  <SubscriptionPage onBack={() => navigate('/')} />
                </RequireOnboarding>
              }
            />
            <Route
              path="/support"
              element={
                <RequireOnboarding>
                  <SupportPage onBack={() => navigate('/')} userEmail={session?.email} />
                </RequireOnboarding>
              }
            />
            <Route
              path="*"
              element={
                <Navigate
                  to={
                    isInvited() && isOnboardingComplete()
                      ? '/chat'
                      : isInvited()
                        ? '/birth-details'
                        : '/splash'
                  }
                  replace
                />
              }
            />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ChatProvider>
      <AppShell />
    </ChatProvider>
  );
}

export default App;
