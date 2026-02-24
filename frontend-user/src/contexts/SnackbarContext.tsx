import { Alert, Snackbar } from '@mui/material';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface SnackbarValue {
  show: (message: string, severity?: ToastType) => void;
}

const SnackbarContext = createContext<SnackbarValue | null>(null);

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<ToastType>('info');

  const value = useMemo(
    () => ({
      show: (msg: string, type: ToastType = 'info') => {
        setMessage(msg);
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

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return context;
};
