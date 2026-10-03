'use client';

import { RequireRole } from '@/components/RequireRole';
import {
    Box,
    Container,
    Typography,
    Paper,
    Card,
    Breadcrumbs,
    Link as MuiLink,
    Button,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    Divider,
    Tooltip,
    Skeleton,
    LinearProgress,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TablePagination,
    useTheme,
    alpha,
} from '@mui/material';
import {
    MoreVert,
    Receipt as ReceiptIcon,
    ShoppingBag as ShoppingBagIcon,
    FilterList as FilterIcon,
    CheckCircle as CheckCircleIcon,
    Check as CheckIcon,
    Schedule as ScheduleIcon,
    HourglassTop as HourglassTopIcon,
    LocalShipping as LocalShippingIcon,
    Storefront as StorefrontIcon,
    ErrorOutlined as ErrorOutlineIcon,
    Cancel as CancelIcon,
    CancelOutlined as CancelOutlinedIcon,
    Replay as ReplayIcon,
    Info as InfoIcon,
    Payment as PaymentIcon,
    Visibility as VisibilityIcon,
    PendingActions as PendingActionsIcon,
    Refresh as RefreshIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OrderService, { ORDER_STATUS, OrderResponse, OrderItem, Payment } from '@/services/order.service';
import { ApiErrorHandler } from '@/lib/error-handler';
import {
    getOrderActions,
    getOrderStatusLabel,
    getPaymentDisplayLabel,
    getPayActionLabel,
    PAYMENT_DISPLAY_TONE,
    PaymentDisplayState,
    resolvePaymentDisplayState,
    OrderBusinessState,
} from '@/lib/payment-status';
import { getImageUrl } from '@/lib/imageUtils';

const STATUS_FILTERS = [
    { value: null, label: 'Toutes' },
    { value: ORDER_STATUS.PENDING, label: OrderService.getStatusLabel(ORDER_STATUS.PENDING) },
    { value: ORDER_STATUS.PROCESSING, label: OrderService.getStatusLabel(ORDER_STATUS.PROCESSING) },
    { value: ORDER_STATUS.SHIPPED, label: OrderService.getStatusLabel(ORDER_STATUS.SHIPPED) },
    { value: ORDER_STATUS.DELIVERED, label: OrderService.getStatusLabel(ORDER_STATUS.DELIVERED) },
    { value: ORDER_STATUS.CANCELLED, label: OrderService.getStatusLabel(ORDER_STATUS.CANCELLED) },
    { value: ORDER_STATUS.REFUNDED, label: OrderService.getStatusLabel(ORDER_STATUS.REFUNDED) },
] as const;

type ChipTone = 'success' | 'warning' | 'info' | 'error' | 'default' | 'secondary';

function orderBusinessBadge(businessState: OrderBusinessState): { tone: ChipTone; icon: React.ReactNode } {
    switch (businessState) {
        case 'pending':
            return { tone: 'warning', icon: <ScheduleIcon fontSize="small" /> };
        case 'payment_processing':
            return { tone: 'warning', icon: <HourglassTopIcon fontSize="small" /> };
        case 'paid':
            return { tone: 'success', icon: <CheckCircleIcon fontSize="small" /> };
        case 'preparing':
            return { tone: 'info', icon: <PendingActionsIcon fontSize="small" /> };
        case 'shipped':
            return { tone: 'info', icon: <LocalShippingIcon fontSize="small" /> };
        case 'delivered':
            return { tone: 'success', icon: <CheckCircleIcon fontSize="small" /> };
        case 'confirmed':
            return { tone: 'info', icon: <CheckIcon fontSize="small" /> };
        case 'cancelled':
            return { tone: 'error', icon: <CancelIcon fontSize="small" /> };
        case 'refunded':
            return { tone: 'secondary', icon: <ReplayIcon fontSize="small" /> };
        default:
            return { tone: 'default', icon: <ReceiptIcon fontSize="small" /> };
    }
}

function paymentDisplayBadge(display: PaymentDisplayState): { tone: ChipTone; icon: React.ReactNode } {
    switch (display) {
        case 'paid':
            return { tone: 'success', icon: <CheckCircleIcon fontSize="small" /> };
        case 'payment_processing':
            return { tone: 'info', icon: <HourglassTopIcon fontSize="small" /> };
        case 'payment_failed':
            return { tone: 'error', icon: <ErrorOutlineIcon fontSize="small" /> };
        case 'payment_cancelled':
            return { tone: 'default', icon: <CancelIcon fontSize="small" /> };
        case 'refunded':
            return { tone: 'secondary', icon: <ReplayIcon fontSize="small" /> };
        case 'anomaly':
            return { tone: PAYMENT_DISPLAY_TONE.anomaly, icon: <ErrorOutlineIcon fontSize="small" /> };
        case 'unpaid':
        default:
            return { tone: 'warning', icon: <ScheduleIcon fontSize="small" /> };
    }
}

function formatShortDate(dateString: string): string {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getDeliveryLabel(order: OrderResponse): string | null {
    if (order.mode === 'store_pickup') return 'Retrait en boutique';
    if (order.mode === 'home_delivery') return 'Livraison à domicile';
    return null;
}

function getOrderItemCount(order: OrderResponse): number {
    if (Array.isArray(order.items)) return order.items.length;
    return order.items_count ?? 0;
}

function getPreviewItems(order: OrderResponse): OrderItem[] {
    return Array.isArray(order.items) ? order.items.slice(0, 3) : [];
}

function getItemImage(item: OrderItem): string {
    if (item.product.cover_image_url) return getImageUrl(item.product.cover_image_url);
    const image = item.product.images?.find((img) => img.is_cover) ?? item.product.images?.[0];
    return getImageUrl(image?.image_url);
}

function StatusBadge({ label, tone, icon }: { label: string; tone: ChipTone; icon: React.ReactNode }) {
    const theme = useTheme();
    const mainColor = tone === 'default' ? theme.palette.text.secondary : theme.palette[tone].main;
    return (
        <Chip
            size="small"
            icon={icon}
            label={label}
            sx={{
                height: 26,
                fontWeight: 700,
                fontSize: '0.72rem',
                bgcolor: alpha(mainColor, 0.1),
                color: mainColor,
                '& .MuiChip-icon': { color: mainColor, fontSize: 16 },
                '& .MuiChip-label': { px: 1 },
            }}
        />
    );
}

function ProductThumb({ item }: { item: OrderItem }) {
    return (
        <Link href={`/product/${item.product.id}`} aria-label={`Voir le produit ${item.product.name}`}>
            <Box
                sx={{
                    position: 'relative',
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'grey.50',
                    flexShrink: 0,
                    '& img': { display: 'block' },
                }}
            >
                <img
                    src={getItemImage(item)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = '/placeholder-image.jpg';
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 2,
                        right: 2,
                        bgcolor: alpha('#0f172a', 0.75),
                        color: '#fff',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        borderRadius: 0.75,
                        px: 0.6,
                        lineHeight: '16px',
                    }}
                >
                    x{item.quantity}
                </Box>
            </Box>
        </Link>
    );
}

// Gating UX : règle unique centralisée dans payment-status.ts (§12). Le
// backend reste l'autorité finale ; le frontend n'invente aucune règle métier.

function OrderSkeletonCard() {
    return (
        <Card sx={{ mb: 2.5, borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 160 }}>
                        <Skeleton width="45%" height={24} sx={{ borderRadius: 1 }} />
                        <Skeleton width="30%" height={16} sx={{ borderRadius: 1, mt: 1 }} />
                    </Box>
                    <Skeleton width={130} height={28} variant="rounded" sx={{ borderRadius: 8 }} />
                </Box>
            </Box>
            <Divider />
            <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Skeleton variant="rounded" width={56} height={56} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rounded" width={56} height={56} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rounded" width={56} height={56} sx={{ borderRadius: 2 }} />
                <Box sx={{ flex: 1, minWidth: 140 }}>
                    <Skeleton width="70%" height={18} sx={{ borderRadius: 1 }} />
                    <Skeleton width="40%" height={14} sx={{ borderRadius: 1, mt: 1 }} />
                </Box>
            </Box>
            <Divider />
            <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                <Skeleton variant="rounded" width={170} height={38} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rounded" width={130} height={38} sx={{ borderRadius: 2 }} />
            </Box>
        </Card>
    );
}

interface LoadErrorInfo {
    title: string;
    message: string;
    kind: 'auth' | 'network' | 'server' | 'other';
}

function getLoadErrorMessage(err: unknown): LoadErrorInfo {
    const classified = ApiErrorHandler.classifyError(err);
    if (classified.status === 401 || classified.status === 403 || ApiErrorHandler.isAuthError(err)) {
        return {
            title: 'Session expirée',
            message: 'Votre session a expiré. Veuillez vous reconnecter pour consulter vos commandes.',
            kind: 'auth',
        };
    }
    if (classified.isTimeout || classified.isNetworkError) {
        return {
            title: 'Problème de connexion',
            message: "Impossible de joindre le serveur. Vérifiez votre connexion internet puis réessayez.",
            kind: 'network',
        };
    }
    if (classified.isServerError) {
        return {
            title: 'Le serveur rencontre un problème',
            message: "Vos commandes sont momentanément indisponibles. Merci de réessayer dans quelques instants.",
            kind: 'server',
        };
    }
    return {
        title: 'Chargement impossible',
        message: classified.message || 'Une erreur est survenue lors du chargement de vos commandes.',
        kind: 'other',
    };
}

function OrdersContent() {
    const router = useRouter();
    const theme = useTheme();
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    // Paiements détaillés par commande (mêmes données que la page détail) :
    // la carte de commande et le détail utilisent exactement la même résolution.
    const [paymentsByOrder, setPaymentsByOrder] = useState<Record<number, Payment[] | null>>({});
    const [loading, setLoading] = useState(true);
    const [isPageChanging, setIsPageChanging] = useState(false);
    const [loadError, setLoadError] = useState<LoadErrorInfo | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const cancelInFlightRef = useRef(false);
    const [confirmDeliveryDialogOpen, setConfirmDeliveryDialogOpen] = useState(false);
    const [confirmingDelivery, setConfirmingDelivery] = useState(false);
    const [confirmDeliveryError, setConfirmDeliveryError] = useState<string | null>(null);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [menuOrderId, setMenuOrderId] = useState<number | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [hasMore, setHasMore] = useState(true);
    const [hasOrders, setHasOrders] = useState(false);
    const [statusFilter, setStatusFilter] = useState<typeof ORDER_STATUS[keyof typeof ORDER_STATUS] | null>(null);

    const fetchOrders = useCallback(async () => {
        try {
            setIsPageChanging(true);
            setLoadError(null);
            const ordersData = await OrderService.getCustomerOrders(page, rowsPerPage, statusFilter ?? undefined);
            setOrders(ordersData);

            // Récupération des paiements détaillés (au même titre que la page
            // détail) pour une résolution unique et cohérente liste/détail.
            const paymentFetches = await Promise.all(
                ordersData.map(async (order) => {
                    try {
                        return { id: order.id, payments: await OrderService.getOrderPayments(order.id) };
                    } catch {
                        return { id: order.id, payments: null };
                    }
                })
            );
            const nextPaymentsByOrder: Record<number, Payment[] | null> = {};
            paymentFetches.forEach((p) => {
                nextPaymentsByOrder[p.id] = p.payments;
            });
            setPaymentsByOrder(nextPaymentsByOrder);

            // Détecter si on a atteint la dernière page
            setHasMore(ordersData.length === rowsPerPage);
            setHasOrders(ordersData.length > 0 || page > 0);
        } catch (err) {
            setLoadError(getLoadErrorMessage(err));
        } finally {
            setLoading(false);
            setIsPageChanging(false);
        }
    }, [page, rowsPerPage, statusFilter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleChangePage = (event: unknown, newPage: number) => {
        // Empêcher d'avancer au-delà de la dernière page
        if (newPage > page && !hasMore) {
            return;
        }
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleStatusFilterChange = (value: typeof ORDER_STATUS[keyof typeof ORDER_STATUS] | null) => {
        setStatusFilter(value);
        setPage(0);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, orderId: number) => {
        setMenuAnchorEl(event.currentTarget);
        setMenuOrderId(orderId);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setMenuOrderId(null);
    };

    const handleMenuAction = (action: 'details' | 'pay' | 'cancel' | 'confirm-delivery', order: OrderResponse) => {
        handleMenuClose();
        switch (action) {
            case 'details':
                router.push(`/account/orders/${order.id}`);
                break;
            case 'pay':
                // Reprise de paiement gérée par /checkout/finalize (garde backend).
                router.push(`/checkout/finalize?orderId=${order.id}`);
                break;
            case 'cancel':
                openCancelDialog(order);
                break;
            case 'confirm-delivery':
                openConfirmDeliveryDialog(order);
                break;
        }
    };

    const openCancelDialog = (order: OrderResponse) => {
        setSelectedOrder(order);
        setCancelError(null);
        setCancelDialogOpen(true);
    };

    const openConfirmDeliveryDialog = (order: OrderResponse) => {
        setSelectedOrder(order);
        setConfirmDeliveryError(null);
        setConfirmDeliveryDialogOpen(true);
    };

    const handleConfirmDelivery = async () => {
        if (!selectedOrder || confirmingDelivery) return;
        setConfirmingDelivery(true);
        setConfirmDeliveryError(null);
        try {
            await OrderService.confirmDelivery(selectedOrder.id);
            setConfirmDeliveryDialogOpen(false);
            setSuccess(`Réception de la commande ${selectedOrder.order_number} confirmée`);
            setSelectedOrder(null);
            await fetchOrders();
        } catch (err) {
            setConfirmDeliveryError(
                err instanceof Error ? err.message : 'Impossible de confirmer la réception. Veuillez réessayer.'
            );
        } finally {
            setConfirmingDelivery(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!selectedOrder || cancelInFlightRef.current) return;
        cancelInFlightRef.current = true;
        setCancelling(true);
        setCancelError(null);
        try {
            await OrderService.cancelCustomerOrder(selectedOrder.id);
            setCancelDialogOpen(false);
            setSuccess(`Commande ${selectedOrder.order_number} annulée avec succès`);
            setSelectedOrder(null);
            await fetchOrders();
        } catch (err) {
            setCancelError(
                err instanceof Error ? err.message : 'Impossible d\'annuler la commande. Veuillez réessayer.'
            );
        } finally {
            cancelInFlightRef.current = false;
            setCancelling(false);
        }
    };

    if (loading && !isPageChanging) {
        return (
            <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
                <Box sx={{ mb: { xs: 2, sm: 4 } }}>
                    <Skeleton width={220} height={40} sx={{ borderRadius: 1 }} />
                    <Skeleton width={320} height={20} sx={{ borderRadius: 1, mt: 1 }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                    {[76, 104, 120, 92, 96].map((w, i) => (
                        <Skeleton key={i} width={w} height={32} variant="rounded" sx={{ borderRadius: 8 }} />
                    ))}
                </Box>
                {[0, 1, 2].map((i) => (
                    <OrderSkeletonCard key={i} />
                ))}
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
            <Breadcrumbs sx={{ mb: 2 }}>
                <MuiLink
                    component={Link}
                    href="/account"
                    variant="body1"
                    underline="hover"
                    color="inherit"
                    sx={{ fontWeight: 500 }}
                >
                    Mon Compte
                </MuiLink>
                <Typography color="text.primary">Mes commandes</Typography>
            </Breadcrumbs>

            <Box sx={{ mb: { xs: 2, sm: 4 } }}>
                <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    Mes commandes
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Retrouvez et suivez toutes vos commandes.
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                <FilterIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                {STATUS_FILTERS.map(({ value, label }) => (
                    <Chip
                        key={label}
                        label={label}
                        size="small"
                        variant={statusFilter === value ? 'filled' : 'outlined'}
                        color={statusFilter === value ? 'primary' : 'default'}
                        onClick={() => handleStatusFilterChange(value)}
                        sx={{ fontWeight: statusFilter === value ? 600 : 400 }}
                    />
                ))}
            </Box>

            {isPageChanging && !loading && (
                <LinearProgress sx={{ mb: 2, borderRadius: 2, height: 3 }} />
            )}

            {/* Erreur de chargement : jamais confondue avec un « aucune commande » */}
            {loadError && orders.length === 0 && (
                <Paper
                    elevation={0}
                    sx={{
                        textAlign: 'center',
                        py: { xs: 6, sm: 8 },
                        px: 3,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 4,
                    }}
                >
                    <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {loadError.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 520, mx: 'auto' }}>
                        {loadError.message}
                    </Typography>
                    {loadError.kind === 'auth' ? (
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => {
                                router.push('/login');
                            }}
                        >
                            Me reconnecter
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<RefreshIcon />}
                            onClick={fetchOrders}
                        >
                            Réessayer
                        </Button>
                    )}
                </Paper>
            )}

            {/* Liste des commandes sous forme de cartes */}
            {loadError === null && orders.map((order) => {
                const orderPayments = paymentsByOrder[order.id] ?? undefined;
                const actionState = getOrderActions({ orderStatus: order.status, paymentStatus: order.payment_status, payments: orderPayments });
                const payDisplay = resolvePaymentDisplayState({ orderStatus: order.status, paymentStatus: order.payment_status, payments: orderPayments });
                const payLabel = getPayActionLabel(payDisplay);
                const previewItems = getPreviewItems(order);
                const hasItems = Array.isArray(order.items);
                const remainingItems = hasItems ? Math.max(0, order.items.length - 3) : 0;
                const itemCount = getOrderItemCount(order);
                const deliveryLabel = getDeliveryLabel(order);
                const orderBadge = orderBusinessBadge(actionState.businessState);
                const paymentBadge = paymentDisplayBadge(payDisplay);
                const menuOpen = menuOrderId === order.id;

                return (
                    <Paper
                        key={order.id}
                        elevation={0}
                        variant="outlined"
                        sx={{ mb: 2.5, borderRadius: 3, overflow: 'hidden', borderColor: 'divider' }}
                    >
                        {/* En-tête : identifiants + statuts */}
                        <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    component={Link}
                                    href={`/account/orders/${order.id}`}
                                    variant="subtitle1"
                                    fontWeight={700}
                                    color="text.primary"
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontSize: { xs: '0.95rem', sm: '1rem' },
                                        '&:hover': { color: 'primary.main' },
                                    }}
                                >
                                    <ReceiptIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                    Commande {order.order_number}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Passée le {formatShortDate(order.created_at)}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 }, flexWrap: 'wrap' }}>
                                <StatusBadge
                                    label={getOrderStatusLabel({ orderStatus: order.status, paymentStatus: order.payment_status, payments: orderPayments })}
                                    tone={orderBadge.tone}
                                    icon={orderBadge.icon}
                                />
                                <StatusBadge
                                    label={`Paiement : ${getPaymentDisplayLabel(payDisplay)}`}
                                    tone={paymentBadge.tone}
                                    icon={paymentBadge.icon}
                                />
                                <IconButton
                                    size="small"
                                    aria-label={`Actions pour la commande ${order.order_number}`}
                                    aria-haspopup="menu"
                                    aria-expanded={menuOpen}
                                    aria-controls={menuOpen ? `order-menu-${order.id}` : undefined}
                                    onClick={(e: React.MouseEvent<HTMLElement>) => handleMenuOpen(e, order.id)}
                                    sx={{ color: 'text.secondary', ml: { xs: 0, sm: 0.5 }, '&:hover': { bgcolor: 'action.hover' } }}
                                >
                                    <MoreVert />
                                </IconButton>
                                <Menu
                                    id={`order-menu-${order.id}`}
                                    anchorEl={menuAnchorEl}
                                    open={menuOpen}
                                    onClose={handleMenuClose}
                                    slotProps={{
                                        paper: {
                                            elevation: 3,
                                            sx: { minWidth: 230, borderRadius: 2, mt: 0.5 },
                                        },
                                    }}
                                >
                                    {actionState.isPaymentProcessing && !actionState.isPaid && (
                                        <MenuItem disabled sx={{ opacity: 0.7 }}>
                                            <ListItemIcon>
                                                <HourglassTopIcon fontSize="small" />
                                            </ListItemIcon>
                                            Paiement en cours…
                                        </MenuItem>
                                    )}
                                    {actionState.canPay && (
                                        <MenuItem onClick={() => handleMenuAction('pay', order)}>
                                            <ListItemIcon>
                                                <PaymentIcon fontSize="small" sx={{ color: 'success.main' }} />
                                            </ListItemIcon>
                                            {payLabel}
                                        </MenuItem>
                                    )}
                                    <MenuItem onClick={() => handleMenuAction('details', order)}>
                                        <ListItemIcon>
                                            <VisibilityIcon fontSize="small" />
                                        </ListItemIcon>
                                        Voir les détails
                                    </MenuItem>
                                    {actionState.canConfirmDelivery && (
                                        <MenuItem onClick={() => handleMenuAction('confirm-delivery', order)}>
                                            <ListItemIcon>
                                                <LocalShippingIcon fontSize="small" sx={{ color: 'success.main' }} />
                                            </ListItemIcon>
                                            Confirmer la réception
                                        </MenuItem>
                                    )}
                                    {actionState.canCancel && (
                                        <MenuItem onClick={() => handleMenuAction('cancel', order)} sx={{ color: 'error.main' }}>
                                            <ListItemIcon>
                                                <CancelOutlinedIcon fontSize="small" sx={{ color: 'error.main' }} />
                                            </ListItemIcon>
                                            Annuler la commande
                                        </MenuItem>
                                    )}
                                </Menu>
                            </Box>
                        </Box>

                        <Divider />

                        {/* Corps : aperçu produits + récapitulatif */}
                        <Box
                            sx={{
                                p: { xs: 2, sm: 3 },
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' },
                                gap: { xs: 2, md: 3 },
                                alignItems: 'center',
                            }}
                        >
                            <Box>
                                {previewItems.length > 0 ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                                        {previewItems.map((item) => (
                                            <ProductThumb key={item.id} item={item} />
                                        ))}
                                        {remainingItems > 0 && (
                                            <Tooltip
                                                title={`${remainingItems} article${remainingItems > 1 ? 's' : ''} supplémentaire${remainingItems > 1 ? 's' : ''}`}
                                            >
                                                <Box
                                                    aria-label={`${remainingItems} articles supplémentaires dans cette commande`}
                                                    sx={{
                                                        width: 56,
                                                        height: 56,
                                                        borderRadius: 2,
                                                        bgcolor: 'grey.100',
                                                        border: '1px dashed',
                                                        borderColor: 'divider',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'text.secondary',
                                                        fontWeight: 700,
                                                        fontSize: '0.8rem',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    +{remainingItems}
                                                </Box>
                                            </Tooltip>
                                        )}
                                        <Box sx={{ minWidth: 0, maxWidth: 260 }}>
                                            <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.875rem' }}>
                                                {previewItems[0]?.product.name}
                                            </Typography>
                                            {remainingItems > 0 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    et {remainingItems} autre{remainingItems > 1 ? 's' : ''} article{remainingItems > 1 ? 's' : ''}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
                                        <ShoppingBagIcon sx={{ fontSize: 22, color: 'text.disabled' }} />
                                        <Typography variant="body2">
                                            {itemCount} article{itemCount > 1 ? 's' : ''}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: { xs: 1.5, sm: 2 },
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    bgcolor: 'background.default',
                                    p: { xs: 1.5, sm: 2 },
                                }}
                            >
                                <Box sx={{ minWidth: 130 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5, display: 'block' }}>
                                        Total
                                    </Typography>
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight={700}
                                        color="primary.main"
                                        sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, lineHeight: 1.4 }}
                                    >
                                        {OrderService.formatAmount(order.total_amount, order.currency)}
                                    </Typography>
                                </Box>
                                <Box sx={{ minWidth: 90 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5, display: 'block' }}>
                                        Articles
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {itemCount}
                                    </Typography>
                                </Box>
                                {deliveryLabel && (
                                    <Box sx={{ minWidth: 150, flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5, display: 'block' }}>
                                            Livraison
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {order.mode === 'store_pickup' ? (
                                                <StorefrontIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />
                                            ) : (
                                                <LocalShippingIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />
                                            )}
                                            <Typography variant="body2" fontWeight={500} noWrap>
                                                {deliveryLabel}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        <Divider />

                        {/* Pied : actions rapides contextuelles */}
                        <Box
                            sx={{
                                p: { xs: 1.5, sm: 2 },
                                px: { xs: 2, sm: 3 },
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 1,
                                flexWrap: 'wrap',
                                bgcolor: alpha(theme.palette.grey[500], 0.03),
                            }}
                        >
                            <Button
                                component={Link}
                                href={`/account/orders/${order.id}`}
                                variant="text"
                                size="small"
                                startIcon={<VisibilityIcon />}
                                sx={{ fontWeight: 600 }}
                            >
                                Voir les détails
                            </Button>
                            {actionState.canPay && (
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<PaymentIcon />}
                                    onClick={() => handleMenuAction('pay', order)}
                                >
                                    {payLabel}
                                </Button>
                            )}
                            {actionState.canConfirmDelivery && (
                                <Button
                                    variant="contained"
                                    size="small"
                                    color="success"
                                    startIcon={<LocalShippingIcon />}
                                    onClick={() => handleMenuAction('confirm-delivery', order)}
                                >
                                    Confirmer la réception
                                </Button>
                            )}
                            {actionState.isPaymentProcessing && !actionState.isPaid && (
                                <Chip
                                    size="small"
                                    icon={<HourglassTopIcon />}
                                    label="Paiement en cours"
                                    sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontWeight: 600 }}
                                />
                            )}
                        </Box>
                    </Paper>
                );
            })}

            {/* Empty state : aucune commande */}
            {loadError === null && orders.length === 0 && page === 0 && !hasOrders && (
                <Paper
                    elevation={0}
                    sx={{ textAlign: 'center', py: { xs: 6, sm: 8 }, px: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 4 }}
                >
                    <ShoppingBagIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom>
                        {statusFilter
                            ? `Aucune commande avec le statut « ${OrderService.getStatusLabel(statusFilter)} »`
                            : "Vous n'avez pas encore de commandes"}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto' }}>
                        {statusFilter
                            ? 'Essayez un autre statut ou consultez toutes vos commandes.'
                            : 'Découvrez nos produits et placez votre première commande en toute simplicité.'}
                    </Typography>
                    {statusFilter ? (
                        <Button
                            variant="outlined"
                            size="large"
                            sx={{ mt: 3 }}
                            onClick={() => handleStatusFilterChange(null)}
                        >
                            Voir toutes les commandes
                        </Button>
                    ) : (
                        <Button
                            component={Link}
                            href="/shop"
                            variant="contained"
                            size="large"
                            sx={{ mt: 3 }}
                        >
                            Découvrir nos produits
                        </Button>
                    )}
                </Paper>
            )}

            {/* Page vide après filtrage/pagination */}
            {loadError === null && orders.length === 0 && page > 0 && (
                <Paper
                    elevation={0}
                    sx={{ textAlign: 'center', py: { xs: 6, sm: 8 }, px: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 4 }}
                >
                    <InfoIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Aucune commande sur cette page
                    </Typography>
                    <Button
                        variant="outlined"
                        size="large"
                        sx={{ mt: 2 }}
                        onClick={() => setPage(Math.max(0, page - 1))}
                    >
                        Retour à la page précédente
                    </Button>
                </Paper>
            )}

            {hasOrders && orders.length > 0 && (
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={-1} // -1 indique que le nombre total n'est pas connu
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Commandes par page:"
                    labelDisplayedRows={({ from, to }: { from: number; to: number }) => `${from}-${to}`}
                    sx={{ borderTop: 1, borderColor: 'divider', '& .MuiTablePagination-toolbar': { minHeight: { xs: 40, sm: 52 } } }}
                    slotProps={{
                        actions: {
                            showFirstButton: { sm: true },
                            showLastButton: { sm: false },
                            nextButton: {
                                size: 'small',
                                disabled: !hasMore,
                            },
                            previousButton: { size: 'small' },
                        },
                        select: {
                            sx: { fontSize: { xs: '0.75rem', sm: '0.875rem' } },
                        },
                    }}
                />
            )}

            {/* Dialogue de confirmation d'annulation */}
            <Dialog
                open={cancelDialogOpen}
                onClose={() => {
                    if (!cancelling) setCancelDialogOpen(false);
                }}
                maxWidth="xs"
                fullWidth
                aria-labelledby="cancel-order-dialog-title"
                aria-describedby="cancel-order-dialog-description"
            >
                <DialogTitle id="cancel-order-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: 2, p: 1, display: 'flex' }}>
                        <CancelIcon sx={{ color: 'error.main', fontSize: 26 }} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Annuler la commande ?
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {selectedOrder?.order_number}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent id="cancel-order-dialog-description" sx={{ pt: 1, pb: 2 }}>
                    <Box component="span" sx={{ display: 'block', mb: 1.5 }}>
                        {selectedOrder && (
                            <>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                    Êtes-vous sûr de vouloir annuler la commande{' '}
                                    <strong>{selectedOrder.order_number}</strong> ? Cette action est définitive
                                    et la commande ne pourra plus être modifiée ni payée.
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.default', borderRadius: 1.5, px: 1.5, py: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Montant
                                    </Typography>
                                    <Typography variant="body2" fontWeight="700">
                                        {OrderService.formatAmount(selectedOrder.total_amount, selectedOrder.currency)}
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Box>
                    {cancelError && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                            {cancelError}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        disabled={cancelling}
                        onClick={() => setCancelDialogOpen(false)}
                    >
                        Non, garder
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={cancelling}
                        startIcon={cancelling ? <HourglassTopIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
                        onClick={handleCancelOrder}
                    >
                        {cancelling ? 'Annulation…' : 'Confirmer l\'annulation'}
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
                aria-labelledby="confirm-delivery-dialog-title"
                aria-describedby="confirm-delivery-dialog-description"
            >
                <DialogTitle id="confirm-delivery-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2, p: 1, display: 'flex' }}>
                        <LocalShippingIcon sx={{ color: 'success.main', fontSize: 26 }} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Confirmer la réception ?
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {selectedOrder?.order_number}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent id="confirm-delivery-dialog-description" sx={{ pt: 1, pb: 2 }}>
                    <Box component="span" sx={{ display: 'block', mb: 1.5 }}>
                        {selectedOrder && (
                            <>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                    Votre commande <strong>{selectedOrder.order_number}</strong> vous a été livrée ?
                                    Confirmez la réception pour la marquer comme <strong>livrée</strong>.
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.default', borderRadius: 1.5, px: 1.5, py: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Montant
                                    </Typography>
                                    <Typography variant="body2" fontWeight="700">
                                        {OrderService.formatAmount(selectedOrder.total_amount, selectedOrder.currency)}
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Box>
                    {confirmDeliveryError && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                            {confirmDeliveryError}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
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
                        startIcon={confirmingDelivery ? <HourglassTopIcon fontSize="small" /> : <CheckIcon fontSize="small" />}
                        onClick={handleConfirmDelivery}
                    >
                        {confirmingDelivery ? 'Confirmation…' : 'Confirmer la réception'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification de succès */}
            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
                    {success}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default function OrdersPage() {
    return (
        <RequireRole allowedRoles={['client']}>
            <OrdersContent />
        </RequireRole>
    );
}