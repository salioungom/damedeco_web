'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Box, Container, Typography, Button, CircularProgress, Alert, alpha, useTheme } from '@mui/material';
import {
  ErrorOutlined as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  ShoppingBag as ShoppingBagIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import OrderService, { Payment } from '@/services/order.service';
import { ApiErrorHandler } from '@/lib/error-handler';
import { resolveCancelPhase, wasPaymentConfirmed } from '@/lib/payment-status';

/**
 * Parcours d'annulation PayTech.
 *
 * Une annulation (callback /payment/cancel du backend) ne doit PAS être
 * transformée visuellement en succès : cette page affiche une annulation et
 * ne redirige jamais vers /checkout/success. Une vérification API optionnelle
 * et non bloquante permet toutefois d'afficher le statut réel si le backend
 * confirme déjà le paiement (IPN) — sans navigation.
 *
 * Une COMMANDE annulée (order.status = cancelled) est distincte d'une
 * annulation de paiement : elle est affichée comme telle et ne propose aucun
 * « Réessayer le paiement ». À l'inverse, sale_canceled laisse la commande
 * active et le retry possible.
 */
type CancelPhase = 'verifying' | 'cancelled' | 'pending' | 'paid' | 'order_cancelled' | 'order_refunded' | 'unknown';

function CheckoutCancelInner() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawOrderId = searchParams.get('orderId') || searchParams.get('order_id');
  // Seul un identifiant numérique est transmis à l'API ; sinon on ne vérifie rien.
  const isValidOrderId = typeof rawOrderId === 'string' && /^\d+$/.test(rawOrderId);
  const orderId = isValidOrderId ? rawOrderId : null;

  const checkedRef = useRef(false);
  const [phase, setPhase] = useState<CancelPhase>(orderId ? 'verifying' : 'cancelled');
  const [note, setNote] = useState<string | null>(null);
  // §6 : commande annulée MAIS paiement confirmé → afficher « Paiement effectué ».
  const [wasPaidConfirmed, setWasPaidConfirmed] = useState(false);

  useEffect(() => {
    if (!orderId || checkedRef.current) return;
    checkedRef.current = true;

    // Vérification unique, en lecture seule (jamais de deuxième paiement).
    const verify = async () => {
      try {
        const order = await OrderService.getOrderDetails(orderId);
        let payments: Payment[] = [];
        try {
          payments = await OrderService.getOrderPayments(orderId);
        } catch {
          // Les paiements sont informatifs : leur échec n'est pas bloquant.
        }

        // Une commande annulée/remboursée est un état final : affichée comme
        // telle, sans retry. Un paiement confirmé reste « payé ». Une simple
        // annulation de paiement laisse la commande active.
        const resolved = resolveCancelPhase({
          orderStatus: order.status,
          paymentStatus: order.payment_status,
          payments,
        });
        setPhase(resolved);
        if (resolved === 'order_cancelled' || resolved === 'order_refunded') {
          setWasPaidConfirmed(
            wasPaymentConfirmed({ paymentStatus: order.payment_status, payments }),
          );
        }
      } catch (err) {
        // Timeout/réseau : résultat inconnu, jamais interprété comme paiement échoué.
        setPhase('unknown');
        const classified = ApiErrorHandler.classifyError(err);
        if (classified.status === 404) {
          setNote('Commande introuvable. Vérifiez la référence de votre commande.');
        } else if (classified.status === 403) {
          setNote("Vous n'avez pas accès à cette commande.");
        }
      }
    };

    verify();
  }, [orderId]);

  if (phase === 'verifying') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  const isPaid = phase === 'paid';
  const isOrderFinal = phase === 'order_cancelled' || phase === 'order_refunded';
  const accent = isPaid
    ? theme.palette.success.main
    : isOrderFinal
      ? theme.palette.error.main
      : theme.palette.warning.main;

  const title =
    isPaid
      ? 'Paiement confirmé'
      : phase === 'order_cancelled'
        ? 'Commande annulée'
        : phase === 'order_refunded'
          ? 'Commande remboursée'
          : 'Paiement interrompu';

  const description =
    phase === 'paid'
      ? 'Votre commande a bien été payée et enregistrée. Vous pouvez suivre son statut depuis vos commandes.'
      : phase === 'pending'
        ? 'Votre paiement a été interrompu ou est encore en cours de traitement. Si un montant a été débité, il sera remboursé automatiquement.'
        : phase === 'unknown'
          ? "Nous n'avons pas pu vérifier le statut de votre paiement. Si un montant a été débité, il sera automatiquement remboursé. Vérifiez vos commandes avant de réessayer."
          : phase === 'order_cancelled'
            ? 'Cette commande a été annulée et ne peut plus être payée ni relancée.'
            : phase === 'order_refunded'
              ? 'Cette commande a été remboursée et ne peut plus être payée.'
              : 'Votre paiement n\'a pas été finalisé. Si un montant a été débité, il sera automatiquement remboursé. Vous pouvez reprendre le paiement depuis vos commandes.';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="sm" sx={{ pt: 14, pb: 8 }}>
        <Box
          sx={{
            textAlign: 'center',
            py: { xs: 6, md: 8 },
            px: { xs: 3, md: 5 },
            borderRadius: 4,
            border: `1px solid ${alpha(accent, 0.15)}`,
            background: `linear-gradient(135deg, ${alpha(accent, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
          }}
        >
          <Box
            sx={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              mx: 'auto',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(accent, 0.1),
            }}
          >
            {isPaid ? (
              <CheckCircleIcon sx={{ fontSize: 48, color: accent }} />
            ) : (
              <ErrorIcon sx={{ fontSize: 48, color: accent }} />
            )}
          </Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
            {description}
          </Typography>

          {!orderId && (
            <Alert severity="info" variant="outlined" sx={{ mb: 4, textAlign: 'left' }}>
              Référence de commande introuvable ou invalide. Consultez vos commandes pour reprendre le paiement.
            </Alert>
          )}

          {phase === 'pending' && (
            <Alert severity="warning" variant="outlined" sx={{ mb: 4, textAlign: 'left' }}>
              Votre paiement est encore en cours de confirmation. Consultez le statut de votre commande
              avant de relancer un paiement.
            </Alert>
          )}

          {phase === 'unknown' && (
            <Alert severity="info" variant="outlined" sx={{ mb: 4, textAlign: 'left' }}>
              Résultat inconnu : vérifiez le statut de votre commande dans vos commandes avant de
              réessayer. Aucun paiement ne sera relancé automatiquement.
            </Alert>
          )}

          {isOrderFinal && wasPaidConfirmed && (
            <Alert severity="info" variant="outlined" sx={{ mb: 4, textAlign: 'left' }}>
              Paiement effectué : le montant réglé reste acquis à cette commande.
            </Alert>
          )}

          {isOrderFinal && (
            <Alert severity="warning" variant="outlined" sx={{ mb: 4, textAlign: 'left' }}>
              {phase === 'order_refunded'
                ? 'La commande et le paiement ont été remboursés. Aucun paiement ne peut être relancé.'
                : 'Aucun paiement ne peut être relancé pour une commande annulée.'}
            </Alert>
          )}

          {note && (
            <Alert severity="error" variant="outlined" sx={{ mb: 4, textAlign: 'left' }}>
              {note}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            {!isPaid && !isOrderFinal && orderId && (
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push(`/checkout/finalize?orderId=${encodeURIComponent(orderId)}`)}
                startIcon={<RefreshIcon />}
                sx={{ flex: 1, borderRadius: 2, py: 1.5, fontWeight: 700 }}
              >
                Réessayer le paiement
              </Button>
            )}
            <Button
              variant={isPaid ? 'contained' : 'outlined'}
              size="large"
              onClick={() => router.push('/account/orders')}
              startIcon={<ShoppingBagIcon />}
              sx={{ flex: 1, borderRadius: 2, py: 1.5, fontWeight: 600 }}
            >
              Voir mes commandes
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push('/')}
              sx={{ flex: 1, borderRadius: 2, py: 1.5, fontWeight: 600 }}
            >
              Continuer mes achats
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={48} />
        </Box>
      }
    >
      <CheckoutCancelInner />
    </Suspense>
  );
}