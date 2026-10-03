'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface GuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: GuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return fallback || <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return fallback || <div>Redirecting...</div>;
  }

  return <>{children}</>;
}

interface RoleGuardProps extends GuardProps {
  allowedRoles: ('admin' | 'superadmin' | 'client')[];
  redirectTo?: string;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback, 
  redirectTo = '/unauthorized' 
}: RoleGuardProps) {
  const { isAuthenticated, roles, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!allowedRoles.some(role => roles.includes(role))) {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, roles, allowedRoles, loading, router, redirectTo]);

  if (loading) {
    return fallback || <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return fallback || <div>Redirecting...</div>;
  }

  if (!allowedRoles.some(role => roles.includes(role))) {
    return fallback || <div>Unauthorized</div>;
  }

  return <>{children}</>;
}

export function AdminGuard({ children, fallback }: GuardProps) {
  return (
    <RoleGuard
      allowedRoles={['admin', 'superadmin']}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

export function SuperAdminGuard({ children, fallback }: GuardProps) {
  return (
    <RoleGuard
      allowedRoles={['superadmin']}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

export function ClientGuard({ children, fallback }: GuardProps) {
  return (
    <RoleGuard
      allowedRoles={['client']}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

export function TwoFAGuard({ children, fallback }: GuardProps) {
  const { requires2FA, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && requires2FA) {
      router.push('/verify-otp');
    }
  }, [requires2FA, loading, router]);

  if (loading) {
    return fallback || <div>Loading...</div>;
  }

  if (requires2FA) {
    return fallback || <div>Redirecting to 2FA...</div>;
  }

  return <>{children}</>;
}

export function SessionGuard({ children, fallback }: GuardProps) {
  const { refreshAccessToken, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSession = async () => {
      try {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          router.push('/login');
        }
      } catch {
        // Network error — do not redirect
      }
    };

    // Check session every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshAccessToken, router]);

  return <>{children}</>;
}

// Combined guards for common use cases
export function SecureRoute({ children, fallback }: GuardProps) {
  return (
    <AuthGuard fallback={fallback}>
      <TwoFAGuard fallback={fallback}>
        <SessionGuard fallback={fallback}>
          {children}
        </SessionGuard>
      </TwoFAGuard>
    </AuthGuard>
  );
}

export function AdminRoute({ children, fallback }: GuardProps) {
  return (
    <AuthGuard fallback={fallback}>
      <TwoFAGuard fallback={fallback}>
        <SessionGuard fallback={fallback}>
          <AdminGuard fallback={fallback}>
            {children}
          </AdminGuard>
        </SessionGuard>
      </TwoFAGuard>
    </AuthGuard>
  );
}

export function SuperAdminRoute({ children, fallback }: GuardProps) {
  return (
    <AuthGuard fallback={fallback}>
      <TwoFAGuard fallback={fallback}>
        <SessionGuard fallback={fallback}>
          <SuperAdminGuard fallback={fallback}>
            {children}
          </SuperAdminGuard>
        </SessionGuard>
      </TwoFAGuard>
    </AuthGuard>
  );
}
