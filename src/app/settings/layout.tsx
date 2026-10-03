'use client';

import { Box } from '@mui/material';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      {children}
    </Box>
  );
}
