'use client';

import { Box, Grid, Typography } from '@mui/material';
import { tokens } from '@/theme/tokens';
import type { ReactNode } from 'react';

interface AuthShellProps {
    eyebrow: string;
    title: string;
    paragraph?: string;
    note?: string;
    formMaxWidth?: number;
    children: ReactNode;
}

export function AuthShell({
    eyebrow,
    title,
    paragraph,
    note,
    formMaxWidth = 420,
    children,
}: AuthShellProps) {
    return (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', py: { xs: 5, md: 8 } }}>
                <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 3, sm: 4 }, width: '100%' }}>
                    <Grid container spacing={{ xs: 5, md: 8 }} sx={{ alignItems: 'center' }}>
                        {/* Éditorial */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ maxWidth: 440, mx: { xs: 0, md: 'auto' } }}>
                                <Typography
                                    component="p"
                                    sx={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        letterSpacing: '0.14em',
                                        textTransform: 'uppercase',
                                        color: tokens.colors.laiton,
                                        mb: 1.5,
                                    }}
                                >
                                    {eyebrow}
                                </Typography>
                                <Typography variant="h1" sx={{ mb: 2, fontSize: { xs: 32, sm: 40 } }}>
                                    {title}
                                </Typography>
                                {paragraph && (
                                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                                        {paragraph}
                                    </Typography>
                                )}
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 2,
                                        bgcolor: tokens.colors.laiton,
                                        mb: 3,
                                        borderRadius: 1,
                                    }}
                                />
                                {note && (
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {note}
                                    </Typography>
                                )}
                            </Box>
                        </Grid>

                        {/* Formulaire */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ maxWidth: formMaxWidth, mx: { xs: 0, md: 'auto' } }}>
                                {children}
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </Box>
    );
}

export default AuthShell;