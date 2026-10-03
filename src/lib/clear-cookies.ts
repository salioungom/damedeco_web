// Script TypeScript pour nettoyer les cookies et localStorage
// Exécuter dans la console du navigateur (F12)

export function clearAuthData(): void {
  if (typeof window !== 'undefined') {
    document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user_fullname');
    localStorage.removeItem('user_email');
  }
}

export function checkAuthState(): void {
  // Intentionally empty — no-op for production safety
}

// Export par défaut
export default {
  clearAuthData,
  checkAuthState
};
