import React, { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'
import useMaterielStore from '../store/materielStore'
import { TYPES_MATERIEL } from '../utils/constants'
import toast from 'react-hot-toast'
import { Search, Trash2, AlertTriangle } from 'lucide-react'

const SuppressionMateriel = () => {
  const { user } = useAuthStore()
  const { 
    materiels, 
    stockCentral, 
    stockEtablissements, 
    loadAllData, 
    deleteMateriel,
    removeStockCentral,
    updateStockEtablissement  // à créer (voir ci-dessous)
  } = useMaterielStore()
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [selectedMateriel, setSelectedMateriel] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [quantiteASupprimer, setQuantiteASupprimer] = useState(1)
  const [maxQuantite, setMaxQuantite] = useState(0)
  
  const isAdmin = user?.role === 'admin_educmad'
  
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
  
  useEffect(() => {
    const init = async () => {
      await loadAllData()
      setLoading(false)
    }
    init()
  }, [])
  
  const materielsList = materiels.map(materiel => {
    const type = TYPES_MATERIEL.find(t => t.id === materiel.id_type)
    const stockCentralQty = stockCentral.find(s => s.id_materiel === materiel.id_materiel)?.quantite || 0
    const stockEtabQty = stockEtablissements
      .filter(s => s.id_materiel === materiel.id_materiel)
      .reduce((sum, s) => sum + (s.quantite || 0), 0)
    
    return {
      id: materiel.id_materiel,
      reference: materiel.reference,
      type: type?.displayName || 'Inconnu',
      typeIcon: getTypeIcon(type?.libelle),
      stockCentral: stockCentralQty,
      stockDistribue: stockEtabQty,
      totalStock: stockCentralQty + stockEtabQty,
      date_ajout: materiel.date_ajout
    }
  })
  
  const filteredItems = materielsList.filter(item => {
    const matchSearch = item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchType = !filterType || item.type === filterType
    return matchSearch && matchType
  })
  
  const handleOpenModal = (item) => {
    setSelectedMateriel(item)
    setQuantiteASupprimer(1)
    setMaxQuantite(item.totalStock)
    setShowConfirmModal(true)
  }
  
  const handleDeletePartial = async () => {
    setIsLoading(true)
    try {
      // 1. Retirer la quantité du stock central (si possible)
      let reste = quantiteASupprimer
      let stockCentralItem = stockCentral.find(s => s.id_materiel === selectedMateriel.id)
      if (stockCentralItem && stockCentralItem.quantite > 0) {
        const aRetirerCentral = Math.min(reste, stockCentralItem.quantite)
        await removeStockCentral(stockCentralItem.id_stock_central, aRetirerCentral)
        reste -= aRetirerCentral
      }
      
      // 2. Si reste > 0, retirer des stocks établissements (par ordre, par exemple)
      if (reste > 0) {
        const stocksEtab = stockEtablissements.filter(s => s.id_materiel === selectedMateriel.id)
        for (const stock of stocksEtab) {
          if (reste === 0) break
          const aRetirerEtab = Math.min(reste, stock.quantite)
          await updateStockEtablissement(stock.id_stock_etab, -aRetirerEtab)
          reste -= aRetirerEtab
        }
      }
      
      // 3. Si après retrait le stock total devient 0, supprimer le matériel
      const newStockCentral = await removeStockCentral ? /* recharger après */ null : null
      await loadAllData() // recharger pour avoir les nouvelles valeurs
      const updated = materielsList.find(m => m.id === selectedMateriel.id)
      if (updated && updated.totalStock - quantiteASupprimer <= 0) {
        await deleteMateriel(selectedMateriel.id)
        toast.success(`Matériel "${selectedMateriel.reference}" entièrement supprimé (stock vide)`)
      } else {
        toast.success(`${quantiteASupprimer} unité(s) de "${selectedMateriel.reference}" retirée(s) du stock`)
      }
      
      setShowConfirmModal(false)
      setSelectedMateriel(null)
      await loadAllData()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }
  
  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">⛔</div>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Accès non autorisé</h2>
        <p className="text-red-600">Seul l'admin EDUCMAD peut supprimer du matériel.</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par référence ou type..."
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
            {[...new Set(materielsList.map(item => item.type))].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock central</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock distribué</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total unités</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600 font-medium">
                    {item.stockCentral}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600 font-medium">
                    {item.stockDistribue}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-800">
                    {item.totalStock}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-lg transition flex items-center gap-1 mx-auto"
                    >
                      <Trash2 size={16} />
                      Retirer / Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Aucun matériel trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal de confirmation avec champ quantité */}
      {showConfirmModal && selectedMateriel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertTriangle size={28} />
              <h2 className="text-xl font-bold">Retirer des unités</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="font-semibold text-red-800">Matériel :</p>
                <p className="text-lg font-bold">{selectedMateriel.reference}</p>
                <p className="text-sm text-gray-600">{selectedMateriel.type}</p>
                <p className="text-sm text-gray-600 mt-1">Stock total actuel : <strong>{selectedMateriel.totalStock}</strong></p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité à retirer *
                </label>
                <input
                  type="number"
                  min="1"
                  max={maxQuantite}
                  value={quantiteASupprimer}
                  onChange={(e) => setQuantiteASupprimer(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum : {maxQuantite}</p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleDeletePartial}
                  disabled={isLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  {isLoading ? 'Traitement...' : 'Confirmer le retrait'}
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false)
                    setSelectedMateriel(null)
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SuppressionMateriel