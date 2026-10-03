'use client';

import { useState } from 'react';
import { authAPI } from '@/lib/auth';
import { Box, Button, Alert, Typography, Link as MuiLink } from '@mui/material';
import NextLink from 'next/link';
import { AuthShell } from '@/components/ui/AuthShell';
import { StaticTextField } from '@/components/ui/StaticTextField';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authAPI.forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Une erreur est survenue lors de l\'envoi de l\'email.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            eyebrow="Sécurité · Compte"
            title="Mot de passe oublié."
            paragraph="Entrez votre adresse email pour recevoir un lien de réinitialisation sécurisé."
            note="Le lien envoyé reste valide quelques heures. Vérifiez aussi vos spams."
        >
            {!success ? (
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
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
                        {loading ? 'Envoi…' : 'Envoyer le lien'}
                    </Button>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                        <MuiLink component={NextLink} href="/login" sx={{ fontSize: 14, fontWeight: 500 }}>
                            Retour à la connexion
                        </MuiLink>
                    </Box>
                </Box>
            ) : (
                <Box>
                    <Alert severity="success" variant="outlined" sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Email envoyé avec succès !
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre mot
                            de passe.
                        </Typography>
                    </Alert>
                    <Button
                        component={NextLink}
                        href="/login"
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ height: 48 }}
                    >
                        Retour à la connexion
                    </Button>
                </Box>
            )}
        </AuthShell>
    );
}