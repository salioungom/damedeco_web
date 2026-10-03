'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    CircularProgress,
    Alert,
    useTheme,
    alpha,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    ShoppingBag as ShoppingBagIcon,
    ArrowForward as ArrowForwardIcon,
    StoreOutlined,
    HourglassEmpty as HourglassIcon,
    ErrorOutlined as ErrorIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import OrderService, { Payment } from '@/services/order.service';
import { ApiErrorHandler } from '@/lib/error-handler';
import { resolveSuccessPhase, wasPaymentConfirmed } from '@/lib/payment-status';
import { useStore } from '@/store/useStore';

type Phase = 'checking' | 'paid' | 'pending' | 'failed' | 'error' | 'order_cancelled' | 'order_refunded';

const MAX_ATTEMPTS = 6;
const POLL_INTERVAL_MS = 2000;

function OrderConfirmationInner() {
    const theme = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');

    const clearCart = useStore((s) => s.clearCart);

    const [phase, setPhase] = useState<Phase>('checking');
    const [error, setError] = useState<string | null>(null);
    const [confirmedPayment, setConfirmedPayment] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const cartClearedRef = useRef(false);

    const brandBlue = theme.palette.primary.main;

    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;

        const run = async (attempt: number) => {
            if (!orderId) {
                setPhase('error');
                setError('Référence de commande manquante.');
                return;
            }

            try {
                const order = await OrderService.getOrderDetails(orderId);

                let payments: Payment[] = [];
                try {
                    payments = await OrderService.getOrderPayments(orderId);
                } catch {
                    // Les paiements sont informatifs : leur récupération ne bloque pas la vérification.
                }

                if (cancelled) return;

                // Le retour sur cette page n'est PAS une preuve de paiement :
                // seule la confirmation du backend (statut du paiement courant) compte.
                // Un ancien paiement annulé/échoué/expiré ne domine jamais un
                // paiement plus récent (pending/processing/completed).
                const phase = resolveSuccessPhase({
                    orderStatus: order.status,
                    paymentStatus: order.payment_status,
                    payments,
                });

                if (phase === 'paid') {
                    if (!cartClearedRef.current) {
                        cartClearedRef.current = true;
                        // Vidage uniquement lorsque le backend confirme le paiement.
                        clearCart();
                    }
                    setPhase('paid');
                    return;
                }

                if (phase === 'order_cancelled' || phase === 'order_refunded') {
                    setConfirmedPayment(
                        wasPaymentConfirmed({
                            paymentStatus: order.payment_status,
                            payments,
                        }),
                    );
                    setPhase(phase);
                    return;
                }

                if (phase === 'failed') {
                    setPhase('failed');
                    return;
                }

                // pending / processing / résultat inconnu : on interroge jusqu'à
                // la confirmation backend ; sinon « vérification en cours ».
                if (attempt < MAX_ATTEMPTS) {
                    timer = setTimeout(() => run(attempt + 1), POLL_INTERVAL_MS);
                } else {
                    setPhase('pending');
                }
            } catch (err) {
                if (cancelled) return;

                const classified = ApiErrorHandler.classifyError(err);
                // Commande introuvable : c'est une erreur définitive, inutile de continuer à interroger.
                if (classified.status === 404) {
                    setPhase('error');
                    setError('Commande introuvable. Vérifiez la référence de votre commande.');
                    return;
                }

                if (attempt < MAX_ATTEMPTS) {
                    timer = setTimeout(() => run(attempt + 1), POLL_INTERVAL_MS);
                } else {
                    setPhase('error');
                    // Timeout/réseau : résultat inconnu, jamais interprété comme paiement échoué.
                    setError(ApiErrorHandler.getOrderError(err, 'check'));
                }
            }
        };

        run(0);

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
        };
    }, [orderId, clearCart, retryKey]);

    if (phase === 'checking') {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={56} sx={{ color: brandBlue }} />
                    <Typography variant="h6" fontWeight={600} sx={{ mt: 3, color: 'text.secondary' }}>
                        Vérification de votre paiement...
                    </Typography>
                </Box>
            </Box>
        );
    }

    const isSuccess = phase === 'paid';
    const isOrderFinal = phase === 'order_cancelled' || phase === 'order_refunded';
    const accent = isSuccess
        ? theme.palette.success.main
        : isOrderFinal || phase === 'failed' || phase === 'error'
          ? theme.palette.error.main
          : theme.palette.warning.main;

    const title =
        phase === 'paid'
            ? 'Paiement confirmé'
            : phase === 'failed'
              ? 'Paiement échoué'
              : phase === 'error'
                ? 'Vérification impossible'
                : phase === 'order_cancelled'
                  ? 'Commande annulée'
                  : phase === 'order_refunded'
                    ? 'Commande remboursée'
                    : 'Paiement en cours de vérification';

    const description =
        phase === 'paid'
            ? 'Votre commande a bien été payée et enregistrée.'
            : phase === 'failed'
              ? 'Le paiement n\'a pas abouti. Aucun montant n\'a été débité définitivement.'
              : phase === 'error'
                ? error || 'Nous n\'avons pas pu vérifier le statut de votre paiement.'
                : phase === 'order_cancelled'
                  ? 'Cette commande a été annulée et ne peut plus être payée ni relancée.'
                  : phase === 'order_refunded'
                    ? 'Cette commande a été remboursée et ne peut plus être payée.'
                    : 'Votre paiement est en cours de traitement. La confirmation définitive interviendra dès réception de la validation du service de paiement.';

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Container maxWidth="sm" sx={{ pt: 14, pb: 8 }}>
                <Box
                    sx={{
                        textAlign: 'center',
                        py: { xs: 6, md: 8 },
                        px: { xs: 3, md: 5 },
                        borderRadius: 4,
                        background: `linear-gradient(135deg, ${alpha(accent, 0.06)} 0%, ${alpha(brandBlue, 0.04)} 100%)`,
                        border: `1px solid ${alpha(accent, 0.15)}`,
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
                        {phase === 'paid' && <CheckCircleIcon sx={{ fontSize: 48, color: accent }} />}
                        {phase === 'pending' && <HourglassIcon sx={{ fontSize: 48, color: accent }} />}
                        {(phase === 'failed' || phase === 'error' || isOrderFinal) && (
                            <ErrorIcon sx={{ fontSize: 48, color: accent }} />
                        )}
                    </Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: phase === 'paid' ? 1 : 4, lineHeight: 1.7 }}>
                        {description}
                    </Typography>
                    {orderId && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                            Référence commande : <strong>#{orderId}</strong>
                        </Typography>
                    )}

                    {isSuccess && (
                        <Box
                            sx={{
                                textAlign: 'left',
                                p: 3,
                                mb: 4,
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                                bgcolor: alpha(theme.palette.common.white, 0.6),
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                <StoreOutlined sx={{ color: brandBlue, fontSize: 22 }} />
                                <Typography variant="subtitle1" fontWeight={700}>
                                    Prochaines étapes
                                </Typography>
                            </Box>
                            {[
                                'Confirmation de votre commande par email',
                                'Préparation de vos articles',
                                'Expédition vers votre adresse',
                                'Livraison et suivi de votre colis',
                            ].map((step, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: i < 3 ? 1.5 : 0 }}>
                                    <Box
                                        sx={{
                                            width: 26,
                                            height: 26,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: alpha(brandBlue, 0.1),
                                            color: brandBlue,
                                            fontSize: 12,
                                            fontWeight: 700,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {i + 1}
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">{step}</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}

                    {phase === 'pending' && (
                        <Alert severity="warning" variant="outlined" sx={{ mb: 4, textAlign: 'left' }}>
                            Le service de paiement n'a pas encore confirmé la transaction. Vous pouvez consulter
                            le statut de votre commande à tout moment dans votre espace.
                        </Alert>
                    )}

                    {isOrderFinal && confirmedPayment && (
                        <Alert severity="info" variant="outlined" sx={{ mb: 4, textAlign: 'left' }}>
                            Le paiement a bien été reçu. La commande a ensuite été {phase === 'order_refunded' ? 'remboursée et annulée' : 'annulée'}.
                        </Alert>
                    )}

                    {isOrderFinal && (
                        <Alert severity="warning" variant="outlined" sx={{ mb: 4, textAlign: 'left' }}>
                            {phase === 'order_refunded'
                                ? 'Le paiement et la commande ont été remboursés. Aucun paiement ne peut être relancé.'
                                : 'Aucun paiement ne peut être relancé pour une commande annulée.'}
                        </Alert>
                    )}

                    {phase === 'error' && error && (
                        <Alert severity="error" variant="outlined" sx={{ mb: 4, textAlign: 'left' }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        {phase === 'paid' && (
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => router.push('/account/orders')}
                                startIcon={<ShoppingBagIcon />}
                                sx={{
                                    flex: 1,
                                    borderRadius: 2,
                                    py: 1.5,
                                    fontWeight: 700,
                                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                                }}
                            >
                                Voir mes commandes
                            </Button>
                        )}

                        {phase === 'pending' && (
                            <>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => {
                                        setPhase('checking');
                                        setError(null);
                                        setConfirmedPayment(false);
                                        setRetryKey((k) => k + 1);
                                    }}
                                    startIcon={<RefreshIcon />}
                                    sx={{ flex: 1, borderRadius: 2, py: 1.5, fontWeight: 700 }}
                                >
                                    Vérifier à nouveau
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    onClick={() => router.push('/account/orders')}
                                    startIcon={<ShoppingBagIcon />}
                                    sx={{ flex: 1, borderRadius: 2, py: 1.5, fontWeight: 600 }}
                                >
                                    Voir mes commandes
                                </Button>
                            </>
                        )}

                        {phase === 'failed' && orderId && (
                            <Button
                                variant="contained"
                                size="large"
                                color="error"
                                onClick={() => router.push(`/checkout/finalize?orderId=${orderId}`)}
                                startIcon={<RefreshIcon />}
                                sx={{ flex: 1, borderRadius: 2, py: 1.5, fontWeight: 700 }}
                            >
                                Réessayer le paiement
                            </Button>
                        )}

                        {phase === 'error' && (
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => window.location.reload()}
                                startIcon={<RefreshIcon />}
                                sx={{ flex: 1, borderRadius: 2, py: 1.5, fontWeight: 700 }}
                            >
                                Réessayer
                            </Button>
                        )}

                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => router.push('/')}
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                                flex: 1,
                                borderRadius: 2,
                                py: 1.5,
                                fontWeight: 600,
                                borderColor: alpha(theme.palette.divider, 0.8),
                            }}
                        >
                            Continuer mes achats
                        </Button>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}

export default function OrderConfirmationPage() {
    return (
        <Suspense
            fallback={
                <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress size={56} />
                    </Box>
                </Box>
            }
        >
            <OrderConfirmationInner />
        </Suspense>
    );
}
