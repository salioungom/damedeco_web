/**
 * @file /contexts/AuthContext.tsx
 * @description AuthContext robuste avec gestion d'états et erreurs structurées
 * @version 2.0.0
 * @author DameDéco Team
 */

'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiUtils } from '@/lib/api';
import { useCartSync } from '@/hooks/useCartSync';

// Types pour l'authentification
interface User {
    id: string;
    email?: string;
    phone?: string;
    role: 'admin' | 'client' | 'superadmin';
    full_name: string;
    avatar?: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    requires2FA: boolean;
    mustChangePassword: boolean;
    roles: ('admin' | 'superadmin' | 'client')[];
    status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'pending_2fa';
}

interface AuthContextType extends AuthState {
    loading: boolean;
    login: (identifier: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; mustChangePassword?: boolean; error?: string; user?: User }>;
    register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshAccessToken: () => Promise<boolean>;
    verifyOTP: (otp: string, method: 'totp' | 'email') => Promise<boolean>;
    refetchUser: () => Promise<void>;
}

interface RegisterData {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    confirmPassword: string;
}

// Création du contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Vérifie l'expiration d'un JWT. Déclaré à portée module (hors du corps du
 * composant) : cette lecture d'horloge est une opération d'environnement, pas
 * du render. Un token illisible est considéré comme non expiré.
 */
function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return Date.now() > payload.exp * 1000;
    } catch {
        return false;
    }
}

/**
 * Redirection dure vers /login, hors des pages déjà authentifiées.
 * La redirection est volontairement conservée en navigation complète : elle
 * purge l'état mémoire du provider et le jeton, ce qu'un `router.push` ne fait
 * pas. Portée module pour la même raison que `isTokenExpired` — ni `useRouter`
 * ni `redirect()` ne sont disponibles hors d'un composant.
 * `replace` évite de laisser la page expirée dans l'historique.
 */
function redirectToLogin(): void {
    if (typeof window === 'undefined') {
        return;
    }
    const { pathname } = window.location;
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
        return;
    }
    window.location.replace(window.location.origin + '/login');
}

