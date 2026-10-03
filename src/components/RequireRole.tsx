'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Box, CircularProgress, Container } from '@mui/material';

interface RequireRoleProps {
    children: React.ReactNode;
    allowedRoles: Array<'admin' | 'client' | 'superadmin'>;
    redirectTo?: string;
}

export function RequireRole({ children, allowedRoles, redirectTo = '/' }: RequireRoleProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        } else if (!loading && user && !allowedRoles.includes(user.role)) {
            router.push(redirectTo);
        }
    }, [user, loading, router, allowedRoles, redirectTo]);

    if (loading) {
        return (
            <Container maxWidth="xl">
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '100vh',
                    }}
                >
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (!user || !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}
