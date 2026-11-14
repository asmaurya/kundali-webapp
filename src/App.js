import React, { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import './App.css';

import AppHeader from './components/AppHeader';
import SidePanel from './components/SidePanel';
import SplashScreen from './components/SplashScreen';
import BirthDetailsScreen from './components/BirthDetailsScreen';
import CreatingChartScreen from './components/CreatingChartScreen';
import ChatInterface from './components/ChatInterface';
import ServicesPage from './components/ServicesPage';
import FamilyListPage from './components/FamilyListPage';
import KundaliChartPage from './components/KundaliChartPage';
import SubscriptionPage from './components/SubscriptionPage';
import SupportPage from './components/SupportPage';
import { ChatProvider, useChat } from './chatStore';

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
  '/birth-details': 'Your Birth Details',
  '/creating-chart': 'Creating Chart',
  '/services': 'Our Services',
  '/family': 'Family Members',
  '/kundali': 'Kundali Chart',
  '/subscription': 'Subscription',
  '/support': 'Support',
};

function AppShell() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { startChat } = useChat();
  const [expanded, setExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sidebarExpanded = isDesktop ? expanded : drawerOpen;
  const isChatPage = location.pathname === '/' || location.pathname === '/chat';
  const title = PAGE_TITLES[location.pathname] || 'Astro Chat';

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

  const handleLogout = () => {
    setDrawerOpen(false);
    setExpanded(false);
    navigate('/splash');
  };

  const handleNewChat = () => {
    startChat('astro-chat');
    navigate('/chat');
    setDrawerOpen(false);
  };

  return (
    <Box className={`app-shell${sidebarExpanded ? ' sidebar-expanded' : ''}${drawerOpen ? ' drawer-open' : ''}`}>
      {!isDesktop && drawerOpen && (
        <Box className="side-panel-backdrop" onClick={() => setDrawerOpen(false)} />
      )}

      <SidePanel
        items={NAV_ITEMS}
        activePath={location.pathname}
        expanded={sidebarExpanded}
        isDesktop={isDesktop}
        onExpand={() => setExpanded(true)}
        onCollapse={() => setExpanded(false)}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <Box className="app-main">
        <AppHeader
          title={title}
          onMenuClick={handleMenuClick}
          newChat={isChatPage ? handleNewChat : null}
        />
        <Box component="main" className={`app-content${isChatPage ? ' app-content--flush' : ''}`}>
          <Routes>
            <Route path="/" element={<ChatInterface />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/splash" element={<SplashScreen onNext={() => navigate('/birth-details')} />} />
            <Route
              path="/birth-details"
              element={<BirthDetailsScreen onSubmit={() => navigate('/creating-chart')} />}
            />
            <Route
              path="/creating-chart"
              element={<CreatingChartScreen onNext={() => navigate('/chat')} />}
            />
            <Route path="/services" element={<ServicesPage onNavigate={handleNavigate} />} />
            <Route path="/family" element={<FamilyListPage />} />
            <Route path="/kundali" element={<KundaliChartPage onBack={() => navigate('/')} />} />
            <Route
              path="/subscription"
              element={<SubscriptionPage onBack={() => navigate('/')} />}
            />
            <Route path="/support" element={<SupportPage onBack={() => navigate('/')} />} />
            <Route path="*" element={<ChatInterface />} />
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
