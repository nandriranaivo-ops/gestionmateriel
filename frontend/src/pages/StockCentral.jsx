import React, { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'
import useMaterielStore from '../store/materielStore'
import { TYPES_MATERIEL } from '../utils/constants'
import toast from 'react-hot-toast'
import { Plus, Search, Eye, Edit, Trash2, X, Save } from 'lucide-react'

const StockCentral = () => {
  const { user } = useAuthStore()
  const { materiels, stockCentral, loadAllData, addStockCentral, removeStockCentral, updateMateriel, deleteMateriel, getMaterielById } = useMaterielStore()
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMateriel, setSelectedMateriel] = useState(null)
  const [quantite, setQuantite] = useState(1)
  
  // États pour les modals de gestion du matériel
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentMateriel, setCurrentMateriel] = useState(null)
  const [editForm, setEditForm] = useState({ reference: '', id_type: '', description: '', quantite: 0 })
  
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
  
  const stockItems = stockCentral.map(item => {
    const materiel = materiels.find(m => m.id_materiel === item.id_materiel)
    const type = TYPES_MATERIEL.find(t => t.id === materiel?.id_type)
    return {
      id: item.id_stock_central,
      id_materiel: item.id_materiel,
      reference: materiel?.reference || 'N/A',
      type: type?.displayName || 'Inconnu',
      typeIcon: getTypeIcon(type?.libelle),
      quantite: item.quantite || 0,
      date_ajout: materiel?.date_ajout || item.date_ajout,
      description: materiel?.description || '',
      id_type: materiel?.id_type
    }
  })
  
  const filteredItems = stockItems.filter(item => {
    const matchSearch = item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchType = !filterType || item.type === filterType
    return matchSearch && matchType
  })
  
  const handleAddStock = async () => {
    if (!selectedMateriel || quantite <= 0) {
      toast.error('Quantité invalide')
      return
    }
    try {
      await addStockCentral(selectedMateriel.id_materiel, quantite)
      toast.success(`${quantite} unité(s) ajoutée(s) au stock central`)
      setShowAddModal(false)
      setSelectedMateriel(null)
      setQuantite(1)
    } catch (error) {
      toast.error(error.message)
    }
  }
  
  const handleViewMateriel = async (item) => {
    try {
      const materiel = await getMaterielById(item.id_materiel)
      setCurrentMateriel({ ...materiel, quantite: item.quantite, id_stock_central: item.id })
      setShowViewModal(true)
    } catch (error) {
      toast.error('Erreur lors du chargement des détails')
    }
  }
  
  const handleEditMateriel = (item) => {
    setCurrentMateriel({
      id_materiel: item.id_materiel,
      reference: item.reference,
      id_type: item.id_type,
      description: item.description,
      quantite: item.quantite,
      id_stock_central: item.id
    })
    setEditForm({
      reference: item.reference,
      id_type: item.id_type?.toString() || '',
      description: item.description || '',
      quantite: item.quantite
    })
    setShowEditModal(true)
  }
  
  const handleUpdateMateriel = async () => {
    if (!editForm.reference || !editForm.id_type) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    try {
      // Mise à jour des infos du matériel
      await updateMateriel(currentMateriel.id_materiel, {
        reference: editForm.reference,
        id_type: parseInt(editForm.id_type),
        description: editForm.description
      })
      
      // Mise à jour de la quantité en stock (différence)
      const ancienneQuantite = currentMateriel.quantite
      const nouvelleQuantite = editForm.quantite
      if (nouvelleQuantite !== ancienneQuantite) {
        const difference = nouvelleQuantite - ancienneQuantite
        if (difference > 0) {
          await addStockCentral(currentMateriel.id_materiel, difference)
        } else if (difference < 0) {
          await removeStockCentral(currentMateriel.id_stock_central, -difference)
        }
      }
      
      toast.success('Matériel modifié avec succès')
      setShowEditModal(false)
      await loadAllData()
    } catch (error) {
      toast.error(error.message)
    }
  }
  
  const handleDeleteMateriel = async () => {
    try {
      await deleteMateriel(currentMateriel.id_materiel)
      toast.success('Matériel supprimé avec succès')
      setShowDeleteConfirm(false)
      await loadAllData()
    } catch (error) {
      toast.error(error.message)
    }
  }
  
  const materielsDisponibles = materiels.filter(m => {
    const stockItem = stockCentral.find(s => s.id_materiel === m.id_materiel)
    return !stockItem || stockItem.quantite === 0
  })
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement du stock central...</p>
        </div>
      </div>
    )
  }
  
  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">⛔</div>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Accès non autorisé</h2>
        <p className="text-red-600">Seul l'admin EDUCMAD peut accéder au stock central.</p>
      </div>
    )
  }
  
  const totalUnites = stockItems.reduce((sum, item) => sum + item.quantite, 0)
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock Central</h1>
          <p className="text-gray-500">Gestion du stock centralisé des matériels</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-primary-500">
          <p className="text-sm text-gray-500">Total unités</p>
          <p className="text-3xl font-bold text-primary-600">{totalUnites}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Types de matériel</p>
          <p className="text-3xl font-bold text-yellow-600">{stockItems.length}</p>
        </div>
      </div>
      
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
          <div>
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
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matériel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.date_ajout ? new Date(item.date_ajout).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {item.description || '-'}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={() => handleViewMateriel(item)}
                      className="text-blue-500 hover:text-blue-700 mr-2"
                      title="Voir détails"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEditMateriel(item)}
                      className="text-yellow-500 hover:text-yellow-700 mr-2"
                      title="Modifier"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setCurrentMateriel(item)
                        setShowDeleteConfirm(true)
                      }}
                      className="text-red-500 hover:text-red-700"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                   </td>
                 </tr>
              ))}
            </tbody>
           </table>
        </div>
      </div>
      
      {/* Modal Voir détails */}
      {showViewModal && currentMateriel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Détails du matériel</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              <p><strong>Référence :</strong> {currentMateriel.reference}</p>
              <p><strong>Type :</strong> {TYPES_MATERIEL.find(t => t.id === currentMateriel.id_type)?.displayName || 'Inconnu'}</p>
              <p><strong>Description :</strong> {currentMateriel.description || 'Aucune description'}</p>
              <p><strong>Quantité en stock :</strong> {currentMateriel.quantite}</p>
              <p><strong>Date d'ajout :</strong> {currentMateriel.date_ajout ? new Date(currentMateriel.date_ajout).toLocaleDateString() : '-'}</p>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowViewModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Modifier matériel (avec champ quantité) */}
      {showEditModal && currentMateriel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Modifier le matériel</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Référence *</label>
                <input
                  type="text"
                  value={editForm.reference}
                  onChange={(e) => setEditForm({...editForm, reference: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={editForm.id_type}
                  onChange={(e) => setEditForm({...editForm, id_type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Sélectionner un type</option>
                  {TYPES_MATERIEL.map(type => (
                    <option key={type.id} value={type.id}>{type.displayName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité en stock</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.quantite}
                  onChange={(e) => setEditForm({...editForm, quantite: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateMateriel}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Enregistrer
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Confirmation suppression */}
      {showDeleteConfirm && currentMateriel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">Confirmer la suppression</h2>
            <p className="text-gray-700 mb-4">
              Êtes-vous sûr de vouloir supprimer le matériel <strong>{currentMateriel.reference}</strong> ?
              <br />
              <span className="text-sm text-red-500">Cette action est irréversible.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteMateriel}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition"
              >
                Supprimer
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Ajout stock */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Ajouter au stock central</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matériel</label>
                <select
                  value={selectedMateriel?.id_materiel || ''}
                  onChange={(e) => {
                    const materiel = materiels.find(m => m.id_materiel === parseInt(e.target.value))
                    const stock = stockCentral.find(s => s.id_materiel === materiel?.id_materiel)
                    setSelectedMateriel(stock || materiel)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Sélectionner un matériel</option>
                  {materielsDisponibles.map(m => (
                    <option key={m.id_materiel} value={m.id_materiel}>
                      {m.reference} - {TYPES_MATERIEL.find(t => t.id === m.id_type)?.displayName}
                    </option>
                  ))}
                  {stockItems.filter(s => s.quantite > 0).map(s => (
                    <option key={s.id_materiel} value={s.id_materiel}>
                      {s.reference} - {s.type} (stock actuel: {s.quantite})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité à ajouter</label>
                <input
                  type="number"
                  min="1"
                  value={quantite}
                  onChange={(e) => setQuantite(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddStock}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 rounded-lg transition"
                >
                  Ajouter
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setSelectedMateriel(null)
                    setQuantite(1)
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

export default StockCentral