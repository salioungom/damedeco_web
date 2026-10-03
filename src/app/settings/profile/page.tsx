'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Button,
    Alert,
    Avatar,
    Grid,

    Stack,
} from '@mui/material';
import { AddressService, parseErrorMessage, type Address, type ProfileAddressPayload } from '@/services/address.service';
import { UserService, type CurrentUserProfile, type ProfileIdentityForm } from '@/services/user.service';
import { validatePhone } from '@/utils/phoneValidation';
import { getDashboardPath } from '@/utils/roleRoutes';
import { SettingsTabs } from '@/components/ui/SettingsTabs';
import { StaticTextField } from '@/components/ui/StaticTextField';
import { tokens } from '@/theme/tokens';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'superadmin';
    const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [addressError, setAddressError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        phone: '',
    });
    const [address, setAddress] = useState('');
    const [savedAddress, setSavedAddress] = useState<Address | null>(null);

    const fetchProfile = useCallback(async () => {
        try {
            const data = await UserService.getCurrentProfile();
            setProfile(data);
            setFormData({
                fullName: data.full_name || '',
                username: data.username || '',
                email: data.email || '',
                phone: data.phone || '',
            });
            if (!isSuperAdmin) {
                const addr = await AddressService.getDefaultAddress();
                setSavedAddress(addr);
                setAddress(addr?.address_line_1 || '');
            }
        } catch (err: unknown) {
            setError(parseErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setAddressError('');
        setSuccess('');

        const phoneError = validatePhone(formData.phone?.trim() || '');
        if (phoneError) {
            setError(`Numéro invalide : ${phoneError}`);
            setSaving(false);
            return;
        }

        let derivedFirstName = '';
        let derivedLastName = '';
        if (!isSuperAdmin) {
            // Delivery and invoice labels require distinct first and last names.
            const nameParts = formData.fullName.trim().split(/\s+/).filter(Boolean);
            derivedFirstName = savedAddress?.first_name || nameParts[0] || '';
            derivedLastName = savedAddress?.last_name || nameParts.slice(1).join(' ');
            if (!derivedFirstName || !derivedLastName) {
                setAddressError('Le nom doit contenir au moins 2 mots (prénom et nom)');
                setSaving(false);
                return;
            }
        }

        try {
            const identityPayload: ProfileIdentityForm = {
                fullName: formData.fullName.trim(),
                username: formData.username.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
            };

            if (isSuperAdmin) {
                const updatedProfile = await UserService.updateProfile(identityPayload);
                setProfile(updatedProfile);
                router.push(getDashboardPath(user?.role));
                return;
            }

            const trimmedAddress = address.trim();
            const addressPayload: ProfileAddressPayload = {
                addressType: 'billing',
                addressLine1: trimmedAddress || savedAddress?.address_line_1 || '',
                addressLine2: savedAddress?.address_line_2,
                city: savedAddress?.city || 'Dakar',
                state: savedAddress?.state,
                firstName: derivedFirstName,
                lastName: derivedLastName,
                phone: formData.phone.trim(),
                deliveryInstructions: savedAddress?.delivery_instructions,
                isDefault: true,
            };

            // UN SEUL submit orchestrant DEUX appels (identité + adresse).
            // `user_id`/`user.name` jamais envoyés : résolus via JWT côté backend.
            const [identityResult, addressResult] = await Promise.allSettled([
                UserService.updateProfile(identityPayload),
                AddressService.saveProfileAddress(savedAddress, addressPayload),
            ]);

            const failures: string[] = [];

            if (identityResult.status === 'fulfilled') {
                setProfile(identityResult.value);
            } else {
                failures.push(`Profil : ${parseErrorMessage(identityResult.reason)}`);
            }

            if (addressResult.status === 'fulfilled') {
                setSavedAddress(addressResult.value);
            } else {
                failures.push(`Adresse : ${parseErrorMessage(addressResult.reason)}`);
            }

            if (failures.length > 0) {
                // Échec partiel : on reste sur la page pour afficher le message
                // et permettre un nouvel essai. Rediriger ici masquerait l'erreur.
                setError(failures.join(' — '));
            } else {
                // Tout est persisté : on ramène l'utilisateur sur SON tableau
                // de bord plutôt que de le laisser sur un formulaire vide.
                // Le `finally` relâche déjà `saving`.
                router.push(getDashboardPath(user?.role));
                return;
            }
        } catch (err: unknown) {
            setError(parseErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleCancel = () => {
        setFormData({
            fullName: profile?.full_name || '',
            username: profile?.username || '',
            email: profile?.email || '',
            phone: profile?.phone || '',
        });
        setAddress(savedAddress?.address_line_1 || '');
        setError('');
        setAddressError('');
        setSuccess('');
        router.push(getDashboardPath(user?.role));
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary">Chargement…</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: 'background.default' }}>
            <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
                <SettingsTabs active="profile" />

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
                    Mon compte
                </Typography>
                <Typography variant="h1" sx={{ mb: 1, fontSize: { xs: 32, sm: 40 } }}>
                    Profil.
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                    Gérez vos informations personnelles.
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
                    {/* Avatar & Info */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2.5,
                            p: 2.5,
                            mb: 4,
                            borderRadius: 2,
                            bgcolor: 'rgba(27, 79, 143, 0.06)',
                        }}
                    >
                        <Avatar
                            src={profile?.avatar}
                            sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 26, fontWeight: 600 }}
                        >
                            {(profile?.full_name || profile?.username || 'U').charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {profile?.full_name || profile?.username}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {profile?.email}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Form */}
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <Grid container spacing={2.5}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <StaticTextField
                                    label="Nom complet"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange('fullName')}
                                    required
                                />
                            </Grid>
                            {!isSuperAdmin && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <StaticTextField
                                        label="Nom d'utilisateur"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange('username')}
                                        required
                                    />
                                </Grid>
                            )}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <StaticTextField
                                    label="Numéro de téléphone (+221 / +220)"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange('phone')}
                                />
                            </Grid>
                            {!isSuperAdmin && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <StaticTextField
                                        label="Adresse"
                                        name="address"
                                        value={address}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            setAddress(e.target.value);
                                            if (addressError) setAddressError('');
                                        }}
                                        error={!!addressError}
                                        helperText={addressError || ' '}
                                    />
                                </Grid>
                            )}
                            <Grid size={{ xs: 12 }}>
                                <StaticTextField
                                    label="Adresse email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange('email')}
                                    required
                                />
                            </Grid>
                        </Grid>

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
                                disabled={saving}
                                sx={{ height: 48, flex: { sm: 2 } }}
                            >
                                {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
                            </Button>
                        </Stack>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}