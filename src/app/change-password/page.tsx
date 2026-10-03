'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell } from '@/components/ui/AuthShell';
import { PasswordField } from '@/components/ui/PasswordField';

export default function ChangePasswordPage() {
    const [userId, setUserId] = useState<number | null>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
    }>({});
    const router = useRouter();
    const { user, refetchUser } = useAuth();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient.get('/api/v1/users/me');
                setUserId(response.data.id);
            } catch (err) {
                console.error('Failed to fetch user profile', err);
            }
        };
        fetchUser();
    }, []);

    const validateForm = (): boolean => {
        const errors: {
            currentPassword?: string;
            newPassword?: string;
            confirmPassword?: string;
        } = {};

        if (!currentPassword) {
            errors.currentPassword = 'Le mot de passe actuel est requis';
        }

        if (!newPassword) {
            errors.newPassword = 'Le nouveau mot de passe est requis';
        } else if (newPassword.length < 12) {
            errors.newPassword = 'Le mot de passe doit contenir au moins 12 caractères';
        } else if (!/[A-Z]/.test(newPassword)) {
            errors.newPassword = 'Le mot de passe doit contenir au moins une lettre majuscule';
        } else if (!/[!@#$%^&*]/.test(newPassword)) {
            errors.newPassword = 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)';
        }

        if (!confirmPassword) {
            errors.confirmPassword = 'La confirmation du mot de passe est requise';
        } else if (newPassword !== confirmPassword) {
            errors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) return;

        if (!userId) {
            setError("Impossible de récupérer l'identifiant de l'utilisateur connecté.");
            return;
        }

        setLoading(true);

        try {
            await apiClient.post(`/api/v1/users/${userId}/change-password`, {
                current_password: currentPassword,
                new_password: newPassword,
            });

            setSuccess('Mot de passe modifié avec succès ! Redirection…');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setFieldErrors({});

            await refetchUser();

            setTimeout(() => {
                if (user?.role === 'superadmin') {
                    router.push('/dashboards');
                } else if (user?.role === 'admin') {
                    router.push('/dashboard');
                } else {
                    router.push('/account');
                }
            }, 2000);
        } catch (err: any) {
            setError(
                err.response?.data?.detail ||
                    err.response?.data?.message ||
                    'Erreur lors de la modification du mot de passe'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            eyebrow="Sécurité · Compte"
            title="Changer le mot de passe."
            paragraph="Vous devez modifier votre mot de passe temporaire pour accéder à votre compte."
            note="12 caractères minimum, une majuscule et un caractère spécial (!@#$%^&*)."
        >
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

            <Box component="form" onSubmit={handleSubmit} noValidate>
                <PasswordField
                    id="currentPassword"
                    name="currentPassword"
                    label="Mot de passe actuel"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setCurrentPassword(e.target.value);
                        if (fieldErrors.currentPassword) setFieldErrors(prev => ({ ...prev, currentPassword: undefined }));
                    }}
                    error={!!fieldErrors.currentPassword}
                    helperText={fieldErrors.currentPassword}
                    required
                    sx={{ mb: 3 }}
                />

                <PasswordField
                    id="newPassword"
                    name="newPassword"
                    label="Nouveau mot de passe"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setNewPassword(e.target.value);
                        if (fieldErrors.newPassword) setFieldErrors(prev => ({ ...prev, newPassword: undefined }));
                    }}
                    error={!!fieldErrors.newPassword}
                    helperText={fieldErrors.newPassword}
                    required
                    sx={{ mb: 3 }}
                />

                <PasswordField
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirmer le nouveau mot de passe"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }}
                    error={!!fieldErrors.confirmPassword}
                    helperText={fieldErrors.confirmPassword}
                    required
                    sx={{ mb: 3 }}
                />

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                    sx={{ height: 48 }}
                >
                    {loading ? 'Modification…' : 'Changer le mot de passe'}
                </Button>
            </Box>
        </AuthShell>
    );
}