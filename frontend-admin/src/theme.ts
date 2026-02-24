import { createTheme } from '@mui/material';

export const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#173a7b' },
    secondary: { main: '#da5e33' },
    background: { default: '#eff3fa', paper: '#ffffff' },
    text: { primary: '#131c2e', secondary: '#5a6478' },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Pretendard, "Noto Sans KR", "Segoe UI", sans-serif',
    h5: { fontWeight: 800, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 12px 26px rgba(18, 35, 77, 0.08)',
          border: '1px solid #dde5f3',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, textTransform: 'none', fontWeight: 700 },
      },
    },
  },
});
