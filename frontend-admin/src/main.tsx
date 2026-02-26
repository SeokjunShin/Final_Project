import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { adminTheme } from './theme';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { AdminSnackbarProvider } from './contexts/SnackbarContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider theme={adminTheme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <AdminSnackbarProvider>
            <AdminAuthProvider>
              <App />
            </AdminAuthProvider>
          </AdminSnackbarProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
