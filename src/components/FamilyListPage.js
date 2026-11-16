import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  MenuItem,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PlaceIcon from '@mui/icons-material/Place';
import FamilyMemberCard from './FamilyMemberCard';
import AppModal from './AppModal';
import { loadFamilyMembers, saveFamilyMembers } from '../betaSession';

const RELATIONS = ['Self', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister'];

const INITIAL_MEMBERS = [
  { id: 1, name: 'John Doe', relation: 'Father', chartReady: true },
  { id: 2, name: 'Jane Doe', relation: 'Mother', chartReady: true },
  { id: 3, name: 'Alex Doe', relation: 'Brother', chartReady: false },
];

const EMPTY_FORM = {
  name: '',
  relation: 'Self',
  date: '',
  time: '',
  place: '',
};

const primaryButton = { bgcolor: '#6B4FA0', '&:hover': { bgcolor: '#5B3FA0' } };
const textButton = { color: '#5B3FA0' };

function FamilyListPage() {
  const [members, setMembers] = useState(() => loadFamilyMembers(INITIAL_MEMBERS));

  useEffect(() => {
    saveFamilyMembers(members);
  }, [members]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);

  const openWizard = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setStep(0);
    setWizardOpen(true);
  };

  const openEdit = (member) => {
    setEditing(member);
    setForm({
      name: member.name,
      relation: member.relation,
      date: member.date || '',
      time: member.time || '',
      place: member.place || '',
    });
    setStep(0);
    setWizardOpen(true);
  };

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const saveMember = () => {
    if (editing) {
      setMembers((current) =>
        current.map((member) => (member.id === editing.id ? { ...member, ...form } : member))
      );
    } else {
      setMembers((current) => [...current, { ...form, id: Date.now(), chartReady: true }]);
    }
    setWizardOpen(false);
  };

  const prepareChart = (member) => {
    setMembers((current) =>
      current.map((item) => (item.id === member.id ? { ...item, chartReady: true } : item))
    );
  };

  const stepOneValid = form.name.trim().length > 0;
  const stepTwoValid = Boolean(form.date && form.time && form.place);

  return (
    <Box className="stack-page">
      <Box className="hill-deco" sx={{ opacity: 0.7 }} />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: 'min(1040px, 100%)',
          margin: '0 auto',
          padding: '28px 32px 48px',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box>
            <Typography component="h2" sx={{ fontSize: 26, fontWeight: 700, color: '#1E1B2E' }}>
              Family Members
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 15, color: '#3A3550' }}>
              Manage profiles and prepare a Kundali chart for every member.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={openWizard}
            sx={{ ...primaryButton, ml: 'auto' }}
          >
            Add Family Member
          </Button>
        </Box>

        <Alert severity="info" sx={{ mt: 2, bgcolor: '#EFE9F7', color: '#3A3550' }}>
          Beta: family profiles stay on this device only. Sync and paid family seats come later.
        </Alert>

        <Box sx={{ mt: 3 }}>
          {members.map((member) => (
            <FamilyMemberCard
              key={member.id}
              member={member}
              onEdit={openEdit}
              onPrepare={prepareChart}
            />
          ))}
        </Box>
      </Box>

      <AppModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'Add Family Member'}
        actions={
          <>
            {step > 0 && step < 2 && (
              <Button onClick={() => setStep((value) => value - 1)} sx={textButton}>
                Back
              </Button>
            )}
            <Button onClick={() => setWizardOpen(false)} sx={textButton}>
              Cancel
            </Button>
            {step === 0 && (
              <Button
                variant="contained"
                disabled={!stepOneValid}
                onClick={() => setStep(1)}
                sx={primaryButton}
              >
                Continue
              </Button>
            )}
            {step === 1 && (
              <Button
                variant="contained"
                disabled={!stepTwoValid}
                onClick={() => setStep(2)}
                sx={primaryButton}
              >
                Create chart
              </Button>
            )}
            {step === 2 && (
              <Button variant="contained" onClick={saveMember} sx={primaryButton}>
                Save member
              </Button>
            )}
          </>
        }
      >
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          <Step>
            <StepLabel>Relation</StepLabel>
          </Step>
          <Step>
            <StepLabel>Birth details</StepLabel>
          </Step>
          <Step>
            <StepLabel>Chart</StepLabel>
          </Step>
        </Stepper>

        {step === 0 && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Full name"
              value={form.name}
              onChange={update('name')}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#FDFBFF' } }}
            />
            <TextField
              select
              label="Relation"
              value={form.relation}
              onChange={update('relation')}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#FDFBFF' } }}
            >
              {RELATIONS.map((relation) => (
                <MenuItem key={relation} value={relation}>
                  {relation}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        )}

        {step === 1 && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Date of Birth"
              type="date"
              value={form.date}
              onChange={update('date')}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <CalendarMonthIcon sx={{ mr: 1, color: '#5B3FA0' }} fontSize="small" />
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#FDFBFF' } }}
            />
            <TextField
              label="Time of Birth"
              type="time"
              value={form.time}
              onChange={update('time')}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <ScheduleIcon sx={{ mr: 1, color: '#5B3FA0' }} fontSize="small" />
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#FDFBFF' } }}
            />
            <TextField
              label="Place of Birth"
              value={form.place}
              onChange={update('place')}
              InputProps={{
                startAdornment: <PlaceIcon sx={{ mr: 1, color: '#5B3FA0' }} fontSize="small" />,
              }}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#FDFBFF' } }}
            />
          </Box>
        )}

        {step === 2 && (
          <Box>
            <Typography sx={{ mb: 2, color: '#3A3550' }}>
              Preparing the Kundali chart for {form.name} ({form.relation})…
            </Typography>
            <LinearProgress
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: '#CFC4EA',
                '& .MuiLinearProgress-bar': { bgcolor: '#6B4FA0', borderRadius: 4 },
              }}
            />
          </Box>
        )}
      </AppModal>
    </Box>
  );
}

export default FamilyListPage;
