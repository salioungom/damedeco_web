/**
 * Utilitaires d'authentification
 * Fonctions pour gérer les tokens et l'état d'authentification
 */

/**
 * Récupère le token d'authentification depuis le stockage local
 * @returns Le token d'accès ou null si non trouvé
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Essayer d'abord accessToken (utilisé par AuthContext)
    let token = localStorage.getItem('accessToken');
    
    // Fallback sur 'token' pour compatibilité
    if (!token) {
      token = localStorage.getItem('token');
    }
    
    return token;
  } catch (error) {
    return null;
  }
}

/**
 * Vérifie si l'utilisateur est authentifié
 * @returns true si un token valide est présent
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  return !!token;
}

/**
 * Récupère les headers d'authentification pour les requêtes API
 * @returns Headers avec Authorization Bearer token
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}
