import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Collapse } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getUsageMeter } from '../providers';

/**
 * Shows when the local wallet snapshot is at/under the low-balance threshold.
 * Phase C: same component; Wallet will be server-backed and PaymentGateway live.
 */
function LowBalanceBanner() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(() => {
    try {
      return getUsageMeter().snapshot();
    } catch {
      return { isLow: false, balance: 0 };
    }
  });
  const [dismissed, setDismissed] = useState(false);

  const refresh = useCallback(() => {
    try {
      setSnapshot(getUsageMeter().snapshot());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (event) => {
      if (!event.key || event.key.startsWith('kundali.usage') || event.key.startsWith('kundali.wallet')) {
        refresh();
      }
    };
    window.addEventListener('storage', onStorage);
    const timer = setInterval(refresh, 4000);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    if (!snapshot.isLow) setDismissed(false);
  }, [snapshot.isLow]);

  const visible = Boolean(snapshot.isLow) && !dismissed;

  return (
    <Collapse in={visible}>
      <Alert
        severity="warning"
        sx={{
          borderRadius: 0,
          alignItems: 'center',
          bgcolor: '#F9F3E6',
          color: '#3A3550',
          '& .MuiAlert-message': { width: '100%' },
        }}
        action={
          <>
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate('/subscription')}
              sx={{ fontWeight: 600 }}
            >
              View usage
            </Button>
            <Button color="inherit" size="small" onClick={() => setDismissed(true)}>
              Dismiss
            </Button>
          </>
        }
      >
        Low balance preview — about {Math.round(snapshot.balance)} units left. Metering is on;
        real top-up lands when the payment gateway is connected (Phase C).
      </Alert>
    </Collapse>
  );
}

export default LowBalanceBanner;
