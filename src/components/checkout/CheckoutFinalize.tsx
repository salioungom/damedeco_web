'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Divider,
  Stack,
  Paper,
  Chip,
  CircularProgress,
  MenuItem,
  useTheme,
  alpha,
} from '@mui/material';
import {
  LocationOn,
  LocalShippingOutlined,
  StoreOutlined,
  PaymentOutlined,
  ArrowForward,
  CheckCircle as CheckCircle2,
} from '@mui/icons-material';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { ClientOnly } from '@/components/ClientOnly';
import { CartItemWithProduct } from '@/hooks/useCartWithProducts';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import { getImageUrl } from '@/lib/imageUtils';
import { computeDeliveryFee, type DeliveryMode } from '@/lib/delivery';
import { formatFcfa } from '@/lib/format';
import { OrderResponse } from '@/services/order.service';

  

export interface OrderCheckoutData {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  deliveryMode: DeliveryMode;
  instructions?: string;
}

export type CheckoutStage = 'idle' | 'creating_order' | 'initializing_payment' | 'redirecting_to_paytech';

interface CheckoutFinalizeProps {
  items: CartItemWithProduct[];
  onPlaceOrder: (data: OrderCheckoutData) => void;
  isProcessing?: boolean;
  stage?: CheckoutStage;
  /** Reprise du paiement d'une commande existante : formulaire à valider si livraison à domicile. */
  orderMode?: boolean;
  error?: string | null;
  /**
   * Montant total renvoyé par le backend (commande déjà créée).
   * Lorsqu'il est fourni, il a priorité sur l'estimation frontend.
   */
  serverTotal?: number | null;
  /**
   * Frais de livraison renvoyés par le backend, s'ils sont disponibles.
   * Prioritaires sur l'estimation frontend.
   */
  serverDeliveryFee?: number | null;
  /**
   * Détails de la commande existante (pour reprise de paiement).
   * Utilisé pour pré-remplir le formulaire et valider le mode de livraison.
   */
  orderDetails?: OrderResponse | null;
}

