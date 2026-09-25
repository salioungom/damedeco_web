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
import apiClient from '@/lib/api-client';
import { AddressService, type Address } from '@/services/address.service';
import { SettingsTabs } from '@/components/ui/SettingsTabs';
import { StaticTextField } from '@/components/ui/StaticTextField';
import { tokens } from '@/theme/tokens';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
    id: number;
    name?: string;
    full_name?: string;
    username: string;
    email: string;
    phone?: string;
    role: string;
    avatar?: string;
    created_at: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        email: '',
        phone: '',
    });
    const [address, setAddress] = useState('');
    const [savedAddress, setSavedAddress] = useState<Address | null>(null);

    const parseErrorMessage = useCallback((err: any): string => {
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string') return detail;
        if (Array.isArray(detail)) return detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
        return err.response?.data?.message || err.message || 'Une erreur est survenue';
    }, []);

    const fetchProfile = useCallback(async () => {
        try {
            const response = await apiClient.get('/api/v1/users/me');
            const data = response.data;
            setProfile(data);
            setFormData({
                full_name: data.full_name || '',
                username: data.username || '',
                email: data.email || '',
                phone: data.phone || '',
            });
            const addr = await AddressService.getDefaultAddress();
            setSavedAddress(addr);
            setAddress(addr?.address_line_1 || '');
        } catch (err: any) {
            setError(parseErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [parseErrorMessage]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const response = await apiClient.patch('/api/v1/users/me', formData);
            setProfile(response.data);
            setSuccess('Profil mis à jour avec succès !');

            const trimmedAddress = address.trim();
            if (trimmedAddress) {
                try {
                    if (savedAddress) {
                        await AddressService.updateAddress(savedAddress.id, {
                            address_type: savedAddress.address_type,
                            address_line_1: trimmedAddress,
                            address_line_2: savedAddress.address_line_2,
                            city: savedAddress.city,
                            state: savedAddress.state,
                            first_name: savedAddress.first_name,
                            last_name: savedAddress.last_name,
                            phone: savedAddress.phone,
                            delivery_instructions: savedAddress.delivery_instructions,
                            is_default: savedAddress.is_default,
                        });
                    } else {
                        const names = (profile?.full_name || profile?.name || '').trim().split(/\s+/);
                        await AddressService.createAddress({
                            address_type: 'billing',
                            address_line_1: trimmedAddress,
                            city: 'Dakar',
                            first_name: names[0] || profile?.username || '',
                            last_name: names.slice(1).join(' ') || '',
                            phone: profile?.phone || '',
                            is_default: true,
                        });
                    }
                } catch (addrErr: any) {
                    setError(`Profil enregistré, mais l'adresse n'a pas pu être sauvegardée : ${addrErr.message || 'erreur inconnue'}`);
                }
            }
        } catch (err: any) {
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
            full_name: profile?.full_name || '',
            username: profile?.username || '',
            email: profile?.email || '',
            phone: profile?.phone || '',
        });
        setAddress(savedAddress?.address_line_1 || '');
        setError('');
        setSuccess('');
        router.push(user?.role === 'superadmin' ? '/dashboards' : user?.role === 'admin' ? '/dashboard' : '/account');
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
                            {(profile?.full_name || profile?.name || profile?.username || 'U').charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {profile?.full_name || profile?.name || profile?.username}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {profile?.email}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Membre depuis le {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Form */}
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <Grid container spacing={2.5}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <StaticTextField
                                    label="Nom complet"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange('full_name')}
                                    required
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <StaticTextField
                                    label="Nom d'utilisateur"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange('username')}
                                    required
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <StaticTextField
                                    label="Numéro de téléphone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange('phone')}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <StaticTextField
                                    label="Adresse"
                                    name="address"
                                    value={address}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
                                />
                            </Grid>
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