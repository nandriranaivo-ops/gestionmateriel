import apiClient from './client'

export const stockAPI = {
  // Récupérer le stock central
  getCentral: () => apiClient.get('/stock/central'),

  // Récupérer tous les stocks des établissements
  getEtablissements: () => apiClient.get('/stock/etablissements'),

  // Récupérer le stock d'un établissement spécifique
  getByEtablissement: (id) => apiClient.get(`/stock/etablissement/${id}`),

  // Distribuer du stock central vers un établissement
  distribuer: (data) => apiClient.post('/stock/distribuer', data),

  // Transférer du stock entre établissements
  transferer: (data) => apiClient.post('/stock/transferer', data),
}