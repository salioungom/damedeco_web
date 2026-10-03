'use client';

import { Box } from '@mui/material';
import { useRouter } from 'next/navigation';

interface SettingsTabsProps {
    active: 'profile' | 'password';
}

const tabSx = {
    px: 3,
    py: 1,
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
    userSelect: 'none' as const,
};

export function SettingsTabs({ active }: SettingsTabsProps) {
    const router = useRouter();

    return (
        <Box
            sx={{
                display: 'inline-flex',
                mb: 3,
                p: 0.5,
                borderRadius: '12px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Box
                component="button"
                type="button"
                onClick={() => router.push('/settings/profile')}
                sx={{
                    ...tabSx,
                    border: 'none',
                    background: 'transparent',
                    color: active === 'profile' ? 'primary.main' : 'text.secondary',
                    fontWeight: active === 'profile' ? 600 : 500,
                    bgcolor: active === 'profile' ? 'rgba(27, 79, 143, 0.08)' : 'transparent',
                    '&:hover': {
                        bgcolor: active === 'profile' ? 'rgba(27, 79, 143, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    },
                }}
            >
                Profil
            </Box>
            <Box
                component="button"
                type="button"
                onClick={() => router.push('/settings/password')}
                sx={{
                    ...tabSx,
                    border: 'none',
                    background: 'transparent',
                    color: active === 'password' ? 'primary.main' : 'text.secondary',
                    fontWeight: active === 'password' ? 600 : 500,
                    bgcolor: active === 'password' ? 'rgba(27, 79, 143, 0.08)' : 'transparent',
                    '&:hover': {
                        bgcolor: active === 'password' ? 'rgba(27, 79, 143, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    },
                }}
            >
                Mot de passe
            </Box>
        </Box>
    );
}

export default SettingsTabs;