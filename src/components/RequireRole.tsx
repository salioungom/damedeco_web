'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardSkeleton, type DashboardSkeletonVariant } from '@/components/account/DashboardSkeleton';

interface RequireRoleProps {
    children: React.ReactNode;
    allowedRoles: Array<'admin' | 'client' | 'superadmin'>;
    redirectTo?: string;
    /**
     * Variante du squelette affiché pendant la vérification de la session :
     * `dashboard` pour l'espace client, `simple` pour les pages d'administration.
     */
    variant?: DashboardSkeletonVariant;
}

export function RequireRole({ children, allowedRoles, redirectTo = '/', variant = 'simple' }: RequireRoleProps) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            // Retour à la page d'origine après connexion : le paramètre `redirect`
            // est déjà lu par /login (src/app/login/page.tsx) et filtré par
            // `sanitizeRedirect` (src/lib/sanitize-redirect.ts).
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        } else if (!loading && user && !allowedRoles.includes(user.role)) {
            router.push(redirectTo);
        }
    }, [user, loading, router, allowedRoles, redirectTo, pathname]);

    if (loading) {
        return <DashboardSkeleton variant={variant} />;
    }

    if (!user || !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}
