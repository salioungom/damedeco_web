import apiClient from './api-client';
import { LoginCredentials, RegisterData, AuthResponse, User } from './types';

// Auth API functions
export const authAPI = {
  // Inscription
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/v1/auth/register', userData);
    return response.data;
  },

  // Connexion
  login: async (identifiant: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', {
      identifiant,
      password
    });
    return response.data;
  },

  // Vérification email
  verifyEmail: async (token: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
  },

  // Mot de passe oublié
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/api/v1/auth/forgot-password', { email });
    return response.data;
  },

  // Réinitialisation mot de passe
  resetPassword: async (token: string, new_password: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      new_password
    });
    return response.data;
  },

  // Obtenir les infos utilisateur connecté
  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Rafraîchir le token
  refreshToken: async (refresh_token: string): Promise<{ token: string }> => {
    const response = await apiClient.post('/auth/refresh', { refresh_token });
    return response.data;
  },

  // Déconnexion
  logout: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};

export default apiClient;
