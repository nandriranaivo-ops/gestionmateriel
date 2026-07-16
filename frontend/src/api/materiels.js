import apiClient from './client'

export const materielsAPI = {
  // Récupérer tous les matériels
  getAll: () => apiClient.get('/materiels'),

  // Récupérer un matériel par ID
  getById: (id) => apiClient.get(`/materiels/${id}`),

  // Créer un matériel
  create: (data) => apiClient.post('/materiels', data),

  // Modifier un matériel
  update: (id, data) => apiClient.put(`/materiels/${id}`, data),

  // Supprimer un matériel
  delete: (id) => apiClient.delete(`/materiels/${id}`),

  // Changer l'état d'un matériel
  changerEtat: (id, etat, quantite = 1) =>
    apiClient.put(`/materiels/${id}/etat`, { etat, quantite }),

  // Modifier l'accessibilité d'un matériel
  modifierAccessibilite: (id, accessible) =>
    apiClient.put(`/materiels/${id}/accessibilite`, { accessible }),
}