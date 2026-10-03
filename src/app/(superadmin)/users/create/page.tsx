'use client';

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  Grid,
  CircularProgress,
  Stack,
  InputAdornment,
  alpha,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AdminPanelSettings as AdminIcon,
  PersonOutlined,
} from '@mui/icons-material';
import { RequireRole } from '@/components/RequireRole';
import { useAuth } from '@/contexts/AuthContext';
import { validatePhone } from '@/utils/phoneValidation';
import { tokens } from '@/theme/tokens';

const C = tokens.colors;

const BRAND = {
  primary: C.brand.main,
  dark: C.surfaces.inverse,
  white: C.surfaces.paper,
  light: C.brand.soft,
  surface: C.surfaces.default,
  border: C.border.light,
  muted: C.text.secondary,
} as const;

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    bgcolor: BRAND.white,
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: BRAND.primary,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: BRAND.primary,
      borderWidth: 2,
    },
  },
};

export default function CreateAdminPage() {
  const router = useRouter();
  const { accessToken } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ full_name?: string; email?: string; phone?: string }>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: { full_name?: string; email?: string; phone?: string } = {};

    if (!formData.full_name.trim()) {
      errors.full_name = 'Le nom complet est requis';
    } else if (formData.full_name.trim().length < 2) {
      errors.full_name = 'Le nom complet doit contenir au moins 2 caractères';
    }

    if (!formData.email.trim()) {
      errors.email = 'L\'adresse email est requise';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Format d\'email invalide';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Le numéro de téléphone est requis';
    } else {
      const phoneError = validatePhone(formData.phone.trim());
      if (phoneError) {
        errors.phone = phoneError;
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = accessToken || localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const userData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      };

      const res = await fetch(`${apiUrl}/api/v1/auth/create-admin`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        if (res.status === 404) {
          throw new Error(`Endpoint non trouvé sur ${apiUrl}. Le backend est-il démarré ?`);
        }
        if (res.status === 400) {
          const errorData = await res.json();
          if (errorData.detail && Array.isArray(errorData.detail)) {
            const errorMessages = errorData.detail
              .map((err: { loc?: string[]; msg: string }) => `${err.loc?.join('.')} : ${err.msg}`)
              .join(', ');
            throw new Error(errorMessages);
          }
          throw new Error(errorData.detail || errorData.message || 'Données invalides');
        }
        if (res.status === 409) {
          const errorData = await res.json();
          throw new Error(errorData.detail || errorData.message || 'Cette adresse e-mail ou ce numéro de téléphone est déjà utilisé.');
        }
        if (res.status === 422) {
          const errorData = await res.json();
          if (errorData.detail && Array.isArray(errorData.detail)) {
            const errorMessages = errorData.detail
              .map((err: { loc?: string[]; msg: string }) => `${err.loc?.join('.')} : ${err.msg}`)
              .join(', ');
            throw new Error(errorMessages);
          }
          throw new Error(errorData.detail || 'Données de validation invalides');
        }
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }

      setSuccess(
        "Un email avec le mot de passe temporaire a été envoyé à l'adresse e-mail de l'administrateur."
      );

      setFormData({ full_name: '', email: '', phone: '' });
      setFieldErrors({});

      setTimeout(() => {
        router.push('/dashboards');
      }, 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'invitation de l'administrateur";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <RequireRole allowedRoles={['superadmin']} redirectTo="/">
      <Box sx={{ bgcolor: BRAND.surface, minHeight: '100vh', pb: 6 }}>
        {/* Hero */}
        <Box
          sx={{
            bgcolor: BRAND.dark,
            color: BRAND.white,
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 3.5, md: 4.5 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 240,
              height: 240,
              borderRadius: '50%',
              bgcolor: alpha(BRAND.white, 0.06),
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 720, mx: 'auto' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/dashboards')}
              sx={{
                mb: 2,
                color: alpha(BRAND.white, 0.9),
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '10px',
                px: 0,
                '&:hover': { bgcolor: alpha(BRAND.white, 0.08) },
              }}
            >
              Retour au tableau de bord
            </Button>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '14px',
                  bgcolor: alpha(BRAND.white, 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PersonAddIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Inviter un administrateur
                </Typography>
                <Typography sx={{ fontSize: 14, opacity: 0.9, mt: 0.5 }}>
                  Envoyez une invitation à un nouveau compte admin sur DameDéco
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* Formulaire */}
        <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 2, sm: 3 }, mt: -2, position: 'relative', zIndex: 2 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: '16px',
              border: `1px solid ${BRAND.border}`,
              bgcolor: BRAND.white,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: { xs: 2.5, sm: 3 },
                py: 2.5,
                bgcolor: BRAND.light,
                borderBottom: `1px solid ${BRAND.border}`,
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <AdminIcon sx={{ color: BRAND.primary }} />
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: BRAND.dark }}>
                    Informations du compte
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: BRAND.muted }}>
                    Les champs marqués * sont obligatoires
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
              {error && (
                <Alert severity="error" variant="outlined" sx={{ mb: 2.5, animation: 'slideUp 0.35s ease-out', '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert
                  severity="success"
                  variant="outlined"
                  icon={<CheckCircleIcon />}
                  sx={{ mb: 2.5, animation: 'slideUp 0.35s ease-out', '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}
                >
                  {success}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Nom complet *"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      disabled={loading}
                      autoFocus
                      error={!!fieldErrors.full_name}
                      helperText={fieldErrors.full_name}
                      sx={fieldSx}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonOutlined sx={{ color: BRAND.muted, fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Email *"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      error={!!fieldErrors.email}
                      helperText={fieldErrors.email}
                      sx={fieldSx}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon sx={{ color: BRAND.muted, fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Téléphone *"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={loading}
                      error={!!fieldErrors.phone}
                      helperText={fieldErrors.phone}
                      sx={fieldSx}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon sx={{ color: BRAND.muted, fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                </Grid>

                <Stack
                  direction={{ xs: 'column-reverse', sm: 'row' }}
                  spacing={1.5}
                  sx={{ mt: 3.5 }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => router.push('/dashboards')}
                    disabled={loading}
                    size="large"
                    sx={{
                      flex: { sm: 1 },
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: BRAND.border,
                      color: BRAND.dark,
                      py: 1.25,
                      '&:hover': { borderColor: BRAND.primary, bgcolor: alpha(BRAND.primary, 0.04) },
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    size="large"
                    sx={{
                      flex: { sm: 2 },
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.25,
                      bgcolor: BRAND.primary,
                      boxShadow: 'none',
                      '&:hover': { bgcolor: BRAND.dark, boxShadow: 'none' },
                    }}
                  >
                    {loading ? (
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'center' }}>
                        <CircularProgress size={20} sx={{ color: BRAND.white }} />
                        <span>Envoi en cours…</span>
                      </Stack>
                    ) : (
                      "Inviter l'administrateur"
                    )}
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </RequireRole>
  );
}
