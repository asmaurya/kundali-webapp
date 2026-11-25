/**
 * Shared outlined-field styling for birth date/time/place inputs.
 * Keep this soft: match input fill for the floating label notch, and do not
 * override MUI's shrink transform (that breaks pickers / overlaps values).
 */
export const birthFieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#FDFBFF',
    borderRadius: 2.5,
  },
  '& .MuiInputLabel-root': {
    bgcolor: '#FDFBFF',
    px: 0.5,
  },
};

/** MUI v6+ slotProps for a native date/time TextField with a leading icon. */
export function birthPickerSlotProps({ ariaLabel, startAdornment }) {
  return {
    inputLabel: { shrink: true },
    input: { startAdornment },
    htmlInput: ariaLabel ? { 'aria-label': ariaLabel } : undefined,
  };
}
