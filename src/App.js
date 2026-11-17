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
import SettingsPage from './components/SettingsPage';
import LlmLabPage from './components/LlmLabPage';
import ReportsPage from './components/ReportsPage';
import AstrologersPage from './components/AstrologersPage';
import RemediesPage from './components/RemediesPage';
import LowBalanceBanner from './components/LowBalanceBanner';
import { ChatProvider, useChat } from './chatStore';
import { LocaleProvider, useLocale } from './i18n/LocaleContext';
import { fetchRemoteAccount, pushRemoteAccount } from './api';
import {
  applyRemoteAccount,
  buildAccountSnapshot,
  clearBetaSession,
  getBirthDetails,
  getSession,
  isInvited,
  isOnboardingComplete,
  markOnboardingComplete,
  saveBirthDetails,
  saveSession,
} from './betaSession';
import { ensureLibrarySeeds } from './lib/libraryStore';
import { getSelfProfile } from './lib/profiles';

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
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [session, setSession] = useState(() => getSession());
  const [onboarded, setOnboarded] = useState(() => isOnboardingComplete());

  const navItems = useMemo(
    () => [
      { label: t('navChat'), path: '/', icon: 'chat' },
      { label: t('navKundali'), path: '/kundali', icon: 'kundali' },
      { label: t('navFamily'), path: '/family', icon: 'family' },
      { label: t('navServices'), path: '/services', icon: 'services' },
      { label: t('navSubscription'), path: '/subscription', icon: 'subscription' },
      { label: t('navSupport'), path: '/support', icon: 'support' },
      { label: t('navSettings'), path: '/settings', icon: 'settings' },
    ],
    [t]
  );

  const pageTitles = useMemo(
    () => ({
      '/': t('navChat'),
      '/chat': t('navChat'),
      '/splash': t('appName'),
      '/invite': t('inviteTitle'),
      '/birth-details': t('birthTitle'),
      '/creating-chart': t('chartTitle'),
      '/services': t('navServices'),
      '/family': t('navFamily'),
      '/kundali': t('navKundali'),
      '/subscription': t('navSubscription'),
      '/support': t('navSupport'),
      '/settings': t('navSettings'),
      '/settings/llm': 'LLM Lab',
      '/reports': 'Detailed Reports',
      '/astrologers': 'Astrologers',
      '/remedies': 'Remedies',
    }),
    [t]
  );

  const sidebarExpanded = isDesktop ? expanded : drawerOpen;
  const isChatPage = location.pathname === '/' || location.pathname === '/chat';
  const isOnboarding = ONBOARDING_PATHS.has(location.pathname);
  const title = pageTitles[location.pathname] || t('appName');
  const user = useMemo(() => {
    const email = session?.email || '';
    const name = displayNameFromEmail(email);
    return {
      name,
      email,
      plan: t('planBeta'),
      initials: (name.charAt(0) || 'B').toUpperCase(),
    };
  }, [session, t]);

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

  const handleNavigate = (path, state) => {
    navigate(path, state ? { state } : undefined);
    setDrawerOpen(false);
  };

  useEffect(() => {
    if (onboarded) {
      ensureLibrarySeeds({ memberName: getSelfProfile().name });
    }
  }, [onboarded]);

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
    async ({ email, inviteCode }) => {
      const next = saveSession({ email, inviteCode });
      setSession(next);
      const remote = await fetchRemoteAccount(next);
      if (remote) {
        applyRemoteAccount(remote);
        setOnboarded(isOnboardingComplete());
        if (isOnboardingComplete()) {
          navigate('/chat', { replace: true });
          return;
        }
        if (getBirthDetails()) {
          navigate('/creating-chart', { replace: true });
          return;
        }
      }
      navigate('/birth-details', { replace: true });
    },
    [navigate]
  );

  const handleBirthSubmit = useCallback(
    (details) => {
      saveBirthDetails(details);
      const current = getSession();
      if (current) {
        pushRemoteAccount(current, buildAccountSnapshot());
      }
      navigate('/creating-chart');
    },
    [navigate]
  );

  const handleChartReady = useCallback(
    (_chart) => {
      markOnboardingComplete();
      setOnboarded(true);
      const current = getSession();
      if (current) {
        pushRemoteAccount(current, buildAccountSnapshot());
      }
      startChat('astro-chat');
      navigate('/chat', { replace: true });
    },
    [navigate, startChat]
  );

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
          items={navItems}
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
            newChat={null}
          />
        )}
        {showChrome && <LowBalanceBanner />}
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
              path="/settings"
              element={
                <RequireOnboarding>
                  <SettingsPage onBack={() => navigate('/')} />
                </RequireOnboarding>
              }
            />
            <Route
              path="/settings/llm"
              element={
                <RequireOnboarding>
                  <LlmLabPage onBack={() => navigate('/settings')} />
                </RequireOnboarding>
              }
            />
            <Route
              path="/reports"
              element={
                <RequireOnboarding>
                  <ReportsPage onBack={() => navigate('/services')} />
                </RequireOnboarding>
              }
            />
            <Route
              path="/astrologers"
              element={
                <RequireOnboarding>
                  <AstrologersPage
                    onBack={() => navigate('/services')}
                    onOpenChat={() => navigate('/chat')}
                  />
                </RequireOnboarding>
              }
            />
            <Route
              path="/remedies"
              element={
                <RequireOnboarding>
                  <RemediesPage onBack={() => navigate('/services')} />
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
    <LocaleProvider>
      <ChatProvider>
        <AppShell />
      </ChatProvider>
    </LocaleProvider>
  );
}

export default App;
