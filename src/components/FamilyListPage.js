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
import { birthFieldSx, birthPickerSlotProps } from './birthFieldSx';
import {
  ensureFamilySeeds,
  ensureMemberChart,
  getFamilyOnly,
  getSelfProfile,
  persistFamilyMembers,
  withChartStatus,
} from '../lib/profiles';

const RELATIONS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister'];

const EMPTY_FORM = {
  name: '',
  relation: 'Spouse',
  date: '',
  time: '',
  place: '',
};

const primaryButton = { bgcolor: '#6B4FA0', '&:hover': { bgcolor: '#5B3FA0' } };
const textButton = { color: '#5B3FA0' };

function buildBirthFromForm(form, placeMeta) {
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
  return birth;
}

function FamilyListPage() {
  const [members, setMembers] = useState(() => {
    ensureFamilySeeds();
    const family = getFamilyOnly().map(withChartStatus);
    return [getSelfProfile(), ...family];
  });

  useEffect(() => {
    persistFamilyMembers(members.filter((m) => !m.isSelf));
  }, [members]);

  // Backfill charts for members that have birth details but no valid chart yet.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pending = members.filter((m) => !m.isSelf && !m.chartReady && m.date && m.time && m.place);
      if (!pending.length) return;
      const updates = {};
      await Promise.all(
        pending.map(async (member) => {
          const prepared = await ensureMemberChart(member);
          updates[member.id] = prepared;
        })
      );
      if (cancelled) return;
      setMembers((current) =>
        current.map((m) => (updates[m.id] ? updates[m.id] : m))
      );
    })();
    return () => {
      cancelled = true;
    };
    // Only on mount — avoid loops when members update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [placeMeta, setPlaceMeta] = useState(null);
  const [preparedMember, setPreparedMember] = useState(null);
  const [chartPhase, setChartPhase] = useState('idle'); // idle | preparing | ready | error
  const [chartError, setChartError] = useState('');

  const refresh = (familyOnly) => {
    setMembers([getSelfProfile(), ...familyOnly.map(withChartStatus)]);
  };

  const openWizard = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPlaceMeta(null);
    setPreparedMember(null);
    setChartPhase('idle');
    setChartError('');
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
    setPreparedMember(null);
    setChartPhase('idle');
    setChartError('');
    setStep(0);
    setWizardOpen(true);
  };

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  // When the Chart step opens, actually generate the chart (was previously stuck forever).
  useEffect(() => {
    if (!wizardOpen || step !== 2) return undefined;
    let cancelled = false;
    setChartPhase('preparing');
    setChartError('');
    setPreparedMember(null);

    (async () => {
      const birth = buildBirthFromForm(form, placeMeta);
      try {
        const withChart = await ensureMemberChart({
          ...(editing || {}),
          ...birth,
          id: editing?.id || Date.now(),
        });
        if (cancelled) return;
        setPreparedMember(withChart);
        if (withChart.chartReady) {
          setChartPhase('ready');
        } else {
          setChartPhase('error');
          setChartError('Could not prepare this chart. Check birth details and try again.');
        }
      } catch (error) {
        if (cancelled) return;
        setChartPhase('error');
        setChartError(String(error?.message || error || 'Chart generation failed.'));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wizardOpen, step, form, placeMeta, editing]);

  const saveMember = () => {
    const birth = buildBirthFromForm(form, placeMeta);
    const withChart =
      preparedMember ||
      withChartStatus({
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

  const prepareChart = async (member) => {
    if (member.isSelf) return;
    const prepared = await ensureMemberChart(member);
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
  // Enable once date, time, and a place string are present. Prefer a resolved
  // suggestion (lat/lon) when available; never leave the button stuck after a pick.
  const placeReady = Boolean(
    (typeof form.place === 'string' && form.place.trim()) ||
      (placeMeta && (placeMeta.label || placeMeta.placeId))
  );
  const stepTwoValid = Boolean(form.date && form.time && placeReady);

  const handlePlaceChange = (place) => {
    setForm((current) => ({ ...current, place: place || '' }));
  };

  const handlePlaceResolved = (meta) => {
    setPlaceMeta(meta);
    if (meta && (meta.label || meta.placeId)) {
      setForm((current) => ({
        ...current,
        place: meta.label || current.place || '',
      }));
    }
  };

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
              <Button
                variant="contained"
                onClick={saveMember}
                disabled={chartPhase === 'preparing'}
                sx={primaryButton}
              >
                {chartPhase === 'ready' ? 'Save member' : chartPhase === 'error' ? 'Save without chart' : 'Working…'}
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
              slotProps={birthPickerSlotProps({
                ariaLabel: 'Date of Birth',
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarMonthIcon sx={{ color: '#5B3FA0' }} fontSize="small" />
                  </InputAdornment>
                ),
              })}
              sx={birthFieldSx}
            />
            <TextField
              label="Time of Birth"
              type="time"
              value={form.time}
              onChange={update('time')}
              fullWidth
              slotProps={birthPickerSlotProps({
                ariaLabel: 'Time of Birth',
                startAdornment: (
                  <InputAdornment position="start">
                    <ScheduleIcon sx={{ color: '#5B3FA0' }} fontSize="small" />
                  </InputAdornment>
                ),
              })}
              sx={birthFieldSx}
            />
            <PlaceOfBirthField
              label="Place of Birth"
              placeholder="Start typing a city…"
              hint="Pick a place from the suggestions for an accurate chart."
              value={form.place}
              onChange={handlePlaceChange}
              onResolved={handlePlaceResolved}
            />
          </Box>
        )}

        {step === 2 && (
          <Box>
            {chartPhase === 'preparing' && (
              <>
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
              </>
            )}
            {chartPhase === 'ready' && (
              <Alert severity="success" sx={{ bgcolor: '#D9F0DC', color: '#1E7A36' }}>
                Chart ready for {form.name}
                {preparedMember?.chart?.summary?.lagna
                  ? ` · Lagna ${preparedMember.chart.summary.lagna}`
                  : ''}
                {preparedMember?.chart?.provenance?.provider
                  ? ` · ${preparedMember.chart.provenance.provider}`
                  : ''}
                . Save to add them to your family list.
              </Alert>
            )}
            {chartPhase === 'error' && (
              <Alert severity="warning">
                {chartError || 'Chart could not be prepared.'} You can still save the member and
                retry later.
              </Alert>
            )}
          </Box>
        )}
      </AppModal>
    </Box>
  );
}

export default FamilyListPage;
