import React, { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'
import useMaterielStore from '../store/materielStore'
import useEtablissementStore from '../store/etablissementStore'
import { TYPES_MATERIEL } from '../utils/constants'
import { Search, Filter, Calendar, Download, History as HistoryIcon } from 'lucide-react'
import toast from 'react-hot-toast'

const Historique = () => {
  const { user } = useAuthStore()
  const { historique, materiels, stockEtablissements, loadAllData } = useMaterielStore()
  const { etablissements, loadEtablissements } = useEtablissementStore()
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  
  const isAdmin = user?.role === 'admin_educmad'
  const isResponsable = user?.role === 'responsable_etab'
  const responsableEtabId = user?.id_etab
  
  useEffect(() => {
    const init = async () => {
      await loadAllData()
      await loadEtablissements()
      setLoading(false)
    }
    init()
  }, [])
  
  const getFilteredHistorique = () => {
    let filtered = [...historique].sort((a, b) => new Date(b.date_action) - new Date(a.date_action))
    
    // Filtrer par établissement pour les responsables
    if (isResponsable) {
      const mesMaterielsIds = stockEtablissements
        .filter(s => s.id_etab === responsableEtabId)
        .map(s => s.id_materiel)
      filtered = filtered.filter(h => mesMaterielsIds.includes(h.id_materiel))
    }
    
    if (searchTerm) {
      filtered = filtered.filter(h => {
        const materiel = materiels.find(m => m.id_materiel === h.id_materiel)
        return materiel?.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               h.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               h.details?.toLowerCase().includes(searchTerm.toLowerCase())
      })
    }
    
    if (filterType) {
      filtered = filtered.filter(h => {
        const materiel = materiels.find(m => m.id_materiel === h.id_materiel)
        const type = TYPES_MATERIEL.find(t => t.id === materiel?.id_type)
        return type?.displayName === filterType
      })
    }
    
    if (filterAction) {
      filtered = filtered.filter(h => h.action === filterAction)
    }
    
    if (dateDebut) {
      filtered = filtered.filter(h => new Date(h.date_action) >= new Date(dateDebut))
    }
    
    if (dateFin) {
      filtered = filtered.filter(h => new Date(h.date_action) <= new Date(dateFin))
    }
    
    return filtered
  }
  
  const getActionIcon = (action) => {
    switch(action) {
      case 'ajout_stock_central': return '➕'
      case 'retrait_stock_central': return '➖'
      case 'distribution': return '📤'
      case 'transfert': return '🔄'
      case 'changement_etat': return '🔧'
      case 'changement_accessibilite': return '🌐'
      case 'creation_demande': return '📝'
      case 'traitement_demande': return '✅'
      default: return '📋'
    }
  }
  
  const getActionLabel = (action) => {
    const labels = {
      'ajout_stock_central': 'Ajout stock central',
      'retrait_stock_central': 'Retrait stock central',
      'distribution': 'Distribution',
      'transfert': 'Transfert',
      'changement_etat': 'Changement état',
      'changement_accessibilite': 'Changement accessibilité',
      'creation_demande': 'Création demande',
      'traitement_demande': 'Traitement demande'
    }
    return labels[action] || action
  }
  
  const getTypeIcon = (libelle) => {
    const icons = {
      'ordinateur_portable': '💻',
      'ordinateur_bureau': '🖥️',
      'smartphone': '📱',
      'tablette': '📟',
      'routeur': '🌐',
      'switch': '🔌',
      'serveur': '🖧',
      'projecteur': '📽️'
    }
    return icons[libelle] || '📦'
  }
  
  const handleExport = () => {
    const data = getFilteredHistorique()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historique_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Historique exporté avec succès')
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement de l'historique...</p>
        </div>
      </div>
    )
  }
  
  const filteredHistorique = getFilteredHistorique()
  const typesDisponibles = [...new Set(
    materiels.map(m => {
      const type = TYPES_MATERIEL.find(t => t.id === m.id_type)
      return type?.displayName
    }).filter(Boolean)
  )]
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Historique des actions</h1>
          <p className="text-gray-500">Traçabilité de toutes les opérations</p>
        </div>
        <button
          onClick={handleExport}
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
        >
          <Download size={18} />
          Exporter
        </button>
      </div>
      
      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Référence, action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de matériel</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tous</option>
              {typesDisponibles.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type d'action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Toutes</option>
              <option value="ajout_stock_central">Ajout stock central</option>
              <option value="retrait_stock_central">Retrait stock central</option>
              <option value="distribution">Distribution</option>
              <option value="transfert">Transfert</option>
              <option value="changement_etat">Changement état</option>
              <option value="changement_accessibilite">Changement accessibilité</option>
              <option value="creation_demande">Création demande</option>
              <option value="traitement_demande">Traitement demande</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Liste historique */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matériel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Détails</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistorique.map((item) => {
                const materiel = materiels.find(m => m.id_materiel === item.id_materiel)
                const type = TYPES_MATERIEL.find(t => t.id === materiel?.id_type)
                return (
                  <tr key={item.id_historique} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.date_action).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {getActionLabel(item.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {materiel?.reference || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                         {type?.displayName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                      {item.details}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.utilisateur_nom}
                    </td>
                  </tr>
                )
              })}
              {filteredHistorique.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <HistoryIcon size={48} className="mx-auto mb-2 text-gray-300" />
                    Aucune action trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Historique