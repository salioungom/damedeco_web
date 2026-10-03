'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  alpha,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { shippingAPI } from '@/lib/shipping';
import type { ShippingSettings, ShippingSettingsCreate } from '@/lib/types/shipping';
import { BRAND_BLUE } from '@/theme';
import { formatFcfa } from '@/lib/format';

const BRAND = {
  primary: BRAND_BLUE,
  dark: '#042C53',
  white: '#FFFFFF',
  light: '#E6F1FB',
  surface: '#F5F9FE',
  border: '#D4E8F7',
  muted: '#5F6B7A',
} as const;

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12.5px',
    bgcolor: BRAND.white,
    maxWidth: 450,
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: BRAND.primary,
      borderWidth: 2,
    },
  },
};

export interface ShippingSettingsFormProps {
  /**
   * Appelé après une sauvegarde RÉUSSIE. Le dashboard s'en sert pour
   * ramener l'utilisateur sur l'onglet « Vue d'ensemble ».
   * Non appelé en cas d'erreur, ni pendant le rechargement post-sauvegarde.
   */
  onSaved?: () => void;
}

export default function ShippingSettingsForm({ onSaved }: ShippingSettingsFormProps = {}) {
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ShippingSettings>>({});

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    const result = await shippingAPI.getSettings();

    if (result.error) {
      setError(result.error.message || 'Erreur lors du chargement des paramètres');
    } else if (result.data) {
      setSettings(result.data);
      setFormData(result.data);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const result = settings
        ? await shippingAPI.updateSettings(formData)
        : await shippingAPI.createSettings(formData as ShippingSettingsCreate);

      if (result.error) {
        setError(result.error.message || 'Erreur lors de la sauvegarde');
      } else {
        // On recharge AVANT de notifier : le panneau est monté à cet instant,
        // sinon `loadSettings` écrirait dans un composant déjà démonté par le
        // changement d'onglet.
        await loadSettings();
        onSaved?.();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: BRAND.primary }} />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" variant="outlined" sx={{ mb: 2.5, animation: 'slideUp 0.35s ease-out', '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          borderRadius: '20px',
          border: `1px solid ${BRAND.border}`,
          bgcolor: BRAND.white,
          overflow: 'hidden',
          maxWidth: 800,
        }}
      >
        <Box sx={{ px: 2.5, py: 2, bgcolor: BRAND.surface, borderBottom: `1px solid ${BRAND.border}` }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: BRAND.dark }}>
            Paramètres de livraison
          </Typography>
        </Box>

        <Box sx={{ p: 2.5 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography sx={{ fontSize: 17.5, fontWeight: 600, color: BRAND.dark, mb: 1 }}>
                Seuil livraison gratuite
              </Typography>
              <TextField
                type="number"
                value={formData.freeShippingThreshold ?? ''}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setFormData({ ...formData, freeShippingThreshold: Number(e.target.value) })
                }
                placeholder="60000"
                sx={fieldSx}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">FCFA</InputAdornment>,
                  },
                }}
              />
              <Typography sx={{ fontSize: 15, color: BRAND.muted, mt: 0.75 }}>
                Montant minimum du panier pour la livraison gratuite
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography sx={{ fontSize: 17.5, fontWeight: 600, color: BRAND.dark, mb: 1 }}>
                Coût livraison standard
              </Typography>
              <TextField
                type="number"
                value={formData.standardShippingCost ?? ''}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setFormData({ ...formData, standardShippingCost: Number(e.target.value) })
                }
                placeholder="3000"
                sx={fieldSx}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">FCFA</InputAdornment>,
                  },
                }}
              />
              <Typography sx={{ fontSize: 15, color: BRAND.muted, mt: 0.75 }}>
                Frais appliqués aux commandes sous le seuil gratuit
              </Typography>
            </Grid>
          </Grid>

          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={22.5} color="inherit" /> : <SaveIcon />}
            sx={{
              mt: 3,
              bgcolor: BRAND.primary,
              borderRadius: '12.5px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.1,
              boxShadow: 'none',
              '&:hover': { bgcolor: BRAND.dark, boxShadow: 'none' },
            }}
          >
            {saving ? 'Enregistrement…' : 'Sauvegarder les modifications'}
          </Button>
        </Box>
      </Paper>

      {settings && (
        <Paper
          elevation={0}
          sx={{
            mt: 2.5,
            p: 2.5,
            maxWidth: 800,
            borderRadius: '20px',
            border: `1px solid ${BRAND.border}`,
            bgcolor: alpha(BRAND.primary, 0.04),
          }}
        >
          <Typography sx={{ fontSize: 17.5, fontWeight: 700, color: BRAND.dark, mb: 1.5 }}>
            Récapitulatif actuel
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography sx={{ fontSize: 16.25, color: BRAND.muted }}>Seuil gratuit</Typography>
              <Typography sx={{ fontSize: 18.75, fontWeight: 700, color: BRAND.primary }}>
                {formatFcfa(settings.freeShippingThreshold)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography sx={{ fontSize: 16.25, color: BRAND.muted }}>Coût standard</Typography>
              <Typography sx={{ fontSize: 18.75, fontWeight: 700, color: BRAND.primary }}>
                {formatFcfa(settings.standardShippingCost)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}
