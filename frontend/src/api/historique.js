import apiClient from './client'

export const historiqueAPI = {
  // Récupérer l'historique complet
  getAll: (params) => apiClient.get('/historique', { params }),

  // Récupérer l'historique d'un utilisateur
  getByUser: (id) => apiClient.get(`/historique/utilisateur/${id}`),

  // Récupérer l'historique d'un établissement
  getByEtablissement: (id) => apiClient.get(`/historique/etablissement/${id}`),

  // Récupérer les types d'actions disponibles
  getActionTypes: () => apiClient.get('/historique/actions/types'),
}