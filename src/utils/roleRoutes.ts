/**
 * Résout la route « tableau de bord » d'un utilisateur selon son rôle.
 *
 * Cette logique était dupliquée dans `login`, `Navigation`, et les deux pages
 * `/settings/*`. Toute divergence faisait qu'un utilisateur atterrissait sur
 * une page interdite à son rôle ( redirection vers `(superadmin)/dashboards`
 * pour un client = 404/redirect loop ).
 */
export function getDashboardPath(role?: string | null): string {
    if (role === 'superadmin') return '/dashboards';
    if (role === 'admin') return '/dashboard';
    return '/account';
}
