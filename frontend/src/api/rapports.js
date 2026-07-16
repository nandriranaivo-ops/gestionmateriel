import apiClient from './client'

export const rapportsAPI = {
  // Statistiques générales
  getStats: () => apiClient.get('/rapports/stats'),

  // Répartition par type de matériel
  getRepartitionParType: () => apiClient.get('/rapports/repartition/type'),

  // Répartition par établissement
  getRepartitionParEtablissement: () => apiClient.get('/rapports/repartition/etablissement'),

  // Évolution des pannes
  getEvolutionPannes: (periode = 6) => apiClient.get(`/rapports/evolution/pannes?periode=${periode}`),
}