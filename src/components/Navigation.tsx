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
  Menu,
  MenuItem,
  alpha,
} from '@mui/material';
import { FavoriteBorder, PersonOutlined, Menu as MenuIcon, Search as SearchIcon, Close as CloseIcon, AdminPanelSettingsOutlined, DashboardOutlined, LogoutOutlined, AccountCircleOutlined, ShoppingCartOutlined } from '@mui/icons-material';
import { useStore } from '@/store/useStore';
import { BrandMark } from './ui/BrandMark';
import { tokens } from '@/theme/tokens';
import { FONT_INTER, FONT_FRAUNCES } from '@/theme';

/** Hauteur fixe de la navbar — utilisée pour le padding du layout */
export const NAVBAR_HEIGHT = { xs: 64, sm: 68, md: 74 };

/**
 * Conteneur de contenu partagé — header, hero et sections qui suivent.
 * Identique partout : max-width 1280px, padding horizontal 24px (mobile) /
 * 40px (à partir de lg). Alignement strict header ↔ hero ↔ sections.
 */
export const CONTENT_MAX_WIDTH = 1280;
export const CONTENT_CONTAINER_SX = {
  width: '100%',
  maxWidth: `${CONTENT_MAX_WIDTH}px`,
  mx: 'auto',
  px: { xs: 2.4, sm: 2.4, md: 2.4, lg: 4 },
};

/** Taille des actions (boutons icônes) — 44px, cible tactile ≥ 44px */
const ACTION_SIZE = 44;
const ICON_SIZE = 20;

function getUserInitials(fullName?: string, email?: string): string {
  const nameParts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (nameParts.length > 1) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toLocaleUpperCase('fr');
  }
  return (nameParts[0]?.[0] || email?.trim()[0] || 'U').toLocaleUpperCase('fr');
}

type NavItem = { label: string; path: string };

