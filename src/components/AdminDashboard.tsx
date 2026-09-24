'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  alpha,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TablePagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as LayoutDashboard,
  Inventory2 as Package,
  ShoppingCart,
  People as Users,
  Settings,
  AttachMoney as DollarSign,
  Receipt as ReceiptIcon,
  Category,
  AdminPanelSettings,
  Search as SearchIcon,
  Visibility,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

import { Product } from '@/lib/types';
import { productService } from '@/services/product.service';
import { DashboardService } from '@/services/dashboard.service';
import type { DashboardOverview, RecentOrderItem } from '@/services/dashboard.service';
import { api } from '@/lib/api';
import { formatFcfa } from '@/lib/format';
import { ProductManagement } from './ProductManagement';
import { CategoriesManagement } from './CategoriesManagement';
import { AdminOrderManagement } from './AdminOrderManagement';
import ShippingManagement from './shipping/ShippingManagement';
import { useAuth } from '@/contexts/AuthContext';
import { tokens } from '@/theme/tokens';

const C = tokens.colors;

const BRAND = {
  primary: C.brand.main,
  dark: C.surfaces.inverse,
  white: C.surfaces.paper,
  light: C.brand.soft,
  surface: C.surfaces.default,
  border: C.border.light,
  muted: C.text.secondary,
} as const;

