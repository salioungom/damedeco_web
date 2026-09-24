'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Badge,
  InputBase,
  Box,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Typography,
  Stack,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  alpha,
} from '@mui/material';
import {
  ShoppingCartOutlined,
  PersonOutlined,
  Menu as MenuIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  AdminPanelSettingsOutlined,
  DashboardOutlined,
  LogoutOutlined,
  AccountCircleOutlined,
  FavoriteBorder,
  StorefrontOutlined,
  HomeOutlined,
  InfoOutlined,
  EmailOutlined,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useStore } from '@/store/useStore';
import { BrandMark } from './ui/BrandMark';
import { tokens } from '@/theme/tokens';

/** Hauteur fixe de la navbar — utilisée pour le padding du layout */
export const NAVBAR_HEIGHT = { xs: 72, sm: 80, md: 90 };

const ACTION_SIZE = { xs: 42, sm: 46, md: 50 };
const ICON_SIZE = { xs: 22, sm: 24, md: 27.5 };

type NavItem = { label: string; path: string; icon: React.ReactNode };

const NAV_ITEMS: NavItem[] = [
  { label: 'Accueil', path: '/', icon: <HomeOutlined sx={{ fontSize: { xs: 20, sm: 22, md: ICON_SIZE } }} /> },
  { label: 'Boutique', path: '/shop', icon: <StorefrontOutlined sx={{ fontSize: { xs: 20, sm: 22, md: ICON_SIZE } }} /> },
  { label: 'À propos', path: '/about', icon: <InfoOutlined sx={{ fontSize: { xs: 20, sm: 22, md: ICON_SIZE } }} /> },
  { label: 'Contact', path: '/contact', icon: <EmailOutlined sx={{ fontSize: { xs: 20, sm: 22, md: ICON_SIZE } }} /> },
];

/** Bouton d'action à taille fixe — évite tout décalage au clic / hover */
const NavActionButton = memo(function NavActionButton({
  children,
  onClick,
  href,
  ariaLabel,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  ariaLabel: string;
  active?: boolean;
}) {
  const theme = useTheme();

  const sx = {
    width: typeof ACTION_SIZE === 'object' ? ACTION_SIZE : ACTION_SIZE,
    height: typeof ACTION_SIZE === 'object' ? ACTION_SIZE : ACTION_SIZE,
    minWidth: typeof ACTION_SIZE === 'object' ? ACTION_SIZE : ACTION_SIZE,
    minHeight: typeof ACTION_SIZE === 'object' ? ACTION_SIZE : ACTION_SIZE,
    p: 0,
    borderRadius: 1,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: active ? 'action.selected' : 'transparent',
    color: active ? theme.palette.text.primary : theme.palette.text.secondary,
    flexShrink: 0,
    transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease',
    '&:hover': {
      bgcolor: 'action.hover',
      color: theme.palette.text.primary,
      borderColor: theme.palette.text.secondary,
    },
    '& .MuiTouchRipple-root': { display: 'none' },
    '&:active': { transform: 'none' },
  };

  if (href) {
    return (
      <IconButton
        component={Link}
        href={href}
        aria-label={ariaLabel}
        disableRipple
        sx={sx}
      >
        {children}
      </IconButton>
    );
  }

  return (
    <IconButton
      aria-label={ariaLabel}
      onClick={onClick}
      disableRipple
      sx={sx}
    >
      {children}
    </IconButton>
  );
});

