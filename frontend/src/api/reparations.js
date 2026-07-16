import apiClient from './client'

export const reparationsAPI = {
  // Récupérer toutes les réparations
  getAll: () => apiClient.get('/reparations'),

  // Récupérer les réparations d'un établissement
  getByEtablissement: (id) => apiClient.get(`/reparations/etablissement/${id}`),

  // Créer une réparation (admin)
  create: (data) => apiClient.post('/reparations', data),

  // Terminer une réparation
  terminer: (id) => apiClient.put(`/reparations/${id}/terminer`),
}