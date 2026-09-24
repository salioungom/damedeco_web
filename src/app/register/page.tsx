'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/auth';
import {
    Box,
    Button,
    Alert,
    Typography,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Link as MuiLink,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import NextLink from 'next/link';
import { sanitizeRedirect } from '@/lib/sanitize-redirect';
import { AuthShell } from '@/components/ui/AuthShell';
import { StaticTextField } from '@/components/ui/StaticTextField';
import { PasswordField } from '@/components/ui/PasswordField';

// ClientOnly wrapper to prevent hydration mismatches
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);
    return isMounted ? <>{children}</> : null;
};

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = sanitizeRedirect(searchParams.get('redirect'));
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
    const [passwordFocused, setPasswordFocused] = useState(false);

    // Validation en temps réel du mot de passe
    const getPasswordStrength = (password: string) => {
        const checks = {
            length: password.length >= 12,
            uppercase: /[A-Z]/.test(password),
            special: /[!@#$%^&*]/.test(password),
            noPredictable: !/123456|password|qwerty/i.test(password),
            noName: !formData.fullName.toLowerCase().split(' ').some(part => 
                part && password.toLowerCase().includes(part)
            ),
        };
        
        const passed = Object.values(checks).filter(Boolean).length;
        const strength = passed === 0 ? 'empty' : 
                       passed <= 2 ? 'weak' : 
                       passed <= 4 ? 'medium' : 'strong';
        
        return { checks, strength, passed };
    };

    const passwordStrength = getPasswordStrength(formData.password);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSuccess('');
        setFieldErrors({});
        setLoading(true);

        try {
            // Validation des champs selon spécifications finales
            const errors: {[key: string]: string} = {};
            
            if (!formData.fullName) {
                errors.fullName = 'Le nom complet est obligatoire';
            }
            
            if (!formData.email) {
                errors.email = 'L\'adresse email est obligatoire';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                errors.email = 'L\'adresse email n\'est pas valide';
            }
            
            if (!formData.phone) {
                errors.phone = 'Le numéro de téléphone est obligatoire';
            }
            
            if (!formData.password) {
                errors.password = 'Le mot de passe est obligatoire';
            } else {
                // Validation du mot de passe sécurisé (minimum 12 caractères)
                if (formData.password.length < 12) {
                    errors.password = 'Le mot de passe doit contenir au moins 12 caractères';
                } else if (!/[A-Z]/.test(formData.password)) {
                    errors.password = 'Le mot de passe doit contenir au moins une lettre majuscule';
                } else if (!/[!@#$%^&*]/.test(formData.password)) {
                    errors.password = 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)';
                } else if (/123456|password|qwerty/i.test(formData.password)) {
                    errors.password = 'Le mot de passe ne peut pas contenir de motifs prévisibles';
                } else if (formData.fullName.toLowerCase().split(' ').some(part => 
                    part && formData.password.toLowerCase().includes(part))) {
                    errors.password = 'Le mot de passe ne peut pas contenir votre nom ou prénom';
                }
            }
            
            if (!formData.confirmPassword) {
                errors.confirmPassword = 'La confirmation du mot de passe est obligatoire';
            } else if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = 'Les mots de passe ne correspondent pas';
            }
            
            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                setLoading(false);
                return;
            }

            // Utiliser le format selon les spécifications backend FINALES
            const response = await authAPI.register(formData);

            // Si la promesse est résolue, l'inscription est réussie
            setSuccess('Compte créé avec succès ! Veuillez vérifier votre email.');
            setTimeout(() => {
                const otpUrl = `/verify-otp?email=${encodeURIComponent(formData.email)}`;
                const finalUrl = redirectTo ? `${otpUrl}&redirect=${encodeURIComponent(redirectTo)}` : otpUrl;
                router.push(finalUrl);
            }, 2000);

        } catch (err: any) {
            let errorMessage = err.message || 'Erreur d\'inscription';

            // Tenter d'extraire le message d'erreur de la réponse API
            if (err.response && err.response.data) {
                if (err.response.data.detail) {
                    if (Array.isArray(err.response.data.detail)) {
                        errorMessage = err.response.data.detail.map((e: any) => e.msg).join(', ');
                    } else {
                        errorMessage = err.response.data.detail;
                    }
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        // Effacer l'erreur du champ modifié
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Composant pour l'indicateur de force du mot de passe
    const PasswordStrengthIndicator = () => {
        if (!passwordFocused && !formData.password) return null;
        
        const strengthColors: { [key: string]: string } = {
            empty: 'grey.300',
            weak: 'error.main',
            medium: 'warning.main',
            strong: 'success.main'
        };
        
        const strengthLabels: { [key: string]: string } = {
            empty: '',
            weak: 'Faible',
            medium: 'Moyen',
            strong: 'Fort'
        };
        
        return (
            <Box sx={{ mt: { xs: 0.5, sm: 1 }, mb: { xs: 0.5, sm: 1 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 0.25, sm: 1 } }}>
                    <Typography variant="caption" color="text.secondary">
                        Force du mot de passe:
                    </Typography>
                    <Chip
                        label={strengthLabels[passwordStrength.strength]}
                        size="small"
                        sx={{
                            bgcolor: strengthColors[passwordStrength.strength],
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem'
                        }}
                    />
                </Box>
                <List dense sx={{ py: 0 }}>
                    <PasswordRequirement
                        met={passwordStrength.checks.length}
                        text="Au moins 12 caractères"
                    />
                    <PasswordRequirement
                        met={passwordStrength.checks.uppercase}
                        text="Au moins une lettre majuscule"
                    />
                    <PasswordRequirement
                        met={passwordStrength.checks.special}
                        text="Au moins un caractère spécial (!@#$%^&*)"
                    />
                    <PasswordRequirement
                        met={passwordStrength.checks.noPredictable}
                        text="Pas de motifs prévisibles"
                    />
                    <PasswordRequirement
                        met={passwordStrength.checks.noName}
                        text="Ne contient pas votre nom"
                    />
                </List>
            </Box>
        );
    };
    
    const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
        <ListItem sx={{ py: { xs: 0.15, sm: 0.5 }, px: 0 }}>
            <ListItemIcon sx={{ minWidth: 24 }}>
                {met ? (
                    <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
                ) : (
                    <Cancel sx={{ color: 'grey.400', fontSize: 16 }} />
                )}
            </ListItemIcon>
            <ListItemText
                primary={text}
                slotProps={{
                    primary: {
                        variant: 'caption',
                        color: met ? 'text.primary' : 'text.secondary',
                        sx: {
                            textDecoration: met ? 'none' : 'line-through',
                            fontSize: '0.75rem',
                        },
                    },
                }}
            />
        </ListItem>
    );

    return (
        <AuthShell
            eyebrow="Maison · Dakar"
            title="Créer un compte."
            paragraph="Rejoignez DameDéco et profitez de nos sélections déco livrées à Dakar et ses alentours."
            note="Inscription gratuite. Paiement à la livraison · Wave · Orange Money · Carte bancaire"
            formMaxWidth={600}
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
                <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <ClientOnly>
                            <StaticTextField
                                id="fullName"
                                name="fullName"
                                label="Nom complet"
                                autoComplete="name"
                                autoFocus
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                                error={!!fieldErrors.fullName}
                                helperText={fieldErrors.fullName}
                            />
                        </ClientOnly>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <ClientOnly>
                            <StaticTextField
                                id="email"
                                name="email"
                                label="Adresse email"
                                type="email"
                                autoComplete="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                error={!!fieldErrors.email}
                                helperText={fieldErrors.email}
                            />
                        </ClientOnly>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <ClientOnly>
                            <StaticTextField
                                id="phone"
                                name="phone"
                                label="Téléphone"
                                type="tel"
                                autoComplete="tel"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                error={!!fieldErrors.phone}
                                helperText={fieldErrors.phone}
                            />
                        </ClientOnly>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <ClientOnly>
                            <PasswordField
                                id="password"
                                name="password"
                                label="Mot de passe"
                                autoComplete="new-password"
                                value={formData.password}
                                onChange={handleChange}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                error={!!fieldErrors.password}
                                helperText={fieldErrors.password}
                                required
                            />
                            <PasswordStrengthIndicator />
                        </ClientOnly>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <ClientOnly>
                            <PasswordField
                                id="confirmPassword"
                                name="confirmPassword"
                                label="Confirmer le mot de passe"
                                autoComplete="new-password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                error={!!fieldErrors.confirmPassword}
                                helperText={fieldErrors.confirmPassword}
                                required
                            />
                        </ClientOnly>
                    </Grid>
                </Grid>

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading}
                    sx={{ height: 48, mt: 3 }}
                >
                    {loading ? 'Création…' : 'Créer mon compte'}
                </Button>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Déjà un compte&nbsp;?
                    </Typography>
                    <MuiLink
                        component={NextLink}
                        href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'}
                        sx={{ fontSize: 14, fontWeight: 600 }}
                    >
                        Se connecter
                    </MuiLink>
                </Box>
            </Box>
        </AuthShell>
    );
}

export default function RegisterPage() {
    return (
        <Suspense>
            <RegisterForm />
        </Suspense>
    );
}