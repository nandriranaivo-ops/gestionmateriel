import apiClient from './client'

export const authAPI = {
  // Connexion
  login: (email, password, role, etablissementId) =>
    apiClient.post('/auth/login', { email, password, role, etablissementId }),

  // Déconnexion
  logout: () => apiClient.post('/auth/logout'),

  // Rafraîchir le token
  refreshToken: () => apiClient.post('/auth/refresh'),
}