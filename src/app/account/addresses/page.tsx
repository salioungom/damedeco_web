'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Breadcrumbs,
  Link,
  Paper,
} from '@mui/material';
import { Add, ArrowBack } from '@mui/icons-material';
import { RequireRole } from '@/components/RequireRole';
import { Address, AddressService, parseErrorMessage } from '@/services/address.service';
import { AddressCard } from '@/components/AddressCard';
import { AddressFormModal } from '@/components/AddressFormModal';

function AddressesPageContent() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await AddressService.getUserAddresses(0, 100);
      setAddresses(response.items);
      setError(null);
    } catch (err: unknown) {
      setError(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleSetDefault = async (id: number) => {
    try {
      await AddressService.setDefaultAddress(id);
      await loadAddresses();
    } catch (err: unknown) {
      setError(parseErrorMessage(err));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
      try {
        await AddressService.deleteAddress(id);
        await loadAddresses();
      } catch (err: unknown) {
        setError(parseErrorMessage(err));
      }
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingAddress(null);
  };

  const handleModalSuccess = () => {
    loadAddresses();
    handleModalClose();
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 12, mb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 4, md: 8 }, mb: 8 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component="button" variant="body1" onClick={() => router.push('/account')} underline="hover">
          Mon Compte
        </Link>
        <Typography color="text.primary">Mes Adresses</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Mes Adresses
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" variant="outlined" sx={{ mb: 3, animation: 'slideUp 0.35s ease-out', '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {addresses.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: 'center',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom fontWeight={600}>
            Aucune adresse enregistrée
          </Typography>
          <Typography variant="body1" color="text.disabled" paragraph>
            Vous pouvez ajouter une adresse lors de votre prochaine commande.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onSetDefault={handleSetDefault}
              onEdit={handleEdit}
            />
          ))}
        </Stack>
      )}

      <AddressFormModal
        address={editingAddress || undefined}
        open={showModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </Container>
  );
}

export default function AddressesPage() {
  return (
    <RequireRole allowedRoles={['client']}>
      <AddressesPageContent />
    </RequireRole>
  );
}
