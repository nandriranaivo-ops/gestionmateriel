import React from 'react'
import { NavLink } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const Navbar = () => {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin_educmad'

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', adminOnly: false },
    { path: '/etablissements', label: 'Établissements', adminOnly: true },
    { path: '/utilisateurs', label: 'Utilisateurs', adminOnly: true },
    { path: '/demandes', label: 'Demandes', adminOnly: false },
    { path: '/historique', label: 'Historique', adminOnly: true },
    { path: '/visites', label: 'Visites', adminOnly: true }
  ]

  const filteredItems = menuItems.filter(item => !item.adminOnly || isAdmin)

  const photoUrl = user?.photo_profil && user.photo_profil !== 'default-avatar.png'
    ? `${import.meta.env.VITE_BASE_URL || 'http://localhost:5000'}/uploads/${user.photo_profil}`
    : null

  return (
    <nav className="shadow-lg fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#e8e8e8' }}>
      <div className="px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img src='src/assets/educmad.png' alt="Logo" style={{ width: '200px', height: 'auto' }} />
          </div>

          {/* Menu central - style boutons */}
          <div className="hidden md:flex items-center gap-1">
            {filteredItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={{ marginRight: '10px', background:'transparent' }}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Profil utilisateur */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800">{user?.nom}</p>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin_educmad' ? 'Administrateur' : 'Responsable Informatique'}
              </p>
            </div>

            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 border-2 border-gray-400 flex items-center justify-center">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={user?.nom || 'Avatar'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML = `<span class="text-gray-700 font-medium">${user?.nom?.charAt(0)?.toUpperCase() || 'U'}</span>`
                    }}
                  />
                ) : (
                  <span className="text-gray-700 font-medium">
                    {user?.nom?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              {user?.est_en_ligne && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
          </div>
        </div>

        {/* Menu mobile - style boutons */}
        <div className="md:hidden py-2 overflow-x-auto flex gap-2">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navbar