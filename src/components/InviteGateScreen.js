import React, { useState } from 'react';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { validateInviteCode } from '../betaSession';

function InviteGateScreen({ onSuccess }) {
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const canSubmit = inviteCode.trim() && email.trim().includes('@');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateInviteCode(inviteCode)) {
      setError('That invite code is not valid. Check the code from your beta invite email.');
      return;
    }
    setError('');
    onSuccess({ inviteCode: inviteCode.trim(), email: email.trim() });
  };

  return (
    <Box
      className="stack-page"
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        px: 4,
        py: 6,
      }}
    >
      <Box className="hill-deco" sx={{ opacity: 0.7 }} />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: 'min(440px, 100%)',
          p: 3,
          bgcolor: '#FFFFFF',
          border: '1px solid #E6DEEF',
          borderRadius: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: '#F1ECF6',
              display: 'grid',
              placeItems: 'center',
              color: '#5B3FA0',
            }}
          >
            <LockOutlinedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography component="h2" sx={{ fontSize: 22, fontWeight: 700, color: '#1E1B2E' }}>
              Beta access
            </Typography>
            <Typography sx={{ fontSize: 14, color: '#3A3550' }}>
              Enter your invite code and email to continue.
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="info" sx={{ mb: 2, bgcolor: '#EFE9F7', color: '#3A3550' }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          required
          label="Invite code"
          value={inviteCode}
          onChange={(event) => setInviteCode(event.target.value)}
          autoComplete="off"
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { bgcolor: '#FDFBFF', borderRadius: 2.5 } }}
        />
        <TextField
          fullWidth
          required
          type="email"
          label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { bgcolor: '#FDFBFF', borderRadius: 2.5 } }}
        />

        <Button
          fullWidth
          type="submit"
          variant="contained"
          disabled={!canSubmit}
          sx={{ py: 1.4, fontSize: 17, bgcolor: '#6B4FA0', '&:hover': { bgcolor: '#5B3FA0' } }}
        >
          Continue
        </Button>

        <Typography sx={{ mt: 2, fontSize: 12, color: '#4A4560', textAlign: 'center' }}>
          Private beta — charts and chats stay on this device for now. No billing in this build.
        </Typography>
      </Box>
    </Box>
  );
}

export default InviteGateScreen;
