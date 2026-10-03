'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box,
    Alert,
    Button,
    Typography,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { OTPInput } from '@/components/auth/OTPInput';
import { sanitizeRedirect } from '@/lib/sanitize-redirect';
import { AuthShell } from '@/components/ui/AuthShell';

function VerifyOTPForm() {
    const [otp, setOtp] = useState('');
    const [method, setMethod] = useState<'totp' | 'email'>('totp');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';
    const redirectTo = sanitizeRedirect(searchParams.get('redirect'));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (otp.length !== 6) {
            setError('Veuillez entrer les 6 chiffres');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    code: otp,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);

                if (data.user) {
                    localStorage.setItem('user_fullname', data.user.name || data.user.fullname);
                    localStorage.setItem('user_email', data.user.email);
                }

                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                if (data.access_token) {
                    localStorage.setItem('token', data.access_token);
                }

                setTimeout(() => {
                    if (redirectTo) {
                        router.push(redirectTo);
                    } else if (data.user?.role === 'superadmin') {
                        router.push('/dashboards');
                    } else if (data.user?.role === 'admin') {
                        router.push('/dashboard');
                    } else if (data.user?.role === 'client') {
                        router.push('/account');
                    } else {
                        router.push('/');
                    }
                }, 2000);
            } else {
                if (data.detail && Array.isArray(data.detail)) {
                    const errorMessages = data.detail.map((err: any) => err.msg).join(', ');
                    setError(errorMessages);
                } else {
                    setError(data.message || data.detail || 'Code OTP invalide');
                }
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/resend-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setSuccessMessage('Code renvoyé avec succès');
            } else {
                if (data.detail && Array.isArray(data.detail)) {
                    const errorMessages = data.detail.map((err: any) => err.msg).join(', ');
                    setError(errorMessages);
                } else {
                    setError(data.message || data.detail || 'Erreur lors du renvoi du code');
                }
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
        } finally {
            setResending(false);
            if (successMessage) {
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        }
    };

    if (success) {
        return (
            <AuthShell
                eyebrow="Sécurité · Compte"
                title="Vérifiée."
                paragraph="Votre identité a bien été confirmée. Redirection vers votre espace…"
                note="Vous pouvez maintenant profiter pleinement de votre compte DameDéco."
            >
                <Alert severity="success" variant="outlined">
                    Vérification réussie ! Redirection en cours…
                </Alert>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            eyebrow="Sécurité · Compte"
            title="Vérifiez votre identité."
            paragraph="Entrez le code à 6 chiffres que nous avons envoyé pour confirmer votre identité."
            note="Pensez à vérifier vos spams. Vous pouvez renvoyer le code ci-dessous."
        >
            {email && (
                <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary', fontWeight: 500, mb: 3, textAlign: 'center' }}
                >
                    Code envoyé à&nbsp;: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{email}</Box>
                </Typography>
            )}

            {error && (
                <Alert severity="error" variant="outlined" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {successMessage && (
                <Alert severity="success" variant="outlined" sx={{ mb: 3 }}>
                    {successMessage}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, textAlign: 'center', color: 'text.secondary' }}>
                        Méthode de vérification
                    </Typography>
                    <ToggleButtonGroup
                        value={method}
                        exclusive
                        onChange={(_: React.MouseEvent<HTMLElement>, newMethod: 'totp' | 'email' | null) => newMethod && setMethod(newMethod)}
                        fullWidth
                        size="small"
                        sx={{
                            '& .MuiToggleButton-root': {
                                py: 1,
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                color: 'text.secondary',
                                borderColor: 'divider',
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main',
                                    color: '#fff',
                                    '&:hover': {
                                        bgcolor: 'primary.dark',
                                    },
                                },
                            },
                        }}
                    >
                        <ToggleButton value="totp">Application</ToggleButton>
                        <ToggleButton value="email">Email</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                    <OTPInput
                        value={otp}
                        onChange={setOtp}
                        length={6}
                        disabled={loading}
                    />
                </Box>

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading || otp.length !== 6}
                    sx={{ height: 48 }}
                >
                    {loading ? 'Vérification…' : 'Vérifier'}
                </Button>

                <Button
                    type="button"
                    variant="text"
                    fullWidth
                    onClick={handleResend}
                    disabled={resending}
                    startIcon={!resending && <RefreshIcon sx={{ fontSize: 16 }} />}
                    sx={{ mt: 2, py: 1, fontWeight: 600 }}
                >
                    {resending ? 'Envoi en cours…' : 'Renvoyer le code'}
                </Button>
            </Box>
        </AuthShell>
    );
}

export default function VerifyOTPPage() {
    return (
        <Suspense>
            <VerifyOTPForm />
        </Suspense>
    );
}