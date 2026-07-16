import apiClient from './client'

export const uploadAPI = {
  // Uploader une photo de profil
  uploadPhoto: (file) => {
    const formData = new FormData()
    formData.append('photo', file)
    return apiClient.post('/upload/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Supprimer la photo de profil
  deletePhoto: () => apiClient.delete('/upload/profile'),
}