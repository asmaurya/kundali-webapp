// Design tokens taken from the FigCraft document "kundali_astro_chat".
import { createTheme } from '@mui/material/styles';

export const tokens = {
  primary: '#6B4FA0',
  primaryDark: '#5B3FA0',
  primarySoft: '#DCCFF3',
  text: '#1E1B2E',
  textSecondary: '#4A4560',
  textMuted: '#6A6580',
  border: '#E2DAEA',
  borderStrong: '#CFC4EA',
  surface: '#FFFFFF',
  canvas: '#F6F1F8',
  panel: '#EFE9F7',
  bubbleBot: '#EEE8F2',
  bubbleUser: '#DCCFF3',
  accent: '#F2B84B',
  success: '#2FB24C',
  hill: '#EAE0F7',
  frame: '#3B3050',
  cardBorder: '#E6DEEF',
  chip: '#F1ECF6',
  chipBorder: '#D8CFE6',
  input: '#FDFBFF',
  screenGradient: 'linear-gradient(180deg, #FCF8F3 0%, #F3ECFA 100%)',
  loadingGradient: 'linear-gradient(180deg, #FBF6F2 0%, #E6DAF6 100%)',
};

const theme = createTheme({
  palette: {
    primary: {
      main: tokens.primary,
      dark: tokens.primaryDark,
      light: tokens.primarySoft,
      contrastText: '#FFFFFF',
    },
    secondary: { main: tokens.accent, contrastText: tokens.text },
    success: { main: tokens.success },
    text: { primary: tokens.text, secondary: tokens.textSecondary },
    background: { default: tokens.canvas, paper: tokens.surface },
    divider: tokens.border,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 28, paddingInline: 24, boxShadow: 'none' },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 10, backgroundColor: tokens.input },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 10, fontWeight: 500 } },
    },
    MuiIconButton: {
      styleOverrides: { root: { color: tokens.text } },
    },
  },
});

export default theme;
