import { Box, Button, Typography } from '@mui/material';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            오류가 발생했습니다
          </Typography>
          <Typography component="pre" sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, overflow: 'auto', fontSize: 12, mb: 2 }}>
            {this.state.error.message}
          </Typography>
          <Button variant="contained" onClick={() => this.setState({ hasError: false, error: null })}>
            다시 시도
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
