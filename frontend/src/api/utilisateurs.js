import apiClient from './client'

export const utilisateursAPI = {
  // Récupérer tous les utilisateurs
  getAll: () => apiClient.get('/utilisateurs'),

  // Récupérer un utilisateur par ID
  getById: (id) => apiClient.get(`/utilisateurs/${id}`),

  // Créer un utilisateur
  create: (data) => apiClient.post('/utilisateurs', data),

  // Modifier un utilisateur
  update: (id, data) => apiClient.put(`/utilisateurs/${id}`, data),

  // Supprimer un utilisateur
  delete: (id) => apiClient.delete(`/utilisateurs/${id}`),
}