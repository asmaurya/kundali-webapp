import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  InputAdornment,
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
import FamilyMemberCard from './FamilyMemberCard';
import AppModal from './AppModal';
import PlaceOfBirthField from './PlaceOfBirthField';
import {
  ensureMemberChart,
  getFamilyOnly,
  getSelfProfile,
  persistFamilyMembers,
} from '../lib/profiles';
import { loadFamilyMembers } from '../betaSession';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#FDFBFF',
    borderRadius: 2.5,
  },
  '& .MuiInputLabel-root': {
    backgroundColor: '#FFFFFF',
    px: 0.5,
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -9px) scale(0.75)',
  },
};

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
  const [placeMeta, setPlaceMeta] = useState(null);

  const refresh = (familyOnly) => {
    setMembers([getSelfProfile(), ...familyOnly.map((m) => ensureMemberChart(m))]);
  };

  const openWizard = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPlaceMeta(null);
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
    setPlaceMeta(
      member.lat != null
        ? {
            lat: member.lat,
            lon: member.lon,
            tzOffsetHours: member.tzOffsetHours,
            countryCode: member.countryCode,
            placeId: member.placeId,
            source: member.source,
            label: member.place,
          }
        : null
    );
    setStep(0);
    setWizardOpen(true);
  };

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const saveMember = () => {
    const birth = { ...form };
    if (placeMeta && Number.isFinite(Number(placeMeta.lat)) && Number.isFinite(Number(placeMeta.lon))) {
      birth.lat = Number(placeMeta.lat);
      birth.lon = Number(placeMeta.lon);
      birth.tzOffsetHours = placeMeta.tzOffsetHours;
      birth.countryCode = placeMeta.countryCode;
      birth.placeId = placeMeta.placeId;
      birth.source = placeMeta.source;
      birth.place = placeMeta.label || form.place;
    }
    const withChart = ensureMemberChart({
      ...(editing || {}),
      ...birth,
      id: editing?.id || Date.now(),
    });
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
          <Box sx={{ display: 'grid', gap: 2.5 }}>
            <TextField
              label="Date of Birth"
              type="date"
              value={form.date}
              onChange={update('date')}
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthIcon sx={{ color: '#5B3FA0' }} fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={fieldSx}
            />
            <TextField
              label="Time of Birth"
              type="time"
              value={form.time}
              onChange={update('time')}
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <ScheduleIcon sx={{ color: '#5B3FA0' }} fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={fieldSx}
            />
            <PlaceOfBirthField
              label="Place of Birth"
              placeholder="Start typing a city…"
              hint="Pick a place from the suggestions for an accurate chart."
              value={form.place}
              onChange={(place) => setForm((current) => ({ ...current, place }))}
              onResolved={setPlaceMeta}
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
