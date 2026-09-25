'use client';

import { RequireRole } from '@/components/RequireRole';
import { useAuth } from '@/contexts/AuthContext';
import {
    Typography,
    Container,
    Paper,
    Box,
    Chip,
    CircularProgress,
    Alert,
    Button,
    Divider,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Avatar,
    IconButton,
    Stepper,
    Step,
    StepLabel,
    StepConnector,
    Breadcrumbs,
    Link,
    Stack,
    Snackbar,
    Tooltip,
    Zoom,
    Fade,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    LocalShipping as ShippingIcon,
    Payment as PaymentIcon,
    ShoppingCart as CartIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Schedule as PendingIcon,
    AccessTime as ScheduleIcon,
    LocalOffer as ProductIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    Home as HomeIcon,
    Remove as RemoveIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Check as CheckIcon,
    CreditCard as CreditCardIcon,
    AccountBalance as BankIcon,
    KeyboardArrowRight as ChevronRightIcon,
    Receipt as ReceiptIcon,
    Info as InfoIcon,
    Replay as ReplayIcon,
    HourglassTop as HourglassTopIcon,
    ErrorOutlined as ErrorOutlineIcon,
} from '@mui/icons-material';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import OrderService, { ORDER_STATUS } from '@/services/order.service';
import { OrderResponse, Payment } from '@/services/order.service';
import { ApiErrorHandler } from '@/lib/error-handler';
import {
    getOrderActions,
    getOrderStatusLabel,
    getPaymentDisplayLabel,
    getPayActionLabel,
    PAYMENT_DISPLAY_TONE,
    PaymentDisplayState,
    resolvePaymentDisplayState,
} from '@/lib/payment-status';
import { getImageUrl } from '@/lib/imageUtils';
import { getPaymentMethodLabel } from '@/lib/delivery';
import { stepConnectorClasses } from '@mui/material/StepConnector';
import { styled, useTheme, alpha } from '@mui/material/styles';

interface ProductWithImage {
    id: number;
    name: string;
    sku: string;
    cover_image_url?: string;
}

// Machine d'état Order : pending → processing → shipped → delivered.
// « confirmed » (legacy) n'a PAS sa place ici : les anciennes commandes sont
// repliées sur l'étape « Traitement » pour l'affichage uniquement.
const orderSteps = [
    { label: 'En attente', value: 'pending', icon: <PendingIcon /> },
    { label: 'Traitement', value: 'processing', icon: <ScheduleIcon /> },
    { label: 'Expédiée', value: 'shipped', icon: <ShippingIcon /> },
    { label: 'Livrée', value: 'delivered', icon: <CheckCircleIcon /> },
];

const ColorlibConnector = styled(StepConnector)(({ theme }: Record<string, any>) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
        top: 22,
    },
    [`& .${stepConnectorClasses.line}`]: {
        height: 3,
        border: 0,
        backgroundColor: theme.palette.grey[200],
        borderRadius: 1,
    },
    [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    },
    [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
        background: theme.palette.success.main,
    },
}));

