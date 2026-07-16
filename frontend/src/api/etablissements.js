import apiClient from './client'

export const etablissementsAPI = {
  // Récupérer tous les établissements
  getAll: () => apiClient.get('/etablissements'),

  // Récupérer un établissement par ID
  getById: (id) => apiClient.get(`/etablissements/${id}`),

  // Créer un établissement
  create: (data) => apiClient.post('/etablissements', data),

  // Modifier un établissement
  update: (id, data) => apiClient.put(`/etablissements/${id}`, data),

  // Supprimer un établissement
  delete: (id, motif) => apiClient.delete(`/etablissements/${id}`, { data: { motif } }),
}