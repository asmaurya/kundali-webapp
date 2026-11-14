import React from 'react';
import { Box, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const SERVICES = [
  {
    id: 'remedies',
    icon: '🌿',
    iconBg: '#FBEFC9',
    title: 'Remedies',
    description:
      'Personalized and practical solutions (mantra, gem, ritual, lifestyle, etc.)',
    action: { label: 'Open chart', path: '/kundali' },
  },
  {
    id: 'counseling',
    icon: '💬',
    iconBg: '#E6DCF6',
    title: 'Counseling',
    description:
      'Guidance for career, relationships, well-being, and important decisions',
    action: { label: 'Start counselling', path: '/chat' },
  },
  {
    id: 'live',
    icon: '🧑',
    iconBg: '#D9F0DC',
    title: 'Chat with a Live Astrologer',
    description: 'Get real-time, personalized advice from verified experts',
    action: { label: 'Chat now', path: '/chat', astrologerId: 'rajiv' },
  },
  {
    id: 'reports',
    icon: '📊',
    iconBg: '#E6DCF6',
    title: 'Detailed Reports',
    description: 'In-depth analysis (career, marriage, health, finance, etc.)',
    action: { label: 'View reports', path: '/kundali' },
  },
];

function ServicesPage({ onNavigate }) {
  const openService = (service) => {
    if (service.action.astrologerId) {
      onNavigate(service.action.path, { astrologerId: service.action.astrologerId });
    } else {
      onNavigate(service.action.path);
    }
  };

  return (
    <Box className="stack-page">
      <Box className="hill-deco" sx={{ opacity: 0.8 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: 'min(1040px, 100%)', margin: '0 auto', padding: '28px 32px 48px' }}>
        <Typography component="h2" sx={{ fontSize: 26, fontWeight: 700, color: '#1E1B2E' }}>
          Our Services
        </Typography>
        <Typography sx={{ mt: 1, fontSize: 16, color: '#3A3550' }}>
          Explore personalized support based on your chart and questions.
        </Typography>

        <Box sx={{ display: 'grid', gap: 2, mt: 4 }}>
          {SERVICES.map((service) => (
            <Box
              key={service.id}
              className="service-card"
              role="button"
              tabIndex={0}
              onClick={() => openService(service)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') openService(service);
              }}
            >
              <span className="service-card__icon" style={{ background: service.iconBg }}>
                {service.icon}
              </span>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1E1B2E' }}>
                  {service.title}
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: 13, color: '#4A4560' }}>
                  {service.description}
                </Typography>
              </Box>
              <ChevronRightIcon sx={{ ml: 'auto', color: '#1E1B2E', fontSize: 30 }} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default ServicesPage;