function ColorlibStepIconRoot(props: { active?: boolean; completed?: boolean; children: React.ReactNode }) {
    const { active, completed, children } = props;
    const t = useTheme();
    return (
        <Box
            sx={{
                backgroundColor: t.palette.grey[200],
                zIndex: 1,
                color: t.palette.common.white,
                width: 46,
                height: 46,
                display: 'flex',
                borderRadius: '50%',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.3s ease',
                ...(active && {
                    background: `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
                    boxShadow: `0 4px 14px 0 ${alpha(t.palette.primary.main, 0.4)}`,
                }),
                ...(completed && {
                    backgroundColor: t.palette.success.main,
                    boxShadow: `0 4px 14px 0 ${alpha(t.palette.success.main, 0.4)}`,
                }),
            }}
        >
            {children}
        </Box>
    );
}

function ColorlibStepIcon(props: { active?: boolean; completed?: boolean; icon?: number }) {
    const { active, completed, icon } = props;
    const step = orderSteps[(icon as number) - 1];

    return (
        <ColorlibStepIconRoot active={active} completed={completed}>
            {step?.icon}
        </ColorlibStepIconRoot>
    );
}

function getCurrentStep(status: string): number {
    // « confirmed » (legacy) est replié sur l'étape « Traitement » sans être
    // réintroduit comme état actif de la machine.
    if (status === 'confirmed') {
        return orderSteps.findIndex(s => s.value === 'processing') + 1;
    }
    const idx = orderSteps.findIndex(s => s.value === status);
    return idx >= 0 ? idx + 1 : 1;
}

function getPaymentMethodIcon(method?: string | null) {
    switch (method?.toLowerCase()) {
        case 'wave':
            return <BankIcon />;
        case 'orange_money':
            return <PhoneIcon />;
        case 'card':
            return <CreditCardIcon />;
        default:
            return <PaymentIcon />;
    }
}

function OrderDetailContent() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const theme = useTheme();
    const orderId = params.id as string;

    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [paymentsError, setPaymentsError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [errorStatus, setErrorStatus] = useState<number | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [paying, setPaying] = useState(false);
    const [saving, setSaving] = useState(false);
    const validatingRef = useRef(false);
    const [confirmDeliveryDialogOpen, setConfirmDeliveryDialogOpen] = useState(false);
    const [confirmingDelivery, setConfirmingDelivery] = useState(false);
    const [confirmDeliveryError, setConfirmDeliveryError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingQuantities, setEditingQuantities] = useState<{ [key: number]: number }>({});
    const [modifications, setModifications] = useState<Array<{
        action: 'add' | 'remove' | 'update';
        product_id: number;
        quantity?: number;
        unit_price?: number;
    }>>([]);

    // Décision centralisée (payment-status.ts) : le backend reste l'autorité
    // finale. Seule une session PayTech live (processing) verrouille le
    // paiement ; `pending` reste payable (matrice : nouvelle commande payable).
    const orderActions = order
        ? getOrderActions({ orderStatus: order.status, paymentStatus: order.payment_status, payments })
        : null;
    const paymentBlocked = orderActions?.isPaymentProcessing ?? false;

    const fetchOrderDetails = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const orderData = await OrderService.getOrderDetails(orderId);
            setOrder(orderData);

            try {
                const paymentsData = await OrderService.getOrderPayments(orderId);
                setPayments(paymentsData);
                setPaymentsError(null);
            } catch (paymentError) {
                const paymentErrorState = paymentError as { cause?: { message?: string }; response?: { data?: { detail?: string } } } | null | undefined;
                const responseDetail = paymentErrorState?.response?.data?.detail;
                const causeMessage = paymentErrorState?.cause?.message;
                setPayments([]);
                setPaymentsError(responseDetail ?? causeMessage ?? 'Impossible de récupérer les paiements.');
                console.warn('Impossible de récupérer les paiements:', paymentError);
            }
        } catch (err) {
            const classified = ApiErrorHandler.classifyError(err);
            setError(ApiErrorHandler.getOrderError(err, 'load'));
            setErrorStatus(classified.status ?? null);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId, fetchOrderDetails]);

    const handleCancelOrder = async () => {
        if (!order) return;
        try {
            setCancelling(true);
            await OrderService.cancelCustomerOrder(order.id);
            setSuccess('Commande annulée avec succès');
            await fetchOrderDetails();
        } catch (error) {
            console.error('Erreur lors de l\'annulation:', error);
            setError('Impossible d\'annuler la commande. Veuillez réessayer.');
        } finally {
            setCancelling(false);
        }
    };

    const handleConfirmDelivery = async () => {
        if (!order || confirmingDelivery) return;
        setConfirmingDelivery(true);
        setConfirmDeliveryError(null);
        try {
            const updated = await OrderService.confirmDelivery(order.id);
            setOrder(updated);
            setConfirmDeliveryDialogOpen(false);
            setSuccess('Réception confirmée : votre commande est marquée comme livrée.');
        } catch (error) {
            console.error('Erreur lors de la confirmation de réception:', error);
            setConfirmDeliveryError(error instanceof Error ? error.message : 'Impossible de confirmer la réception. Veuillez réessayer.');
        } finally {
            setConfirmingDelivery(false);
        }
    };

    const handleValidateOrder = async () => {
        if (!order) return;
        // Commande déjà réglée : ne jamais relancer un paiement (pending+paid =
        // commande PAYÉE en attente de traitement, cf. matrice).
        if (orderActions?.isPaid) {
            router.push(`/checkout/success?orderId=${order.id}`);
            return;
        }
        // Une session PayTech est live : ne pas en déclencher une seconde.
        if (orderActions?.isPaymentProcessing) {
            setError('Un paiement est déjà en cours pour cette commande. Attendez sa confirmation avant d\'en relancer un.');
            return;
        }
        // Garde synchrone contre un double clic avant le re-render de `paying`.
        if (validatingRef.current) return;
        validatingRef.current = true;
        try {
            setPaying(true);
            // Le backend exige order_id et renvoie l'URL de redirection PayTech.
            const paymentResp = await OrderService.initiatePayment(order.id);
            const redirectUrl = paymentResp?.redirect_url;
            if (!redirectUrl) {
                setError(paymentResp?.message || 'Le paiement n\'a pas fourni d\'URL de redirection.');
                validatingRef.current = false;
                return;
            }
            setSuccess('Redirection vers la page de paiement sécurisée...');
            window.location.href = redirectUrl;
        } catch (error) {
            console.error('Erreur lors de la validation:', error);
            // 403/404 → messages distincts ; timeout/réseau → résultat inconnu, jamais « paiement échoué ».
            setError(ApiErrorHandler.getOrderError(error, 'pay'));
            validatingRef.current = false;
        } finally {
            setPaying(false);
        }
    };

    const handleBack = () => {
        router.push('/account/orders');
    };

    const handleStartEditing = () => {
        setIsEditing(true);
        setModifications([]);
        if (order?.items) {
            const quantities: { [key: number]: number } = {};
            order.items.forEach(item => {
                quantities[item.id] = item.quantity;
            });
            setEditingQuantities(quantities);
        }
    };

    const handleCancelEditing = () => {
        setIsEditing(false);
        setEditingQuantities({});
        setModifications([]);
    };

    const handleQuantityChange = (itemId: number, newQuantity: number) => {
        if (newQuantity < 1) return;
        const oldQuantity = editingQuantities[itemId] || 0;
        setEditingQuantities(prev => ({
            ...prev,
            [itemId]: newQuantity
        }));

        const item = order?.items.find(i => i.id === itemId);
        if (item) {
            setModifications(prev => {
                const filtered = prev.filter(mod => mod.product_id !== item.product_id);
                if (newQuantity !== item.quantity) {
                    return [...filtered, {
                        action: 'update',
                        product_id: item.product_id,
                        quantity: newQuantity,
                        unit_price: parseFloat(item.unit_price)
                    }];
                }
                return filtered;
            });
        }
    };

    const handleRemoveItem = (itemId: number) => {
        const item = order?.items.find(i => i.id === itemId);
        if (item) {
            setModifications(prev => [
                ...prev.filter(mod => mod.product_id !== item.product_id),
                { action: 'remove', product_id: item.product_id }
            ]);

            if (order?.items) {
                const updatedItems = order.items.filter(i => i.id !== itemId);
                setOrder({ ...order, items: updatedItems });
            }

            const newQuantities = { ...editingQuantities };
            delete newQuantities[itemId];
            setEditingQuantities(newQuantities);
        }
    };

    const handleSaveOrder = async () => {
        if (!order || modifications.length === 0) {
            setError('Aucune modification à sauvegarder.');
            return;
        }

        try {
            setSaving(true);
            const { isAuthenticated } = await import('@/lib/authUtils');

            if (!isAuthenticated()) {
                setError('Votre session a expiré. Veuillez vous reconnecter.');
                setTimeout(() => {
                    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                }, 2000);
                return;
            }

            const updatedOrder = await OrderService.modifyOrder(order.id, modifications);
            setOrder(updatedOrder);
            setIsEditing(false);
            setEditingQuantities({});
            setModifications([]);
            setSuccess('Commande modifiée avec succès !');
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            const errorMessage = error instanceof Error ? error.message : 'Impossible de modifier la commande. Veuillez réessayer.';
            if (errorMessage.includes('reconnecter') || errorMessage.includes('session a expiré')) {
                setError(errorMessage);
                setTimeout(() => {
                    setError(null);
                    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                }, 3000);
            } else {
                setError(errorMessage);
            }
        } finally {
            setSaving(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered':
                return <CheckCircleIcon />;
            case 'cancelled':
                return <CancelIcon />;
            case 'pending':
                return <PendingIcon />;
            case 'processing':
            case 'confirmed':
            case 'shipped':
                return <ShippingIcon />;
            default:
                return <ScheduleIcon />;
        }
    };

    const getPaymentStatusIcon = (status: string) => {
        switch (status) {
            case 'paid':
            case 'completed':
                return <CheckCircleIcon />;
            case 'failed':
            case 'cancelled':
            case 'expired':
                return <CancelIcon />;
            case 'refunded':
                return <ReplayIcon />;
            default:
                return <PendingIcon />;
        }
    };

    const getPaymentDisplayIcon = (state: PaymentDisplayState) => {
        switch (state) {
            case 'paid':
                return <CheckCircleIcon />;
            case 'payment_processing':
                return <HourglassTopIcon />;
            case 'payment_failed':
                return <ErrorOutlineIcon />;
            case 'payment_cancelled':
                return <CancelIcon />;
            case 'refunded':
                return <ReplayIcon />;
            case 'anomaly':
                return <ErrorOutlineIcon />;
            case 'unpaid':
            default:
                return <PendingIcon />;
        }
    };

    const paymentDisplay = order
        ? resolvePaymentDisplayState({ orderStatus: order.status, paymentStatus: order.payment_status, payments })
        : undefined;
    const payActionLabel = paymentDisplay ? getPayActionLabel(paymentDisplay) : 'Payer la commande';

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12 }}>
                    <CircularProgress size={48} sx={{ mb: 3 }} />
                    <Typography variant="body1" color="text.secondary">
                        Chargement de la commande...
                    </Typography>
                </Box>
            </Container>
        );
    }

    if (error && !order) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Fade in>
                    <Paper
                        sx={{
                            p: 6,
                            textAlign: 'center',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'error.light',
                            bgcolor: alpha(theme.palette.error.main, 0.03),
                        }}
                    >
                        <CancelIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            {errorStatus === 403 ? 'Accès refusé' : 'Commande introuvable'}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 480, mx: 'auto' }}>
                            {error || 'La commande que vous recherchez n\'existe pas ou a été supprimée.'}
                        </Typography>
                        <Button variant="contained" size="large" onClick={handleBack} startIcon={<ArrowBackIcon />}>
                            Retour aux commandes
                        </Button>
                    </Paper>
                </Fade>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: { xs: 1, sm: 2 }, mb: { xs: 2, sm: 4 } }}>
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                slots={{ transition: Zoom }}
            >
                <Alert onClose={() => setError(null)} severity="error" variant="outlined" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={4000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                slots={{ transition: Zoom }}
            >
                <Alert onClose={() => setSuccess(null)} severity="success" variant="filled" sx={{ width: '100%', borderRadius: 2, boxShadow: 3 }}>
                    {success}
                </Alert>
            </Snackbar>

            {/* Breadcrumbs */}
            <Breadcrumbs
                separator={<ChevronRightIcon fontSize="small" />}
                sx={{ mb: 2.5, '& .MuiBreadcrumbs-separator': { color: 'text.disabled' } }}
            >
                <Link
                    underline="hover"
                    color="text.secondary"
                    onClick={() => router.push('/account')}
                    sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500, fontSize: '0.875rem' }}
                >
                    <HomeIcon sx={{ fontSize: 16 }} />
                    Mon compte
                </Link>
                <Link
                    underline="hover"
                    color="text.secondary"
                    onClick={() => router.push('/account/orders')}
                    sx={{ cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}
                >
                    Mes commandes
                </Link>
                <Typography color="text.primary" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {order?.order_number || 'Détail'}
                </Typography>
            </Breadcrumbs>

            {/* Bouton de retour */}
            <Button
                variant="text"
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push('/account/orders')}
                sx={{
                    mb: 2,
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.06) },
                    fontWeight: 500,
                    fontSize: '0.875rem',
                }}
            >
                Retour aux commandes
            </Button>

            {/* En-tête avec statut */}
            <Paper
                sx={{
                    p: { xs: 3, sm: 4 },
                    mb: 4,
                    background: theme.palette.primary.dark,
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 3,
                }}
            >

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Grid container spacing={3} sx={{ alignItems: 'center' }}>
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 }, mb: 1.5 }}>
                                <Avatar
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.15)',
                                        width: { xs: 48, sm: 60 },
                                        height: { xs: 48, sm: 60 },
                                        backdropFilter: 'blur(8px)',
                                    }}
                                >
                                    <ReceiptIcon sx={{ fontSize: { xs: 24, sm: 30 } }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem' } }}>
                                        Commande {order?.order_number}
                                    </Typography>
                                    <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.25, fontSize: { xs: '0.8rem', sm: '0.95rem' } }}>
                                        Passée le {order && OrderService.formatDate(order.created_at)}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
                                <Chip
                                    icon={order && getStatusIcon(order.status)}
                                    label={order && getOrderStatusLabel({ orderStatus: order.status, paymentStatus: order.payment_status, payments })}
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.18)',
                                        color: 'white',
                                        fontWeight: 600,
                                        backdropFilter: 'blur(8px)',
                                        '& .MuiChip-icon': { color: 'white', fontSize: 16 },
                                        fontSize: '0.75rem',
                                        height: 28,
                                    }}
                                />
                                <Chip
                                    icon={order && paymentDisplay && getPaymentDisplayIcon(paymentDisplay)}
                                    label={order && paymentDisplay ? `Paiement : ${getPaymentDisplayLabel(paymentDisplay)}` : 'Paiement'}
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.18)',
                                        color: 'white',
                                        fontWeight: 600,
                                        backdropFilter: 'blur(8px)',
                                        '& .MuiChip-icon': { color: 'white', fontSize: 16 },
                                        fontSize: '0.75rem',
                                        height: 28,
                                    }}
                                />
                                {order && (
                                    <Chip
                                        icon={<CartIcon />}
                                        label={`${order.items?.length || 0} article${(order.items?.length || 0) > 1 ? 's' : ''}`}
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.18)',
                                            color: 'white',
                                            fontWeight: 600,
                                            backdropFilter: 'blur(8px)',
                                            '& .MuiChip-icon': { color: 'white', fontSize: 16 },
                                            fontSize: '0.75rem',
                                            height: 28,
                                        }}
                                    />
                                )}
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Box
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    borderRadius: 2,
                                    p: 2,
                                    backdropFilter: 'blur(8px)',
                                    textAlign: 'right',
                                }}
                            >
                                <Typography variant="caption" sx={{ opacity: 0.75, display: 'block', mb: 0.5 }}>
                                    Montant total
                                </Typography>
                                <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, lineHeight: 1.1 }}>
                                    {order && OrderService.formatAmount(order.total_amount, order.currency)}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>

            {/* Stepper de progression */}
            {order && order.status !== ORDER_STATUS.CANCELLED && order.status !== ORDER_STATUS.REFUNDED && (
                <Zoom in>
                    <Card sx={{ mb: 4, borderRadius: 3 }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                Progression de la commande
                            </Typography>
                            <Stepper
                                alternativeLabel
                                activeStep={getCurrentStep(order.status)}
                                connector={<ColorlibConnector />}
                                sx={{ pt: 1, '& .MuiStepLabel-label': { mt: 0.5, fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.8rem' } } }}
                            >
                                {orderSteps.map(step => (
                                    <Step key={step.value}>
                                        <StepLabel slots={{ stepIcon: ColorlibStepIcon }}>
                                            {step.label}
                                        </StepLabel>
                                    </Step>
                                ))}
                            </Stepper>
                        </CardContent>
                    </Card>
                </Zoom>
            )}

            {order?.status === ORDER_STATUS.CANCELLED && (
                <Zoom in>
                    <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.2), bgcolor: alpha(theme.palette.error.main, 0.04) }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: { xs: 2.5, sm: 3 } }}>
                            <CancelIcon sx={{ fontSize: 40, color: 'error.main' }} />
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight="bold" color="error" gutterBottom>
                                    Commande annulée
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Cette commande a été annulée et ne peut plus être modifiée.
                                </Typography>
                            </Box>
                            <Button variant="outlined" color="error" startIcon={<ArrowBackIcon />} onClick={() => router.push('/account/orders')} size="small">
                                Retour
                            </Button>
                        </CardContent>
                    </Card>
                </Zoom>
            )}

            <Grid container spacing={3}>
                {/* Articles de la commande */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
                        <CardHeader
                            avatar={
                                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                                    <CartIcon sx={{ fontSize: 20 }} />
                                </Avatar>
                            }
                            title={
                                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                                    Articles commandés ({order?.items?.length || 0})
                                </Typography>
                            }
                            subheader="Détails des produits de votre commande"
                            action={
                                orderActions?.canModify && (
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pr: 1 }}>
                                        {isEditing && modifications.length > 0 && (
                                            <Fade in>
                                                <Chip
                                                    label={`${modifications.length} modif.`}
                                                    size="small"
                                                    color="warning"
                                                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                                />
                                            </Fade>
                                        )}
                                        {!isEditing ? (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<ReceiptIcon />}
                                                onClick={handleStartEditing}
                                                sx={{ borderWidth: 1.5, fontWeight: 600 }}
                                            >
                                                Modifier
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                color="error"
                                                startIcon={<CancelIcon />}
                                                onClick={handleCancelEditing}
                                                sx={{ borderWidth: 1.5, fontWeight: 600 }}
                                            >
                                                Annuler
                                            </Button>
                                        )}
                                    </Box>
                                )
                            }
                            sx={{ '& .MuiCardHeader-action': { alignSelf: 'center', my: 0 } }}
                        />
                        <Divider />
                        <CardContent sx={{ p: 0 }}>
                            {order?.items?.map((item, index) => {
                                const isModified = isEditing && modifications.some(mod => mod.product_id === item.product_id);
                                return (
                                    <Box key={item.id}>
                                        <Box
                                            sx={{
                                                p: { xs: 2, sm: 2.5 },
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: { xs: 1.5, sm: 2.5 },
                                                bgcolor: isModified ? alpha(theme.palette.warning.main, 0.06) : 'transparent',
                                                borderLeft: isModified ? 3 : 0,
                                                borderColor: 'warning.main',
                                                transition: 'all 0.2s ease',
                                                '&:hover': { bgcolor: isModified ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.grey[500], 0.04) },
                                            }}
                                        >
                                            {(item.product as ProductWithImage).cover_image_url ? (
                                                <Box
                                                    sx={{
                                                        width: { xs: 56, sm: 72 },
                                                        height: { xs: 56, sm: 72 },
                                                        borderRadius: 2,
                                                        overflow: 'hidden',
                                                        border: '1px solid',
                                                        borderColor: 'grey.200',
                                                        flexShrink: 0,
                                                        bgcolor: 'grey.50',
                                                    }}
                                                >
                                                    <img
                                                        src={getImageUrl((item.product as ProductWithImage).cover_image_url!)}
                                                        alt={item.product.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={(e) => { e.currentTarget.src = '/placeholder-image.jpg'; }}
                                                    />
                                                </Box>
                                            ) : (
                                                <Avatar
                                                    sx={{
                                                        width: { xs: 56, sm: 72 },
                                                        height: { xs: 56, sm: 72 },
                                                        bgcolor: 'grey.100',
                                                        border: '1px solid',
                                                        borderColor: 'grey.200',
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    <ProductIcon sx={{ color: 'grey.600', fontSize: { xs: 24, sm: 32 } }} />
                                                </Avatar>
                                            )}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography variant="subtitle1" fontWeight="600" noWrap sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                                                        {item.product.name}
                                                    </Typography>
                                                    {isModified && (
                                                        <Zoom in>
                                                            <Chip
                                                                label="modifié"
                                                                size="small"
                                                                color="warning"
                                                                sx={{ fontSize: '0.6rem', height: 20, fontWeight: 700, flexShrink: 0 }}
                                                            />
                                                        </Zoom>
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center', flexWrap: 'wrap' }}>
                                                    {isEditing ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'grey.100', borderRadius: 2, px: 0.5 }}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleQuantityChange(item.id, (editingQuantities[item.id] || item.quantity) - 1)}
                                                                disabled={(editingQuantities[item.id] || item.quantity) <= 1}
                                                                sx={{ color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' } }}
                                                            >
                                                                <RemoveIcon fontSize="small" />
                                                            </IconButton>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    minWidth: 32,
                                                                    textAlign: 'center',
                                                                    fontWeight: 700,
                                                                    fontSize: '0.9rem',
                                                                }}
                                                            >
                                                                {editingQuantities[item.id] || item.quantity}
                                                            </Typography>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleQuantityChange(item.id, (editingQuantities[item.id] || item.quantity) + 1)}
                                                                sx={{ color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' } }}
                                                            >
                                                                <AddIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    ) : (
                                                        <Chip
                                                            label={`Qté: ${item.quantity}`}
                                                            size="small"
                                                            variant="outlined"
                                                            color="primary"
                                                            sx={{ fontWeight: 600, fontSize: '0.75rem', height: 26 }}
                                                        />
                                                    )}
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                                                        {OrderService.formatAmount(item.unit_price, order?.currency)} / unité
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
                                                <Typography variant="subtitle1" color="primary" fontWeight="bold" sx={{ fontSize: { xs: '0.9rem', sm: '1.05rem' } }}>
                                                    {order && OrderService.formatAmount(
                                                        isEditing
                                                            ? (parseFloat(item.unit_price) * (editingQuantities[item.id] || item.quantity)).toFixed(2)
                                                            : item.total_price,
                                                        order.currency
                                                    )}
                                                </Typography>
                                                {isEditing && (
                                                    <Tooltip title="Supprimer l'article" arrow>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleRemoveItem(item.id)}
                                                            sx={{
                                                                bgcolor: alpha(theme.palette.error.main, 0.08),
                                                                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) },
                                                                width: 32,
                                                                height: 32,
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </Box>
                                        {index < (order?.items?.length || 0) - 1 && <Divider sx={{ ml: { xs: 0, sm: 0 } }} />}
                                    </Box>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    {order?.status === ORDER_STATUS.PENDING && (isEditing || orderActions?.canPay || orderActions?.canModify) && (
                        <Fade in>
                            <Card
                                sx={{
                                    borderRadius: 3,
                                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                                    border: '1px solid',
                                    borderColor: alpha(theme.palette.primary.main, 0.12),
                                }}
                            >
                                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                                                {isEditing ? 'Modification de la commande' : 'Commande en attente'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                                {isEditing
                                                    ? 'Modifiez les quantités ou supprimez des articles, puis sauvegardez vos modifications.'
                                                    : 'Vous pouvez modifier ou annuler cette commande tant qu\'elle n\'est pas confirmée.'
                                                }
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                            {isEditing ? (
                                                <>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        onClick={handleSaveOrder}
                                                        disabled={saving || cancelling}
                                                        startIcon={saving ? <CircularProgress size={18} /> : <CheckIcon />}
                                                        size="large"
                                                    >
                                                        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        onClick={handleCancelEditing}
                                                        disabled={saving || cancelling}
                                                        startIcon={<CancelIcon />}
                                                        size="large"
                                                    >
                                                        Annuler
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        onClick={handleValidateOrder}
                                                        disabled={paying || cancelling || paymentBlocked}
                                                        startIcon={paying ? <CircularProgress size={18} /> : <CheckCircleIcon />}
                                                        size="large"
                                                    >
                                                        {paying ? 'Redirection...' : paymentBlocked ? 'Paiement en cours...' : payActionLabel}
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        onClick={() => setCancelDialogOpen(true)}
                                                        disabled={cancelling || paying}
                                                        startIcon={cancelling ? <CircularProgress size={18} /> : <CancelIcon />}
                                                        size="large"
                                                    >
                                                        {cancelling ? 'Annulation...' : 'Annuler'}
                                                    </Button>
                                                </>
                                            )}
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Fade>
                    )}

                    {/* Actions : commande en préparation → annulation encore possible */}
                    {order?.status === ORDER_STATUS.PROCESSING && orderActions?.canCancel && (
                        <Fade in>
                            <Card
                                sx={{
                                    borderRadius: 3,
                                    bgcolor: alpha(theme.palette.warning.main, 0.04),
                                    border: '1px solid',
                                    borderColor: alpha(theme.palette.warning.main, 0.15),
                                }}
                            >
                                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                                                Votre commande est en préparation
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                                Elle ne peut plus être modifiée ni payée, mais vous pouvez encore l'annuler tant qu'elle n'est pas expédiée.
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={() => setCancelDialogOpen(true)}
                                            disabled={cancelling}
                                            startIcon={cancelling ? <CircularProgress size={18} /> : <CancelIcon />}
                                            size="large"
                                        >
                                            {cancelling ? 'Annulation...' : 'Annuler la commande'}
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Fade>
                    )}

                    {/* Action : confirmer la réception d'une commande expédiée */}
                    {orderActions?.canConfirmDelivery && (
                        <Fade in>
                            <Card
                                sx={{
                                    borderRadius: 3,
                                    bgcolor: alpha(theme.palette.success.main, 0.04),
                                    border: '1px solid',
                                    borderColor: alpha(theme.palette.success.main, 0.15),
                                }}
                            >
                                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                                                Votre commande a été expédiée
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                                L'avez-vous reçue ? Confirmez la réception pour la marquer comme livrée.
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            onClick={() => { setConfirmDeliveryError(null); setConfirmDeliveryDialogOpen(true); }}
                                            disabled={confirmingDelivery}
                                            startIcon={confirmingDelivery ? <CircularProgress size={18} /> : <ShippingIcon />}
                                            size="large"
                                        >
                                            {confirmingDelivery ? 'Confirmation...' : 'Confirmer la réception'}
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Fade>
                    )}

                    {/* Confirmation dialog for cancel */}
                    <Zoom in={order?.status === ORDER_STATUS.PENDING && !isEditing}>
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                                <InfoIcon sx={{ fontSize: 14 }} />
                                Les modifications ne sont possibles que sur les commandes en attente
                            </Typography>
                        </Box>
                    </Zoom>
                </Grid>

                {/* Sidebar - Informations de livraison et paiement */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    {/* Récapitulatif */}
                    <Card sx={{ mb: 3, borderRadius: 3 }}>
                        <CardHeader
                            avatar={
                                <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                                    <ReceiptIcon sx={{ fontSize: 20 }} />
                                </Avatar>
                            }
                            title={<Typography variant="subtitle1" fontWeight="bold">Récapitulatif</Typography>}
                            subheader="Détails financiers"
                            sx={{ pb: 1 }}
                        />
                        <Divider />
                        <CardContent sx={{ pt: 2 }}>
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Sous-total
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                        {order && order.shipping_amount != null
                                            ? OrderService.formatAmount(Math.max(0, Number(order.total_amount) - Number(order.shipping_amount)), order.currency)
                                            : order && (order.items?.length || 0) > 0
                                                ? OrderService.formatAmount(order.items.reduce((sum, item) => sum + Number(item.total_price || 0), 0), order.currency)
                                                : 'N/C'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Livraison
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                        {order && order.shipping_amount != null
                                            ? OrderService.formatAmount(order.shipping_amount, order.currency)
                                            : order?.mode === 'store_pickup'
                                                ? OrderService.formatAmount(0, order.currency)
                                                : 'N/C'}
                                    </Typography>
                                </Box>
                                <Divider />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        Total
                                    </Typography>
                                    <Typography variant="h6" color="primary" fontWeight="bold">
                                        {order && OrderService.formatAmount(order.total_amount, order.currency)}
                                    </Typography>
                                </Box>
                                {order && paymentDisplay && (
                                    <Box sx={{ pt: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Statut paiement
                                            </Typography>
                                            <Chip
                                                icon={getPaymentDisplayIcon(paymentDisplay)}
                                                label={getPaymentDisplayLabel(paymentDisplay)}
                                                size="small"
                                                color={PAYMENT_DISPLAY_TONE[paymentDisplay]}
                                                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                            />
                                        </Box>
                                        {paymentDisplay === 'anomaly' && (
                                            <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.75, lineHeight: 1.4 }}>
                                                Le paiement de cette commande est à vérifier auprès du support.
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Retrait en boutique */}
                    {order?.mode === 'store_pickup' && (
                        <Card sx={{ mb: 3, borderRadius: 3 }}>
                            <CardHeader
                                avatar={
                                    <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                                        <HomeIcon sx={{ fontSize: 20 }} />
                                    </Avatar>
                                }
                                title={<Typography variant="subtitle1" fontWeight="bold">Retrait en boutique</Typography>}
                                subheader="Votre commande sera disponible au point de retrait"
                                sx={{ pb: 1 }}
                            />
                            <Divider />
                            <CardContent sx={{ pt: 2 }}>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <LocationIcon color="action" sx={{ fontSize: 20, flexShrink: 0 }} />
                                        <Typography variant="body2">
                                            Retrait gratuit en boutique
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <InfoIcon color="action" sx={{ fontSize: 20, flexShrink: 0 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            Vous serez informé·e dès que la commande sera prête à être retirée.
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}

                    {/* Adresse de livraison */}
                    {order?.shipping_address && order?.mode !== 'store_pickup' && (
                        <Card sx={{ mb: 3, borderRadius: 3 }}>
                            <CardHeader
                                avatar={
                                    <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                                        <ShippingIcon sx={{ fontSize: 20 }} />
                                    </Avatar>
                                }
                                title={<Typography variant="subtitle1" fontWeight="bold">Adresse de livraison</Typography>}
                                subheader="Où sera livrée votre commande"
                                sx={{ pb: 1 }}
                            />
                            <Divider />
                            <CardContent sx={{ pt: 2 }}>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                        <LocationIcon color="action" sx={{ fontSize: 20, mt: 0.3, flexShrink: 0 }} />
                                        <Box>
                                            <Typography variant="body2" fontWeight="600">
                                                {order.shipping_address.first_name} {order.shipping_address.last_name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {order.shipping_address.address}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <PhoneIcon color="action" sx={{ fontSize: 20, flexShrink: 0 }} />
                                        <Typography variant="body2">
                                            {order.shipping_address.phone}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}

                    {/* Informations de paiement */}
                    {paymentsError && (
                        <Card sx={{ borderRadius: 3 }}>
                            <CardHeader
                                avatar={
                                    <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                                        <PaymentIcon sx={{ fontSize: 20 }} />
                                    </Avatar>
                                }
                                title={<Typography variant="subtitle1" fontWeight="bold">Paiement</Typography>}
                                subheader="Échec du chargement des transactions"
                                sx={{ pb: 1 }}
                            />
                            <Divider />
                            <CardContent sx={{ pt: 2 }}>
                                <Alert severity="error" variant="outlined">
                                    <Typography variant="body2" color="error.dark">
                                        Les détails de paiement de cette commande n'ont pas pu être chargés.
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                        {paymentsError}
                                    </Typography>
                                </Alert>
                            </CardContent>
                        </Card>
                    )}
                    {payments.length > 0 && (
                        <Card sx={{ borderRadius: 3 }}>
                            <CardHeader
                                avatar={
                                    <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                                        <PaymentIcon sx={{ fontSize: 20 }} />
                                    </Avatar>
                                }
                                title={<Typography variant="subtitle1" fontWeight="bold">Paiement</Typography>}
                                subheader="Détails de la transaction"
                                sx={{ pb: 1 }}
                            />
                            <Divider />
                            <CardContent sx={{ pt: 2 }}>
                                {payments.map((payment) => (
                                    <Box key={payment.id}>
                                        <Stack spacing={2}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Méthode
                                                </Typography>
                                                <Chip
                                                    icon={getPaymentMethodIcon(payment.payment_method)}
                                                    label={getPaymentMethodLabel(payment.payment_method)}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'capitalize' }}
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Montant
                                                </Typography>
                                                <Typography variant="body2" fontWeight="600">
                                                    {OrderService.formatAmount(payment.amount, payment.currency)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Statut
                                                </Typography>
                                                <Chip
                                                    icon={getPaymentStatusIcon(payment.status)}
                                                    label={OrderService.getPaymentStatusLabel(payment.status)}
                                                    size="small"
                                                    color={payment.status === 'paid' || payment.status === 'completed' ? 'success' : 'warning'}
                                                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                                />
                                            </Box>
                                            {payment.transaction_id && (
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Transaction
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 1, py: 0.3, borderRadius: 1, fontSize: '0.65rem' }}>
                                                        {payment.transaction_id}
                                                    </Typography>
                                                </Box>
                                            )}
                                            <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'right' }}>
                                                {OrderService.formatDate(payment.created_at)}
                                            </Typography>
                                        </Stack>
                                        {payments.indexOf(payment) < payments.length - 1 && <Divider sx={{ my: 2 }} />}
                                    </Box>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>

            {/* Dialogue de confirmation d'annulation */}
            <Dialog
                open={cancelDialogOpen}
                onClose={() => {
                    if (!cancelling) setCancelDialogOpen(false);
                }}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'error.light', width: 38, height: 38 }}>
                        <CancelIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Annuler la commande ?
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Cette action est définitive
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: 1, pb: 1 }}>
                    {order && (
                        <Stack spacing={1.5}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Commande
                                </Typography>
                                <Typography variant="body2" fontWeight="600">
                                    {OrderService.formatAmount(order.total_amount, order.currency)}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Articles
                                </Typography>
                                <Typography variant="body2" fontWeight="600">
                                    {order.items?.length || 0}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="text.disabled">
                                La commande sera annulée et ne pourra plus être modifiée.
                            </Typography>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        disabled={cancelling}
                        onClick={() => setCancelDialogOpen(false)}
                    >
                        Retour
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={cancelling}
                        startIcon={cancelling ? <CircularProgress size={18} /> : <CancelIcon />}
                        onClick={handleCancelOrder}
                    >
                        {cancelling ? 'Annulation...' : 'Confirmer l\'annulation'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialogue de confirmation de réception */}
            <Dialog
                open={confirmDeliveryDialogOpen}
                onClose={() => {
                    if (!confirmingDelivery) setConfirmDeliveryDialogOpen(false);
                }}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'success.light', width: 38, height: 38 }}>
                        <ShippingIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Confirmer la réception ?
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Votre commande sera marquée comme livrée
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: 1, pb: 1 }}>
                    {order && (
                        <Stack spacing={1.5}>
                            <Typography variant="body2" color="text.secondary">
                                Vous avez bien reçu votre commande{' '}
                                <strong>{order.order_number}</strong> ? Cette action est définitive.
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Montant
                                </Typography>
                                <Typography variant="body2" fontWeight="600">
                                    {OrderService.formatAmount(order.total_amount, order.currency)}
                                </Typography>
                            </Box>
                            {confirmDeliveryError && (
                                <Alert severity="error" sx={{ mt: 0.5 }}>
                                    {confirmDeliveryError}
                                </Alert>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        disabled={confirmingDelivery}
                        onClick={() => setConfirmDeliveryDialogOpen(false)}
                    >
                        Plus tard
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        disabled={confirmingDelivery}
                        startIcon={confirmingDelivery ? <CircularProgress size={18} /> : <CheckIcon />}
                        onClick={handleConfirmDelivery}
                    >
                        {confirmingDelivery ? 'Confirmation...' : 'Confirmer la réception'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default function OrderDetailPage() {
    return (
        <RequireRole allowedRoles={['client']}>
            <OrderDetailContent />
        </RequireRole>
    );
}
