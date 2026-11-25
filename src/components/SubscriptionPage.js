import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, LinearProgress, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { getPaymentGateway, getUsageMeter } from '../providers';

const INVOICES = [
  { id: 'INV-2043', date: '01 Nov 2026', amount: '₹499', status: 'Paid' },
  { id: 'INV-1987', date: '01 Oct 2026', amount: '₹499', status: 'Paid' },
  { id: 'INV-1931', date: '01 Sep 2026', amount: '₹499', status: 'Paid' },
];

function SubscriptionPage({ onBack }) {
  const [wallet, setWallet] = useState(() => getUsageMeter().snapshot());
  const [topUpNote, setTopUpNote] = useState('');

  const refresh = useCallback(() => {
    setWallet(getUsageMeter().snapshot());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleTopUpPreview = async () => {
    setTopUpNote('');
    try {
      const session = await getPaymentGateway().createTopUpSession({ amount: 100, currency: 'INR' });
      setTopUpNote(session.message || `Gateway ${session.status}: session ${session.sessionId}`);
      // Local demo credit so the banner / meter path can be exercised end-to-end.
      getUsageMeter().credit(100);
      refresh();
    } catch (error) {
      setTopUpNote(String(error.message || error));
    }
  };

  const usedPct = Math.min(
    100,
    Math.round(((100 - wallet.balance) / 100) * 100)
  );

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

        <Alert severity="info" sx={{ mt: 2, bgcolor: '#EFE9F7', color: '#3A3550' }}>
          Usage metering is live locally. Charging and the real payment gateway wait for Phase C
          (after a signed-in account + real LLM). Plan / invoice cards below remain UI previews.
        </Alert>

        <Box className="panel" sx={{ mt: 3 }}>
          <Typography sx={{ fontWeight: 700, color: '#1E1B2E' }}>Wallet (beta meter)</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
            <Typography sx={{ fontSize: 14, color: '#4A4560' }}>Remaining units</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1E1B2E' }}>
              {Math.round(wallet.balance)} / ~100
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.max(0, 100 - usedPct)}
            sx={{
              mt: 1,
              height: 8,
              borderRadius: 4,
              bgcolor: '#CFC4EA',
              '& .MuiLinearProgress-bar': {
                bgcolor: wallet.isLow ? '#8A6A2F' : '#6B4FA0',
                borderRadius: 4,
              },
            }}
          />
          {wallet.isLow && (
            <Typography sx={{ mt: 1, fontSize: 13, color: '#8A6A2F' }}>
              Low balance — top-up preview credits local units only.
            </Typography>
          )}
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={handleTopUpPreview} sx={{ bgcolor: '#5B3FA0' }}>
              Top up (gateway stub)
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                getUsageMeter().resetDemo();
                refresh();
                setTopUpNote('Demo wallet reset to 100 units.');
              }}
              sx={{ borderColor: '#5B3FA0', color: '#5B3FA0' }}
            >
              Reset demo wallet
            </Button>
          </Box>
          {topUpNote ? (
            <Typography sx={{ mt: 1.5, fontSize: 13, color: '#4A4560' }}>{topUpNote}</Typography>
          ) : null}
          {wallet.recent?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E1B2E' }}>
                Recent meter events
              </Typography>
              {wallet.recent.slice(0, 5).map((event) => (
                <Typography key={event.id} sx={{ fontSize: 12, color: '#6A6580', mt: 0.5 }}>
                  {event.kind} · −{event.cost} ·{' '}
                  {new Date(event.at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </Typography>
              ))}
            </Box>
          )}
        </Box>

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
              label="Preview"
              sx={{ color: '#5B3FA0', bgcolor: '#F1ECF6', fontWeight: 600 }}
            />
          </Box>
          <Typography sx={{ mt: 1, fontSize: 14, opacity: 0.9 }}>
            Unlimited chart insights, live astrologer minutes and detailed reports.
          </Typography>
          <Typography sx={{ mt: 2, fontSize: 28, fontWeight: 700 }}>
            ₹499 <Typography component="span" sx={{ fontSize: 14, fontWeight: 400 }}>/ month</Typography>
          </Typography>
          <Typography sx={{ fontSize: 13, opacity: 0.85 }}>Not charged during private beta</Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              disabled
              sx={{ bgcolor: '#FFFFFF', color: '#5B3FA0', '&.Mui-disabled': { bgcolor: '#F1ECF6', color: '#6A6580' } }}
            >
              Change plan
            </Button>
            <Button variant="outlined" disabled sx={{ color: '#FFFFFF', borderColor: '#FFFFFF' }}>
              Cancel subscription
            </Button>
          </Box>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: '#FFFFFF', border: '1px solid #E6DEEF', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CreditCardIcon sx={{ color: '#5B3FA0' }} />
            <Box>
              <Typography sx={{ fontWeight: 600, color: '#1E1B2E' }}>Payment method</Typography>
              <Typography sx={{ fontSize: 13, color: '#6A6580' }}>
                Razorpay / Stripe adapter not connected yet (PaymentGateway stub).
              </Typography>
            </Box>
            <Button size="small" disabled sx={{ ml: 'auto', color: '#5B3FA0' }}>
              Update
            </Button>
          </Box>
        </Box>

        <Typography sx={{ mt: 3, fontWeight: 700, color: '#1E1B2E' }}>Billing history (preview)</Typography>
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
