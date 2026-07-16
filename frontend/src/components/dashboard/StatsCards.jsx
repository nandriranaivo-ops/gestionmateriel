import React from 'react'
import { Package, Building2, Users, Wrench } from 'lucide-react'

const StatsCards = ({ stats, userRole }) => {
  const isAdmin = userRole === 'admin_educmad'
  
  const cards = [
    {
      title: 'Stock Central',
      value: stats.totalStockCentral,
      icon: Package,
      color: 'bg-blue-500',
      visible: isAdmin
    },
    {
      title: 'Établissements',
      value: stats.nbEtablissements,
      icon: Building2,
      color: 'bg-green-500',
      visible: isAdmin
    },
    {
      title: 'Matériels distribués',
      value: stats.totalMaterielDistribue,
      icon: Package,
      color: 'bg-purple-500',
      visible: isAdmin
    },
    {
      title: 'Matériels en panne',
      value: stats.totalEnPanne,
      icon: Wrench,
      color: 'bg-red-500',
      visible: true
    }
  ]
  
  const visibleCards = cards.filter(card => card.visible)
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {visibleCards.map((card, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
            </div>
            <div className={`${card.color} p-3 rounded-lg text-white`}>
              <card.icon size={24} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatsCards