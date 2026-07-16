// frontend/src/store/userStore.js
import { create } from 'zustand'
import apiClient from '../api/client'

const useUserStore = create((set, get) => ({
  utilisateurs: [],
  isLoading: false,
  error: null,
  
  loadUtilisateurs: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.get('/utilisateurs')
      set({ utilisateurs: response.data || [], isLoading: false })
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
      set({ 
        utilisateurs: [], 
        isLoading: false, 
        error: error.response?.data?.message || error.message 
      })
    }
  },
  
  addUtilisateur: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post('/utilisateurs', data)
      const { utilisateurs } = get()
      set({ 
        utilisateurs: [...utilisateurs, response.data],
        isLoading: false 
      })
      return response.data
    } catch (error) {
      console.error('Erreur ajout utilisateur:', error)
      set({ isLoading: false, error: error.response?.data?.message || error.message })
      throw error
    }
  },
  
  updateUtilisateur: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.put(`/utilisateurs/${id}`, data)
      const { utilisateurs } = get()
      set({
        utilisateurs: utilisateurs.map(u => u.id_user === id ? response.data : u),
        isLoading: false
      })
      return response.data
    } catch (error) {
      console.error('Erreur modification utilisateur:', error)
      set({ isLoading: false, error: error.response?.data?.message || error.message })
      throw error
    }
  },
  
  // ✅ Nouvelle fonction pour la photo de profil
  updatePhotoProfil: async (formData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.put('/utilisateurs/photo-profil', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      set({ isLoading: false })
      return response.data
    } catch (error) {
      console.error('Erreur mise à jour photo:', error)
      set({ isLoading: false, error: error.response?.data?.message || error.message })
      throw error
    }
  },
  
  deleteUtilisateur: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.delete(`/utilisateurs/${id}`)
      const { utilisateurs } = get()
      set({
        utilisateurs: utilisateurs.filter(u => u.id_user !== id),
        isLoading: false
      })
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error)
      set({ isLoading: false, error: error.response?.data?.message || error.message })
      throw error
    }
  },
  
  getUtilisateurById: async (id) => {
    try {
      const response = await apiClient.get(`/utilisateurs/${id}`)
      return response.data
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error)
      throw error
    }
  },
  
  reset: () => {
    set({ utilisateurs: [], isLoading: false, error: null })
  }
}))

export default useUserStore