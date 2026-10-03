'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Typography,
  Box,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Chip,
  Stack,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  TablePagination,
  Tooltip,
  Alert,
  FormControlLabel,
  Switch,
  alpha,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Dashboard as DashboardIcon,
  ManageAccounts as ManageAccountsIcon,
  CheckCircleOutlined,
  CancelOutlined,
  ShieldOutlined,
  ArrowForward,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { safeApiCall } from '@/lib/error-handler';
import { tokens } from '@/theme/tokens';
import { SuperAdminService, type SuperAdminStats } from '@/services/superadmin.service';

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

type User = {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role?: 'admin' | 'client' | 'superadmin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string | null;
};

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent = BRAND.primary,
  loading = false,
}: {
  title: string;
  value?: string | number;
  subtitle: string;
  icon: React.ReactNode;
  accent?: string;
  loading?: boolean;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: '16px',
        border: `1px solid ${BRAND.border}`,
        bgcolor: BRAND.white,
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        '&:hover': {
          boxShadow: `0 12px 32px ${alpha(BRAND.primary, 0.12)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              bgcolor: alpha(accent, 0.1),
              color: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, color: BRAND.muted, fontWeight: 500, mb: 0.5 }}>
              {title}
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 31 }}>
                <CircularProgress size={22} sx={{ color: accent }} />
              </Box>
            ) : (
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: BRAND.dark, lineHeight: 1.1 }}>
                {value ?? '—'}
              </Typography>
            )}
            <Typography sx={{ fontSize: 12, color: BRAND.muted, mt: 0.5 }}>
              {subtitle}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function QuickActionButton({
  label,
  href,
  onClick,
  icon,
  variant = 'primary',
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  variant?: 'primary' | 'outline';
}) {
  const isPrimary = variant === 'primary';
  const sx = {
    py: 1.5,
    px: 2,
    justifyContent: 'space-between',
    borderRadius: '12px',
    textTransform: 'none' as const,
    fontWeight: 600,
    fontSize: 14,
    width: '100%',
    boxShadow: 'none',
    ...(isPrimary
      ? {
          bgcolor: BRAND.primary,
          color: BRAND.white,
          '&:hover': { bgcolor: BRAND.dark, boxShadow: 'none' },
        }
      : {
          bgcolor: BRAND.white,
          color: BRAND.dark,
          border: `1px solid ${BRAND.border}`,
          '&:hover': { bgcolor: BRAND.surface, borderColor: BRAND.primary },
        }),
  };

  const endIcon = <ArrowForward sx={{ fontSize: 18, opacity: 0.7 }} />;

  if (href) {
    return (
      <Button component={Link} href={href} variant={isPrimary ? 'contained' : 'outlined'} startIcon={icon} endIcon={endIcon} sx={sx}>
        {label}
      </Button>
    );
  }

  return (
    <Button variant={isPrimary ? 'contained' : 'outlined'} startIcon={icon} endIcon={endIcon} onClick={onClick} sx={sx}>
      {label}
    </Button>
  );
}

function formatLastLogin(value?: string | null): string {
  if (!value) return 'Jamais connecté';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Jamais connecté';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const { user, isAuthenticated, loading: authLoading, accessToken } = useAuth();

  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'admin' as 'admin' | 'client',
    is_active: true,
  });

  const filteredUsers = useMemo(() => {
    let result = users;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (u) =>
          u.username?.toLowerCase().includes(q) ||
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q),
      );
    }
    if (statusFilter === 'active') result = result.filter((u) => u.is_active);
    else if (statusFilter === 'inactive') result = result.filter((u) => !u.is_active);
    return result;
  }, [users, searchFilter, statusFilter]);

  const paginatedUsers = useMemo(
    () => filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredUsers, page, rowsPerPage],
  );

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);

    try {
      if (!isAuthenticated || !accessToken) {
        router.push('/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const result = await safeApiCall(async () => {
        const response = await fetch(`${apiUrl}/api/v1/users/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          }
          if (response.status === 404) {
            throw new Error('Endpoint utilisateurs non trouvé. Le backend est-il démarré ?');
          }
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        return response.json();
      });

      if (result.error) {
        setUsersError(result.error.message);
        return;
      }

      const data = result.data;
      let usersData: User[] = [];

      if (data.items && Array.isArray(data.items)) {
        usersData = data.items.filter((u: User) => {
          const role = u.role?.toLowerCase().trim();
          return role === 'admin' || role === 'administrator';
        });
      } else if (Array.isArray(data)) {
        usersData = data.filter(
          (u: User) =>
            u.role === 'admin' ||
            (u.username && u.username.includes('admin')) ||
            (u.email && u.email.includes('admin')),
        );
      }

      setUsers(usersData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible de charger les utilisateurs';
      setUsersError(message);
    } finally {
      setUsersLoading(false);
    }
  }, [isAuthenticated, accessToken, router]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);

    try {
      if (!isAuthenticated || !accessToken) {
        router.push('/login');
        return;
      }

      const result = await safeApiCall(() => SuperAdminService.getStats());

      if (result.error) {
        setStatsError(result.error.message);
        return;
      }

      setStats(result.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible de charger les statistiques administrateurs';
      setStatsError(message);
    } finally {
      setStatsLoading(false);
    }
  }, [isAuthenticated, accessToken, router]);

  const handleEditUser = (target: User) => {
    setUserToEdit(target);
    setEditForm({
      name: target.full_name,
      email: target.email,
      role: (target.role === 'superadmin' ? 'admin' : target.role) || 'client',
      is_active: target.is_active,
    });
    setEditDialogOpen(true);
    handleCloseMenu();
  };

  const handleUpdateUser = async () => {
    if (!userToEdit) return;

    try {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Non authentifié');
      }

      const updateData = {
        full_name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        is_active: editForm.is_active,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${userToEdit.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || `Erreur ${res.status}`);
      }

      setSuccess('Utilisateur mis à jour avec succès');
      setEditDialogOpen(false);
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setUsersError(message);
    }
  };

  const handleDeleteUser = (target: User) => {
    if (target.role === 'superadmin') {
      setUsersError('Impossible de supprimer un SuperAdmin');
      return;
    }
    setUserToDelete(target);
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Non authentifié');
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }

      setSuccess('Utilisateur supprimé avec succès');
      setDeleteDialogOpen(false);
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setUsersError(message);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, target: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(target);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'SuperAdmin';
      case 'admin':
        return 'Admin';
      case 'client':
        return 'Client';
      default:
        return role;
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'superadmin') {
      loadUsers();
      loadStats();
    }
  }, [authLoading, isAuthenticated, user, loadUsers, loadStats]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'superadmin') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          bgcolor: BRAND.surface,
        }}
      >
        <CircularProgress sx={{ color: BRAND.primary }} size={48} />
        <Typography sx={{ color: BRAND.muted, fontWeight: 500 }}>Chargement du tableau de bord…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4, px: 2 }}>
        <Alert severity="error" variant="outlined" sx={{ animation: 'slideUp 0.35s ease-out', '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: BRAND.surface, minHeight: '100vh', pb: 6 }}>
      {/* Hero */}
      <Box
        sx={{
          bgcolor: BRAND.dark,
          color: BRAND.white,
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 4, md: 5 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1200, mx: 'auto' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
            <Box>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    bgcolor: alpha(BRAND.white, 0.15),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AdminPanelSettingsIcon sx={{ fontSize: 26 }} />
                </Box>
                <Typography sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 700, letterSpacing: '-0.02em' }}>
                  SuperAdmin
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: 15, opacity: 0.9, mb: 2 }}>
                Bienvenue, <strong>{user?.full_name || 'SuperAdmin'}</strong> — gestion de la plateforme DameDéco
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Chip
                  icon={<ShieldOutlined sx={{ fontSize: '16px !important', color: `${BRAND.white} !important` }} />}
                  label="Accès sécurisé"
                  size="small"
                  sx={{
                    bgcolor: alpha(BRAND.white, 0.12),
                    color: BRAND.white,
                    border: `1px solid ${alpha(BRAND.white, 0.2)}`,
                    fontWeight: 600,
                  }}
                />
                <Chip
                  label="Rôle SuperAdmin"
                  size="small"
                  sx={{
                    bgcolor: alpha(BRAND.white, 0.12),
                    color: BRAND.white,
                    border: `1px solid ${alpha(BRAND.white, 0.2)}`,
                    fontWeight: 600,
                  }}
                />
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, mt: -3, position: 'relative', zIndex: 2 }}>
        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '14px',
            border: `1px solid ${BRAND.border}`,
            bgcolor: BRAND.white,
            mb: 3,
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(_e: React.SyntheticEvent, v: number) => setTabValue(v)}
            variant="fullWidth"
            sx={{
              minHeight: 56,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 14,
                color: BRAND.muted,
                minHeight: 56,
              },
              '& .Mui-selected': {
                color: `${BRAND.primary} !important`,
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                bgcolor: BRAND.primary,
              },
            }}
          >
            <Tab icon={<DashboardIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Vue d'ensemble" />
            <Tab icon={<ManageAccountsIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Administrateurs" />
          </Tabs>
        </Paper>

        {usersError && (
          <Alert severity="error" variant="outlined" sx={{ mb: 2, animation: 'slideUp 0.35s ease-out', '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }} onClose={() => setUsersError(null)}>
            {usersError}
          </Alert>
        )}
        {statsError && (
          <Alert severity="error" variant="outlined" sx={{ mb: 2, animation: 'slideUp 0.35s ease-out', '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }} onClose={() => setStatsError(null)}>
            {statsError}
          </Alert>
        )}
        {success && (
          <Alert severity="success" variant="outlined" sx={{ mb: 2, animation: 'slideUp 0.35s ease-out', '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Vue d'ensemble */}
        {tabValue === 0 && (
          <Box>
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  title="Total administrateurs"
                  value={stats?.total_admins}
                  loading={statsLoading}
                  subtitle="Comptes admin enregistrés"
                  icon={<PeopleIcon />}
                  accent={BRAND.primary}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  title="Administrateurs actifs"
                  value={stats?.active_admins}
                  loading={statsLoading}
                  subtitle="Comptes actuellement actifs"
                  icon={<CheckCircleOutlined />}
                  accent={C.status.success}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  title="Administrateurs inactifs"
                  value={stats?.inactive_admins}
                  loading={statsLoading}
                  subtitle="Comptes désactivés"
                  icon={<CancelOutlined />}
                  accent={BRAND.muted}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  title="Sécurité"
                  value="OK"
                  subtitle="Authentification & API"
                  icon={<SecurityIcon />}
                  accent={BRAND.dark}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    border: `1px solid ${BRAND.border}`,
                    bgcolor: BRAND.white,
                    height: '100%',
                  }}
                >
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: BRAND.dark, mb: 2.5 }}>
                    Actions rapides
                  </Typography>
                  <Stack spacing={1.5}>
                    <QuickActionButton
                      label="Gérer les administrateurs"
                      onClick={() => setTabValue(1)}
                      icon={<ManageAccountsIcon />}
                      variant="primary"
                    />
                    <QuickActionButton
                      label="Créer un administrateur"
                      href="/users/create"
                      icon={<AddIcon />}
                      variant="outline"
                    />
                    <QuickActionButton
                      label="Paramètres système"
                      href="/settings"
                      icon={<SettingsIcon />}
                      variant="outline"
                    />
                    <QuickActionButton
                      label="Sécurité & monitoring"
                      href="/admin/security/summary"
                      icon={<SecurityIcon />}
                      variant="outline"
                    />
                  </Stack>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    border: `1px solid ${BRAND.border}`,
                    bgcolor: BRAND.white,
                    height: '100%',
                  }}
                >
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: BRAND.dark, mb: 2.5 }}>
                    État du système
                  </Typography>
                  <Stack spacing={2}>
                    {[
                      { label: 'Backend API', value: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000' },
                      { label: 'Votre rôle', value: 'SuperAdmin' },
                      { label: 'Session', value: isAuthenticated ? 'Connectée' : 'Non connectée' },
                      { label: 'Dernière synchro', value: usersLoading ? 'En cours…' : 'À jour' },
                    ].map((row) => (
                      <Box
                        key={row.label}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1.25,
                          px: 1.5,
                          borderRadius: '10px',
                          bgcolor: BRAND.surface,
                          border: `1px solid ${BRAND.border}`,
                          gap: 2,
                        }}
                      >
                        <Typography sx={{ fontSize: 13, color: BRAND.muted, fontWeight: 500 }}>
                          {row.label}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: BRAND.dark,
                            textAlign: 'right',
                            wordBreak: 'break-all',
                          }}
                        >
                          {row.value}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Gestion administrateurs */}
        {tabValue === 1 && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: '16px',
              border: `1px solid ${BRAND.border}`,
              bgcolor: BRAND.white,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: { xs: 2, sm: 3 },
                py: 2.5,
                bgcolor: BRAND.light,
                borderBottom: `1px solid ${BRAND.border}`,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: BRAND.dark }}>
                  Liste des administrateurs
                </Typography>
                <Typography sx={{ fontSize: 13, color: BRAND.muted, mt: 0.25 }}>
                  {filteredUsers.length} administrateur{filteredUsers.length !== 1 ? 's' : ''} trouvé{filteredUsers.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadUsers}
                  disabled={usersLoading}
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: BRAND.border,
                    color: BRAND.dark,
                    '&:hover': { borderColor: BRAND.primary, bgcolor: alpha(BRAND.primary, 0.04) },
                  }}
                >
                  Actualiser
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/users/create')}
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: BRAND.primary,
                    boxShadow: 'none',
                    '&:hover': { bgcolor: BRAND.dark, boxShadow: 'none' },
                  }}
                >
                  Créer un admin
                </Button>
              </Stack>
            </Box>

            {users.length > 0 && (
              <Box
                sx={{
                  px: { xs: 1.5, sm: 2.5 },
                  py: 2,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  alignItems: 'center',
                  borderBottom: `1px solid ${BRAND.border}`,
                }}
              >
                <TextField
                  size="small"
                  placeholder="Rechercher un admin..."
                  value={searchFilter}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchFilter(e.target.value);
                    setPage(0);
                  }}
                  sx={{
                    flex: '1 1 220px',
                    '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 13 },
                  }}
                />
                <Stack direction="row" spacing={1}>
                  {(['all', 'active', 'inactive'] as const).map((opt) => (
                    <Chip
                      key={opt}
                      label={opt === 'all' ? 'Tous' : opt === 'active' ? 'Actifs' : 'Inactifs'}
                      onClick={() => { setStatusFilter(opt); setPage(0); }}
                      variant={statusFilter === opt ? 'filled' : 'outlined'}
                      sx={{
                        fontWeight: 600,
                        fontSize: 12,
                        borderRadius: '8px',
                        bgcolor: statusFilter === opt ? BRAND.primary : 'transparent',
                        color: statusFilter === opt ? BRAND.white : BRAND.muted,
                        border: `1px solid ${statusFilter === opt ? BRAND.primary : BRAND.border}`,
                        '&:hover': { bgcolor: statusFilter === opt ? BRAND.dark : alpha(BRAND.primary, 0.06) },
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {usersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: BRAND.primary }} />
              </Box>
            ) : users.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
                <PeopleIcon sx={{ fontSize: 48, color: BRAND.border, mb: 1 }} />
                <Typography sx={{ color: BRAND.muted, fontWeight: 500 }}>Aucun administrateur trouvé</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/users/create')}
                  sx={{ mt: 2, bgcolor: BRAND.primary, borderRadius: '10px', textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
                >
                  Créer le premier admin
                </Button>
              </Box>
            ) : filteredUsers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
                <PeopleIcon sx={{ fontSize: 48, color: BRAND.border, mb: 1 }} />
                <Typography sx={{ color: BRAND.muted, fontWeight: 500 }}>Aucun résultat pour votre recherche</Typography>
                <Button
                  variant="outlined"
                  onClick={() => { setSearchFilter(''); setStatusFilter('all'); }}
                  sx={{ mt: 2, borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: BRAND.border, color: BRAND.dark }}
                >
                  Réinitialiser les filtres
                </Button>
              </Box>
            ) : (
              <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                <TableContainer sx={{ borderRadius: '12px', border: `1px solid ${BRAND.border}` }}>
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: BRAND.dark,
                          '& th': {
                            color: BRAND.white,
                            fontWeight: 600,
                            fontSize: 12,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            borderBottom: 'none',
                            py: 1.5,
                          },
                        }}
                      >
                        <TableCell>ID</TableCell>
                        <TableCell>Administrateur</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Rôle</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Dernière connexion</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedUsers.map((row, index) => (
                        <TableRow
                          key={row.id}
                          hover
                          sx={{
                            bgcolor: index % 2 === 0 ? BRAND.white : BRAND.surface,
                            '&:hover': { bgcolor: alpha(BRAND.primary, 0.04) },
                            '& td': { borderColor: BRAND.border, py: 1.75 },
                          }}
                        >
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: BRAND.primary }}>
                              #{row.id}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                              <Avatar
                                sx={{
                                  width: 40,
                                  height: 40,
                                  bgcolor: row.is_active ? BRAND.primary : BRAND.muted,
                                  fontSize: 14,
                                  fontWeight: 700,
                                }}
                              >
                                {row.full_name?.charAt(0) || row.username?.charAt(0) || '?'}
                              </Avatar>
                              <Box>
                                <Typography sx={{ fontSize: 14, fontWeight: 600, color: BRAND.dark }}>
                                  {row.full_name || row.username}
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: BRAND.muted }}>@{row.username}</Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, color: BRAND.muted, wordBreak: 'break-word' }}>
                              {row.email || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getRoleLabel(row.role || 'client')}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: 11,
                                bgcolor: alpha(BRAND.primary, 0.1),
                                color: BRAND.primary,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={row.is_active ? 'Actif' : 'Inactif'}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: 11,
                                bgcolor: row.is_active ? alpha(C.status.success, 0.1) : alpha(BRAND.muted, 0.15),
                                color: row.is_active ? C.status.success : BRAND.muted,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, color: BRAND.muted }}>
                              {formatLastLogin(row.last_login)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Actions">
                              <IconButton
                                size="small"
                                onClick={(e: React.MouseEvent<HTMLElement>) => handleMenuClick(e, row)}
                                sx={{
                                  borderRadius: '8px',
                                  color: BRAND.dark,
                                  '&:hover': { bgcolor: alpha(BRAND.primary, 0.1), color: BRAND.primary },
                                }}
                              >
                                <MoreVertIcon fontSize="small" />
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
                  count={filteredUsers.length}
                  page={page}
                  onPageChange={(_e: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Lignes par page"
                  labelDisplayedRows={({ from, to, count }: { from: number; to: number; count: number }) => `${from}–${to} sur ${count !== -1 ? count : `plus de ${to}`}`}
                  sx={{
                    borderTop: `1px solid ${BRAND.border}`,
                    '& .MuiTablePagination-toolbar': { minHeight: 52 },
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: 13, color: BRAND.muted },
                    '& .MuiTablePagination-select': { fontSize: 13 },
                  }}
                />
              </Box>
            )}
          </Paper>
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '12px',
              border: `1px solid ${BRAND.border}`,
              minWidth: 180,
              boxShadow: `0 8px 24px ${alpha(BRAND.dark, 0.12)}`,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => selectedUser && handleEditUser(selectedUser)}
          sx={{ borderRadius: '8px', mx: 0.5, fontSize: 14 }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ color: BRAND.primary }} />
          </ListItemIcon>
          <ListItemText>Modifier</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => selectedUser && handleDeleteUser(selectedUser)}
          disabled={selectedUser?.role === 'superadmin'}
          sx={{ borderRadius: '8px', mx: 0.5, fontSize: 14, color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Supprimer</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        slotProps={{
          paper: {
            sx: { borderRadius: '16px', maxWidth: 440 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: BRAND.dark, pb: 1 }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: BRAND.muted, mb: 2 }}>
            Supprimer l&apos;administrateur{' '}
            <strong style={{ color: BRAND.dark }}>
              {userToDelete?.full_name || userToDelete?.username}
            </strong>{' '}
            ({userToDelete?.email}) ?
          </Typography>
          <Alert severity="warning" variant="outlined">
            Cette action est irréversible.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}>
            Annuler
          </Button>
          <Button
            onClick={confirmDeleteUser}
            color="error"
            variant="contained"
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', boxShadow: 'none' }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: '16px' },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: BRAND.dark, pb: 1 }}>
          Modifier l&apos;administrateur
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nom complet"
            value={editForm.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, name: e.target.value })}
            margin="normal"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <TextField
            fullWidth
            label="Email"
            value={editForm.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, email: e.target.value })}
            margin="normal"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <Box sx={{ mt: 2, p: 2, borderRadius: '10px', bgcolor: BRAND.surface, border: `1px solid ${BRAND.border}` }}>
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.is_active}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  sx={{
                    '& .Mui-checked': { color: BRAND.primary },
                    '& .Mui-checked + .MuiSwitch-track': { bgcolor: BRAND.primary },
                  }}
                />
              }
              label={<Typography sx={{ fontSize: 14, fontWeight: 500, color: BRAND.dark }}>Compte actif</Typography>}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}>
            Annuler
          </Button>
          <Button
            onClick={handleUpdateUser}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '10px',
              bgcolor: BRAND.primary,
              boxShadow: 'none',
              '&:hover': { bgcolor: BRAND.dark, boxShadow: 'none' },
            }}
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
