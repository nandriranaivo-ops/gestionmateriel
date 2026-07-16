// frontend/src/store/etablissementStore.js
import { create } from 'zustand';
import apiClient from '../api/client';

const useEtablissementStore = create((set, get) => ({
    etablissements: [],
    isLoading: false,
    error: null,

    // ✅ Chargement public pour la page de connexion (route /etablissements/selection)
    loadEtablissementsPublic: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get('/etablissements/selection');
            set({ etablissements: response.data, isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: error.response?.data?.error || error.message
            });
        }
    },

    // Charger la liste complète (protégée)
    loadEtablissements: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get('/etablissements');
            set({ etablissements: response.data, isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: error.response?.data?.error || error.message
            });
        }
    },

    // Ajouter un établissement – on filtre les champs
    addEtablissement: async (data) => {
        try {
            const allowedFields = [
                'nom', 'dren', 'cisco', 'zap',
                'nom_directeur', 'contact_directeur', 'email_directeur',
                'nom_responsable_info', 'contact_responsable_info', 'email_responsable_info'
            ];
            const payload = {};
            for (const key of allowedFields) {
                if (data[key] !== undefined) {
                    payload[key] = data[key];
                }
            }
            const response = await apiClient.post('/etablissements', payload);
            await get().loadEtablissements();
            return response.data.etablissement;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Modifier un établissement
    updateEtablissement: async (id, data) => {
        try {
            const allowedFields = [
                'nom', 'dren', 'cisco', 'zap',
                'nom_directeur', 'contact_directeur', 'email_directeur',
                'nom_responsable_info', 'contact_responsable_info', 'email_responsable_info',
                'actif'
            ];
            const payload = {};
            for (const key of allowedFields) {
                if (data[key] !== undefined) {
                    payload[key] = data[key];
                }
            }
            const response = await apiClient.put(`/etablissements/${id}`, payload);
            await get().loadEtablissements();
            return response.data.etablissement;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Supprimer (désactiver) un établissement
    deleteEtablissement: async (id, motif) => {
        try {
            await apiClient.delete(`/etablissements/${id}`, { data: { motif } });
            await get().loadEtablissements();
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Réinitialisation
    reset: () => set({ etablissements: [], isLoading: false, error: null })
}));

export default useEtablissementStore;