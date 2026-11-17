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
import {
  ensureMemberChart,
  getFamilyOnly,
  getSelfProfile,
  persistFamilyMembers,
} from '../lib/profiles';
import { loadFamilyMembers } from '../betaSession';
import { addReport } from '../lib/libraryStore';

const RELATIONS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister'];

const INITIAL_MEMBERS = [
  {
    id: 1,
    name: 'Ramesh Sharma',
    relation: 'Father',
    date: '1962-03-12',
    time: '06:15',
    place: 'Jaipur, Rajasthan, India',
    chartReady: false,
  },
  {
    id: 2,
    name: 'Sunita Sharma',
    relation: 'Mother',
    date: '1965-11-02',
    time: '09:40',
    place: 'Jaipur, Rajasthan, India',
    chartReady: false,
  },
  {
    id: 3,
    name: 'Aman Sharma',
    relation: 'Brother',
    chartReady: false,
  },
];

const EMPTY_FORM = {
  name: '',
  relation: 'Spouse',
  date: '',
  time: '',
  place: '',
};

const primaryButton = { bgcolor: '#6B4FA0', '&:hover': { bgcolor: '#5B3FA0' } };
const textButton = { color: '#5B3FA0' };

function FamilyListPage() {
  const [members, setMembers] = useState(() => {
    const stored = loadFamilyMembers(null);
    const family = Array.isArray(stored)
      ? getFamilyOnly()
      : getFamilyOnly(INITIAL_MEMBERS).map((m) => ensureMemberChart(m));
    if (!Array.isArray(stored)) {
      persistFamilyMembers(family);
    }
    return [getSelfProfile(), ...family.map((m) => ensureMemberChart(m))];
  });

  useEffect(() => {
    persistFamilyMembers(members.filter((m) => !m.isSelf));
  }, [members]);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);

  const refresh = (familyOnly) => {
    setMembers([getSelfProfile(), ...familyOnly.map((m) => ensureMemberChart(m))]);
  };

  const openWizard = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setStep(0);
    setWizardOpen(true);
  };

  const openEdit = (member) => {
    if (member.isSelf) return;
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
    const withChart = ensureMemberChart({
      ...(editing || {}),
      ...form,
      id: editing?.id || Date.now(),
    });
    if (withChart.chart) {
      addReport({
        title: `${withChart.name} · Lagna Kundali`,
        memberId: String(withChart.id),
        memberName: withChart.name,
        kind: 'kundali',
        summary: `Chart prepared for ${withChart.relation}.`,
        source: 'family',
      });
    }
    const family = members.filter((m) => !m.isSelf);
    const nextFamily = editing
      ? family.map((member) => (member.id === editing.id ? withChart : member))
      : [...family, withChart];
    refresh(nextFamily);
    setWizardOpen(false);
  };

  const prepareChart = (member) => {
    if (member.isSelf) return;
    const prepared = ensureMemberChart(member);
    const nextFamily = members
      .filter((m) => !m.isSelf)
      .map((item) => (item.id === member.id ? prepared : item));
    refresh(nextFamily);
    if (prepared.chart) {
      addReport({
        title: `${prepared.name} · Lagna Kundali`,
        memberId: String(prepared.id),
        memberName: prepared.name,
        kind: 'kundali',
        summary: `Chart prepared for ${prepared.relation}.`,
        source: 'family',
      });
    }
  };

  const deleteMember = (member) => {
    if (member.isSelf) return;
    const nextFamily = members.filter((m) => !m.isSelf && m.id !== member.id);
    refresh(nextFamily);
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
              You stay at the top. Add family profiles and prepare a Kundali for each.
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
          Your own profile cannot be removed. Family charts appear under Kundali tabs once birth
          details are saved.
        </Alert>

        <Box sx={{ mt: 3 }}>
          {members.map((member) => (
            <FamilyMemberCard
              key={member.id}
              member={member}
              onEdit={openEdit}
              onPrepare={prepareChart}
              onDelete={deleteMember}
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
