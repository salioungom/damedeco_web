'use client';

import { RequireRole } from '@/components/RequireRole';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    Divider,
    Chip,
    LinearProgress,
    Stack,
    Avatar,
    AvatarGroup,
    alpha,
    IconButton,
    useTheme,
} from '@mui/material';
import {
    ShoppingBag,
    TrendingUp,
    Pending,
    Star,
    ChevronRight,
    HeadsetMic,
    Inventory2
} from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { StatsService } from '@/services/stats.service';
import { formatFcfa } from '@/lib/format';

function AccountPageContent() {
    const router = useRouter();
    const { user } = useAuth();
    const theme = useTheme();
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        favoritesCount: 0,
        currency: 'FCFA',
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const userStats = await StatsService.getUserStats();
            setStats({
                totalOrders: userStats.totalOrders,
                totalSpent: userStats.totalSpent,
                pendingOrders: userStats.pendingOrders,
                favoritesCount: userStats.totalFavorites,           
                currency: 'FCFA',
            });
            setRecentOrders(userStats.recentOrders);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'warning';
            // 'confirmed' est legacy uniquement (anciennes commandes).
            case 'confirmed': return 'primary';
            case 'processing': return 'info';
            case 'shipped': return 'primary';
            case 'delivered': return 'success';
            case 'cancelled': return 'error';
            // 'refunded' : compatibilité d'affichage, jamais déclenché par l'UI.
            case 'refunded': return 'error';
            default: return 'default';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'En attente';
            case 'confirmed': return 'Confirmée';
            case 'processing': return 'En préparation';
            case 'shipped': return 'Expédiée';
            case 'delivered': return 'Livrée';
            case 'cancelled': return 'Annulée';
            case 'refunded': return 'Remboursée';
            default: return 'Inconnu';
        }
    };

    const statCards = [
        {
            title: 'Vos Commandes',
            value: stats.totalOrders,
            icon: <ShoppingBag sx={{ fontSize: 32 }} />,
            color: theme.palette.primary.main,
            bgColor: alpha(theme.palette.primary.main, 0.1),
            path: '/account/orders',
        },
        {
            title: 'Total Dépensé',
            value: formatFcfa(stats.totalSpent),
            icon: <TrendingUp sx={{ fontSize: 32 }} />,
            color: theme.palette.success.main,
            bgColor: alpha(theme.palette.success.main, 0.1),
            path: '/account/orders',
        },
        {
            title: 'En attente',
            value: stats.pendingOrders,
            icon: <Pending sx={{ fontSize: 32 }} />,
            color: theme.palette.warning.main,
            bgColor: alpha(theme.palette.warning.main, 0.1),
            path: '/account/orders',
        },
        {
            title: 'Favoris',
            value: stats.favoritesCount,
            icon: <Star sx={{ fontSize: 32 }} />,
            color: theme.palette.error.main,
            bgColor: alpha(theme.palette.error.main, 0.1),
            path: '/favorites',
        },
    ];


    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ mt: { xs: 4, md: 8 }, mb: 8 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 8, md: 12 } }}>
                    <LinearProgress sx={{ width: '100%', maxWidth: { xs: 280, md: 400 }, borderRadius: 2 }} />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: { xs: 12, md: 16 }, mb: 4 }}>
            {/* Hero Section */}
            <Box
                sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 4,
                    p: { xs: 2.5, sm: 3.5, md: 6 },
                    mb: { xs: 3, sm: 4, md: 5 },
                    background: theme.palette.primary.main,
                    color: 'white',
                    boxShadow: '0 20px 40px -15px rgba(0,0,0,0.2)',
                }}
            >
                

                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: { xs: 3, md: 4 } }}>
                    <Avatar
                        sx={{
                            width: { xs: 100, md: 120 },
                            height: { xs: 100, md: 120 },
                            bgcolor: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            border: '3px solid rgba(255,255,255,0.5)',
                            fontSize: '3.5rem',
                            fontWeight: 700,
                            color: 'white',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)'
                        }}
                    >
                        {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </Avatar>
                    <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                        <Typography variant="h3" gutterBottom fontWeight={800} sx={{ textShadow: '0 2px 10px rgba(0,0,0,0.1)', fontSize: { xs: '2rem', md: '3rem' } }}>
                            Bonjour, {user?.full_name || user?.email?.split('@')[0] || 'Cher client'}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 400, maxWidth: 600, fontSize: { xs: 14, sm: 15, md: 16 }, lineHeight: 1.6 }}>
                            Bienvenue sur votre espace personnel. Gérez vos commandes, vos favoris et vos paramètres en toute simplicité.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Statistiques / KPIs */}
            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: { xs: 3, sm: 4, md: 6 } }}>
                {statCards.map((stat, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                        <Card
                            elevation={0}
                            onClick={() => router.push(stat.path)}
                            sx={{
                                height: '100%',
                                borderRadius: 4,
                                border: '1px solid',
                                borderColor: alpha(theme.palette.divider, 0.4),
                                cursor: 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: `0 16px 32px -10px ${alpha(stat.color, 0.3)}`,
                                    borderColor: alpha(stat.color, 0.4),
                                    '& .stat-icon-wrapper': {
                                        transform: 'scale(1.1) rotate(8deg)',
                                    }
                                },
                            }}
                        >
                            <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.75rem', letterSpacing: 1.2 }}>
                                            {stat.title}
                                        </Typography>
                                        {typeof stat.value === 'string' && stat.value.includes('FCFA') ? (
                                            <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                                                <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }, lineHeight: 1.1 }}>
                                                    {stat.value.replace(/\s*FCFA$/, '')}
                                                </Typography>
                                                <Typography fontWeight={800} color="text.primary" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }, lineHeight: 1.1 }}>
                                                    FCFA
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="h4" fontWeight={800} color="text.primary" mt={0.5} sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
                                                {stat.value}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box
                                        className="stat-icon-wrapper"
                                        sx={{
                                            p: { xs: 1.5, sm: 1.75, md: 2 },
                                            borderRadius: '50%',
                                            bgcolor: stat.bgColor,
                                            color: stat.color,
                                            transition: 'all 0.4s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: `inset 0 0 0 1px ${alpha(stat.color, 0.1)}`
                                        }}
                                    >
                                        {stat.icon}
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={{ xs: 3, sm: 3.5, md: 4 }}>
                {/* Commandes Récentes */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 0,
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: alpha(theme.palette.divider, 0.4),
                            overflow: 'hidden',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Box sx={{
                            p: { xs: 2, sm: 2.5, md: 3 },
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            bgcolor: alpha(theme.palette.background.paper, 0.5)
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: { xs: 36, md: 40 }, height: { xs: 36, md: 40 } }}>
                                    <Inventory2 sx={{ fontSize: { xs: 18, md: 20 } }} />
                                </Avatar>
                                <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }}>
                                    Commandes Récentes
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                endIcon={<ChevronRight />}
                                onClick={() => router.push('/account/orders')}
                                sx={{ fontWeight: 600, borderRadius: 2, textTransform: 'none', fontSize: { xs: 12, sm: 13, md: 14 }, px: { xs: 1.5, sm: 2 } }}
                            >
                                Voir tout
                            </Button>
                        </Box>

                        <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: recentOrders.length === 0 ? 'center' : 'flex-start' }}>
                            {recentOrders.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: { xs: 4, sm: 5, md: 6 } }}>
                                    <Avatar sx={{ width: { xs: 72, sm: 86, md: 100 }, height: { xs: 72, sm: 86, md: 100 }, mx: 'auto', mb: { xs: 2, sm: 2.5, md: 3 }, bgcolor: alpha(theme.palette.text.disabled, 0.05), color: theme.palette.text.secondary }}>
                                        <ShoppingBag sx={{ fontSize: { xs: 36, sm: 43, md: 50 }, opacity: 0.5 }} />
                                    </Avatar>
                                    <Typography variant="h6" color="text.secondary" fontWeight={600} gutterBottom sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }}>
                                        Aucune commande trouvée
                                    </Typography>
                                    <Typography variant="body1" color="text.disabled" mb={{ xs: 2.5, sm: 3, md: 4 }} sx={{ fontSize: { xs: 14, sm: 15, md: 16 } }}>
                                        Votre historique de commandes est vide.
                                    </Typography>
                                    <Button variant="contained" size="large" disableElevation onClick={() => router.push('/shop')} sx={{ borderRadius: 3, px: { xs: 3.5, sm: 4.5, md: 5 }, py: { xs: 1.25, sm: 1.35, md: 1.5 }, fontWeight: 700, textTransform: 'none', fontSize: { xs: 14, sm: 15, md: 16 } }}>
                                        Commencer à acheter
                                    </Button>
                                </Box>
                            ) : (
                                <Stack spacing={1.5}>
                                    {recentOrders.map((order) => (
                                        <Card
                                            key={order.id}
                                            elevation={0}
                                            sx={{
                                                border: '1px solid transparent',
                                                bgcolor: alpha(theme.palette.background.default, 0.4),
                                                borderRadius: 3,
                                                transition: 'all 0.2s ease',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    bgcolor: 'background.paper',
                                                    borderColor: alpha(theme.palette.primary.main, 0.2),
                                                    transform: 'translateX(6px)',
                                                    boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                                                },
                                            }}
                                            onClick={() => router.push(`/account/orders/${order.id}`)}
                                        >
                                            <CardContent sx={{ py: { xs: 1.25, sm: 1.5, md: 2 } + ' !important' }}>
                                <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ alignItems: 'center', mb: { xs: 1, sm: 0 } }}>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                                        <Typography variant="caption" color="text.tertiary" sx={{ fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                                                            N° Commande
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="body1" fontWeight={700}>
                                                                {order.orderNumber || `${order.id}`}
                                                            </Typography>
                                                            {order.productImages && order.productImages.length > 0 && (
                                                                <AvatarGroup
                                                                    max={4}
                                                                    sx={{
                                                                        '& .MuiAvatar-root': {
                                                                            width: 38,
                                                                            height: 38,
                                                                            fontSize: '0.65rem',
                                                                            border: '2px solid',
                                                                            borderColor: 'background.paper',
                                                                        },
                                                                    }}
                                                                >
                                                                    {order.productImages.map((imageUrl: string, index: number) => (
                                                                        <Avatar
                                                                            key={index}
                                                                            alt={`Produit ${index + 1}`}
                                                                            src={imageUrl}
                                                                            sx={{ width: 24, height: 24 }}
                                                                        />
                                                                    ))}
                                                                </AvatarGroup>
                                                            )}
                                                        </Box>
                                                    </Grid>
                                                    <Grid size={{ xs: 4, sm: 3 }}>
                                                        <Typography variant="caption" color="text.tertiary" sx={{ fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                                                            Date
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={500} color="text.secondary">
                                                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Non disponible'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 4, sm: 3 }}>
                                                        <Typography variant="caption" color="text.tertiary" sx={{ fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                                                            Montant
                                                        </Typography>
                                                        <Typography variant="body1" fontWeight={800} color="text.primary">
                                                            {order.totalAmount ? StatsService.formatAmount(order.totalAmount, 'FCFA') : 'Non disponible'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 4, sm: 2 }}>
                                                        <Typography variant="caption" color="text.tertiary" sx={{ fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                                                            Statut
                                                        </Typography>
                                                        <Chip
                                                            label={getStatusLabel(order.status)}
                                                            color={getStatusColor(order.status) as any}
                                                            size="medium"
                                                            sx={{
                                                                fontWeight: 700,
                                                                borderRadius: 2,
                                                                height: 32,
                                                                px: 1,
                                                                bgcolor: alpha(theme.palette[getStatusColor(order.status) as 'primary' | 'success' | 'warning' | 'error' | 'info']?.main || '#999', 0.1),
                                                                color: theme.palette[getStatusColor(order.status) as 'primary' | 'success' | 'warning' | 'error' | 'info']?.main,
                                                                border: 'none',
                                                            }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Actions Rapides & Aide */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Stack spacing={4} sx={{ height: '100%' }}>
                        {/* Box D'assistance */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 3, sm: 3.5, md: 4 },
                                borderRadius: 4,
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                textAlign: 'center',
                                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.light, 0.1)} 100%)`,
                                border: '1px solid',
                                borderColor: alpha(theme.palette.info.main, 0.15),
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Decorative background circle */}
                            <Box sx={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: alpha(theme.palette.info.main, 0.05) }} />

                            <Box sx={{ p: { xs: 1.5, sm: 1.75, md: 2 }, borderRadius: '50%', bgcolor: 'white', mb: { xs: 1.5, sm: 1.75, md: 2 }, color: 'info.main', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', position: 'relative', zIndex: 1 }}>
                                <HeadsetMic sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />
                            </Box>
                            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ position: 'relative', zIndex: 1, fontSize: { xs: 16, sm: 17, md: 18 } }}>
                                Besoin d'assistance ?
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, position: 'relative', zIndex: 1, maxWidth: 280 }}>
                                Notre équipe de support client est disponible pour répondre à vos questions 7j/7.
                            </Typography>
                            <Button
                                variant="contained"
                                color="info"
                                disableElevation
                                component={Link}
                                href="/contact"
                                sx={{ borderRadius: 8, px: { xs: 3.5, sm: 4.5, md: 5 }, py: { xs: 1.25, sm: 1.4, md: 1.5 }, fontWeight: 700, textTransform: 'none', position: 'relative', zIndex: 1, fontSize: { xs: 13, sm: 14, md: 15 } }}
                            >
                                Contacter l'aide
                            </Button>
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>
        </Container>
    );
}

export default function AccountPage() {
    return (
        <RequireRole allowedRoles={['client']}>
            <AccountPageContent />
        </RequireRole>
    );
}
