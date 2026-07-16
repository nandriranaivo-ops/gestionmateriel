import React, { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'
import useMaterielStore from '../store/materielStore'
import useEtablissementStore from '../store/etablissementStore'
import { TYPES_MATERIEL } from '../utils/constants'
import toast from 'react-hot-toast'
import { Plus, Search, Building2, Package, CheckCircle } from 'lucide-react'

const Distribution = () => {
  const { user } = useAuthStore()
  const { materiels, stockCentral, stockEtablissements, loadAllData, distribuerMateriel } = useMaterielStore()
  const { etablissements, loadEtablissements } = useEtablissementStore()

  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedMateriel, setSelectedMateriel] = useState(null)
  const [selectedEtablissement, setSelectedEtablissement] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAdmin = user?.role === 'admin_educmad'

  // ✅ Définir la fonction AVANT de l'utiliser
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
      await loadEtablissements()
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
      description: materiel?.description || ''
    }
  })

  const disponibles = stockItems.filter(item => item.quantite > 0)

  const filteredItems = disponibles.filter(item => {
    const matchSearch = item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchType = !filterType || item.type === filterType
    return matchSearch && matchType
  })

  const handleDistribuer = async () => {
    if (!selectedMateriel || !selectedEtablissement) {
      toast.error('Veuillez sélectionner un matériel et un établissement')
      return
    }

    if (quantite <= 0 || quantite > selectedMateriel.quantite) {
      toast.error(`Quantité invalide. Maximum: ${selectedMateriel.quantite}`)
      return
    }

    setIsSubmitting(true)
    try {
      await distribuerMateriel(selectedMateriel.id_materiel, parseInt(selectedEtablissement), quantite)
      toast.success(`${quantite} unité(s) distribuée(s) à ${etablissements.find(e => e.id_etab === parseInt(selectedEtablissement))?.nom}`)
      setShowModal(false)
      setSelectedMateriel(null)
      setSelectedEtablissement('')
      setQuantite(1)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
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
        <p className="text-red-600">Seul l'admin EDUCMAD peut distribuer du matériel.</p>
      </div>
    )
  }

  const totalDisponible = disponibles.reduce((sum, item) => sum + item.quantite, 0)
  const totalTypes = disponibles.length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Distribution de matériel</h1>
          <p className="text-gray-500">Distribuer du matériel du stock central aux établissements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Stock disponible</p>
              <p className="text-3xl font-bold text-primary-600">{totalDisponible}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Package size={24} className="text-primary-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Types disponibles</p>
              <p className="text-3xl font-bold text-green-600">{totalTypes}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Building2 size={24} className="text-green-500" />
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
            {[...new Set(disponibles.map(item => item.type))].map(type => (
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
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock disponible</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-primary-600">
                    {item.quantite}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={() => {
                        setSelectedMateriel(item)
                        setSelectedEtablissement('')
                        setQuantite(1)
                        setShowModal(true)
                      }}
                      className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-1 rounded-lg transition flex items-center gap-1 mx-auto"
                    >
                      <Plus size={16} />
                      Distribuer
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    Aucun matériel disponible dans le stock central
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de distribution */}
      {showModal && selectedMateriel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Distribuer du matériel</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600">
                  Matériel : <span className="font-semibold">{selectedMateriel.reference}</span>
                </p>
                <p className="text-gray-600">
                  Type : {selectedMateriel.type}
                </p>
                <p className="text-gray-600">
                  Stock disponible : <span className="font-semibold text-primary-600">{selectedMateriel.quantite}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Établissement destinataire *</label>
                <select
                  value={selectedEtablissement}
                  onChange={(e) => setSelectedEtablissement(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Sélectionner un établissement</option>
                  {etablissements.filter(e => e.actif).map(etab => (
                    <option key={etab.id_etab} value={etab.id_etab}>{etab.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedMateriel.quantite}
                  value={quantite}
                  onChange={(e) => setQuantite(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleDistribuer}
                  disabled={isSubmitting}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  {isSubmitting ? 'Distribution...' : 'Distribuer'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedMateriel(null)
                    setSelectedEtablissement('')
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

export default Distribution