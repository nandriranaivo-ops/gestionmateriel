// frontend/src/store/authStore.js
import { create } from 'zustand';
import apiClient from '../api/client';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  login: async (email, password, role, id_etab = null) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        role,
        id_etab: id_etab ? parseInt(id_etab) : null
      });

      const { token, user } = response.data;

      if (token && user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ user, token, isLoading: false });
        return user;
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      set({ isLoading: false, user: null, token: null });
      throw new Error(error.response?.data?.message || 'Erreur de connexion');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete apiClient.defaults.headers.common['Authorization'];
    set({ user: null, token: null });
  },

  loadUserFromStorage: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token });
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return true;
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return false;
  },

  // ✅ Mise à jour du profil (nom, email) – accessible à tout utilisateur
  updateProfile: async (data) => {
    try {
      const response = await apiClient.put('/utilisateurs/profile', data);
      const updatedUser = response.data;
      set({ user: updatedUser });
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ✅ Changement de mot de passe – accessible à tout utilisateur
  updatePassword: async (passwords) => {
    try {
      const response = await apiClient.put('/utilisateurs/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ✅ Mise à jour de la photo de profil – accessible à tout utilisateur
  updatePhotoProfil: async (formData) => {
    try {
      const response = await apiClient.put('/utilisateurs/photo-profil', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { user } = get();
      if (user) {
        const updatedUser = { ...user, photo_profil: response.data.photo_profil };
        set({ user: updatedUser });
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}));

export default useAuthStore;