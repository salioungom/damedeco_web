'use client';

import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { ErrorOutlined } from '@mui/icons-material';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In production, you could send this to an error reporting service
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              minHeight: '50vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              textAlign: 'center',
            }}
          >
            <ErrorOutlined sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Une erreur est survenue
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              L&apos;application a rencontré un problème inattendu. Veuillez réessayer.
            </Typography>
            <Button variant="contained" onClick={this.handleReset} sx={{ borderRadius: 2 }}>
              Réessayer
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}
