import React, { useEffect, useState } from 'react'
import { localStorageService } from '../../utils/localStorage'
import { formatRelativeTime, getStatutDemandeBadge } from '../../utils/formatters'

const RecentActivities = () => {
  const [activities, setActivities] = useState([])
  
  useEffect(() => {
    const historique = useHistoriqueStore.getState().loadHistorique()
    setActivities(historique.slice(0, 10))
  }, [])
  
  const getActionIcon = (actionType) => {
    const icons = {
      CREATE: '➕',
      UPDATE: '✏️',
      DELETE: '🗑️',
      LOGIN: '🔐',
      LOGOUT: '🚪',
      DISTRIBUTION: '📦',
      TRANSFERT: '🔄',
      REPARATION: '🔧',
      SUPPRESSION: '❌'
    }
    return icons[actionType] || '📋'
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Activités récentes</h3>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
        ) : (
          activities.map((activity, idx) => (
            <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
              <div className="text-xl">{getActionIcon(activity.action_type)}</div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">
                  <span className="font-medium">{activity.nom_utilisateur}</span> - {activity.details || activity.action_type}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatRelativeTime(activity.date_action)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default RecentActivities