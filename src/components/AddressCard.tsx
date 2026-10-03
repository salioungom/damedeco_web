'use client';

import { Box, Typography, Button, Chip, IconButton, Card, CardContent, alpha, useTheme } from '@mui/material';
import { Edit, Delete, Star, LocationOn } from '@mui/icons-material';
import { AddressService } from '@/services/address.service';
import { Address } from '@/services/address.service';

interface AddressCardProps {
  address: Address;
  onSetDefault: (id: number) => void;
  onEdit: (address: Address) => void;
  onDelete?: (id: number) => void;
}

export function AddressCard({ address, onSetDefault, onEdit, onDelete }: AddressCardProps) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: address.is_default ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.divider, 0.4),
        borderRadius: 2,
        transition: 'all 0.2s ease',
        bgcolor: address.is_default ? alpha(theme.palette.primary.main, 0.02) : 'background.paper',
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.4),
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LocationOn sx={{ color: 'primary.main', fontSize: 25 }} />
            <Typography variant="h6" fontWeight={700}>
              {address.address_type === 'billing' ? 'Adresse de facturation' : 'Adresse de livraison'}
            </Typography>
          </Box>
          {address.is_default && (
            <Chip
              icon={<Star sx={{ fontSize: 20 }} />}
              label="Par défaut"
              size="small"
              color="primary"
              sx={{ fontWeight: 600, borderRadius: 1 }}
            />
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {AddressService.formatFullName(address)}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {address.phone}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {address.address_line_1}
          </Typography>
          {address.address_line_2 && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {address.address_line_2}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {address.city}, {address.state}
          </Typography>
          {address.delivery_instructions && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Instructions: {address.delivery_instructions}
            </Typography>
          )}
        </Box>  

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {!address.is_default && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => onSetDefault(address.id)}
              sx={{ borderRadius: 1, textTransform: 'none' }}
            >
              Définir par défaut
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit sx={{ fontSize: 20 }} />}
            onClick={() => onEdit(address)}
            sx={{ borderRadius: 1, textTransform: 'none' }}
          >
            Modifier
          </Button>
          {onDelete && (
            <IconButton
              size="small"
              onClick={() => onDelete(address.id)}
              sx={{ color: 'error.main' }}
            >
              <Delete sx={{ fontSize: 22.5 }} />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
