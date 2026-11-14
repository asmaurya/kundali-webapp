import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const FAQS = [
  {
    question: 'How is my Kundali chart calculated?',
    answer:
      'Your chart is calculated from the date, time and place of birth you provide, using Vedic planetary positions and the sidereal zodiac.',
  },
  {
    question: 'Can I chat with a live astrologer?',
    answer:
      'Yes. Open Services, pick “Chat with a Live Astrologer” and choose an available astrologer from the conversation list.',
  },
  {
    question: 'How do I add my family members?',
    answer:
      'Open Family Members, choose “Add Family Member”, pick the relation, add the birth details and the chart is created for that profile.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer:
      'Go to Subscription, choose “Cancel subscription” and confirm. Your plan stays active until the end of the billing cycle.',
  },
  {
    question: 'Is my birth information private?',
    answer:
      'Yes. Birth details are used only to calculate charts and are never shared with third parties.',
  },
];

function SupportPage({ onBack }) {
  return (
    <Box className="stack-page">
      <Box className="hill-deco" sx={{ opacity: 0.7 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: 'min(1040px, 100%)', margin: '0 auto', padding: '28px 32px 48px' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ color: '#1E1B2E', pl: 0, mb: 2 }}
        >
          Back to Home
        </Button>

        <Typography component="h2" sx={{ fontSize: 26, fontWeight: 700, color: '#1E1B2E' }}>
          Support
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 15, color: '#3A3550' }}>
          Find quick answers or talk to the Astro Chat team.
        </Typography>

        <TextField
          fullWidth
          placeholder="Search help topics"
          aria-label="Search help topics"
          InputProps={{
            startAdornment: (
              <Box sx={{ mr: 1, display: 'flex', color: '#5B3FA0' }}>
                <SearchIcon fontSize="small" />
              </Box>
            ),
          }}
          sx={{ mt: 3, '& .MuiOutlinedInput-root': { bgcolor: '#FDFBFF', borderRadius: 2.5 } }}
        />

        <Box sx={{ mt: 3 }}>
          {FAQS.map((faq) => (
            <Accordion
              key={faq.question}
              disableGutters
              sx={{
                mb: 1,
                bgcolor: '#FFFFFF',
                border: '1px solid #E6DEEF',
                borderRadius: '12px !important',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
                <Typography sx={{ fontWeight: 600, color: '#1E1B2E' }}>{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2 }}>
                <Typography sx={{ fontSize: 14, color: '#4A4560' }}>{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            mt: 4,
            p: 3,
            color: '#FFFFFF',
            background: 'linear-gradient(135deg, #6B4FA0 0%, #5B3FA0 100%)',
            borderRadius: 4,
          }}
        >
          <SupportAgentIcon sx={{ fontSize: 36 }} />
          <Box>
            <Typography sx={{ fontWeight: 700 }}>Still need help?</Typography>
            <Typography sx={{ fontSize: 14, opacity: 0.9 }}>
              Our team replies on WhatsApp and email within a few hours.
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              sx={{ bgcolor: '#FFFFFF', color: '#5B3FA0', '&:hover': { bgcolor: '#F1ECF6' } }}
            >
              Chat with us
            </Button>
            <Button variant="outlined" sx={{ color: '#FFFFFF', borderColor: '#FFFFFF' }}>
              Email
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default SupportPage;