const Brand = memo(function Brand() {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      spacing={{ xs: 1, sm: 1.25 }}
      sx={{ alignItems: 'center', flexShrink: 0 }}
    >
      <BrandMark />
      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
        <Typography
          sx={{
            fontSize: { sm: 17, md: 18.75 },
            fontWeight: 700,
            color: theme.palette.text.primary,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
              DameDéco
        </Typography>
        <Typography
          sx={{
            fontSize: { sm: 11.5, md: 12.5 },
            color: theme.palette.text.secondary,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          Import & Commerce
        </Typography>
      </Box>
    </Stack>
  );
});

const NavLink = memo(function NavLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  return (
    <Button
      component={Link}
      href={item.path}
      disableRipple
      sx={{
        position: 'relative',
        borderRadius: 1,
        px: { xs: 1.25, md: 1.75 },
        py: { xs: 0.75, md: 1 },
        fontSize: { xs: 15, md: 17.5 },
        fontWeight: active ? 600 : 500,
        textTransform: 'none',
        color: active ? primary : theme.palette.text.secondary,
        bgcolor: 'transparent',
        minWidth: 'auto',
        flexShrink: 0,
        transition: 'color 0.15s ease',
        '&:hover': { bgcolor: 'action.hover', color: theme.palette.text.primary },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: { xs: 3, md: 4 },
          left: '50%',
          transform: active ? 'translateX(-50%) scaleX(1)' : 'translateX(-50%) scaleX(0)',
          width: '60%',
          height: { xs: 2, md: 2.5 },
          borderRadius: 1.25,
          bgcolor: primary,
          transition: 'transform 0.15s ease',
        },
        '& .MuiButton-startIcon': {
          mr: { xs: 0.5, md: 0.75 },
          ml: 0,
          '& svg': { fontSize: { xs: 18, md: 22.5 } },
        },
      }}
      startIcon={item.icon}
    >
      {item.label}
    </Button>
  );
});

const SearchField = memo(function SearchField({
  value,
  onChange,
  onSubmit,
  autoFocus,
  fullWidth,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  autoFocus?: boolean;
  fullWidth?: boolean;
}) {
  const theme = useTheme();

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{ width: fullWidth ? '100%' : { sm: 200, md: 275, lg: 325 } }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.75, sm: 1 },
          height: typeof ACTION_SIZE === 'object' ? ACTION_SIZE : ACTION_SIZE,
          px: { xs: 1, sm: 1.25, md: 1.5 },
          borderRadius: 1,
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'border-color 0.15s ease',
          '&:focus-within': {
            borderColor: theme.palette.primary.main,
            outline: `2px solid ${tokens.colors.status.focus}`,
            outlineOffset: '2px',
          },
        }}
      >
        <SearchIcon sx={{ fontSize: { xs: 18, sm: 20, md: 22.5 }, color: theme.palette.text.secondary, flexShrink: 0 }} />
        <InputBase
          placeholder="Rechercher un produit…"
          value={value}
          autoFocus={autoFocus}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          sx={{
            flex: 1,
            fontSize: { xs: 14, sm: 15, md: 16.25 },
            fontWeight: 500,
            color: theme.palette.text.primary,
            '& input::placeholder': {
              color: theme.palette.text.disabled,
              opacity: 1,
            },
          }}
        />
      </Box>
    </Box>
  );
});

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { user, logout, loading: authLoading } = useAuth();
  const isAdmin = useStore((s) => s.isAdmin);
  const toggleAdmin = useStore((s) => s.toggleAdmin);
  const cart = useStore((s) => s.cart);
  const toggleCart = useStore((s) => s.toggleCart);
  const favorites = useStore((s) => s.favorites);

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const cartCount = useMemo(
    () => (cart || []).reduce((acc, item) => acc + item.quantity, 0),
    [cart],
  );

  const favoriteCount = favorites?.length ?? 0;

  const profileMenuOpen = Boolean(profileAnchor);

  useEffect(() => {
    setProfileAnchor(null);
    setSearchOpen(false);
  }, [pathname]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery('');
        setSearchOpen(false);
      }
    },
    [searchQuery, router],
  );

  const openProfileMenu = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setProfileAnchor(e.currentTarget);
  }, []);

  const closeProfileMenu = useCallback(() => {
    setProfileAnchor(null);
  }, []);

  const userMenuItems = useMemo(() => {
    if (!user) return [];
    if (user.role === 'superadmin') {
      return [
        { label: 'Tableau de bord', icon: <DashboardOutlined fontSize="small" />, path: '/dashboards' },
        { label: 'Profil', icon: <AccountCircleOutlined fontSize="small" />, path: '/settings/profile' },
        { label: 'Déconnexion', icon: <LogoutOutlined fontSize="small" />, action: 'logout' as const },
      ];
    }
    if (user.role === 'admin') {
      return [
        { label: 'Tableau de bord', icon: <DashboardOutlined fontSize="small" />, path: '/dashboard' },
        { label: 'Profil', icon: <AccountCircleOutlined fontSize="small" />, path: '/settings/profile' },
        { label: 'Déconnexion', icon: <LogoutOutlined fontSize="small" />, action: 'logout' as const },
      ];
    }
    return [
      { label: 'Tableau de bord', icon: <DashboardOutlined fontSize="small" />, path: '/account' },
      { label: 'Profil', icon: <AccountCircleOutlined fontSize="small" />, path: '/settings/profile' },
      { label: 'Déconnexion', icon: <LogoutOutlined fontSize="small" />, action: 'logout' as const },
    ];
  }, [user]);

  const drawer = (
    <Box sx={{ width: { xs: '85%', sm: 320, md: 375 }, maxWidth: 375, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Brand />
        <NavActionButton ariaLabel="Fermer le menu" onClick={() => setMobileOpen(false)}>
          <CloseIcon sx={{ fontSize: { xs: 22, sm: 24, md: ICON_SIZE } }} />
        </NavActionButton>
      </Box>

      <Box sx={{ px: 2, py: 2, borderBottom: 1, borderColor: 'divider' }}>
        <SearchField
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearch}
          fullWidth
        />
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        <List disablePadding>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={Link}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  sx={{
                    mx: { xs: 1, sm: 1.5 },
                    borderRadius: '12.5px',
                    py: { xs: 1, sm: 1.25 },
                    mb: 0.25,
                    bgcolor: active ? 'action.selected' : 'transparent',
                    color: active ? 'primary.main' : 'text.secondary',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: { xs: 32, sm: 36 }, color: 'inherit' }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: { xs: 16, sm: 17.5 },
                          fontWeight: active ? 600 : 500,
                        },
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {isAdmin && (
          <>
            <Divider sx={{ mx: 2, my: 1 }} />
            <List disablePadding>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    toggleAdmin?.();
                    setMobileOpen(false);
                  }}
                  sx={{ mx: 1.5, borderRadius: '12.5px' }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
                    <AdminPanelSettingsOutlined fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Mode Admin"
                    slotProps={{
                      primary: {
                        sx: {
                          fontWeight: 600,
                          color: 'error.main',
                        },
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </>
        )}

        <Divider sx={{ mx: 2, my: 0.5 }} />
        <List disablePadding>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              href="/favorites"
              onClick={() => setMobileOpen(false)}
              sx={{
                mx: { xs: 1, sm: 1.5 },
                borderRadius: '12.5px',
                py: { xs: 0.85, sm: 1 },
                mb: 0.25,
                color: 'text.secondary',
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 32, sm: 36 }, color: 'inherit' }}>
                <FavoriteBorder sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />
              </ListItemIcon>
              <ListItemText
                primary="Mes favoris"
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: { xs: 15, sm: 16.5 },
                      fontWeight: 500,
                    },
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              href={user ? '/account' : '/login'}
              onClick={() => setMobileOpen(false)}
              sx={{
                mx: { xs: 1, sm: 1.5 },
                borderRadius: '12.5px',
                py: { xs: 0.85, sm: 1 },
                mb: 0.25,
                color: 'text.secondary',
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 32, sm: 36 }, color: 'inherit' }}>
                <PersonOutlined sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />
              </ListItemIcon>
              <ListItemText
                primary={user ? 'Mon compte' : 'Suivre ma commande'}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: { xs: 15, sm: 16.5 },
                      fontWeight: 500,
                    },
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      <Box sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
        {user ? (
          <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} sx={{ alignItems: 'center' }}>
            <Avatar src={user.avatar} sx={{ width: { xs: 44, sm: 48, md: 52.5 }, height: { xs: 44, sm: 48, md: 52.5 }, bgcolor: 'primary.main' }}>
              {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography fontWeight={600} fontSize={{ xs: 15, sm: 17.5 }}>
                {user.full_name || user.email}
              </Typography>
              <Typography fontSize={{ xs: 13, sm: 15 }} color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Stack>
        ) : (
          <Stack spacing={1}>
            <Box sx={{ textAlign: 'center', mb: 0.5 }}>
              <Box
                sx={{
                  width: { xs: 48, sm: 55 },
                  height: { xs: 48, sm: 55 },
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1,
                  color: 'primary.contrastText',
                }}
              >
                <PersonOutlined sx={{ fontSize: { xs: 24, sm: 27.5 } }} />
              </Box>
              <Typography fontSize={{ xs: 15, sm: 17.5 }} fontWeight={700} color="text.primary">
                Bienvenue !
              </Typography>
              <Typography fontSize={{ xs: 13, sm: 15 }} color="text.secondary" sx={{ mt: 0.5 }}>
                Suivez vos commandes et vos favoris
              </Typography>
            </Box>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              component={Link}
              href="/login"
              onClick={() => setMobileOpen(false)}
              disableElevation
              sx={{
                py: { xs: 1, sm: 1.2 },
                fontWeight: 700,
                fontSize: { xs: 15, sm: 17.5 },
                textTransform: 'none',
              }}
            >
              Se connecter
            </Button>
            <Button
              fullWidth
              variant="text"
              component={Link}
              href="/register"
              onClick={() => setMobileOpen(false)}
              sx={{
                py: { xs: 0.9, sm: 1 },
                borderRadius: '12.5px',
                fontWeight: 600,
                fontSize: { xs: 14, sm: 16.25 },
                textTransform: 'none',
                color: theme.palette.primary.main,
                justifyContent: 'center',
                textAlign: 'center',
                flexWrap: 'wrap',
              }}
            >
              Pas encore de compte ?{' '}
              <Box component="span" sx={{ fontWeight: 700, ml: 0.5 }}>
                Créer
              </Box>
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );

  const profileTrigger = (
    <Box
      component="button"
      type="button"
      onClick={openProfileMenu}
      aria-label="Mon compte"
      aria-expanded={profileMenuOpen}
      aria-haspopup="true"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: { xs: 0.25, sm: 0.5, md: 0.75 },
        width: user && !isMobile ? 'auto' : typeof ACTION_SIZE === 'object' ? ACTION_SIZE : ACTION_SIZE,
        minWidth: typeof ACTION_SIZE === 'object' ? ACTION_SIZE : ACTION_SIZE,
        height: typeof ACTION_SIZE === 'object' ? ACTION_SIZE : ACTION_SIZE,
        pl: user && !isMobile ? { xs: 0.5, sm: 0.75 } : 0,
        pr: user && !isMobile ? { xs: 0.5, sm: 0.75, md: 1.25 } : 0,
        border: '1px solid',
        borderColor: profileMenuOpen ? theme.palette.primary.main : 'divider',
        borderRadius: 1,
        bgcolor: profileMenuOpen ? 'action.selected' : 'transparent',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        '&:hover': {
          bgcolor: 'action.hover',
          borderColor: theme.palette.text.secondary,
        },
      }}
    >
      {authLoading ? (
        <Avatar sx={{ width: { xs: 28, sm: 30, md: 35 }, height: { xs: 28, sm: 30, md: 35 }, bgcolor: 'action.hover' }} />
      ) : user ? (
        <>
              <Avatar sx={{ width: { xs: 28, sm: 30, md: 35 }, height: { xs: 28, sm: 30, md: 35 }, bgcolor: 'primary.main', fontSize: { xs: 12, sm: 13, md: 15 }, fontWeight: 700 }}>
            {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
          </Avatar>
          {!isMobile && (
            <Typography sx={{ fontSize: { xs: 13, sm: 14, md: 16.25 }, fontWeight: 600, color: 'text.primary', maxWidth: { xs: 60, sm: 90, md: 110 } }} noWrap>
              {user.full_name?.split(' ')[0] || 'Compte'}
            </Typography>
          )}
          {(!isMobile || user) && (
            <KeyboardArrowDown
              sx={{
                fontSize: { xs: 16, sm: 18, md: 22.5 },
                color: 'text.disabled',
                transition: 'transform 0.2s ease',
                transform: profileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                flexShrink: 0,
              }}
            />
          )}
        </>
      ) : (
        <PersonOutlined sx={{ fontSize: { xs: 20, sm: 22, md: ICON_SIZE }, color: 'text.secondary' }} />
      )}
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          height: typeof NAVBAR_HEIGHT === 'object' ? NAVBAR_HEIGHT : NAVBAR_HEIGHT,
          justifyContent: 'center',
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          transition: 'background-color 0.15s ease',
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Container maxWidth="xl" sx={{ height: '100%', px: { xs: 1.5, sm: 2, md: 3 } }}>
          <Toolbar
            disableGutters
            sx={{
              height: typeof NAVBAR_HEIGHT === 'object' ? NAVBAR_HEIGHT : NAVBAR_HEIGHT,
              minHeight: `${typeof NAVBAR_HEIGHT === 'object' ? NAVBAR_HEIGHT.md : NAVBAR_HEIGHT}px !important`,
              justifyContent: 'space-between',
              gap: { xs: 1.5, sm: 1.5, md: 2 },
            }}
          >
            {/* Gauche */}
            <Stack direction="row" spacing={{ xs: 1, sm: 1 }} sx={{ alignItems: 'center', flexShrink: 0 }}>
              <Box sx={{ display: { lg: 'none' } }}>
                <NavActionButton
                  ariaLabel="Ouvrir le menu"
                  onClick={() => setMobileOpen(true)}
                  active={mobileOpen}
                >
                  <MenuIcon sx={{ fontSize: { xs: 22, sm: 24, md: ICON_SIZE } }} />
                </NavActionButton>
              </Box>
              <Button
                component={Link}
                href="/"
                disableRipple
                sx={{ p: 0, minWidth: 'auto', textTransform: 'none', '&:hover': { bgcolor: 'transparent' } }}
              >
                <Brand />
              </Button>
            </Stack>

            {/* Centre — desktop */}
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ display: { xs: 'none', lg: 'flex' }, flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.path} item={item} active={pathname === item.path} />
              ))}
            </Stack>

            {/* Droite — slots fixes */}
            <Stack
              direction="row"
              spacing={{ xs: 1, sm: 0.75 }}
              sx={{ flexShrink: 0, minWidth: { xs: 'auto', sm: 'auto', md: 280 }, alignItems: 'center' }}
            >
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <SearchField
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSubmit={handleSearch}
                />
              </Box>

              <Box sx={{ display: { md: 'none' } }}>
                <NavActionButton
                  ariaLabel="Rechercher"
                  onClick={() => setSearchOpen((p) => !p)}
                  active={searchOpen}
                >
                  <SearchIcon sx={{ fontSize: { xs: 22, sm: 24, md: ICON_SIZE } }} />
                </NavActionButton>
              </Box>

              <Box
                sx={{
                  width: '1px',
                  height: { xs: 24, sm: 28, md: 30 },
                  bgcolor: 'divider',
                  mx: { xs: 0.15, sm: 0.25 },
                  display: { xs: 'none', sm: 'block' },
                }}
              />

              <NavActionButton ariaLabel="Mes favoris" href="/favorites" active={pathname === '/favorites'}>
                <Badge
                  badgeContent={favoriteCount > 0 ? favoriteCount : undefined}
                  color="primary"
                  overlap="circular"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: { xs: 11, sm: 12.5 },
                      fontWeight: 700,
                      height: { xs: 18, sm: 22.5 },
                      minWidth: { xs: 18, sm: 22.5 },
                      top: { xs: 4, sm: 5 },
                      right: { xs: 4, sm: 5 },
                      border: '2px solid',
                      borderColor: 'background.paper',
                    },
                  }}
                >
                  <FavoriteBorder sx={{ fontSize: { xs: 22, sm: 24, md: ICON_SIZE } }} />
                </Badge>
              </NavActionButton>

              <NavActionButton ariaLabel="Panier" onClick={() => toggleCart()} active={false}>
                <Badge
                  badgeContent={cartCount > 0 ? cartCount : undefined}
                  color="primary"
                  overlap="circular"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: { xs: 11, sm: 12.5 },
                      fontWeight: 700,
                      height: { xs: 18, sm: 22.5 },
                      minWidth: { xs: 18, sm: 22.5 },
                      top: { xs: 4, sm: 5 },
                      right: { xs: 4, sm: 5 },
                      border: '2px solid',
                      borderColor: 'background.paper',
                    },
                  }}
                >
                  <ShoppingCartOutlined sx={{ fontSize: { xs: 22, sm: 24, md: ICON_SIZE } }} />
                </Badge>
              </NavActionButton>

              {profileTrigger}
            </Stack>
          </Toolbar>
        </Container>

        {/* Recherche mobile — overlay sans changer la hauteur de la barre */}
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            px: { xs: 1.5, sm: 2 },
            py: { xs: 1, sm: 1.5 },
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            opacity: searchOpen ? 1 : 0,
            visibility: searchOpen ? 'visible' : 'hidden',
            pointerEvents: searchOpen ? 'auto' : 'none',
            transition: 'opacity 0.15s ease, visibility 0.15s ease',
            display: { md: 'none' },
          }}
        >
          <SearchField
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSearch}
            autoFocus={searchOpen}
            fullWidth
          />
        </Box>
      </AppBar>

      {/* Menu profil — portal MUI, pas de Popper dans l'AppBar */}
      <Menu
        anchorEl={profileAnchor}
        open={profileMenuOpen}
        onClose={closeProfileMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 1,
              minWidth: { xs: 248, sm: 264, md: 280 },
              maxWidth: { xs: '85vw', sm: 'auto' },
              borderRadius: { xs: '14px', sm: '17.5px' },
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.12)}`,
              overflow: 'hidden',
            },
          },
          list: {
            sx: { py: { xs: 0.5, sm: 0.6 } },
          },
        }}
        disableScrollLock
      >
        {user && (
          <Box
            component="li"
            sx={{
              listStyle: 'none',
              px: { xs: 1.5, sm: 2 },
              py: { xs: 1.25, sm: 1.5 },
              mx: { xs: 0.75, sm: 1 },
              mb: { xs: 0.25, sm: 0.5 },
              borderRadius: 1,
              bgcolor: 'action.hover',
            }}
          >
            <Stack direction="row" spacing={{ xs: 0.75, sm: 1, md: 1.25 }} sx={{ alignItems: 'center' }}>
              <Avatar sx={{ width: { xs: 36, sm: 42, md: 50 }, height: { xs: 36, sm: 42, md: 50 }, bgcolor: 'primary.main', fontSize: { xs: 14, sm: 16, md: 18 }, fontWeight: 700 }}>
                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={600} fontSize={{ xs: 14, sm: 15, md: 17.5 }} noWrap>
                  {user.full_name || user.email}
                </Typography>
                <Typography fontSize={{ xs: 12, sm: 13, md: 15 }} color="text.secondary" noWrap>
                  {user.email}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
        {user && <Divider sx={{ my: 0.5 }} />}
        {user &&
          userMenuItems.map((item) => (
            <MenuItem
              key={item.label}
              onClick={async () => {
                closeProfileMenu();
                if ('action' in item && item.action === 'logout') {
                  await logout();
                } else if ('path' in item && item.path) {
                  router.push(item.path);
                }
              }}
              sx={{ mx: { xs: 0.75, sm: 1 }, borderRadius: { xs: '8px', sm: '10px' }, py: { xs: 0.75, sm: 0.85, md: 1 }, fontSize: { xs: 14, sm: 15, md: 17.5 } }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 28, sm: 32 }, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </MenuItem>
          ))}
        {!user && (
          <Box component="li" sx={{ listStyle: 'none', p: 0 }}>
            <Box
              sx={{
                px: { xs: 1.25, sm: 1.5, md: 1.5 },
                py: { xs: 1, sm: 1.1, md: 1.25 },
                bgcolor: tokens.colors.surfaces.alt,
              }}
            >
              <Stack direction="row" spacing={{ xs: 1, sm: 1.1 }} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: { xs: 32, sm: 36, md: 40 },
                    height: { xs: 32, sm: 36, md: 40 },
                    borderRadius: 1,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <PersonOutlined sx={{ fontSize: { xs: 18, sm: 20, md: 22 } }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    fontSize={{ xs: 13, sm: 14, md: 15 }}
                    fontWeight={700}
                    color="text.primary"
                    sx={{ lineHeight: 1.25, mb: 0.2 }}
                  >
                    Bienvenue !
                  </Typography>
                  <Typography
                    fontSize={{ xs: 12, sm: 12.5, md: 13 }}
                    color="text.secondary"
                    sx={{ lineHeight: 1.35 }}
                  >
                    Commandes, favoris et offres exclusives après connexion.
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <Box
              sx={{
                px: { xs: 1.25, sm: 1.5, md: 1.5 },
                py: { xs: 1, sm: 1.1, md: 1.25 },
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 0.6, sm: 0.7 },
              }}
            >
              <Button
                fullWidth
                variant="contained"
                color="primary"
                component={Link}
                href="/login"
                onClick={closeProfileMenu}
                disableElevation
                sx={{
                  py: { xs: 0.7, sm: 0.75, md: 0.85 },
                  fontWeight: 700,
                  fontSize: { xs: 13, sm: 14, md: 15 },
                  textTransform: 'none',
                  transition: 'background-color 0.15s ease',
                }}
              >
                Se connecter
              </Button>
              <Button
                fullWidth
                variant="text"
                component={Link}
                href="/register"
                onClick={closeProfileMenu}
                sx={{
                  py: { xs: 0.55, sm: 0.6, md: 0.7 },
                  borderRadius: 1,
                  fontWeight: 600,
                  fontSize: { xs: 12.5, sm: 13, md: 14 },
                  textTransform: 'none',
                  color: 'primary.main',
                  justifyContent: 'center',
                  textAlign: 'center',
                  flexWrap: 'wrap',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                Pas encore de compte ?{' '}
                <Box component="span" sx={{ fontWeight: 700, ml: 0.5 }}>
                  Créer
                </Box>
              </Button>
            </Box>
          </Box>
        )}
      </Menu>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { width: { xs: '85%', sm: 320, md: 375 }, maxWidth: 375, border: 'none' },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}
