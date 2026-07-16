// D:/projet/gestionmateriel/frontend/src/api/client.js
import axios from 'axios'

// URL de l'API - utilise la variable d'environnement ou l'URL par défaut
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Création de l'instance Axios
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // 30 secondes
  withCredentials: false // Ne pas envoyer les cookies (CORS simple)
})

// === INTERCEPTEURS ===

// Intercepteur de requête (ajout du token)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log pour le développement
    if (import.meta.env.DEV) {
      console.log(`🚀 [API Request] ${config.method?.toUpperCase()} -> ${config.baseURL}${config.url}`)
    }
    
    return config
  },
  (error) => {
    console.error('❌ [API Request Error]', error)
    return Promise.reject(error)
  }
)

// Intercepteur de réponse
apiClient.interceptors.response.use(
  (response) => {
    // Log pour le développement
    if (import.meta.env.DEV) {
      console.log(`✅ [API Response] ${response.status} <- ${response.config.url}`)
    }
    return response
  },
  (error) => {
    // Gestion des erreurs
    if (error.response) {
      // Le serveur a répondu avec un statut d'erreur
      const { status, data, config } = error.response
      
      console.error(`❌ [API Error ${status}] ${config.url}`, data)
      
      // Erreur 401 : Non autorisé -> déconnexion
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        // Rediriger vers login si pas déjà sur la page login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
      
      // Erreur 403 : Interdit
      if (status === 403) {
        console.error('⛔ Accès interdit')
      }
      
      // Erreur 404 : Non trouvé
      if (status === 404) {
        console.error('🔍 Ressource non trouvée')
      }
      
      // Erreur 500 : Erreur serveur
      if (status >= 500) {
        console.error('💥 Erreur serveur')
      }
      
      return Promise.reject({
        status,
        message: data?.message || data?.error || 'Erreur serveur',
        data: data
      })
    }
    
    if (error.request) {
      // La requête a été faite mais pas de réponse
      console.error('❌ [API No Response]', error.request)
      return Promise.reject({
        status: 0,
        message: 'Impossible de contacter le serveur. Vérifiez que le backend est démarré.',
        isNetworkError: true
      })
    }
    
    // Autre erreur
    console.error('❌ [API Unknown Error]', error.message)
    return Promise.reject({
      status: 0,
      message: error.message || 'Erreur inconnue'
    })
  }
)

// === MÉTHODES UTILITAIRES ===

// Vérifier si l'API est accessible
apiClient.checkHealth = async () => {
  try {
    const response = await apiClient.get('/health')
    return response.data
  } catch (error) {
    console.error('API Health Check Failed:', error)
    return null
  }
}

// Récupérer le token actuel
apiClient.getToken = () => {
  return localStorage.getItem('token')
}

// Définir le token manuellement
apiClient.setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token)
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    localStorage.removeItem('token')
    delete apiClient.defaults.headers.common['Authorization']
  }
}

// Déconnexion
apiClient.logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  delete apiClient.defaults.headers.common['Authorization']
}

export default apiClient