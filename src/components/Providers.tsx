'use client';

import { SnackbarProvider } from 'notistack';
import { Box } from '@mui/material';
import { Navigation, NAVBAR_HEIGHT } from './Navigation';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { ErrorBoundary } from './ErrorBoundary';
import { Toaster } from 'sonner';
import { useStore } from '@/store/useStore';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { cartLog } from '@/lib/cart-logger';

interface ProvidersProps {
  children: React.ReactNode;
}

function CartInitializer() {
  const loadCart = useStore((s) => s.loadCart);
  const initGuestSession = useStore((s) => s.initGuestSession);
  const flushOfflineQueue = useStore((s) => s.flushOfflineQueue);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    const init = async () => {
      await initGuestSession();
      await loadCart();
    };
    init();

    // ─── Sync on window focus ─────────────────────────────────────────
    const onFocus = () => {
      cartLog('Window focused — syncing cart');
      loadCart(true);
    };

    // ─── Sync on back online ──────────────────────────────────────────
    const onOnline = () => {
      cartLog('Network restored — flushing offline queue');
      flushOfflineQueue();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, [authLoading, loadCart, initGuestSession, flushOfflineQueue]);

  return null;
}

function FavoritesInitializer() {
  const setUser = useStore((s) => s.setUser);
  const loadFavorites = useStore((s) => s.loadFavorites);
  const storeUser = useStore((s) => s.user);
  const { user, isAuthenticated } = useAuth();
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (storeUser) setUser(null);
      syncedUserIdRef.current = null;
      return;
    }

    if (syncedUserIdRef.current === user.id) return;
    syncedUserIdRef.current = user.id;

    if (storeUser?.id !== user.id) {
      setUser({
        id: user.id,
        name: user.full_name,
        email: user.email || '',
        role: user.role,
        type: 'retail' as const,
        avatar: user.avatar,
        phone: user.phone,
      });
    }

    loadFavorites();
  }, [isAuthenticated, user, setUser, loadFavorites, storeUser]);

  return null;
}

export function Providers({ children }: ProvidersProps) {
  const pathname = usePathname();

  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={4000}
    >
      <CartInitializer />
      <FavoritesInitializer />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
      >
        <Navigation />

        <Box
          component="main"
          sx={{
            flex: 1,
            width: '100%',
            maxWidth: '100%',
            mx: 'auto',
            pt: {
              xs: `${NAVBAR_HEIGHT.xs}px`,
              sm: `${NAVBAR_HEIGHT.sm}px`,
              md: `${NAVBAR_HEIGHT.md}px`,
            },
          }}
        >
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </Box>
        <Footer />
        <CartDrawer />
        <Toaster />
      </Box>
    </SnackbarProvider>
  );
}
