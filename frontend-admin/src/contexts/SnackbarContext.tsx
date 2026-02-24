import { Alert, Snackbar } from '@mui/material';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

const SnackbarContext = createContext<{ show: (message: string, severity?: ToastType) => void } | null>(null);

export const AdminSnackbarProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<ToastType>('info');

  const value = useMemo(
    () => ({
      show: (text: string, type: ToastType = 'info') => {
        setMessage(text);
        setSeverity(type);
        setOpen(true);
      },
    }),
    [],
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)}>
        <Alert severity={severity} variant="filled" onClose={() => setOpen(false)}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useAdminSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useAdminSnackbar must be used within AdminSnackbarProvider');
  }
  return context;
};
