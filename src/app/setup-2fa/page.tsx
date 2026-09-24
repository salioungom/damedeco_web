'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Paper,
    Typography,
    Alert,
    CircularProgress,
    Button,
    Switch,
    FormControlLabel,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { AuthShell } from '@/components/ui/AuthShell';
import { tokens } from '@/theme/tokens';

interface TOTPSetup {
    secret: string;
    qrCode: string;
    backupCodes: string[];
}

interface TwoFAStatus {
    totpEnabled: boolean;
    emailEnabled: boolean;
    email: string;
}

export default function Setup2FAPage() {
    const [status, setStatus] = useState<TwoFAStatus | null>(null);
    const [totpSetup, setTotpSetup] = useState<TOTPSetup | null>(null);
    const [loading, setLoading] = useState(true);
    const [settingUpTOTP, setSettingUpTOTP] = useState(false);
    const [enablingTOTP, setEnablingTOTP] = useState(false);
    const [disablingTOTP, setDisablingTOTP] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    const router = useRouter();

    const fetchStatus = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/2fa/status`);
            const data = await response.json();

            if (response.ok) {
                setStatus(data);
            } else {
                setError(data.message || 'Erreur lors du chargement du statut');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleSetupTOTP = async () => {
        setSettingUpTOTP(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/2fa/totp/setup`);
            const data = await response.json();

            if (response.ok) {
                setTotpSetup(data);
                setVerifyDialogOpen(true);
            } else {
                setError(data.message || 'Erreur lors de la configuration TOTP');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
        } finally {
            setSettingUpTOTP(false);
        }
    };

    const handleEnableTOTP = async () => {
        if (!verificationCode || !totpSetup) return;

        setEnablingTOTP(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/2fa/totp/enable`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: verificationCode,
                    secret: totpSetup.secret,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('2FA TOTP activé avec succès !');
                setVerifyDialogOpen(false);
                setTotpSetup(null);
                setVerificationCode('');
                fetchStatus();
            } else {
                setError(data.message || 'Code de vérification invalide');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
        } finally {
            setEnablingTOTP(false);
        }
    };

    const handleDisableTOTP = async () => {
        setDisablingTOTP(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/2fa/totp/disable`, {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('2FA TOTP désactivé avec succès !');
                fetchStatus();
            } else {
                setError(data.message || 'Erreur lors de la désactivation');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
        } finally {
            setDisablingTOTP(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', bgcolor: 'background.default' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <AuthShell
            eyebrow="Sécurité · Compte"
            title="Sécurité du compte."
            paragraph="Activez une seconde couche de protection pour vos achats et votre compte."
            note="Un code généré par une application (TOTP) ou envoyé par email à chaque connexion."
            formMaxWidth={620}
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

            {status && (
                <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, borderRadius: 2, mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Application d&apos;authentification (TOTP)
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        Utilisez une application comme Google Authenticator, Authy ou Microsoft Authenticator pour
                        générer des codes de vérification.
                    </Typography>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={status.totpEnabled}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    if (e.target.checked) {
                                        handleSetupTOTP();
                                    } else {
                                        handleDisableTOTP();
                                    }
                                }}
                                disabled={settingUpTOTP || enablingTOTP || disablingTOTP}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: 'primary.main',
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: 'primary.main',
                                    },
                                }}
                            />
                        }
                        label={
                            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                {status.totpEnabled
                                    ? 'TOTP activé'
                                    : settingUpTOTP
                                        ? 'Configuration en cours…'
                                        : 'Activer TOTP'}
                            </Typography>
                        }
                    />

                    {status.totpEnabled && (
                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={handleSetupTOTP}
                                disabled={settingUpTOTP}
                                size="small"
                                sx={{ fontWeight: 600 }}
                            >
                                Régénérer le code / codes de secours
                            </Button>
                        </Box>
                    )}
                </Paper>
            )}

            {status && (
                <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Email OTP
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        Recevez des codes de vérification par email.
                    </Typography>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={status.emailEnabled}
                                onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                                    if (e.target.checked) {
                                        try {
                                            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/2fa/email/send`);
                                            const data = await response.json();

                                            if (response.ok) {
                                                setSuccess('Code envoyé par email');
                                            } else {
                                                setError(data.message || 'Erreur lors de l\'envoi du code');
                                            }
                                        } catch (err) {
                                            setError('Erreur de connexion au serveur');
                                        }
                                    }
                                }}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: 'primary.main',
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: 'primary.main',
                                    },
                                }}
                            />
                        }
                        label={
                            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                {status.emailEnabled ? 'Email OTP activé' : 'Activer Email OTP'}
                            </Typography>
                        }
                    />
                </Paper>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button variant="text" color="primary" onClick={() => router.push('/account')} sx={{ fontWeight: 600, fontSize: 14 }}>
                    Retour à mon compte
                </Button>
            </Box>

            {/* Dialog TOTP Setup */}
            <Dialog
                open={verifyDialogOpen}
                onClose={() => setVerifyDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 2,
                            boxShadow: 'none',
                            border: '1px solid',
                            borderColor: 'divider',
                        },
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 600 }}>Configurer l&apos;authentification TOTP</DialogTitle>
                <DialogContent>
                    {totpSetup && (
                        <>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                1. Scannez ce QR code avec votre application d&apos;authentification&nbsp;:
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                    <QRCodeSVG value={totpSetup.qrCode} size={200} />
                                </Box>
                            </Box>

                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Ou entrez manuellement cette clé secrète&nbsp;:
                            </Typography>

                            <TextField
                                fullWidth
                                value={totpSetup.secret}
                                slotProps={{
                                    input: {
                                        readOnly: true,
                                        sx: {
                                            borderRadius: 2,
                                            fontFamily: 'monospace',
                                            fontSize: '0.875rem',
                                        },
                                    },
                                }}
                                sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />

                            <Typography variant="body2" sx={{ mb: 2 }}>
                                2. Entrez le code à 6 chiffres généré par votre application&nbsp;:
                            </Typography>

                            <TextField
                                fullWidth
                                variant="outlined"
                                label="Code de vérification"
                                value={verificationCode}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVerificationCode(e.target.value)}
                                placeholder="000000"
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                        sx: {
                                            position: 'static',
                                            transform: 'none',
                                            maxWidth: 'none',
                                            fontSize: 14,
                                            fontWeight: 500,
                                            marginBottom: '8px',
                                            color: tokens.colors.ink,
                                        },
                                    },
                                    input: { notched: false },
                                    htmlInput: {
                                        maxLength: 6,
                                        sx: { fontFamily: 'monospace' },
                                    },
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, height: 48 } }}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setVerifyDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleEnableTOTP}
                        variant="contained"
                        color="primary"
                        disabled={!verificationCode || verificationCode.length !== 6 || enablingTOTP}
                        sx={{ fontWeight: 600 }}
                    >
                        {enablingTOTP ? <CircularProgress size={20} color="inherit" /> : 'Activer TOTP'}
                    </Button>
                </DialogActions>
            </Dialog>
        </AuthShell>
    );
}