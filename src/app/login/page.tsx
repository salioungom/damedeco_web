'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Alert, Typography, Box, Link as MuiLink } from '@mui/material';
import NextLink from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeRedirect } from '@/lib/sanitize-redirect';
import { getDashboardPath } from '@/utils/roleRoutes';
import { AuthShell } from '@/components/ui/AuthShell';
import { StaticTextField } from '@/components/ui/StaticTextField';
import { PasswordField } from '@/components/ui/PasswordField';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const redirectTo = sanitizeRedirect(searchParams.get('redirect'));
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

    const registerHref = redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : '/register';

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        const errors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            errors.email = 'L\'adresse email est obligatoire';
        }

        if (!password) {
            errors.password = 'Le mot de passe est obligatoire';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setLoading(true);

        try {
            const result = await login(email.trim(), password);

            if (result.success) {
                if (result.mustChangePassword) {
                    router.push('/change-password');
                } else if (redirectTo) {
                    router.push(redirectTo);
                } else {
                    router.push(getDashboardPath(result.user?.role));
                }
            } else {
                setError(result.error || 'Email ou mot de passe incorrect');
            }
        } catch {
            setError('Erreur de connexion. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthShell
            eyebrow="Maison · Dakar"
            title="Bon retour."
            paragraph="Retrouvez votre espace, vos favoris et le suivi de vos commandes. Une sélection déco pensée pour le Sénégal."
            note="Paiement à la livraison · Wave · Orange Money · Carte bancaire"
        >
            {error && (
                <Alert severity="error" variant="outlined" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
                <StaticTextField
                    id="email"
                    name="email"
                    label="Adresse email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                    }}
                    error={!!fieldErrors.email}
                    helperText={fieldErrors.email}
                    sx={{ mb: 3 }}
                />

                <PasswordField
                    id="password"
                    name="password"
                    label="Mot de passe"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                    }}
                    error={!!fieldErrors.password}
                    helperText={fieldErrors.password}
                    sx={{ mb: 1 }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                    <MuiLink component={NextLink} href="/forgot-password" sx={{ fontSize: 14, fontWeight: 500 }}>
                        Mot de passe oublié&nbsp;?
                    </MuiLink>
                </Box>

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading}
                    sx={{ height: 48 }}
                >
                    {loading ? 'Connexion…' : 'Se connecter'}
                </Button>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Pas encore de compte&nbsp;?
                    </Typography>
                    <MuiLink component={NextLink} href={registerHref} sx={{ fontSize: 14, fontWeight: 600 }}>
                        Créer un compte
                    </MuiLink>
                </Box>
            </Box>
        </AuthShell>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}