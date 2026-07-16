import React, { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'
import useMaterielStore from '../store/materielStore'
import useEtablissementStore from '../store/etablissementStore'
import { TYPES_MATERIEL } from '../utils/constants'
import { Search, AlertCircle, Package, Building2 } from 'lucide-react'

const StockEtablissement = () => {
  const { user } = useAuthStore()
  const { materiels, stockEtablissements, etatsMateriel, accessibilites, loadAllData } = useMaterielStore()
  const { etablissements, loadEtablissements } = useEtablissementStore()
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterEtat, setFilterEtat] = useState('')
  
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
  
  // Filtrer les stocks selon le rôle
  const getFilteredStocks = () => {
    let filtered = [...stockEtablissements]
    
    if (isResponsable) {
      filtered = filtered.filter(s => s.id_etab === responsableEtabId)
    }
    
    return filtered
  }
  
  const getDernierEtat = (id_materiel, id_etab) => {
    const etats = etatsMateriel
      .filter(e => e.id_materiel === id_materiel && e.id_etab === id_etab)
      .sort((a, b) => new Date(b.date_changement) - new Date(a.date_changement))
    return etats[0]
  }

  const getDerniereAccessibilite = (id_materiel, id_etab) => {
    const acces = accessibilites
      .filter(a => a.id_materiel === id_materiel && a.id_etab === id_etab)
      .sort((a, b) => new Date(b.date_changement) - new Date(a.date_changement))
    return acces[0]
  }
  
  const stockItems = getFilteredStocks().map(item => {
    const materiel = materiels.find(m => m.id_materiel === item.id_materiel)
    const type = TYPES_MATERIEL.find(t => t.id === materiel?.id_type)
    const etablissement = etablissements.find(e => e.id_etab === item.id_etab)
    
    const dernierEtat = getDernierEtat(item.id_materiel, item.id_etab)
    const derniereAccessibilite = getDerniereAccessibilite(item.id_materiel, item.id_etab)
    
    // Déterminer l'état principal
    let etatPrincipal = 'inconnu'
    if (dernierEtat) {
      if (dernierEtat.en_marche > 0) etatPrincipal = 'en_marche'
      else if (dernierEtat.en_panne > 0) etatPrincipal = 'en_panne'
      else if (dernierEtat.en_reparation > 0) etatPrincipal = 'en_reparation'
    }
    
    return {
      id: item.id_stock_etab,
      id_materiel: item.id_materiel,
      id_etab: item.id_etab,
      reference: materiel?.reference || 'N/A',
      type: type?.displayName || 'Inconnu',
      typeIcon: getTypeIcon(type?.libelle),
      typeId: materiel?.id_type,
      quantite: item.quantite || 0,
      enMarche: dernierEtat?.en_marche || 0,
      enPanne: dernierEtat?.en_panne || 0,
      enReparation: dernierEtat?.en_reparation || 0,
      etat: etatPrincipal,
      connecte: derniereAccessibilite?.connecte || 0,
      nonConnecte: derniereAccessibilite?.non_connecte || 0,
      accessible: (derniereAccessibilite?.connecte || 0) > 0,
      etablissement: etablissement?.nom || 'Inconnu',
      date_reception: item.date_reception
    }
  })
  
  const filteredItems = stockItems.filter(item => {
    const matchSearch = item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.etablissement.toLowerCase().includes(searchTerm.toLowerCase())
    const matchType = !filterType || item.type === filterType
    const matchEtat = !filterEtat || item.etat === filterEtat
    return matchSearch && matchType && matchEtat
  })
  
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
  
  const getEtatIcon = (etat) => {
    switch(etat) {
      case 'en_marche': return '🟢'
      case 'en_panne': return '🔴'
      case 'en_reparation': return '🟡'
      default: return '⚪'
    }
  }
  
  const getEtatLabel = (etat) => {
    switch(etat) {
      case 'en_marche': return 'En marche'
      case 'en_panne': return 'En panne'
      case 'en_reparation': return 'En réparation'
      default: return 'Inconnu'
    }
  }
  
  const getEtatColor = (etat) => {
    switch(etat) {
      case 'en_marche': return 'text-green-600 bg-green-50'
      case 'en_panne': return 'text-red-600 bg-red-50'
      case 'en_reparation': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des stocks...</p>
        </div>
      </div>
    )
  }
  
  if (!isAdmin && !isResponsable) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">⛔</div>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Accès non autorisé</h2>
        <p className="text-red-600">Vous n'avez pas les droits pour accéder à cette page.</p>
      </div>
    )
  }
  
  const totalUnites = stockItems.reduce((sum, item) => sum + item.quantite, 0)
  const totalPanne = stockItems.reduce((sum, item) => sum + item.enPanne, 0)
  const totalAccessibles = stockItems.reduce((sum, item) => sum + item.connecte, 0)
  const typesCount = new Set(stockItems.map(item => item.type)).size
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Stock des établissements</h1>
        <p className="text-gray-500">
          {isAdmin 
            ? 'Gestion du stock distribué dans tous les établissements'
            : `Gestion du stock de mon établissement : ${etablissements.find(e => e.id_etab === responsableEtabId)?.nom || ''}`}
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg border-l-4 border-primary-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total unités</p>
              <p className="text-3xl font-bold text-primary-600">{totalUnites}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Package size={24} className="text-primary-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border-l-4 border-purple-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Types de matériel</p>
              <p className="text-3xl font-bold text-purple-600">{typesCount}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Building2 size={24} className="text-purple-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border-l-4 border-red-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En panne</p>
              <p className="text-3xl font-bold text-red-600">{totalPanne}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle size={24} className="text-red-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border-l-4 border-green-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Connectés (AccesMad)</p>
              <p className="text-3xl font-bold text-green-600">{totalAccessibles}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Package size={24} className="text-green-500" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par référence, type ou établissement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous les types</option>
            {[...new Set(stockItems.map(item => item.type))].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={filterEtat}
            onChange={(e) => setFilterEtat(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous les états</option>
            <option value="en_marche">🟢 En marche</option>
            <option value="en_panne">🔴 En panne</option>
            <option value="en_reparation">🟡 En réparation</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantité</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-green-600 uppercase">Marche</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-red-600 uppercase">Panne</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-yellow-600 uppercase">Réparation</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-teal-600 uppercase">Connecté</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Non connecté</th>
                {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Établissement</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date réception</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      {item.typeIcon} {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-800">
                    {item.quantite}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600 font-semibold">
                    {item.enMarche}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600 font-semibold">
                    {item.enPanne}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-yellow-600 font-semibold">
                    {item.enReparation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-teal-600 font-semibold">
                    {item.connecte}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 font-semibold">
                    {item.nonConnecte}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.etablissement}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.date_reception ? new Date(item.date_reception).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="px-6 py-8 text-center text-gray-500">
                    Aucun matériel trouvé
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

export default StockEtablissement