import React from 'react'
import { NavLink } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useUiStore from '../../store/uiStore'
import { 
  ChevronLeft,
  ChevronRight,
  LogOut,
  User
} from 'lucide-react'

const Sidebar = () => {
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUiStore()
  const isAdmin = user?.role === 'admin_educmad'
  const isResponsable = user?.role === 'responsable_etab'

  const adminActions = [
    { label: 'Distribuer', path: '/distribution' },
    { label: 'Transférer', path: '/transfert' },
    { label: 'Ajout matériel', path: '/ajout-materiel' },
    { label: 'Supprimer', path: '/suppression-materiel' },
    { label: 'Stock Central', path: '/stock-central' },
  ]

  const responsableActions = [
    { label: 'Gérer états', path: '/gestion-pannes' },
    { label: 'Gérer accès', path: '/gestion-acces' },
  ]

  const actions = isAdmin ? adminActions : (isResponsable ? responsableActions : [])

  return (
    <div 
      className={`${sidebarOpen ? 'w-64' : 'w-16'} shadow-lg transition-all duration-300 flex flex-col h-full`}
      style={{ backgroundColor: '#e8e8e8' }} // gris plus soutenu que whitesmoke
    >
      {/* Bouton toggle */}
      <div className="flex items-center justify-end p-3 border-b border-gray-300">
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-lg bg-gray-300 hover:bg-gray-400 transition text-gray-700"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Titre Actions rapides */}
      {sidebarOpen && actions.length > 0 && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Actions</p>
        </div>
      )}

      {/* Actions rapides (sans icônes) - style boutons */}
      <div className="flex-1 px-2 py-2 overflow-y-auto">
        {actions.map((action, idx) => (
          <NavLink
            key={idx}
            to={action.path}
            style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', background:'transparent'}}
            className={({ isActive }) =>
              `flex items-center w-full px-4 py-2 my-1 rounded-lg transition duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-200 hover:shadow-sm'
              }`
            }
            title={!sidebarOpen ? action.label : ''}
          >
            {sidebarOpen && <span className="text-sm font-medium">{action.label}</span>}
          </NavLink>
        ))}
      </div>

      {/* Section Profil et Déconnexion en bas (avec icônes) */}
      <div className="p-3 border-t border-gray-300">
        {/* Profil */}
        <NavLink
          to="/profile"
          className="flex items-center w-full px-3 py-2 mb-2 rounded-lg transition duration-200 bg-white hover:bg-gray-200 text-gray-700 shadow-sm"
          title={!sidebarOpen ? 'Profil' : ''}
        >
          <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white">
            <User size={14} />
          </div>
          {sidebarOpen && <span className="ml-3 text-sm font-medium">Profil</span>}
        </NavLink>

        {/* Déconnexion */}
        <button
          onClick={logout}
          className="flex items-center w-full px-3 py-2 rounded-lg transition duration-200 bg-white hover:bg-red-100 text-red-600 shadow-sm"
          title={!sidebarOpen ? 'Déconnexion' : ''}
        >
          <div className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white">
            <LogOut size={14} />
          </div>
          {sidebarOpen && <span className="ml-3 text-sm font-medium">Déconnexion</span>}
        </button>
      </div>
    </div>
  )
}

export default Sidebar