// Provider principal
export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        requires2FA: false,
        mustChangePassword: false,
        roles: [],
        status: 'idle',
    });
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    
    // Hook pour la synchronisation du panier
    useCartSync();

    // Gestion sécurisée du localStorage
    const getStoredToken = useCallback((): string | null => {
        if (typeof window === 'undefined') {
            return null;
        }

        try {
            return localStorage.getItem('accessToken') || localStorage.getItem('token');
        } catch (error) {
            return null;
        }
    }, []);

    const clearStoredTokens = useCallback((): void => {
        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
        } catch (error) {
            // Silent fail
        }
    }, []);

    const setStoredToken = useCallback((token: string): void => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            localStorage.setItem('accessToken', token);
        } catch (error) {
            // Silent fail
        }
    }, []);

    // Mise à jour de l'état d'authentification
    const updateAuthState = useCallback((updates: Partial<AuthState>): void => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Gestion des erreurs API
    const handleAuthError = useCallback((error: any, context: string): string => {
        const errorMessage = apiUtils.handleApiError(error);
        return errorMessage;
    }, []);

    // `fetchUser` se ré-invoque lui-même pour le retry réseau (voir
    // `setTimeout` plus bas). Cette auto-référence ne peut pas figurer dans ses
    // propres dépendances : la ref casse le cycle. Elle est alimentée par un
    // effet, jamais pendant le render — une ref mutée en phase de render peut
    // être issue d'un rendu abandonné en rendu concurrent.
    // `fetchUser` est par ailleurs stable pour toute la durée du provider (ses
    // dépendances sont des `useCallback(…, [])`), donc l'effet ne se rejoue pas et
    // la ref ne peut pas devenir obsolète.
    const fetchUserRef = useRef<((retryCount?: number) => Promise<void>) | undefined>(undefined);

    // Récupération des informations utilisateur avec retry
    const fetchUser = useCallback(async (retryCount = 0): Promise<void> => {
        if (typeof window === 'undefined') {
            return;
        }

        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        
        if (!token) {
            updateAuthState({
                user: null,
                accessToken: null,
                isAuthenticated: false,
                requires2FA: false,
                mustChangePassword: false,
                roles: [],
                status: 'unauthenticated',
            });
            setLoading(false);
            return;
        }

        if (isTokenExpired(token)) {
            clearStoredTokens();
            updateAuthState({
                user: null,
                accessToken: null,
                isAuthenticated: false,
                requires2FA: false,
                roles: [],
                status: 'unauthenticated',
            });
            setLoading(false);
            redirectToLogin();
            return;
        }
        
        try {
            const response = await api.get('/api/v1/auth/me', {
                timeout: 8000,
            });
            
            const user = response.data.user || response.data;
            if (!user) {
                throw new Error('No user data in API response');
            }

            updateAuthState({
                user,
                accessToken: token,
                isAuthenticated: true,
                requires2FA: response.data.requires2FA || false,
                mustChangePassword: response.data.must_change_password === true,
                roles: user.role ? [user.role] : [],
                status: 'authenticated',
            });

        } catch (error: any) {
            const errorMessage = handleAuthError(error, 'fetchUser');
            
            if ((error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR') && retryCount < 2) {
                setTimeout(() => fetchUserRef.current?.(retryCount + 1), 1000 * (retryCount + 1));
                return;
            }
            
            // 401/403 are handled by the API interceptor (refresh → retry → logout)
            if (error?.status === 401 || error?.status === 403) {
                setLoading(false);
                return;
            }

            if (!error?.status || error.status >= 500) {
                setLoading(false);
                return;
            }

            setLoading(false);
        } finally {
            setLoading(false);
        }
    }, [updateAuthState, clearStoredTokens, handleAuthError]);

    // Connexion
    const login = useCallback(async (identifier: string, password: string): Promise<{ success: boolean; requires2FA?: boolean; mustChangePassword?: boolean; error?: string; user?: User }> => {
        if (typeof window === 'undefined') {
            return { success: false, error: 'Login not available server-side' };
        }

        try {
            updateAuthState({ status: 'loading' });
            
            const response = await api.post('/api/v1/auth/login', {
                identifiant: identifier,
                password: password,
            });

            if (response.data.requires_2fa) {
                updateAuthState({
                    requires2FA: true,
                    user: response.data.user || null,
                    status: 'pending_2fa',
                });
                return { success: true, requires2FA: true, user: response.data.user };
            }

            const mustChangePassword = response.data.must_change_password === true;

            const token = response.data.access_token || response.data.token;
            if (token) {
                setStoredToken(token);
            }

            updateAuthState({
                user: response.data.user,
                accessToken: token,
                isAuthenticated: true,
                requires2FA: false,
                mustChangePassword,
                roles: response.data.user?.role ? [response.data.user.role] : [],
                status: 'authenticated',
            });

            return { success: true, user: response.data.user, mustChangePassword };

        } catch (error: any) {
            const errorMessage = handleAuthError(error, 'login');
            updateAuthState({ status: 'unauthenticated' });
            return { success: false, error: errorMessage };
        }
    }, [updateAuthState, setStoredToken, handleAuthError]);

    // Inscription
    const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
        if (typeof window === 'undefined') {
            return { success: false, error: 'Registration not available server-side' };
        }

        try {
            const response = await api.post('/api/v1/auth/register', data);
            return { success: true };

        } catch (error: any) {
            const errorMessage = handleAuthError(error, 'register');
            return { success: false, error: errorMessage };
        }
    }, [handleAuthError]);

    // Déconnexion
    // Décision : la présence du jeton est lue dans `localStorage` (via
    // `getStoredToken`) et non dans `state.accessToken`.
    // `localStorage` est la source de vérité de la session côté serveur ;
    // `state.accessToken` n'en est qu'un cache, vide au démarrage tant que
    // `fetchUser` n'a pas résolu. Lire `state` faisait donc sauter l'appel
    // `/auth/logout` — donc la révocation serveur — si l'utilisateur cliquait sur
    // « déconnexion » pendant la fenêtre de bootstrap, et imposait `state` en
    // dépendance du `useCallback` sans rôle dans la décision.
    const logout = useCallback(async (): Promise<void> => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            if (getStoredToken()) {
                await api.post('/api/v1/auth/logout', {}, { timeout: 5000 });
            }
        } catch (error: any) {
            // Silent fail on logout
        } finally {
            clearStoredTokens();
            updateAuthState({
                user: null,
                accessToken: null,
                isAuthenticated: false,
                requires2FA: false,
                mustChangePassword: false,
                roles: [],
                status: 'unauthenticated',
            });
            
            router.push('/login');
        }
    }, [getStoredToken, clearStoredTokens, updateAuthState, router]);

    /** @deprecated Handled by the API interceptor — kept for SessionGuard compat */
    const refreshAccessToken = useCallback(async (): Promise<boolean> => {
        if (typeof window === 'undefined') {
            return false;
        }

        try {
            const response = await api.post('/api/v1/auth/refresh');
            const token = response.data.access_token || response.data.accessToken;
            
            if (token) {
                setStoredToken(token);
                updateAuthState({ accessToken: token });
                return true;
            }

            return false;

        } catch {
            return false;
        }
    }, [setStoredToken, updateAuthState]);

    // Vérification OTP
    const verifyOTP = useCallback(async (otp: string, method: 'totp' | 'email'): Promise<boolean> => {
        if (typeof window === 'undefined') {
            return false;
        }

        try {
            const response = await api.post('/api/v1/auth/verify-otp', { otp, method });
            const user = response.data.user;
            const token = response.data.access_token || response.data.accessToken;
            
            setStoredToken(token);
            updateAuthState({
                user,
                accessToken: token,
                isAuthenticated: true,
                requires2FA: false,
                roles: user.role ? [user.role] : [],
                status: 'authenticated',
            });
            
            return true;

        } catch (error: any) {
            handleAuthError(error, 'verifyOTP');
            return false;
        }
    }, [setStoredToken, updateAuthState, handleAuthError]);

    // Recharger les données utilisateur
    const refetchUser = useCallback(async (): Promise<void> => {
        await fetchUser();
    }, [fetchUser]);

    // Maintient `fetchUserRef` pointant sur la dernière `fetchUser`. Déclaré AVANT
    // l'effet d'initialisation : React exécute les effets dans l'ordre de
    // déclaration après chaque commit, la ref est donc renseignée avant tout
    // appel à `fetchUser` — donc avant tout retry qu'elle pourrait planifier.
    useEffect(() => {
        fetchUserRef.current = fetchUser;
    }, [fetchUser]);

    // Initialisation au montage du composant
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    useEffect(() => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            apiUtils.checkApiHealth();
        }
    }, []);

    const contextValue: AuthContextType = useMemo(() => ({
        ...state,
        loading,
        login,
        register,
        logout,
        refreshAccessToken,
        verifyOTP,
        refetchUser,
    }), [state, loading, login, register, logout, refreshAccessToken, verifyOTP, refetchUser]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook d'utilisation
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Export des types
export type { User, AuthState, AuthContextType, RegisterData };
