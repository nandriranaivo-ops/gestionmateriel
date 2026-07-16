// D:/projet/gestionmateriel/frontend/src/store/materielStore.js
import { create } from 'zustand'
import apiClient from '../api/client'

const useMaterielStore = create((set, get) => ({
  // ========== ÉTAT INITIAL ==========
  materiels: [],
  stockCentral: [],
  stockEtablissements: [],
  etatsMateriel: [],
  accessibilites: [],
  demandes: [],
  reparations: [],
  historique: [],
  visites: [],
  isLoading: false,
  error: null,

  // ========== CHARGEMENT DES DONNÉES ==========
  loadAllData: async () => {
    set({ isLoading: true, error: null })
    try {
      const [
        materielsRes,
        stockCentralRes,
        stockEtablissementsRes,
        etatsMaterielRes,
        accessibilitesRes,
        demandesRes,
        reparationsRes,
        historiqueRes,
        visitesRes
      ] = await Promise.all([
        apiClient.get('/materiels'),
        apiClient.get('/stock-central'),
        apiClient.get('/stock-etablissements'),
        apiClient.get('/materiels/etats-materiel'),
        apiClient.get('/materiels/accessibilite'),
        apiClient.get('/demandes'),
        apiClient.get('/reparations'),
        apiClient.get('/historique'),
        apiClient.get('/visites')
      ])

      set({
        materiels: materielsRes.data || [],
        stockCentral: stockCentralRes.data || [],
        stockEtablissements: stockEtablissementsRes.data || [],
        etatsMateriel: etatsMaterielRes.data || [],
        accessibilites: accessibilitesRes.data || [],
        demandes: demandesRes.data || [],
        reparations: reparationsRes.data || [],
        historique: historiqueRes.data || [],
        visites: visitesRes.data || [],
        isLoading: false,
        error: null
      })
    } catch (error) {
      console.error('Erreur chargement données:', error)
      set({
        isLoading: false,
        error: error.response?.data?.message || error.message
      })
    }
  },

  // ========== STOCK CENTRAL ==========
  addStockCentral: async (id_materiel, quantite) => {
    try {
      const response = await apiClient.post('/stock-central', { id_materiel, quantite })
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  removeStockCentral: async (id_stock_central, quantite) => {
    try {
      const response = await apiClient.put(`/stock-central/${id_stock_central}/remove`, { quantite })
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  updateStockCentral: async (id_stock_central, quantite) => {
    try {
      const response = await apiClient.put(`/stock-central/${id_stock_central}`, { quantite })
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // ========== DISTRIBUTION ==========
  distribuerMateriel: async (id_materiel, id_etab, quantite) => {
    try {
      const response = await apiClient.post('/distribution', { id_materiel, id_etab, quantite })
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // ========== TRANSFERT ==========
  transfererMateriel: async (id_materiel, id_etab_source, id_etab_dest, quantite) => {
    try {
      const response = await apiClient.post('/transfert', {
        id_materiel,
        id_etab_source,
        id_etab_dest,
        quantite
      })
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // ========== ÉTAT MATÉRIEL (CORRIGÉ) ==========
  // frontend/src/store/materielStore.js

  // ========== ÉTAT MATÉRIEL (CORRIGÉ) ==========
  updateEtatMateriel: async (id_materiel, id_etab, etatData) => {
    // etatData = { action, quantite, commentaire }
    try {
      const response = await apiClient.put(`/materiels/${id_materiel}/etat`, {
        id_etab: id_etab,
        etat: etatData.action,      // 'reparer', 'mettre_en_panne', etc.
        quantite: etatData.quantite,
        commentaire: etatData.commentaire || null
      });
      await get().loadAllData();
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ========== ACCESSIBILITÉ (CORRIGÉ) ==========
  updateAccessibilite: async (id_materiel, id_etab, accesData) => {
    // accesData = { connecter, quantite, commentaire }
    try {
      const response = await apiClient.put(`/materiels/${id_materiel}/accessibilite`, {
        id_etab: id_etab,
        connecter: accesData.connecter,
        quantite: accesData.quantite,
        commentaire: accesData.commentaire || null
      });
      await get().loadAllData();
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ========== TRANSFERT ACCESSIBILITÉ (NOUVEAU) ==========
  transfererAccessibilite: async (id_materiel, id_etab, nombre, sens) => {
    // sens: 'connecter' ou 'deconnecter'
    try {
      const response = await apiClient.post(`/materiels/${id_materiel}/transfert-accessibilite`, {
        id_etab: id_etab,
        nombre,
        sens
      })
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // ========== STOCK ÉTABLISSEMENT ==========
  updateStockEtablissement: async (id_stock_etab, delta) => {
    try {
      const response = await apiClient.put(`/stock-etablissements/${id_stock_etab}`, { delta })
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error
    }
  },

  // ========== DEMANDES DE RÉPARATION ==========
  // frontend/src/store/materielStore.js

  // ========== DEMANDES DE RÉPARATION (CORRIGÉ) ==========
  addDemande: async (data) => {
    try {
      const response = await apiClient.post('/demandes', {
        id_materiel: data.id_materiel,
        quantite: data.quantite,
        type_panne: data.type_panne || null,
        urgence: data.urgence || 'normale',
        description: data.description
      });
      await get().loadAllData();
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateDemande: async (id_demande, data) => {
    try {
      const response = await apiClient.put(`/demandes/${id_demande}`, data)
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  traiterDemande: async (id_demande, statut, motif_refus = null) => {
    try {
      const response = await apiClient.put(`/demandes/${id_demande}/traiter`, { statut, motif_refus })
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // ========== RÉPARATIONS ==========
  addReparation: async (data) => {
    try {
      const response = await apiClient.post('/reparations', data)
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  updateReparation: async (id_reparation, data) => {
    try {
      const response = await apiClient.put(`/reparations/${id_reparation}`, data)
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  deleteReparation: async (id_reparation) => {
    try {
      const response = await apiClient.delete(`/reparations/${id_reparation}`)
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // ========== VISITES ==========
  addVisite: async (data) => {
    try {
      const response = await apiClient.post('/visites', data)
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  updateVisite: async (id_visite, data) => {
    try {
      const response = await apiClient.put(`/visites/${id_visite}`, data)
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  deleteVisite: async (id_visite) => {
    try {
      const response = await apiClient.delete(`/visites/${id_visite}`)
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // ========== GESTION MATÉRIEL (CRUD) (CORRIGÉ) ==========
  addMateriel: async (data) => {
    try {
      const response = await apiClient.post('/materiels', {
        reference: data.reference,
        id_type: data.id_type,
        description: data.description,
        quantiteInitial: data.quantite || 1
      })
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  updateMateriel: async (id_materiel, data) => {
    try {
      const response = await apiClient.put(`/materiels/${id_materiel}`, data)
      await get().loadAllData()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  deleteMateriel: async (id_materiel) => {
    try {
      await apiClient.delete(`/materiels/${id_materiel}`)
      await get().loadAllData()
    } catch (error) {
      throw error.response?.data || error
    }
  },

  getMaterielById: async (id_materiel) => {
    try {
      const response = await apiClient.get(`/materiels/${id_materiel}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // ========== TYPES DE MATÉRIEL ==========
  getTypesMateriel: async () => {
    try {
      const response = await apiClient.get('/types-materiel')
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // ========== STATISTIQUES (CORRIGÉ) ==========
  getStats: () => {
    const { materiels, stockCentral, stockEtablissements, etatsMateriel, accessibilites } = get()

    const totalMateriels = materiels.length
    const totalStockCentral = stockCentral.reduce((sum, item) => sum + (item.quantite || 0), 0)
    const totalDistribue = stockEtablissements.reduce((sum, item) => sum + (item.quantite || 0), 0)

    // Dernier état de chaque matériel (pour chaque établissement)
    const derniersEtats = {}
    etatsMateriel.forEach(etat => {
      const key = `${etat.id_materiel}_${etat.id_etab}`
      if (!derniersEtats[key] ||
        new Date(etat.date_changement) > new Date(derniersEtats[key].date_changement)) {
        derniersEtats[key] = etat
      }
    })

    // Total en panne (somme des en_panne)
    const totalPanne = Object.values(derniersEtats).reduce((sum, e) => sum + (e.en_panne || 0), 0)

    // Accessibilité - Utiliser connecte au lieu de accessible
    const derniersAcces = {}
    accessibilites.forEach(acc => {
      const key = `${acc.id_materiel}_${acc.id_etab}`
      if (!derniersAcces[key] ||
        new Date(acc.date_changement) > new Date(derniersAcces[key].date_changement)) {
        derniersAcces[key] = acc
      }
    })

    // Total connectés
    const totalConnectes = Object.values(derniersAcces).reduce((sum, a) => sum + (a.connecte || 0), 0)

    const totalUnites = totalStockCentral + totalDistribue

    return {
      totalMateriels,
      totalStockCentral,
      totalDistribue,
      totalPanne,
      totalConnectes,
      tauxPanne: totalUnites > 0 ? (totalPanne / totalUnites) * 100 : 0,
      tauxAccessibilite: totalUnites > 0 ? (totalConnectes / totalUnites) * 100 : 0
    }
  },

  // ========== RÉINITIALISATION ==========
  reset: () => {
    set({
      materiels: [],
      stockCentral: [],
      stockEtablissements: [],
      etatsMateriel: [],
      accessibilites: [],
      demandes: [],
      reparations: [],
      historique: [],
      visites: [],
      isLoading: false,
      error: null
    })
  }
}))

export default useMaterielStore