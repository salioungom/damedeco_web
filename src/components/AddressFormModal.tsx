'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  FormHelperText,
} from '@mui/material';
import { Address, CreateAddressData, AddressService, parseErrorMessage } from '@/services/address.service';
import { validatePhone, formatPhoneInput, detectCountry, getOperators } from '@/utils/phoneValidation';

interface AddressFormModalProps {
  address?: Address;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddressFormModal({ address, open, onClose, onSuccess }: AddressFormModalProps) {
  const [formData, setFormData] = useState<CreateAddressData>({
    address_type: 'shipping',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    first_name: '',
    last_name: '',
    phone: '',
    delivery_instructions: '',
    is_default: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      setFormData({
        address_type: address.address_type,
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2 || '',
        city: address.city,
        state: address.state || '',
        first_name: address.first_name,
        last_name: address.last_name,
        phone: address.phone,
        delivery_instructions: address.delivery_instructions || '',
        is_default: address.is_default,
      });
    } else {
      setFormData({
        address_type: 'shipping',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        first_name: '',
        last_name: '',
        phone: '',
        delivery_instructions: '',
        is_default: false,
      });
    }
    setError(null);
    setPhoneError(null);
  }, [address, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate phone before submission
    const phoneValidationError = validatePhone(formData.phone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      setLoading(false);
      return;
    }

    try {
      if (address) {
        await AddressService.updateAddress(address.id, formData);
      } else {
        await AddressService.createAddress(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      const message = parseErrorMessage(err);
      if (message.toLowerCase().includes('phone') || message.toLowerCase().includes('téléphone')) {
        setPhoneError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateAddressData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string | boolean } }
  ) => {
    const value = 'target' in e ? e.target.value : e;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPhoneInput(value);
    setFormData(prev => ({ ...prev, phone: formatted }));

    // Real-time validation after typing a few characters
    if (value.length > 4) {
      const error = validatePhone(formatted);
      setPhoneError(error);
    } else {
      setPhoneError(null);
    }
  };

  const handlePhoneBlur = () => {
    const error = validatePhone(formData.phone);
    setPhoneError(error);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 2 },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {address ? 'Modifier' : 'Ajouter'} une adresse
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" variant="outlined" sx={{ mb: 2, animation: 'slideUp 0.35s ease-out', '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Type d'adresse</InputLabel>
              <Select
                value={formData.address_type}
                onChange={handleChange('address_type')}
                label="Type d'adresse"
                required
              >
                <MenuItem value="shipping">Livraison</MenuItem>
                <MenuItem value="billing">Facturation</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Prénom"
              value={formData.first_name}
              onChange={handleChange('first_name')}
              required
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Nom"
              value={formData.last_name}
              onChange={handleChange('last_name')}
              required
            />

            <TextField
              fullWidth
              label="Téléphone"
              value={formData.phone}
              onChange={handlePhoneChange}
              onBlur={handlePhoneBlur}
              error={!!phoneError}
              helperText={phoneError || "Format: +221 XX XXX XX XX (SN) ou +220 XX XXX XX (GM)"}
              required
              placeholder="+221 77 123 45 67"
            />
          </Box>

          {phoneError && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Opérateurs valides:
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                🇸🇳 Sénégal: 77, 78, 76, 70, 75, 33, 30
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                🇬🇲 Gambie: 30, 39, 99, 77, 88, 55, 22
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label="Ville"
            value={formData.city}
            onChange={handleChange('city')}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Adresse principale"
            value={formData.address_line_1}
            onChange={handleChange('address_line_1')}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Complément d'adresse (optionnel)"
            value={formData.address_line_2}
            onChange={handleChange('address_line_2')}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Région (optionnel)"
            value={formData.state}
            onChange={handleChange('state')}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Instructions de livraison (optionnel)"
            value={formData.delivery_instructions}
            onChange={handleChange('delivery_instructions')}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_default}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
              />
            }
            label="Définir comme adresse par défaut"
          />
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 2 }}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ borderRadius: 2, minWidth: 120 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Sauvegarder'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
