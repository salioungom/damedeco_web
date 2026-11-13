'use client';

import { useState } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Button,
    Alert,
    Stack,
} from '@mui/material';
import apiClient from '@/lib/api-client';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { SettingsTabs } from '@/components/ui/SettingsTabs';
import { PasswordField } from '@/components/ui/PasswordField';
import { RequireRole } from '@/components/RequireRole';
import { tokens } from '@/theme/tokens';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardPath } from '@/utils/roleRoutes';

function PasswordPageContent() {
    const router = useRouter();
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await apiClient.post('/api/v1/auth/password/change', {
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword,
            });

            setSuccess('Mot de passe modifié avec succès !');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // Mot de passe changé : on ramène l'utilisateur sur SON tableau de
            // bord. `setLoading(false)` est fait par le `finally`, sinon le
            // bouton resterait figé si la navigation est annulée.
            router.push(getDashboardPath(user?.role));
        } catch (err: any) {
            setError(err.response?.data?.detail || err.response?.data?.message || 'Erreur lors de la modification du mot de passe');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
        router.push(getDashboardPath(user?.role));
    };

    const checkPasswordStrength = async (password: string) => {
        try {
            const response = await apiClient.post('/api/v1/auth/password/strength', { password });
            return response.data;
        } catch (err) {
            // Ignore errors for strength check
        }
        return null;
    };

    return (
        <Box sx={{ bgcolor: 'background.default' }}>
            <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
                <SettingsTabs active="password" />

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
                    Sécurité
                </Typography>
                <Typography variant="h1" sx={{ mb: 1, fontSize: { xs: 32, sm: 40 } }}>
                    Mot de passe.
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                    Changez votre mot de passe pour sécuriser votre compte.
                </Typography>

                {error && (
                    <Alert severity="error" variant="outlined" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" variant="outlined" sx={{ mb: 3 }}>
                        {success}
                    </Alert>
                )}

                <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, borderRadius: 2 }}>
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <PasswordField
                            id="currentPassword"
                            name="currentPassword"
                            label="Mot de passe actuel"
                            autoComplete="current-password"
                            value={currentPassword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                            required
                            sx={{ mb: 3 }}
                        />

                        <PasswordField
                            id="newPassword"
                            name="newPassword"
                            label="Nouveau mot de passe"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                            required
                            sx={{ mb: 2 }}
                        />

                        <PasswordStrengthMeter
                            password={newPassword}
                            onStrengthCheck={checkPasswordStrength}
                        />

                        <PasswordField
                            id="confirmPassword"
                            name="confirmPassword"
                            label="Confirmer le nouveau mot de passe"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                            required
                            sx={{ mt: 2 }}
                        />

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3.5, alignItems: 'stretch' }}>
                            <Button
                                type="button"
                                variant="outlined"
                                color="inherit"
                                onClick={handleCancel}
                                sx={{ height: 48, flex: { sm: 1 } }}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                                sx={{ height: 48, flex: { sm: 2 } }}
                            >
                                {loading ? 'Modification…' : 'Changer le mot de passe'}
                            </Button>
                        </Stack>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

export default function PasswordPage() {
    return (
        <RequireRole allowedRoles={['client', 'admin', 'superadmin']}>
            <PasswordPageContent />
        </RequireRole>
    );
}
