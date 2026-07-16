import React, { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'
import useMaterielStore from '../store/materielStore'
import useEtablissementStore from '../store/etablissementStore'
import { TYPES_MATERIEL } from '../utils/constants'
import toast from 'react-hot-toast'
import { Calendar, MapPin, User, CheckCircle, Clock, Plus, Eye } from 'lucide-react'

const Visites = () => {
  const { user } = useAuthStore()
  const { visites, loadAllData, addVisite, updateVisite } = useMaterielStore()
  const { etablissements, loadEtablissements } = useEtablissementStore()

  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedVisite, setSelectedVisite] = useState(null)
  const [formData, setFormData] = useState({
    id_etab: '',
    date_visite: '',
    objet: '',
    observations: '',
    statut: 'planifiee'
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

  const visitesList = visites.map(visite => {
    const etablissement = etablissements.find(e => e.id_etab === visite.id_etab)
    return {
      id: visite.id_visite,
      id_etab: visite.id_etab,
      etablissement: etablissement?.nom || 'Inconnu',
      date_visite: visite.date_visite,
      objet: visite.objet,
      observations: visite.observations,
      statut: visite.statut,
      rapport: visite.rapport,
      date_creation: visite.date_creation
    }
  })

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'planifiee': return 'bg-blue-100 text-blue-700'
      case 'realisee': return 'bg-green-100 text-green-700'
      case 'annulee': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'planifiee': return ' Planifiée'
      case 'realisee': return 'Réalisée'
      case 'annulee': return 'Annulée'
      default: return statut
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.id_etab || !formData.date_visite || !formData.objet) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    // ✅ Vérifier que la date est au moins demain
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(formData.date_visite);
    selectedDate.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (selectedDate < tomorrow) {
      toast.error('La date de visite doit être au minimum 1 jour après aujourd\'hui (demain).');
      return;
    }

    setIsSubmitting(true)
    try {
      await addVisite({
        id_etab: parseInt(formData.id_etab),
        date_visite: formData.date_visite,
        objet: formData.objet,
        observations: formData.observations || null,
        statut: formData.statut
      })
      toast.success('Visite planifiée avec succès')
      setShowModal(false)
      setFormData({
        id_etab: '',
        date_visite: '',
        objet: '',
        observations: '',
        statut: 'planifiee'
      })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatut = async (visite, nouveauStatut) => {
    try {
      await updateVisite(visite.id, { statut: nouveauStatut })
      toast.success(`Visite ${nouveauStatut === 'realisee' ? 'marquée comme réalisée' : 'annulée'}`)
    } catch (error) {
      toast.error(error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des visites...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">⛔</div>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Accès non autorisé</h2>
        <p className="text-red-600">Seul l'admin EDUCMAD peut gérer les visites.</p>
      </div>
    )
  }

  const visitesPlanifiees = visitesList.filter(v => v.statut === 'planifiee')
  const visitesRealisees = visitesList.filter(v => v.statut === 'realisee')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des visites</h1>
          <p className="text-gray-500">Planifier et suivre les visites dans les établissements</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
        >
          <Plus size={20} />
          Planifier une visite
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visites planifiées */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-blue-500 px-6 py-3">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Clock size={18} />
              Visites planifiées ({visitesPlanifiees.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {visitesPlanifiees.length > 0 ? (
              visitesPlanifiees.map(visite => (
                <div key={visite.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-800">{visite.etablissement}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatutColor(visite.statut)}`}>
                          {getStatutLabel(visite.statut)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(visite.date_visite).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {visite.etablissement}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{visite.objet}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedVisite(visite)
                          setShowDetailModal(true)
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleUpdateStatut(visite, 'realisee')}
                        className="text-green-500 hover:text-green-700"
                        title="Marquer comme réalisée"
                      >
                        <CheckCircle size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                Aucune visite planifiée
              </div>
            )}
          </div>
        </div>

        {/* Visites réalisées */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-green-500 px-6 py-3">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <CheckCircle size={18} />
              Visites réalisées ({visitesRealisees.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {visitesRealisees.length > 0 ? (
              visitesRealisees.map(visite => (
                <div key={visite.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-800">{visite.etablissement}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatutColor(visite.statut)}`}>
                          {getStatutLabel(visite.statut)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(visite.date_visite).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{visite.objet}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedVisite(visite)
                        setShowDetailModal(true)
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                Aucune visite réalisée
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Ajout Visite */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Planifier une visite</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Établissement *</label>
                <select
                  value={formData.id_etab}
                  onChange={(e) => setFormData({ ...formData, id_etab: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de visite *</label>
                <input
                  type="date"
                  value={formData.date_visite}
                  onChange={(e) => setFormData({ ...formData, date_visite: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objet de la visite *</label>
                <input
                  type="text"
                  value={formData.objet}
                  onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                  placeholder="Ex: Inspection annuelle, Audit matériel..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
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
                  {isSubmitting ? 'Planification...' : 'Planifier'}
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

      {/* Modal Détail Visite */}
      {showDetailModal && selectedVisite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Détail de la visite</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-gray-500">Établissement:</p>
                <p className="font-semibold">{selectedVisite.etablissement}</p>
                <p className="text-gray-500">Date:</p>
                <p>{new Date(selectedVisite.date_visite).toLocaleDateString()}</p>
                <p className="text-gray-500">Statut:</p>
                <p className={getStatutColor(selectedVisite.statut)}>{getStatutLabel(selectedVisite.statut)}</p>
                <p className="text-gray-500">Objet:</p>
                <p>{selectedVisite.objet}</p>
              </div>
              {selectedVisite.observations && (
                <div>
                  <p className="text-gray-500">Observations:</p>
                  <p className="bg-gray-50 p-3 rounded-lg mt-1">{selectedVisite.observations}</p>
                </div>
              )}
              {selectedVisite.rapport && (
                <div>
                  <p className="text-gray-500">Rapport:</p>
                  <p className="bg-gray-50 p-3 rounded-lg mt-1">{selectedVisite.rapport}</p>
                </div>
              )}
            </div>
            {selectedVisite.statut === 'planifiee' && (
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => handleUpdateStatut(selectedVisite, 'realisee')}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition"
                >
                  Marquer comme réalisée
                </button>
                <button
                  onClick={() => handleUpdateStatut(selectedVisite, 'annulee')}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition"
                >
                  Annuler la visite
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

export default Visites