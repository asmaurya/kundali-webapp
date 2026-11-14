import React from 'react';
import { Box, Button, Chip, LinearProgress, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const INVOICES = [
  { id: 'INV-2043', date: '01 Nov 2026', amount: '₹499', status: 'Paid' },
  { id: 'INV-1987', date: '01 Oct 2026', amount: '₹499', status: 'Paid' },
  { id: 'INV-1931', date: '01 Sep 2026', amount: '₹499', status: 'Paid' },
];

function SubscriptionPage({ onBack }) {
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
          Subscription Management
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 15, color: '#3A3550' }}>
          Manage your plan, usage and billing details.
        </Typography>

        <Box
          sx={{
            mt: 3,
            p: 3,
            color: '#FFFFFF',
            background: 'linear-gradient(135deg, #6B4FA0 0%, #5B3FA0 100%)',
            borderRadius: 4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700 }}>Astro Chat Plus</Typography>
            <Chip
              size="small"
              label="Active"
              sx={{ color: '#1E7A36', bgcolor: '#D9F0DC', fontWeight: 600 }}
            />
          </Box>
          <Typography sx={{ mt: 1, fontSize: 14, opacity: 0.9 }}>
            Unlimited chart insights, live astrologer minutes and detailed reports.
          </Typography>
          <Typography sx={{ mt: 2, fontSize: 28, fontWeight: 700 }}>
            ₹499 <Typography component="span" sx={{ fontSize: 14, fontWeight: 400 }}>/ month</Typography>
          </Typography>
          <Typography sx={{ fontSize: 13, opacity: 0.85 }}>Next renewal on 01 Dec 2026</Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              sx={{ bgcolor: '#FFFFFF', color: '#5B3FA0', '&:hover': { bgcolor: '#F1ECF6' } }}
            >
              Change plan
            </Button>
            <Button variant="outlined" sx={{ color: '#FFFFFF', borderColor: '#FFFFFF' }}>
              Cancel subscription
            </Button>
          </Box>
        </Box>

        <Box className="panel" sx={{ mt: 3 }}>
          <Typography sx={{ fontWeight: 700, color: '#1E1B2E' }}>Usage this month</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
            <Typography sx={{ fontSize: 14, color: '#4A4560' }}>Live astrologer minutes</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1E1B2E' }}>18 / 60 min</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={30}
            sx={{
              mt: 1,
              height: 8,
              borderRadius: 4,
              bgcolor: '#CFC4EA',
              '& .MuiLinearProgress-bar': { bgcolor: '#6B4FA0', borderRadius: 4 },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Typography sx={{ fontSize: 14, color: '#4A4560' }}>Reports generated</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1E1B2E' }}>3 / 10</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={30}
            sx={{
              mt: 1,
              height: 8,
              borderRadius: 4,
              bgcolor: '#CFC4EA',
              '& .MuiLinearProgress-bar': { bgcolor: '#6B4FA0', borderRadius: 4 },
            }}
          />
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: '#FFFFFF', border: '1px solid #E6DEEF', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CreditCardIcon sx={{ color: '#5B3FA0' }} />
            <Box>
              <Typography sx={{ fontWeight: 600, color: '#1E1B2E' }}>Visa •••• 4242</Typography>
              <Typography sx={{ fontSize: 13, color: '#6A6580' }}>Expires 04/28</Typography>
            </Box>
            <Button size="small" sx={{ ml: 'auto', color: '#5B3FA0' }}>
              Update
            </Button>
          </Box>
        </Box>

        <Typography sx={{ mt: 3, fontWeight: 700, color: '#1E1B2E' }}>Billing history</Typography>
        <Box sx={{ mt: 1.5 }}>
          {INVOICES.map((invoice) => (
            <Box
              key={invoice.id}
              sx={{
                display: 'flex',
                gap: 1.5,
                alignItems: 'center',
                p: 1.5,
                mb: 1,
                bgcolor: '#FFFFFF',
                border: '1px solid #E6DEEF',
                borderRadius: 2.5,
              }}
            >
              <ReceiptLongIcon sx={{ color: '#5B3FA0' }} fontSize="small" />
              <Typography sx={{ fontSize: 14, color: '#1E1B2E' }}>{invoice.id}</Typography>
              <Typography sx={{ fontSize: 13, color: '#6A6580' }}>{invoice.date}</Typography>
              <Typography sx={{ ml: 'auto', fontSize: 14, fontWeight: 600, color: '#1E1B2E' }}>
                {invoice.amount}
              </Typography>
              <Chip size="small" label={invoice.status} sx={{ color: '#1E7A36', bgcolor: '#D9F0DC' }} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default SubscriptionPage;
