import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import useEtablissementStore from './store/etablissementStore'
import useMaterielStore from './store/materielStore'
import routes from './routes'

function App() {
  const { user, token, loadUserFromStorage, isAuthenticated } = useAuthStore()
  const { loadEtablissements } = useEtablissementStore()
  const { loadAllData } = useMaterielStore()
  
  // ✅ Charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    loadUserFromStorage()
  }, [])
  
  // ✅ Charger les données SEULEMENT si connecté
  useEffect(() => {
    if (user && token) {
      loadEtablissements()
      loadAllData()
    }
  }, [user, token])
  
  const authenticated = !!user && !!token
  
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {routes.map((route, index) => {
          const Element = route.element
          const Layout = route.layout
          
          // Route publique
          if (!route.protected) {
            return (
              <Route
                key={index}
                path={route.path}
                element={
                  authenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Element />
                  )
                }
              />
            )
          }
          
          // Route protégée
          return (
            <Route
              key={index}
              path={route.path}
              element={
                authenticated ? (
                  Layout ? (
                    <Layout>
                      <Element />
                    </Layout>
                  ) : (
                    <Element />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          )
        })}
      </Routes>
    </Router>
  )
}

export default App