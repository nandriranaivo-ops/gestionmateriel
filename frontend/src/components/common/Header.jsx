import React from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { Bell, User } from 'lucide-react'

const Header = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          {user?.role === 'admin_educmad' ? 'Administrateur' : 'Responsable Informatique'}
        </h2>
        {user?.role === 'responsable_etab' && (
          <p className="text-sm text-gray-500">Lycée Ambanitsena</p>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-gray-100 transition relative">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <User size={16} className="text-primary-600" />
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">
            {user?.nom}
          </span>
        </button>
      </div>
    </header>
  )
}

export default Header