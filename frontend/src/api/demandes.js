import apiClient from './client'

export const demandesAPI = {
  // Récupérer toutes les demandes
  getAll: () => apiClient.get('/demandes'),

  // Récupérer les demandes d'un établissement
  getByEtablissement: (id) => apiClient.get(`/demandes/etablissement/${id}`),

  // Créer une demande
  create: (data) => apiClient.post('/demandes', data),

  // Accepter une demande (avec création de réparation)
  accepter: (id, reparationData) => apiClient.put(`/demandes/${id}/accepter`, reparationData),

  // Refuser une demande
  refuser: (id, motif) => apiClient.put(`/demandes/${id}/refuser`, { motif_refus: motif }),

  // Terminer une demande (réparation terminée)
  terminer: (id) => apiClient.put(`/demandes/${id}/terminer`),
}