export function CheckoutFinalize({
  items,
  onPlaceOrder,
  isProcessing = false,
  stage = 'idle',
  orderMode = false,
  error = null,
  serverTotal = null,
  serverDeliveryFee = null,
  orderDetails = null,
}: CheckoutFinalizeProps) {
  const theme = useTheme();
  const brandBlue = theme.palette.primary.main;

  const {
    deliveryMode,
    deliveryFee,
    setDeliveryMode,
    setDeliveryFee,
    setShippingInfo,
  } = useCheckoutStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pré-remplir le formulaire avec les données de la commande existante
  useEffect(() => {
    if (orderMode && orderDetails?.shipping_address) {
      const addr = orderDetails.shipping_address;
      setFirstName(addr.first_name || '');
      setLastName(addr.last_name || '');
      setPhone(addr.phone || '');
      // Utiliser city directement si disponible, sinon tenter le parsing
      if (addr.city) {
        setCity(addr.city);
        setAddress(addr.address || '');
      } else {
        // Fallback : tenter de séparer ville et adresse
        const fullAddress = addr.address || '';
        const parts = fullAddress.split(',').map(p => p.trim());
        if (parts.length > 1) {
          setCity(parts[parts.length - 1]);
          setAddress(parts.slice(0, -1).join(', '));
        } else {
          setAddress(fullAddress);
        }
      }
    }
    // Définir le mode de livraison depuis la commande
    if (orderMode && orderDetails?.mode) {
      setDeliveryMode(orderDetails.mode);
    }
  }, [orderMode, orderDetails, setDeliveryMode]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        if (!item.product) return sum;
        const price =
          item.price_type === 'wholesale' ? item.product.wholesale_price : item.product.price;
        return sum + (price || 0) * item.quantity;
      }, 0),
    [items]
  );

  /**
   * Estimation frontend des frais de livraison (règle 0 / 1500 / 25000).
   * Le backend reste l'autorité pour le montant final facturé : serverDeliveryFee
   * et serverTotal, lorsqu'ils sont fournis, ont priorité sur cette estimation.
   */
  const estimatedDeliveryFee = deliveryFee;
  const displayDeliveryFee = serverDeliveryFee ?? estimatedDeliveryFee;
  const displayTotal = serverTotal ?? subtotal + estimatedDeliveryFee;

  const validateField = (name: string, value: string) => {
    let error = '';
    switch (name) {
      case 'firstName':
        if (!value.trim()) error = 'Le prénom est obligatoire';
        else if (value.trim().length < 2) error = 'Minimum 2 caractères';
        break;
      case 'lastName':
        if (!value.trim()) error = 'Le nom est obligatoire';
        else if (value.trim().length < 2) error = 'Minimum 2 caractères';
        break;
      case 'phone':
        if (!value.trim()) error = 'Le téléphone est obligatoire';
        else if (!isPhoneValid(value)) {
          error = 'Ex: 77 123 45 67 ou +221 77 123 45 67';
        }
        break;
      case 'city':
        if (!value.trim()) error = 'La ville est obligatoire';
        break;
      case 'address':
        if (!value.trim()) error = "L'adresse est obligatoire";
        else if (value.trim().length < 10) error = 'Minimum 10 caractères';
        break;
    }
    return error;
  };

  const isPhoneValid = (val: string) => {
    const digits = val.replace(/\s/g, '');
    return /^(\+?221)?[73]\d{8}$/.test(digits);
  };

  const isFormValid = (() => {
    // En reprise de paiement avec livraison à domicile : valider les champs obligatoires
    if (orderMode && deliveryMode === 'home_delivery') {
      if (!firstName.trim() || !lastName.trim() || !phone.trim() || !city.trim() || !address.trim()) return false;
      // Valider également le format du téléphone
      if (!isPhoneValid(phone)) return false;
      // Valider la longueur minimale de l'adresse
      if (address.trim().length < 10) return false;
      // Valider la longueur minimale du prénom et nom
      if (firstName.trim().length < 2 || lastName.trim().length < 2) return false;
      return true;
    }
    // Nouvelle commande avec livraison à domicile
    if (!orderMode && deliveryMode === 'home_delivery') {
      if (!firstName.trim() || !lastName.trim() || !phone.trim() || !city.trim() || !address.trim()) return false;
    }
    // Retrait en boutique : pas de validation d'adresse requise
    return true;
  })();

  // Frais de livraison : règle backend unique (mode de livraison + sous-total).
  useEffect(() => {
    setDeliveryFee(computeDeliveryFee(deliveryMode, subtotal));
  }, [deliveryMode, subtotal, setDeliveryFee]);

  const handlePlaceOrder = () => {
    if (isProcessing) return;

    // Validation des champs pour la livraison à domicile (y compris en reprise de paiement).
    if (deliveryMode === 'home_delivery') {
      const newErrors: Record<string, string> = {};
      newErrors.firstName = validateField('firstName', firstName);
      newErrors.lastName = validateField('lastName', lastName);
      newErrors.phone = validateField('phone', phone);
      newErrors.city = validateField('city', city);
      newErrors.address = validateField('address', address);
      setErrors(newErrors);

      if (Object.values(newErrors).some((e) => e)) return;
    }

    if (!orderMode) {
      setShippingInfo({ firstName: firstName.trim(), lastName: lastName.trim(), phone, address, city });
    }

    onPlaceOrder({
      fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email,
      phone,
      address,
      city,
      country: 'Sénégal',
      deliveryMode,
      instructions,
    });
  };

  const sectionSx = {
    p: { xs: 2, sm: 2.5, md: 3.5 },
    borderRadius: 3,
    bgcolor: 'background.paper',
    border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: alpha(theme.palette.common.black, 0.02) },
  };

  const deliveryCities = ['Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack', 'Mbour', 'Touba', 'Rufisque', 'Louga', 'Fatick', 'Kolda', 'Matam', 'Kaffrine', 'Kédougou', 'Sédhiou'];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 5 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4 }}>
          <Box>
              <Stack spacing={3.5}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0 }}>
                  Vérifiez et complétez vos coordonnées. Les champs marqués d'un * sont obligatoires.
                </Typography>
              {/* Section 1: Mode de livraison */}
              <Box sx={sectionSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 2, sm: 3 } }}>
                  <LocalShippingOutlined sx={{ color: brandBlue, fontSize: { xs: 24, sm: 27.5 } }} />
                  <Typography variant={{ xs: 'subtitle1', sm: 'h6' }} fontWeight={700}>Mode de livraison</Typography>
                </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr' }, gap: { xs: 1.5, sm: 2 } }}>
                  <Box
                    role="button"
                    tabIndex={0}
                    aria-pressed={deliveryMode === 'home_delivery'}
                    onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') setDeliveryMode('home_delivery'); }}
                    onClick={() => setDeliveryMode('home_delivery')}
                    sx={{
                      p: { xs: 1.5, sm: 2.5 },
                      border: '2px solid',
                      borderColor: deliveryMode === 'home_delivery' ? brandBlue : alpha(theme.palette.divider, 0.8),
                      borderRadius: 3,
                      cursor: 'pointer',
                      bgcolor: deliveryMode === 'home_delivery' ? alpha(brandBlue, 0.06) : 'background.paper',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: alpha(brandBlue, 0.4), bgcolor: alpha(brandBlue, 0.03) },
                      '&:focus-visible': { outline: `3px solid ${brandBlue}`, outlineOffset: 3 },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.5 }, mb: { xs: 0.5, sm: 1 } }}>
                      <LocalShippingOutlined sx={{ color: deliveryMode === 'home_delivery' ? brandBlue : 'text.secondary', fontSize: { xs: 24, sm: 30 } }} />
                      <Typography variant={{ xs: 'body2', sm: 'subtitle1' }} fontWeight={700} color={deliveryMode === 'home_delivery' ? 'text.primary' : 'text.secondary'}>
                        Livraison à la maison
                      </Typography>
                    </Box>
                    
                    {deliveryMode === 'home_delivery' && (
                      <Box sx={{ mt: { xs: 1, sm: 1.5 }, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircle2 sx={{ color: brandBlue, fontSize: { xs: 18, sm: 22.5 } }} />
                        <Typography variant={{ xs: 'caption', sm: 'caption' }} fontWeight={600} color={brandBlue}>Sélectionné</Typography>
                      </Box>
                    )}
                  </Box>

                  <Box
                    role="button"
                    tabIndex={0}
                    aria-pressed={deliveryMode === 'store_pickup'}
                    onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') setDeliveryMode('store_pickup'); }}
                    onClick={() => setDeliveryMode('store_pickup')}
                    sx={{
                      p: { xs: 1.5, sm: 2.5 },
                      border: '2px solid',
                      borderColor: deliveryMode === 'store_pickup' ? brandBlue : alpha(theme.palette.divider, 0.8),
                      borderRadius: 3,
                      cursor: 'pointer',
                      bgcolor: deliveryMode === 'store_pickup' ? alpha(brandBlue, 0.06) : 'background.paper',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: alpha(brandBlue, 0.4), bgcolor: alpha(brandBlue, 0.03) },
                      '&:focus-visible': { outline: `3px solid ${brandBlue}`, outlineOffset: 3 },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.5 }, mb: { xs: 0.5, sm: 1 } }}>
                      <StoreOutlined sx={{ color: deliveryMode === 'store_pickup' ? brandBlue : 'text.secondary', fontSize: { xs: 24, sm: 30 } }} />
                      <Typography variant={{ xs: 'body2', sm: 'subtitle1' }} fontWeight={700} color={deliveryMode === 'store_pickup' ? 'text.primary' : 'text.secondary'}>
                        Retrait en boutique
                      </Typography>
                    </Box>
                    <Typography variant={{ xs: 'caption', sm: 'body2' }} color="text.secondary">
                      Gratuit 
                    </Typography>
                    {deliveryMode === 'store_pickup' && (
                      <Box sx={{ mt: { xs: 1, sm: 1.5 }, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircle2 sx={{ color: brandBlue, fontSize: { xs: 18, sm: 22.5 } }} />
                        <Typography variant={{ xs: 'caption', sm: 'caption' }} fontWeight={600} color={brandBlue}>Sélectionné</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

                  {deliveryMode === 'store_pickup' && (
                <Box sx={{ ...sectionSx, bgcolor: alpha(brandBlue, 0.04) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <StoreOutlined sx={{ color: brandBlue, fontSize: 27.5 }} />
                    <Typography variant="h6" fontWeight={700}>Retrait en boutique</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    Vous pourrez récupérer votre commande directement en boutique, sans frais de livraison.
                    Vous serez notifié dès que votre commande sera prête.
                  </Typography>
                </Box>
              )}

              {/* Section 2: Informations de livraison (uniquement si livraison à la maison) */}
              {deliveryMode === 'home_delivery' && (
                <Box sx={sectionSx} component="form" noValidate>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 2, sm: 3 } }}>
                    <LocationOn sx={{ color: brandBlue, fontSize: { xs: 24, sm: 27.5 } }} />
                    <Typography variant={{ xs: 'subtitle1', sm: 'h6' }} fontWeight={700}>Informations de livraison</Typography>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                    <ClientOnly>
                      <TextField
                        id="firstName"
                        name="firstName"
                        fullWidth
                        label="Prénom"
                        placeholder="Votre prénom"
                        value={firstName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setFirstName(e.target.value);
                          setErrors((prev) => ({ ...prev, firstName: validateField('firstName', e.target.value) }));
                        }}
                        required
                        error={!!errors.firstName}
                        helperText={errors.firstName}
                        sx={inputSx}
                      />
                    </ClientOnly>

                    <ClientOnly>
                      <TextField
                        id="lastName"
                        name="lastName"
                        fullWidth
                        label="Nom"
                        placeholder="Votre nom"
                        value={lastName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setLastName(e.target.value);
                          setErrors((prev) => ({ ...prev, lastName: validateField('lastName', e.target.value) }));
                        }}
                        required
                        error={!!errors.lastName}
                        helperText={errors.lastName}
                        sx={inputSx}
                      />
                    </ClientOnly>

                    <ClientOnly>
                      <TextField
                        id="email"
                        name="email"
                        fullWidth
                        label="Email"
                        placeholder="exemple@email.com"
                        type="email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        sx={inputSx}
                      />
                    </ClientOnly>

                    <ClientOnly>
                      <TextField
                        id="phone"
                        name="phone"
                        fullWidth
                        label="Téléphone"
                        placeholder="+221 77 123 45 67"
                        value={phone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setPhone(e.target.value);
                          setErrors((prev) => ({ ...prev, phone: validateField('phone', e.target.value) }));
                        }}
                        required
                        error={!!errors.phone}
                        helperText={errors.phone || 'Ex: 77 123 45 67 ou +221 77 123 45 67'}
                        sx={inputSx}
                      />
                    </ClientOnly>

                    <ClientOnly>
                      <TextField
                        id="city"
                        name="city"
                        select
                        fullWidth
                        label="Ville"
                        value={city}
                        onChange={(e: { target: { value: string } }) => {
                          setCity(e.target.value);
                          setErrors((prev) => ({ ...prev, city: validateField('city', e.target.value) }));
                        }}
                        required
                        error={!!errors.city}
                        helperText={errors.city}
                        sx={inputSx}
                      >
                        {deliveryCities.map((c) => (
                          <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                      </TextField>
                    </ClientOnly>

                    <ClientOnly>
                      <TextField
                        id="address"
                        name="address"
                        fullWidth
                        label="Adresse complète"
                        placeholder="Rue, quartier, repères..."
                        value={address}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setAddress(e.target.value);
                          setErrors((prev) => ({ ...prev, address: validateField('address', e.target.value) }));
                        }}
                        required
                        error={!!errors.address}
                        helperText={errors.address}
                        sx={{ ...inputSx, gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}
                      />
                    </ClientOnly>

                    <ClientOnly>
                      <TextField
                        id="instructions"
                        name="instructions"
                        fullWidth
                        label="Instructions (optionnel)"
                        placeholder="Instructions de livraison, repères, étage..."
                        multiline
                        minRows={2}
                        maxRows={4}
                        value={instructions}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInstructions(e.target.value)}
                        sx={{ ...inputSx, gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}
                      />
                    </ClientOnly>
                  </Box>
                </Box>
              )}

              {/* Section 3: Méthode de paiement */}
              <Box sx={sectionSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 2, sm: 3 } }}>
                  <PaymentOutlined sx={{ color: brandBlue, fontSize: { xs: 24, sm: 27.5 } }} />
                  <Typography variant={{ xs: 'subtitle1', sm: 'h6' }} fontWeight={700}>Mode de paiement</Typography>
                </Box>

                <Box
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    border: '2px solid',
                    borderColor: brandBlue,
                    borderRadius: 3,
                    bgcolor: alpha(brandBlue, 0.06),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: brandBlue,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                      Paiement en ligne sécurisé
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.6 }}>
                    Vous serez redirigé vers PayTech pour choisir votre moyen de paiement.
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      Wave
                    </Typography>
                    <Typography variant="caption" color="text.secondary">•</Typography>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      Orange Money
                    </Typography>
                    <Typography variant="caption" color="text.secondary">•</Typography>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      Carte bancaire
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            </Stack>
          </Box>

          {/* Récapitulatif sticky */}
            <Box>
            <Box
              sx={{
                ...sectionSx,
                position: 'sticky',
                top: 100,
                maxHeight: 'calc(100vh - 140px)',
                overflow: 'auto',
                pr: { xs: 0, sm: 0 },
              }}
              aria-live="polite"
            >
              <Typography variant={{ xs: 'subtitle1', sm: 'h6' }} fontWeight={700} sx={{ mb: { xs: 2, sm: 3 } }}>
                Récapitulatif
              </Typography>
              <Stack spacing={2.5}>
                {items.filter((i) => i.product).map((item) => {
                  if (!item.product) return null;
                  const price =
                    item.price_type === 'wholesale' ? item.product.wholesale_price : item.product.price;
                  const totalPrice = (price || 0) * item.quantity;
                  return (
                    <Box key={item.id || item.product.id} sx={{ display: 'flex', gap: 2 }}>
                        <Box
                        sx={{
                          width: { xs: 55, sm: 70 },
                          height: { xs: 55, sm: 70 },
                          borderRadius: 2,
                          overflow: 'hidden',
                          bgcolor: 'action.hover',
                          flexShrink: 0,
                          border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                        }}
                      >
                        <ImageWithFallback
                          src={getImageUrl(item.product.cover_image_url || item.product.images?.[0]?.image_url)}
                          alt={item.product.name || 'Produit'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Typography variant={{ xs: 'caption', sm: 'body2' }} fontWeight={600} noWrap sx={{ mb: 0.5 }}>
                          {item.product.name || `Produit #${item.product_id}`}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant={{ xs: 'caption', sm: 'caption' }} color="text.secondary">
                            {item.quantity} x {formatFcfa(price || 0)}
                          </Typography>
                          <Typography variant={{ xs: 'caption', sm: 'body2' }} fontWeight={700} color="primary">
                            {formatFcfa(totalPrice)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Sous-total</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatFcfa(subtotal)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {deliveryMode === 'store_pickup' ? 'Retrait' : 'Livraison'}
                  </Typography>
                  <Chip
                    label={displayDeliveryFee === 0 ? 'Gratuite' : formatFcfa(displayDeliveryFee)}
                    size="small"
                    sx={{
                      height: 27.5,
                      fontSize: 13.75,
                      fontWeight: 600,
                      bgcolor: displayDeliveryFee === 0 ? alpha(theme.palette.success.main, 0.1) : alpha(brandBlue, 0.1),
                      color: displayDeliveryFee === 0 ? 'success.main' : brandBlue,
                      border: 'none',
                    }}
                  />
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight={800}>Total</Typography>
                  <Typography variant="subtitle1" fontWeight={800} color="primary">
                    {formatFcfa(displayTotal)}
                  </Typography>
                </Box>

                <Box>
                  {error && (
                      <Box sx={{ mb: 2, p: 2, bgcolor: alpha(theme.palette.error.main, 0.08), borderRadius: 2, border: `1px solid ${alpha(theme.palette.error.main, 0.15)}` }} role="alert">
                        <Typography variant="body2" color="error" fontWeight={500}>{error}</Typography>
                      </Box>
                    )}
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handlePlaceOrder}
                    disabled={isProcessing || !isFormValid}
                    endIcon={isProcessing ? undefined : <ArrowForward />}
                      sx={{
                        borderRadius: 2,
                        py: { xs: 1.4, sm: 1.6 },
                        fontWeight: 700,
                        fontSize: { xs: 15, sm: 18.75 },
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.28)}`,
                      '&:disabled': { opacity: 0.65 },
                      '&:focus-visible': { outline: `3px solid ${alpha(theme.palette.primary.main, 0.18)}`, outlineOffset: 3 },
                    }}
                  >
                    {isProcessing ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} color="inherit" />
                        {stage === 'creating_order'
                          ? 'Création de votre commande...'
                          : stage === 'initializing_payment'
                            ? 'Initialisation du paiement sécurisé...'
                            : stage === 'redirecting_to_paytech'
                              ? 'Redirection vers PayTech...'
                              : 'Traitement...'}
                      </Box>
                    ) : !isFormValid ? (
                      'Remplissez les champs obligatoires'
                    ) : orderMode ? (
                      'Reprendre le paiement'
                    ) : (
                      'Confirmer la commande'
                    )}
                  </Button>
                </Box>

                <Typography variant={{ xs: 'caption', sm: 'caption' }} align="center" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5, fontSize: { xs: 11, sm: 12 } }}>
                  En passant commande, vous acceptez nos conditions de vente
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
