import React, { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'
import useMaterielStore from '../store/materielStore'
import useEtablissementStore from '../store/etablissementStore'
import { TYPES_MATERIEL } from '../utils/constants'
import toast from 'react-hot-toast'
import { Search, Plus, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'

const DemandesReparation = () => {
  const { user } = useAuthStore()
  const { demandes, materiels, stockEtablissements, loadAllData, addDemande, updateDemande, traiterDemande } = useMaterielStore()
  const { etablissements, loadEtablissements } = useEtablissementStore()

  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState(null)
  const [formData, setFormData] = useState({
    id_materiel: '',
    quantite: 1,
    type_panne: '',
    urgence: 'normale',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAdmin = user?.role === 'admin_educmad'
  const isResponsable = user?.role === 'responsable_etab'
  const responsableEtabId = user?.id_etab

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

  const getFilteredDemandes = () => {
    let filtered = [...demandes]
    if (isResponsable) {
      const mesMaterielsIds = stockEtablissements
        .filter(s => s.id_etab === responsableEtabId)
        .map(s => s.id_materiel)
      filtered = filtered.filter(d => mesMaterielsIds.includes(d.id_materiel))
    }
    return filtered
  }

  const demandesList = getFilteredDemandes().map(demande => {
    const materiel = materiels.find(m => m.id_materiel === demande.id_materiel)
    const type = TYPES_MATERIEL.find(t => t.id === materiel?.id_type)
    const etablissement = etablissements.find(e => e.id_etab === demande.id_etab)

    return {
      id: demande.id_demande,
      id_materiel: demande.id_materiel,
      reference: materiel?.reference || 'N/A',
      type: type?.displayName || 'Inconnu',
      typeIcon: getTypeIcon(type?.libelle),
      quantite: demande.quantite || 1,           // ← nombre d'unités
      type_panne: demande.type_panne || '',
      urgence: demande.urgence || 'normale',
      description: demande.description,
      statut: demande.statut,
      date_demande: demande.date_demande,
      date_traitement: demande.date_traitement,
      etablissement: etablissement?.nom || (isAdmin ? 'N/A' : 'Mon établissement'),
      commentaire_admin: demande.commentaire_admin
    }
  })

  const filteredItems = demandesList.filter(item => {
    const matchSearch = item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatut = !filterStatut || item.statut === filterStatut
    return matchSearch && matchStatut
  })

  const getUrgenceColor = (urgence) => {
    switch (urgence) {
      case 'urgente': return 'bg-red-100 text-red-700'
      case 'haute': return 'bg-orange-100 text-orange-700'
      case 'normale': return 'bg-blue-100 text-blue-700'
      case 'basse': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getUrgenceLabel = (urgence) => {
    switch (urgence) {
      case 'urgente': return 'Urgente'
      case 'haute': return 'Haute'
      case 'normale': return 'Normale'
      case 'basse': return 'Basse'
      default: return urgence
    }
  }

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-700'
      case 'en_cours': return 'bg-blue-100 text-blue-700'
      case 'terminee': return 'bg-green-100 text-green-700'
      case 'rejetee': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'en_attente': return 'En attente'
      case 'en_cours': return 'En cours'
      case 'terminee': return 'Terminée'
      case 'rejetee': return 'Rejetée'
      default: return statut
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.id_materiel || !formData.description) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    if (formData.quantite < 1) {
      toast.error('La quantité doit être au moins 1')
      return
    }
    console.log('Données envoyées:', {
      id_materiel: parseInt(formData.id_materiel),
      quantite: formData.quantite,
      type_panne: formData.type_panne,
      urgence: formData.urgence,
      description: formData.description,
      id_etab: responsableEtabId
    });
    setIsSubmitting(true)
    try {
      await addDemande({
        id_materiel: parseInt(formData.id_materiel),
        quantite: formData.quantite,
        type_panne: formData.type_panne || null,
        urgence: formData.urgence,
        description: formData.description,
        id_etab: responsableEtabId
      })
      toast.success('Demande de réparation envoyée')
      setShowModal(false)
      setFormData({
        id_materiel: '',
        quantite: 1,
        type_panne: '',
        urgence: 'normale',
        description: ''
      })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Dans le composant
  const handleUpdateStatut = async (demande, nouveauStatut, motif_refus = null) => {
    try {
      await traiterDemande(demande.id, nouveauStatut, motif_refus);
      toast.success(`Demande ${nouveauStatut === 'en_cours' ? 'prise en charge' : nouveauStatut === 'terminee' ? 'terminée' : 'rejetée'}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Matériels disponibles pour le responsable (ceux de son établissement)
  const mesMateriels = isResponsable ? stockEtablissements
    .filter(s => s.id_etab === responsableEtabId && s.quantite > 0)
    .map(s => {
      const materiel = materiels.find(m => m.id_materiel === s.id_materiel)
      const type = TYPES_MATERIEL.find(t => t.id === materiel?.id_type)
      return {
        id: materiel?.id_materiel,
        reference: materiel?.reference,
        type: type?.displayName,
        stock: s.quantite
      }
    })
    .filter(m => m.id) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des demandes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Demandes de réparation</h1>
          <p className="text-gray-500">
            {isAdmin
              ? 'Gestion des demandes de réparation des établissements'
              : 'Soumettre une demande de réparation pour votre matériel'}
          </p>
        </div>
        {isResponsable && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
          >
            <Plus size={20} />
            Nouvelle demande
          </button>
        )}
      </div>

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
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="rejetee">Rejetée</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matériel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Établissement</th>}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qté (unités)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
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
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.etablissement}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold">
                    {item.quantite}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getUrgenceColor(item.urgence)}`}>
                      {getUrgenceLabel(item.urgence)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(item.statut)}`}>
                      {getStatutLabel(item.statut)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.date_demande).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={() => {
                        setSelectedDemande(item)
                        setShowDetailModal(true)
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                    Aucune demande de réparation
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nouvelle Demande */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Nouvelle demande de réparation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matériel *</label>
                <select
                  value={formData.id_materiel}
                  onChange={(e) => setFormData({ ...formData, id_materiel: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Sélectionner un matériel</option>
                  {mesMateriels.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.reference} - {m.type} (stock: {m.stock} unités)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité à réparer (unités) *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantite}
                  onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Nombre d’exemplaires concernés</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de panne</label>
                <select
                  value={formData.type_panne}
                  onChange={(e) => setFormData({ ...formData, type_panne: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Sélectionner (optionnel)</option>
                  <option value="materielle">Matérielle</option>
                  <option value="logicielle">Logicielle</option>
                  <option value="reseau">Réseau</option>
                  <option value="alimentation">Alimentation</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgence</label>
                <select
                  value={formData.urgence}
                  onChange={(e) => setFormData({ ...formData, urgence: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description de la panne *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Envoi...' : 'Envoyer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détail */}
      {showDetailModal && selectedDemande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Détail de la demande</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-gray-500">Matériel:</p>
                <p className="font-semibold">{selectedDemande.reference}</p>
                <p className="text-gray-500">Type:</p>
                <p>{selectedDemande.type}</p>
                <p className="text-gray-500">Quantité (unités):</p>
                <p>{selectedDemande.quantite}</p>
                <p className="text-gray-500">Type panne:</p>
                <p>{selectedDemande.type_panne || '-'}</p>
                <p className="text-gray-500">Urgence:</p>
                <p className={getUrgenceColor(selectedDemande.urgence)}>{getUrgenceLabel(selectedDemande.urgence)}</p>
                <p className="text-gray-500">Statut:</p>
                <p className={getStatutColor(selectedDemande.statut)}>{getStatutLabel(selectedDemande.statut)}</p>
                <p className="text-gray-500">Date demande:</p>
                <p>{new Date(selectedDemande.date_demande).toLocaleString()}</p>
                {selectedDemande.date_traitement && (
                  <>
                    <p className="text-gray-500">Date traitement:</p>
                    <p>{new Date(selectedDemande.date_traitement).toLocaleString()}</p>
                  </>
                )}
              </div>
              <div>
                <p className="text-gray-500">Description:</p>
                <p className="bg-gray-50 p-3 rounded-lg mt-1">{selectedDemande.description}</p>
              </div>
              {selectedDemande.commentaire_admin && (
                <div>
                  <p className="text-gray-500">Commentaire admin:</p>
                  <p className="bg-blue-50 p-3 rounded-lg mt-1">{selectedDemande.commentaire_admin}</p>
                </div>
              )}
            </div>
            {isAdmin && selectedDemande.statut === 'en_attente' && (
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => handleUpdateStatut(selectedDemande, 'en_cours')}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Clock size={18} />
                  Prendre en charge
                </button>
                <button
                  onClick={() => handleUpdateStatut(selectedDemande, 'rejetee')}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <XCircle size={18} />
                  Rejeter
                </button>
              </div>
            )}
            {isAdmin && selectedDemande.statut === 'en_cours' && (
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => handleUpdateStatut(selectedDemande, 'terminee')}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Terminer
                </button>
              </div>
            )}
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

export default DemandesReparation