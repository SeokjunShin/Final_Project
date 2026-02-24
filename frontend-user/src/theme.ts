import { createTheme } from '@mui/material';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#18489f' },
    secondary: { main: '#16a3a1' },
    background: { default: '#eef3fb', paper: '#ffffff' },
    text: { primary: '#111c2f', secondary: '#55627a' },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: 'Pretendard, "Noto Sans KR", "Segoe UI", sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 800, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 14px 32px rgba(20, 50, 110, 0.09)',
          border: '1px solid #e3ebf8',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, textTransform: 'none', fontWeight: 700 },
      },
    },
  },
});