const NAV_ITEMS: NavItem[] = [
  { label: 'Accueil', path: '/' },
  { label: 'Boutique', path: '/shop' },
  { label: 'À propos', path: '/about' },
  { label: 'Contact', path: '/contact' },
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
  const sx = {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    minWidth: ACTION_SIZE,
    minHeight: ACTION_SIZE,
    p: 0,
    borderRadius: '10px',
    border: 'none',
    bgcolor: 'transparent',
    color: active ? tokens.colors.text.primary : tokens.colors.text.secondary,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background-color 0.15s ease, color 0.15s ease',
    '&:hover': {
      bgcolor: tokens.colors.surfaces.alt,
      color: tokens.colors.text.primary,
    },
    '&:focus-visible': {
      outline: `2px solid ${tokens.colors.status.focus}`,
      outlineOffset: '2px',
      borderRadius: '10px',
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

/** Badge du panier — petit rond bleu (token `surfaces.inverse`) + texte blanc 11px */
function CartBadge({ count }: { count: number }) {
  return (
    <Badge
      badgeContent={count > 0 ? count : undefined}
      overlap="circular"
      sx={{
        '& .MuiBadge-badge': {
          position: 'absolute',
          top: 4,
          right: 4,
          height: 18,
          minWidth: 18,
          borderRadius: '50%',
          padding: 0,
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1,
          bgcolor: tokens.colors.surfaces.inverse,
          color: tokens.colors.white,
        },
      }}
    >
      <ShoppingCartOutlined sx={{ fontSize: ICON_SIZE }} strokeWidth={1.5} />
    </Badge>
  );
}

const Brand = memo(function Brand() {
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
            fontFamily: FONT_FRAUNCES,
            fontWeight: 500,
            fontSize: { sm: 17, md: 18.75 },
            color: tokens.colors.text.primary,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          DameDéco
        </Typography>
        <Typography
          sx={{
            fontFamily: FONT_INTER,
            fontWeight: 500,
            fontSize: { xs: 10, sm: 11 },
            color: tokens.colors.text.disabled,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          Import &amp; Commerce
        </Typography>
      </Box>
    </Stack>
  );
});

const navLinkBaseSx = {
  position: 'relative',
  borderRadius: '10px',
  px: { xs: 1.25, md: 1.75 },
  py: { xs: 0.75, md: 1 },
  fontFamily: FONT_INTER,
  fontSize: 15,
  fontWeight: 500,
  lineHeight: 1.5,
  textTransform: 'none',
  color: tokens.colors.text.primary,
  bgcolor: 'transparent',
  minWidth: 'auto',
  flexShrink: 0,
  transition: 'color 0.15s ease, textDecorationColor 0.15s ease',
  '&:hover': {
    bgcolor: 'transparent',
    color: tokens.colors.text.primary,
    textDecoration: 'underline',
    textDecorationColor: tokens.colors.text.primary,
    textDecorationThickness: '2px',
    textUnderlineOffset: '8px',
  },
  '&:focus-visible': {
    outline: `2px solid ${tokens.colors.status.focus}`,
    outlineOffset: '2px',
  },
};

const navLinkActiveSx = {
  ...navLinkBaseSx,
  textDecoration: 'underline',
  textDecorationColor: tokens.colors.text.primary,
  textDecorationThickness: '2px',
  textUnderlineOffset: '8px',
};

const NavLink = memo(function NavLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  return (
    <Button
      component={Link}
      href={item.path}
      disableRipple
      aria-current={active ? 'page' : undefined}
      sx={active ? navLinkActiveSx : navLinkBaseSx}
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
  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{ width: fullWidth ? '100%' : { sm: 240 }, maxWidth: fullWidth ? '100%' : 240 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: ACTION_SIZE,
          px: 2,
          borderRadius: '10px',
          bgcolor: tokens.colors.surfaces.alt,
          '&:focus-within': {
            outline: `2px solid ${tokens.colors.status.focus}`,
            outlineOffset: '2px',
          },
        }}
      >
        <SearchIcon sx={{ fontSize: ICON_SIZE, color: tokens.colors.text.secondary, flexShrink: 0 }} strokeWidth={1.5} />
        <InputBase
          placeholder="Rechercher un produit…"
          value={value}
          autoFocus={autoFocus}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          inputProps={{ 'aria-label': 'Rechercher un produit' }}
          sx={{
            flex: 1,
            fontSize: 15,
            fontWeight: 500,
            color: tokens.colors.text.primary,
            '& input::placeholder': {
              color: tokens.colors.text.disabled,
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
  const isMobile = useMediaQuery(theme.breakpoints.down(768));

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
  const [scrolled, setScrolled] = useState(false);

  const cartCount = useMemo(
    () => (cart || []).reduce((acc, item) => acc + item.quantity, 0),
    [cart],
  );

  const favoriteCount = favorites?.length ?? 0;

  const profileMenuOpen = Boolean(profileAnchor);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
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
          <CloseIcon sx={{ fontSize: ICON_SIZE }} strokeWidth={1.5} />
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
                    mx: 2,
                    borderRadius: '10px',
                    py: 2,
                    bgcolor: 'transparent',
                    color: tokens.colors.text.primary,
                    transition: 'background-color 0.15s ease',
                    '&:hover': { bgcolor: tokens.colors.surfaces.alt },
                    '&:focus-visible': { outline: `2px solid ${tokens.colors.status.focus}`, outlineOffset: '2px' },
                    ...(active
                      ? {
                          textDecoration: 'underline',
                          textDecorationColor: tokens.colors.text.primary,
                          textDecorationThickness: '2px',
                          textUnderlineOffset: '8px',
                        }
                      : { textDecoration: 'none' }),
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontFamily: FONT_FRAUNCES,
                          fontSize: 28,
                          fontWeight: 500,
                          lineHeight: 1.2,
                          color: tokens.colors.text.primary,
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
                  sx={{ mx: 2, borderRadius: '10px' }}
                >
                  <ListItemIcon sx={{ minWidth: { xs: 32, sm: 36 }, color: 'inherit' }}>
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
                mx: 2,
                borderRadius: '10px',
                py: 2,
                bgcolor: 'transparent',
                color: tokens.colors.text.secondary,
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 32, sm: 36 }, color: 'inherit' }}>
                <FavoriteBorder sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} strokeWidth={1.5} />
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
                mx: 2,
                borderRadius: '10px',
                py: 2,
                bgcolor: 'transparent',
                color: tokens.colors.text.secondary,
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 32, sm: 36 }, color: 'inherit' }}>
                <PersonOutlined sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} strokeWidth={1.5} />
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
              {getUserInitials(user.full_name, user.email)}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: { xs: 15, sm: 17.5 } }}>
                {user.full_name || user.email}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: { xs: 13, sm: 15 } }}>
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
              <Typography color="text.primary" sx={{ fontSize: { xs: 15, sm: 17.5 }, fontWeight: 700 }}>
                Bienvenue !
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: { xs: 13, sm: 15 }, mt: 0.5 }}>
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
        width: ACTION_SIZE,
        minWidth: ACTION_SIZE,
        height: ACTION_SIZE,
        p: 0,
        borderRadius: '10px',
        border: 'none',
        bgcolor: 'transparent',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        '&:hover': {
          bgcolor: tokens.colors.surfaces.alt,
          borderColor: tokens.colors.text.secondary,
        },
        '&:focus-visible': {
          outline: `2px solid ${tokens.colors.status.focus}`,
          outlineOffset: '2px',
          borderRadius: '10px',
        },
      }}
    >
      {authLoading ? (
        <Avatar sx={{ width: { xs: 28, sm: 30, md: 35 }, height: { xs: 28, sm: 30, md: 35 }, bgcolor: 'action.hover' }} />
      ) : user ? (
        <Avatar
          src={user.avatar}
          sx={{ width: { xs: 28, sm: 30, md: 35 }, height: { xs: 28, sm: 30, md: 35 }, bgcolor: 'primary.main', fontSize: { xs: 12, sm: 13, md: 15 }, fontWeight: 700 }}
        >
          {getUserInitials(user.full_name, user.email)}
        </Avatar>
      ) : (
        <PersonOutlined sx={{ fontSize: ICON_SIZE, color: 'text.secondary' }} strokeWidth={1.5} />
      )}
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: theme.zIndex.appBar,
          height: { xs: NAVBAR_HEIGHT.xs, sm: NAVBAR_HEIGHT.sm, md: NAVBAR_HEIGHT.md },
          bgcolor: tokens.colors.surfaces.default,
          borderBottom: '1px solid',
          borderColor: tokens.colors.border.light,
          backdropFilter: scrolled ? 'blur(8px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(8px)' : 'none',
          transition: 'background-color 0.15s ease, backdrop-filter 0.2s ease',
        }}
      >
        <Container maxWidth={false} disableGutters sx={{ ...CONTENT_CONTAINER_SX, height: '100%' }}>
          <Toolbar
            disableGutters
            sx={{
              height: NAVBAR_HEIGHT,
              justifyContent: 'space-between',
              gap: { xs: 1.5, sm: 1.5, md: 2 },
            }}
          >
            {/* Gauche — logo */}
            <Stack direction="row" spacing={{ xs: 1, sm: 1 }} sx={{ alignItems: 'center', flexShrink: 0 }}>
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
            {!isMobile && (
              <Box component="nav" aria-label="Principal" sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Stack direction="row" spacing={0.5} sx={{ display: 'flex', alignItems: 'center' }}>
                  {NAV_ITEMS.map((item) => (
                    <NavLink key={item.path} item={item} active={pathname === item.path} />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Droite — actions */}
            <Stack direction="row" spacing={{ xs: 1, sm: 0.75 }} sx={{ flexShrink: 0, alignItems: 'center' }}>
              {isMobile ? (
                <>
                  <NavActionButton ariaLabel="Rechercher" onClick={() => setSearchOpen((p) => !p)}>
                    <SearchIcon sx={{ fontSize: ICON_SIZE }} strokeWidth={1.5} />
                  </NavActionButton>
                  <NavActionButton ariaLabel="Panier" onClick={() => toggleCart()}>
                    <CartBadge count={cartCount} />
                  </NavActionButton>
                  <NavActionButton ariaLabel="Ouvrir le menu" onClick={() => setMobileOpen(true)}>
                    <MenuIcon sx={{ fontSize: ICON_SIZE }} strokeWidth={1.5} />
                  </NavActionButton>
                </>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SearchField
                      value={searchQuery}
                      onChange={setSearchQuery}
                      onSubmit={handleSearch}
                    />
                  </Box>

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
                      <FavoriteBorder sx={{ fontSize: { xs: 22, sm: 24, md: ICON_SIZE } }} strokeWidth={1.5} />
                    </Badge>
                  </NavActionButton>

                  <NavActionButton ariaLabel="Panier" onClick={() => toggleCart()}>
                    <CartBadge count={cartCount} />
                  </NavActionButton>

                  {profileTrigger}
                </>
              )}
            </Stack>
          </Toolbar>
        </Container>

        {/* Recherche mobile — overlay sous la barre */}
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
            display: { xs: 'block', md: 'none' },
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
          <Box component="li" sx={{ listStyle: 'none', p: 0 }}>
            <Box
              sx={{
                px: { xs: 1.25, sm: 1.5, md: 1.5 },
                py: { xs: 1, sm: 1.1, md: 1.25 },
                bgcolor: tokens.colors.surfaces.alt,
              }}
            >
              <Stack direction="row" spacing={{ xs: 1, sm: 1.1 }} sx={{ alignItems: 'center' }}>
                <Avatar
                  sx={{
                    width: { xs: 32, sm: 36, md: 40 },
                    height: { xs: 32, sm: 36, md: 40 },
                    bgcolor: 'primary.main',
                    fontSize: { xs: 14, sm: 15, md: 16 },
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {getUserInitials(user.full_name, user.email)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    color="text.primary"
                    noWrap
                    sx={{ fontSize: { xs: 13, sm: 14, md: 15 }, fontWeight: 700, lineHeight: 1.25 }}
                  >
                    {user.full_name || user.email}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    noWrap
                    sx={{ fontSize: { xs: 12, sm: 12.5, md: 13 }, lineHeight: 1.35 }}
                  >
                    {user.email}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        )}
        {user && <Divider sx={{ my: 0.25 }} />}
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
              sx={{ mx: { xs: 0.75, sm: 1 }, borderRadius: { xs: '8px', sm: '10px' }, py: { xs: 0.6, sm: 0.65, md: 0.75 }, fontSize: { xs: 13.5, sm: 14.5, md: 16 } }}
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
                    color="text.primary"
                    sx={{ fontSize: { xs: 13, sm: 14, md: 15 }, fontWeight: 700, lineHeight: 1.25, mb: 0.2 }}
                  >
                    Bienvenue !
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{ fontSize: { xs: 12, sm: 12.5, md: 13 }, lineHeight: 1.35 }}
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
          '& .MuiDrawer-paper': { width: '100%', borderRight: 'none', borderRadius: 0 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}
