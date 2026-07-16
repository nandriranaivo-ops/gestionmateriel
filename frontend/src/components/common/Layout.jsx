import React from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navbar fixe en haut */}
      <Navbar />
      
      {/* Contenu principal avec Sidebar (ajout d'un padding-top pour éviter que le contenu soit sous la navbar) */}
      <div className="flex flex-1 overflow-hidden pt-16">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout