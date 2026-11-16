import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const FEEDBACK_EMAIL = process.env.REACT_APP_FEEDBACK_EMAIL || 'asmaurya@gmail.com';

const FAQS = [
  {
    question: 'How is my Kundali chart calculated?',
    answer:
      'In this beta, the chart screen is a visual preview. Your birth details are stored on this device and will drive a real chart once the server is connected.',
  },
  {
    question: 'Can I chat with a live astrologer?',
    answer:
      'Live booking is preview-only in beta. You can open sample threads with listed astrologers; real sessions arrive after launch.',
  },
  {
    question: 'How do I add my family members?',
    answer:
      'Open Family Members, choose “Add Family Member”, pick the relation, add the birth details and save. Profiles stay on this device for now.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer:
      'There is no billing in the beta. Subscription screens are UI previews only.',
  },
  {
    question: 'Is my birth information private?',
    answer:
      'Yes for this build: birth details and chats stay in your browser localStorage. Clearing site data or logging out removes them from this device.',
  },
];

function SupportPage({ onBack, userEmail }) {
  const [feedback, setFeedback] = useState('');

  const mailtoHref = (() => {
    const subject = encodeURIComponent('Astro Chat beta feedback');
    const body = encodeURIComponent(
      `From: ${userEmail || 'unknown'}\n\n${feedback.trim() || '(write your feedback here)'}\n`
    );
    return `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
  })();

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
          Find quick answers or send beta feedback.
        </Typography>

        <Alert severity="info" sx={{ mt: 2, bgcolor: '#EFE9F7', color: '#3A3550' }}>
          Private beta: answers are scripted on-device. Tell us what feels wrong or missing.
        </Alert>

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
            mt: 4,
            p: 3,
            bgcolor: '#FFFFFF',
            border: '1px solid #E6DEEF',
            borderRadius: 4,
          }}
        >
          <Typography sx={{ fontWeight: 700, color: '#1E1B2E' }}>Send feedback</Typography>
          <Typography sx={{ mt: 0.5, fontSize: 14, color: '#4A4560' }}>
            Opens your email app with a draft to the beta inbox.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="What should we improve?"
            aria-label="Feedback message"
            sx={{ mt: 2, '& .MuiOutlinedInput-root': { bgcolor: '#FDFBFF', borderRadius: 2.5 } }}
          />
          <Button
            component="a"
            href={mailtoHref}
            variant="contained"
            sx={{ mt: 2, bgcolor: '#6B4FA0', '&:hover': { bgcolor: '#5B3FA0' } }}
          >
            Send feedback
          </Button>
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
              Email the beta inbox and we will reply when we can.
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              component="a"
              href={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('Astro Chat beta help')}`}
              variant="contained"
              sx={{ bgcolor: '#FFFFFF', color: '#5B3FA0', '&:hover': { bgcolor: '#F1ECF6' } }}
            >
              Email
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default SupportPage;
