'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Alert } from '@mui/material';
import { AuthShell } from '@/components/ui/AuthShell';
import { PasswordField } from '@/components/ui/PasswordField';

function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(true);

    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setTokenValid(false);
            setError('Token de réinitialisation manquant');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (password.length < 12) {
            setError('Le mot de passe doit contenir au moins 12 caractères');
            return;
        }

        if (!/[A-Z]/.test(password)) {
            setError('Le mot de passe doit contenir au moins une lettre majuscule');
            return;
        }

        if (!/[!@#$%^&*]/.test(password)) {
            setError('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)');
            return;
        }

        if (!token) {
            setError('Token de réinitialisation manquant');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/reset-password-confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    password,
                    confirmPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
            } else {
                setError(data.message || 'Une erreur est survenue');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    if (!tokenValid) {
        return (
            <AuthShell
                eyebrow="Sécurité · Compte"
                title="Lien invalide."
                paragraph="Le lien de réinitialisation est manquant ou a expiré."
                note="Demandez un nouveau lien pour réinitialiser votre mot de passe."
            >
                {error && (
                    <Alert severity="error" variant="outlined" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => router.push('/forgot-password')}
                    sx={{ height: 48 }}
                >
                    Demander un nouveau lien
                </Button>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            eyebrow="Sécurité · Compte"
            title="Nouveau mot de passe."
            paragraph="Entrez votre nouveau mot de passe sécurisé."
            note="12 caractères minimum, une majuscule et un caractère spécial (!@#$%^&*)."
        >
            {!success ? (
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <PasswordField
                        id="password"
                        name="password"
                        label="Nouveau mot de passe"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        required
                        sx={{ mb: 3 }}
                    />

                    <PasswordField
                        id="confirmPassword"
                        name="confirmPassword"
                        label="Confirmer le mot de passe"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                        required
                        sx={{ mb: 3 }}
                    />

                    {error && (
                        <Alert severity="error" variant="outlined" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={loading}
                        sx={{ height: 48 }}
                    >
                        {loading ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
                    </Button>
                </Box>
            ) : (
                <Box>
                    <Alert severity="success" variant="outlined" sx={{ mb: 3 }}>
                        <Box component="span" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Mot de passe réinitialisé !
                        </Box>
                        <Box component="span" sx={{ color: 'text.secondary', fontSize: 14 }}>
                            Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                        </Box>
                    </Alert>
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => router.push('/login')}
                        sx={{ height: 48 }}
                    >
                        Se connecter
                    </Button>
                </Box>
            )}
        </AuthShell>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    );
}