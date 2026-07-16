import React, { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'
import useMaterielStore from '../store/materielStore'
import useEtablissementStore from '../store/etablissementStore'
import { TYPES_MATERIEL } from '../utils/constants'
import toast from 'react-hot-toast'
import { Search, Wrench, CheckCircle, Clock, Eye } from 'lucide-react'

const Reparation = () => {
  const { user } = useAuthStore()
  const { reparations, demandes, materiels, loadAllData, addReparation, updateReparation } = useMaterielStore()
  const { etablissements, loadEtablissements } = useEtablissementStore()
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedReparation, setSelectedReparation] = useState(null)
  const [selectedDemande, setSelectedDemande] = useState(null)
  const [formData, setFormData] = useState({
    id_demande: '',
    cout: '',
    duree: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const isAdmin = user?.role === 'admin_educmad'
  
  useEffect(() => {
    const init = async () => {
      await loadAllData()
      await loadEtablissements()
      setLoading(false)
    }
    init()
  }, [])
  
  const reparationsList = reparations.map(rep => {
    const demande = demandes.find(d => d.id_demande === rep.id_demande)
    const materiel = materiels.find(m => m.id_materiel === demande?.id_materiel)
    const type = TYPES_MATERIEL.find(t => t.id === materiel?.id_type)
    const etablissement = etablissements.find(e => e.id_etab === demande?.id_etab)
    
    return {
      id: rep.id_reparation,
      id_demande: rep.id_demande,
      reference: materiel?.reference || 'N/A',
      type: type?.displayName || 'Inconnu',
      typeIcon: getTypeIcon(type?.libelle),
      statut: rep.statut,
      cout: rep.cout,
      duree: rep.duree,
      notes: rep.notes,
      date_debut: rep.date_debut,
      date_fin: rep.date_fin,
      etablissement: etablissement?.nom || 'N/A'
    }
  })
  
  const demandesEnAttente = demandes
    .filter(d => d.statut === 'en_cours' && !reparations.some(r => r.id_demande === d.id_demande))
    .map(d => {
      const materiel = materiels.find(m => m.id_materiel === d.id_materiel)
      const type = TYPES_MATERIEL.find(t => t.id === materiel?.id_type)
      const etablissement = etablissements.find(e => e.id_etab === d.id_etab)
      return {
        id: d.id_demande,
        reference: materiel?.reference || 'N/A',
        type: type?.displayName || 'Inconnu',
        description: d.description,
        priorite: d.priorite,
        etablissement: etablissement?.nom
      }
    })
  
  const filteredItems = reparationsList.filter(item => {
    const matchSearch = item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatut = !filterStatut || item.statut === filterStatut
    return matchSearch && matchStatut
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
  
  const getStatutColor = (statut) => {
    switch(statut) {
      case 'en_cours': return 'bg-blue-100 text-blue-700'
      case 'terminee': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }
  
  const getStatutLabel = (statut) => {
    switch(statut) {
      case 'en_cours': return '🛠️ En cours'
      case 'terminee': return '✅ Terminée'
      default: return statut
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.id_demande) {
      toast.error('Veuillez sélectionner une demande')
      return
    }
    
    setIsSubmitting(true)
    try {
      await addReparation({
        id_demande: parseInt(formData.id_demande),
        cout: formData.cout ? parseFloat(formData.cout) : null,
        duree: formData.duree || null,
        notes: formData.notes || null
      })
      toast.success('Réparation enregistrée')
      setShowModal(false)
      setSelectedDemande(null)
      setFormData({
        id_demande: '',
        cout: '',
        duree: '',
        notes: ''
      })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleTerminer = async (reparation) => {
    try {
      await updateReparation(reparation.id, { statut: 'terminee', date_fin: new Date().toISOString() })
      toast.success('Réparation terminée')
    } catch (error) {
      toast.error(error.message)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des réparations...</p>
        </div>
      </div>
    )
  }
  
  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">⛔</div>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Accès non autorisé</h2>
        <p className="text-red-600">Seul l'admin EDUCMAD peut gérer les réparations.</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des réparations</h1>
          <p className="text-gray-500">Suivi des réparations de matériel</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
        >
          <Wrench size={20} />
          Nouvelle réparation
        </button>
      </div>
      
      {demandesEnAttente.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">📋 Demandes en attente de réparation</h3>
          <div className="flex flex-wrap gap-2">
            {demandesEnAttente.map(d => (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedDemande(d)
                  setFormData({...formData, id_demande: d.id.toString()})
                  setShowModal(true)
                }}
                className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm hover:bg-yellow-200 transition"
              >
                {d.reference} - {d.etablissement}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par référence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous les statuts</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matériel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Établissement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Coût</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Durée</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.etablissement}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(item.statut)}`}>
                      {getStatutLabel(item.statut)}
                    </span>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {item.cout ? `${item.cout} Ar` : '-'}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {item.duree || '-'}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={() => {
                        setSelectedReparation(item)
                        setShowDetailModal(true)
                      }}
                      className="text-blue-500 hover:text-blue-700 mr-2"
                    >
                      <Eye size={18} />
                    </button>
                    {item.statut === 'en_cours' && (
                      <button
                        onClick={() => handleTerminer(item)}
                        className="text-green-500 hover:text-green-700"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    </td>
                 </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Aucune réparation
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal Nouvelle Réparation */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Nouvelle réparation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Demande associée *</label>
                <select
                  value={formData.id_demande}
                  onChange={(e) => {
                    setFormData({...formData, id_demande: e.target.value})
                    const demande = demandesEnAttente.find(d => d.id === parseInt(e.target.value))
                    setSelectedDemande(demande)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Sélectionner une demande</option>
                  {demandesEnAttente.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.reference} - {d.type} - {d.etablissement}
                    </option>
                  ))}
                </select>
              </div>
              {selectedDemande && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Description:</p>
                  <p className="text-sm">{selectedDemande.description}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coût de réparation (Ar)</label>
                <input
                  type="number"
                  value={formData.cout}
                  onChange={(e) => setFormData({...formData, cout: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durée estimée</label>
                <input
                  type="text"
                  placeholder="Ex: 2 jours"
                  value={formData.duree}
                  onChange={(e) => setFormData({...formData, duree: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedDemande(null)
                    setFormData({
                      id_demande: '',
                      cout: '',
                      duree: '',
                      notes: ''
                    })
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal Détail Réparation */}
      {showDetailModal && selectedReparation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Détail de la réparation</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-gray-500">Matériel:</p>
                <p className="font-semibold">{selectedReparation.reference}</p>
                <p className="text-gray-500">Type:</p>
                <p>{selectedReparation.type}</p>
                <p className="text-gray-500">Établissement:</p>
                <p>{selectedReparation.etablissement}</p>
                <p className="text-gray-500">Statut:</p>
                <p className={getStatutColor(selectedReparation.statut)}>{getStatutLabel(selectedReparation.statut)}</p>
                <p className="text-gray-500">Coût:</p>
                <p>{selectedReparation.cout ? `${selectedReparation.cout} Ar` : '-'}</p>
                <p className="text-gray-500">Durée:</p>
                <p>{selectedReparation.duree || '-'}</p>
                <p className="text-gray-500">Date début:</p>
                <p>{new Date(selectedReparation.date_debut).toLocaleDateString()}</p>
                {selectedReparation.date_fin && (
                  <>
                    <p className="text-gray-500">Date fin:</p>
                    <p>{new Date(selectedReparation.date_fin).toLocaleDateString()}</p>
                  </>
                )}
              </div>
              {selectedReparation.notes && (
                <div>
                  <p className="text-gray-500">Notes:</p>
                  <p className="bg-gray-50 p-3 rounded-lg mt-1">{selectedReparation.notes}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reparation