interface ClientWithStats {
  id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  total_orders: number;
  total_spent: number;
  pending_orders: number;
  last_order_date: string | null;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  loading,
  accent,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  loading?: boolean;
  accent?: string;
}) {
  const accentColor = accent || BRAND.primary;
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.75,
        height: '100%',
        borderRadius: '20px',
        border: `1px solid ${BRAND.border}`,
        bgcolor: BRAND.white,
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        '&:hover': {
          boxShadow: `0 8px 24px ${alpha(accentColor, 0.12)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '15px',
            bgcolor: alpha(accentColor, 0.1),
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 16.25, color: BRAND.muted, fontWeight: 500 }}>
            {title}
          </Typography>
          {loading ? (
            <CircularProgress size={24} sx={{ color: accentColor, mt: 1 }} />
          ) : (
            <Typography sx={{ fontSize: 30, fontWeight: 700, color: BRAND.dark, mt: 0.5, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              {value}
            </Typography>
          )}
          <Typography sx={{ fontSize: 15, color: BRAND.muted, mt: 0.5, lineHeight: 1.4 }}>
            {subtitle}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ py: 3 }}>{children}</Box>;
}

function getOrderCustomerName(order: { customer_name?: string | null; email?: string | null }) {
  return order.customer_name || 'Client invité';
}

const STATUS_META: { status: string; label: string; color: string }[] = [
  { status: 'pending', label: 'En attente', color: C.status.warning },
  { status: 'confirmed', label: 'Confirmée', color: C.brand.main },
  { status: 'processing', label: 'En traitement', color: C.brand.hover },
  { status: 'shipped', label: 'Expédiée', color: C.brand.active },
  { status: 'delivered', label: 'Livrée', color: C.status.success },
  { status: 'cancelled', label: 'Annulée', color: C.status.error },
  { status: 'refunded', label: 'Remboursée', color: C.text.secondary },
];

const PERIOD_OPTIONS: { value: 'all' | 'today' | '7d' | '30d'; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'today', label: "Aujourd'hui" },
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
];

function getDateRange(period: 'all' | 'today' | '7d' | '30d'): { start_date?: string; end_date?: string } {
  if (period === 'all') return {};
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const end = new Date();
  const start = new Date();
  if (period === 'today') {
    return { start_date: formatDate(start), end_date: formatDate(end) };
  }
  start.setDate(end.getDate() - (period === '7d' ? 6 : 29));
  return { start_date: formatDate(start), end_date: formatDate(end) };
}

export function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [recentOrdersData, setRecentOrdersData] = useState<RecentOrderItem[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'all' | 'today' | '7d' | '30d'>('all');

  const [clientSearch, setClientSearch] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('all');
  const [clientPage, setClientPage] = useState(0);
  const [clientRowsPerPage, setClientRowsPerPage] = useState(10);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    setOverviewError(null);
    try {
      const range = getDateRange(period);
      const [overviewRes, recentRes] = await Promise.all([
        DashboardService.getOverview(range.start_date, range.end_date),
        DashboardService.getRecentOrders(5),
      ]);
      setOverview(overviewRes);
      setRecentOrdersData(Array.isArray(recentRes) ? recentRes : []);
    } catch (err) {
      setOverview(null);
      setRecentOrdersData([]);
      setOverviewError(err instanceof Error ? err.message : 'Impossible de charger la vue d\'ensemble');
    } finally {
      setLoadingOverview(false);
    }
  }, [period]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const statusCounts = useMemo(() => {
    const map = new Map<string, number>();
    (overview?.orders_by_status || []).forEach((s) => map.set(s.status, Number(s.count) || 0));
    return STATUS_META.map((meta) => ({
      status: meta.status,
      label: meta.label,
      color: meta.color,
      count: map.get(meta.status) || 0,
    }));
  }, [overview]);

  const statusMax = useMemo(() => Math.max(1, ...statusCounts.map((s) => s.count)), [statusCounts]);

  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label || 'Tout';

  const filteredClients = useMemo(() => {
    let result = clients;
    if (clientStatusFilter !== 'all') {
      const isActive = clientStatusFilter === 'active';
      result = result.filter((c) => c.is_active === isActive);
    }
    if (clientSearch.trim()) {
      const q = clientSearch.toLowerCase();
      result = result.filter((c) =>
        (c.full_name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [clients, clientStatusFilter, clientSearch]);

  const paginatedClients = useMemo(() => {
    const start = clientPage * clientRowsPerPage;
    return filteredClients.slice(start, start + clientRowsPerPage);
  }, [filteredClients, clientPage, clientRowsPerPage]);

  const fetchDashboardData = async () => {
    setLoadingStats(true);
    setLoadingClients(true);

    try {
      const [popularRes, clientsRes] = await Promise.all([
        productService.getProducts({ limit: 5, sort_by: 'is_featured', sort_order: 'desc' }),
        api.get('/api/v1/users/clients', { params: { skip: 0, limit: 100 } }).catch(() => ({ data: { items: [] } })),
      ]);

      setPopularProducts(popularRes.error ? [] : popularRes.data?.items || []);

      const clientsData: ClientWithStats[] = Array.isArray(clientsRes.data?.items)
        ? clientsRes.data.items
        : Array.isArray(clientsRes.data)
          ? clientsRes.data
          : [];
      setClients(clientsData);
    } catch {
      setPopularProducts([]);
    } finally {
      setLoadingStats(false);
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    setClientPage(0);
  }, [clientSearch, clientStatusFilter]);

  const getStatusChipSx = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      pending: { bg: alpha(C.status.warning, 0.12), color: C.status.warning },
      confirmed: { bg: alpha(BRAND.primary, 0.1), color: BRAND.primary },
      processing: { bg: alpha(BRAND.primary, 0.1), color: BRAND.primary },
      shipped: { bg: alpha(C.brand.active, 0.12), color: C.brand.active },
      delivered: { bg: alpha(C.status.success, 0.1), color: C.status.success },
      cancelled: { bg: alpha(C.status.error, 0.1), color: C.status.error },
      refunded: { bg: alpha(BRAND.muted, 0.15), color: BRAND.muted },
    };
    const c = colors[status] || { bg: alpha(BRAND.muted, 0.1), color: BRAND.muted };
    return { bgcolor: c.bg, color: c.color, fontWeight: 600, fontSize: 13.75 };
  };

  return (
    <Box sx={{ bgcolor: BRAND.surface, minHeight: '100vh', pb: 6 }}>
      <Box
        sx={{
          bgcolor: BRAND.dark,
          color: BRAND.white,
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3.5, md: 4.5 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 350,
            height: 350,
            borderRadius: '50%',
            bgcolor: alpha(BRAND.white, 0.06),
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1500, mx: 'auto' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Box>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: 55,
                    height: 55,
                    borderRadius: '15px',
                    bgcolor: alpha(BRAND.white, 0.15),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AdminPanelSettings sx={{ fontSize: 32.5 }} />
                </Box>
                <Typography sx={{ fontSize: { xs: 30, md: 37.5 }, fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Dashboard Administrateur
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: 17.5, opacity: 0.9 }}>
                Bienvenue{user?.full_name ? `, ${user.full_name}` : ''} — gérez votre boutique DameDéco
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1500, mx: 'auto', px: { xs: 2, sm: 3 }, mt: -2, position: 'relative', zIndex: 2 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: '17.5px',
            border: `1px solid ${BRAND.border}`,
            bgcolor: BRAND.white,
            mb: 3,
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_e: any, v: number) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 56,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 16.25,
                color: BRAND.muted,
                minHeight: 56,
              },
              '& .Mui-selected': { color: `${BRAND.primary} !important` },
              '& .MuiTabs-indicator': { height: 3.75, bgcolor: BRAND.primary },
            }}
          >
            <Tab icon={<LayoutDashboard sx={{ fontSize: 25 }} />} iconPosition="start" label="Vue d'ensemble" />
            <Tab icon={<Package sx={{ fontSize: 25 }} />} iconPosition="start" label="Produits" />
            <Tab icon={<Category sx={{ fontSize: 25 }} />} iconPosition="start" label="Catégories" />
            <Tab icon={<ShoppingCart sx={{ fontSize: 25 }} />} iconPosition="start" label="Commandes" />
            <Tab icon={<Users sx={{ fontSize: 25 }} />} iconPosition="start" label="Clients" />
            <Tab icon={<Settings sx={{ fontSize: 25 }} />} iconPosition="start" label="Livraison" />
          </Tabs>
        </Paper>

        {/* Vue d'ensemble */}
        <CustomTabPanel value={activeTab} index={0}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: 2.5 }}
          >
            <Box>
              <Typography sx={{ fontSize: 22.5, fontWeight: 700, color: BRAND.dark }}>
                Vue d'ensemble
              </Typography>
              <Typography sx={{ fontSize: 15.5, color: BRAND.muted, mt: 0.25 }}>
                Statistiques issues du backend — période : {periodLabel}
              </Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel sx={{ color: BRAND.muted }}>Période</InputLabel>
              <Select
                value={period}
                label="Période"
                onChange={(e: React.ChangeEvent<{ value: unknown }>) => setPeriod(e.target.value as 'all' | 'today' | '7d' | '30d')}
                sx={{ borderRadius: '10px', bgcolor: BRAND.white }}
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {overviewError && (
            <Alert
              severity="error"
              variant="outlined"
              sx={{ mb: 2.5 }}
              onClose={() => setOverviewError(null)}
              action={
                <Button size="small" color="inherit" onClick={() => fetchOverview()}>
                  Réessayer
                </Button>
              }
            >
              {overviewError}
            </Alert>
          )}

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Revenu total"
                value={overview ? formatFcfa(Number(overview.total_revenue) || 0) : '—'}
                subtitle={period === 'all' ? 'Hors commandes annulées/remboursées' : `Sur ${periodLabel.toLowerCase()}`}
                icon={<DollarSign sx={{ fontSize: 30 }} />}
                loading={loadingOverview}
                accent={C.status.success}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Commandes"
                value={overview ? Number(overview.total_orders) || 0 : '—'}
                subtitle={period === 'all' ? 'Toutes commandes confondues' : `Sur ${periodLabel.toLowerCase()}`}
                icon={<ShoppingCart sx={{ fontSize: 30 }} />}
                loading={loadingOverview}
                accent={C.brand.main}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Panier moyen"
                value={overview ? formatFcfa(Number(overview.average_order_value) || 0) : '—'}
                subtitle="Revenu ÷ commandes"
                icon={<ReceiptIcon sx={{ fontSize: 30 }} />}
                loading={loadingOverview}
                accent={C.brand.active}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Produits"
                value={overview ? Number(overview.total_products) || 0 : '—'}
                subtitle="Catalogue (total backend)"
                icon={<Package sx={{ fontSize: 30 }} />}
                loading={loadingOverview}
                accent={C.status.warning}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Clients"
                value={overview ? Number(overview.total_clients) || 0 : '—'}
                subtitle={period === 'all' ? 'Comptes enregistrés' : 'Sur la période sélectionnée'}
                icon={<Users sx={{ fontSize: 30 }} />}
                loading={loadingOverview}
                accent={C.accent.main}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper
                elevation={0}
                sx={{ borderRadius: '20px', border: `1px solid ${BRAND.border}`, bgcolor: BRAND.white, overflow: 'hidden' }}
              >
                <Box sx={{ px: 2.5, py: 2, bgcolor: BRAND.light, borderBottom: `1px solid ${BRAND.border}` }}>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: BRAND.dark }}>
                    Répartition par statut
                  </Typography>
                </Box>
                <Box sx={{ p: 2.5 }}>
                  {loadingOverview ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={32} sx={{ color: BRAND.primary }} />
                    </Box>
                  ) : !overview || statusCounts.every((s) => s.count === 0) ? (
                    <Typography sx={{ fontSize: 17.5, color: BRAND.muted, textAlign: 'center', py: 3 }}>
                      Aucune commande sur la période sélectionnée
                    </Typography>
                  ) : (
                    <Stack spacing={1.75}>
                      {statusCounts.map(({ status, label, color, count }) => (
                        <Box key={status}>
                          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                              <Typography sx={{ fontSize: 15, fontWeight: 600, color: BRAND.dark }}>{label}</Typography>
                            </Stack>
                            <Typography sx={{ fontSize: 15, fontWeight: 700, color: BRAND.dark }}>{count}</Typography>
                          </Stack>
                          <Box sx={{ height: 9, borderRadius: '99px', bgcolor: BRAND.surface, overflow: 'hidden' }}>
                            <Box
                              sx={{
                                height: '100%',
                                width: `${Math.round((count / statusMax) * 100)}%`,
                                borderRadius: '99px',
                                bgcolor: color,
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper
                elevation={0}
                sx={{ borderRadius: '20px', border: `1px solid ${BRAND.border}`, bgcolor: BRAND.white, overflow: 'hidden' }}
              >
                <Box sx={{ px: 2.5, py: 2, bgcolor: BRAND.light, borderBottom: `1px solid ${BRAND.border}` }}>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: BRAND.dark }}>
                    Commandes récentes
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  {loadingOverview ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={32} sx={{ color: BRAND.primary }} />
                    </Box>
                  ) : recentOrdersData.length === 0 ? (
                    <Typography sx={{ fontSize: 17.5, color: BRAND.muted, textAlign: 'center', py: 3 }}>
                      Aucune commande pour le moment
                    </Typography>
                  ) : (
                    <Stack spacing={1.25}>
                      {recentOrdersData.map((order) => (
                        <Box
                          key={order.id}
                          sx={{
                            p: 1.5,
                            borderRadius: '12.5px',
                            border: `1px solid ${BRAND.border}`,
                            bgcolor: BRAND.surface,
                          }}
                        >
                          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontSize: 17.5, fontWeight: 600, color: BRAND.dark }} noWrap>
                                {getOrderCustomerName(order)}
                              </Typography>
                              <Typography sx={{ fontSize: 15, color: BRAND.muted }}>
                                {order.order_number || `#${order.id}`}
                                {order.created_at ? ` · ${new Date(order.created_at).toLocaleDateString('fr-FR')}` : ''}
                                {typeof order.items_count === 'number' ? ` · ${order.items_count} article${order.items_count > 1 ? 's' : ''}` : ''}
                              </Typography>
                              {order.email ? (
                                <Typography sx={{ fontSize: 13.5, color: BRAND.muted, mt: 0.25 }} noWrap>
                                  {order.email}
                                </Typography>
                              ) : null}
                            </Box>
                            <Chip label={order.status || '—'} size="small" sx={{ ...getStatusChipSx(order.status || ''), flexShrink: 0 }} />
                          </Stack>
                          <Typography sx={{ fontSize: 17.5, fontWeight: 700, color: BRAND.primary, mt: 0.75 }}>
                            {typeof order.total_amount === 'number' ? formatFcfa(Number(order.total_amount) || 0) : '—'}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Paper
                elevation={0}
                sx={{ borderRadius: '20px', border: `1px solid ${BRAND.border}`, bgcolor: BRAND.white, overflow: 'hidden' }}
              >
                <Box sx={{ px: 2.5, py: 2, bgcolor: BRAND.light, borderBottom: `1px solid ${BRAND.border}` }}>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: BRAND.dark }}>
                    Produits populaires
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  {loadingStats ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={32} sx={{ color: BRAND.primary }} />
                    </Box>
                  ) : popularProducts.length === 0 ? (
                    <Typography sx={{ fontSize: 17.5, color: BRAND.muted, textAlign: 'center', py: 3 }}>
                      Aucun produit mis en avant
                    </Typography>
                  ) : (
                    <Grid container spacing={1.5}>
                      {popularProducts.map((product) => (
                        <Grid key={product.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: '12.5px',
                              border: `1px solid ${BRAND.border}`,
                              bgcolor: BRAND.surface,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 2,
                              height: '100%',
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontSize: 16.25, fontWeight: 600, color: BRAND.dark }} noWrap>
                                {product.name}
                              </Typography>
                              <Typography sx={{ fontSize: 15, color: BRAND.muted }}>
                                Stock : {product.inventory_quantity ?? '—'}
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize: 16.25, fontWeight: 700, color: BRAND.primary, flexShrink: 0 }}>
                              {formatFcfa(Number(product.price) || 0)}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={1}>
          <ProductManagement />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={2}>
          <CategoriesManagement />
        </CustomTabPanel>

        {/* Commandes */}
        <CustomTabPanel value={activeTab} index={3}>
          <AdminOrderManagement initialCustomerId={selectedCustomerId} />
        </CustomTabPanel>

        {/* Clients */}
        <CustomTabPanel value={activeTab} index={4}>
          <Paper
            elevation={0}
            sx={{ borderRadius: '20px', border: `1px solid ${BRAND.border}`, bgcolor: BRAND.white, overflow: 'hidden' }}
          >
            <Box sx={{ px: 2.5, py: 2, bgcolor: BRAND.light, borderBottom: `1px solid ${BRAND.border}` }}>
              <Typography sx={{ fontSize: 22.5, fontWeight: 700, color: BRAND.dark }}>
                Clients
              </Typography>
              <Typography sx={{ fontSize: 16.25, color: BRAND.muted }}>
                {loadingClients
                  ? 'Chargement…'
                  : `${filteredClients.length} client${filteredClients.length !== 1 ? 's' : ''} sur ${clients.length}`}
              </Typography>
            </Box>

            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${BRAND.border}`, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Rechercher un client..."
                value={clientSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClientSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 220 }}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ color: BRAND.muted, mr: 1, fontSize: 20 }} />,
                  },
                }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel sx={{ color: BRAND.muted }}>Statut</InputLabel>
                <Select
                  value={clientStatusFilter}
                  label="Statut"
                  onChange={(e: React.ChangeEvent<{ value: unknown }>) => setClientStatusFilter(e.target.value as string)}
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="all">Tous les statuts</MenuItem>
                  <MenuItem value="active">Actif</MenuItem>
                  <MenuItem value="inactive">Inactif</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {loadingClients ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: BRAND.primary }} />
              </Box>
            ) : filteredClients.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Users sx={{ fontSize: 60, color: BRAND.border, mb: 1 }} />
                <Typography sx={{ color: BRAND.muted }}>
                  {clients.length === 0 ? 'Aucun client enregistré' : 'Aucun client ne correspond aux filtres'}
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: BRAND.dark,
                          '& th': {
                            color: BRAND.white,
                            fontWeight: 600,
                            fontSize: 15,
                            py: 1.5,
                            borderBottom: 'none',
                          },
                        }}
                      >
                        <TableCell>Nom</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Téléphone</TableCell>
                        <TableCell align="right">Total dépensé</TableCell>
                        <TableCell align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedClients.map((client, i) => (
                        <TableRow
                          key={client.id}
                          sx={{
                            bgcolor: i % 2 === 0 ? BRAND.white : BRAND.surface,
                            '& td': { borderColor: BRAND.border, py: 1.5 },
                          }}
                        >
                          <TableCell>
                            <Typography sx={{ fontSize: 17.5, fontWeight: 600, color: BRAND.dark }}>
                              {client.full_name || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 16.25, color: BRAND.muted }}>{client.email || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 16.25, color: BRAND.muted }}>{client.phone || '—'}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontSize: 17.5, fontWeight: 600, color: BRAND.primary }}>
                              {formatFcfa(client.total_spent)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Voir les commandes">
                              <IconButton
                                onClick={() => {
                                  setSelectedCustomerId(client.id);
                                  setActiveTab(3);
                                }}
                                sx={{ color: BRAND.primary }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredClients.length}
                  page={clientPage}
                  onPageChange={(_e: React.MouseEvent<HTMLButtonElement> | null, p: number) => setClientPage(p)}
                  rowsPerPage={clientRowsPerPage}
                  onRowsPerPageChange={(e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => { setClientRowsPerPage(Number(e.target.value)); setClientPage(0); }}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Lignes par page"
                  labelDisplayedRows={({ from, to, count }: { from: number; to: number; count: number }) => `${from}–${to} sur ${count}`}
                  sx={{
                    borderTop: `1px solid ${BRAND.border}`,
                    '& .MuiTablePagination-toolbar': { minHeight: 52 },
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                      color: BRAND.muted,
                      fontSize: 15,
                    },
                    '& .MuiIconButton-root': { color: BRAND.primary },
                  }}
                />
              </>
            )}
          </Paper>
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={5}>
          <ShippingManagement />
        </CustomTabPanel>
      </Box>
    </Box>
  );
}
