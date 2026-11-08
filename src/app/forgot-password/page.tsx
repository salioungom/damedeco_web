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

    const isValidEmail = (email: string) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validation de format avant l'envoi
        if (!email || !isValidEmail(email)) {
            setError('Veuillez entrer une adresse email valide.');
            setLoading(false);
            return;
        }

        try {
            await authAPI.forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            // Erreur réseau ou serveur : jamais de message de succès
            setError(
                err.response?.data?.message ||
                err.message ||
                'Une erreur est survenue lors de l\'envoi de l\'email. Veuillez réessayer.',
            );
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            eyebrow="SÉCURITÉ · COMPTE"
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
                        <Alert
                            severity="error"
                            variant="outlined"
                            sx={{ mb: 3 }}
                            role="alert"
                        >
                            {error}
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={loading}
                        sx={{
                          height: 52,
                          '&:disabled': { opacity: 0.5, cursor: 'not-available' },
                        }}
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
                    {/* Message de succès NEUTRE : pas de fuite d'information sur l'existence du compte */}
                    <Alert
                        role="status"
                        aria-live="polite"
                        severity="success"
                        variant="outlined"
                        sx={{ mb: 3 }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être envoyé.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Vérifiez votre boîte de réception et vos spams.
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