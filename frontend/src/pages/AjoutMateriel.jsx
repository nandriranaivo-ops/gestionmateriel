// frontend/src/pages/AjoutMateriel.jsx
import React, { useState, useEffect } from 'react'
import useAuthStore from '../store/authStore'
import useMaterielStore from '../store/materielStore'
import { TYPES_MATERIEL } from '../utils/constants'
import toast from 'react-hot-toast'
import { Save, X } from 'lucide-react'

// Mapping entre le libellé du type et le préfixe de référence (3 lettres)
const getPrefixFromType = (libelle) => {
  const mapping = {
    'ordinateur_portable': 'ORP',   // Ordinateur Portable -> ORP
    'ordinateur_bureau': 'ORB',     // Ordinateur Bureau -> ORB
    'smartphone': 'SMP',            // Smartphone -> SMP
    'tablette': 'TAB',              // Tablette -> TAB
    'routeur': 'ROU',               // Routeur -> ROU
    'switch': 'SWI',                // Switch -> SWI
    'serveur': 'SRV',               // Serveur -> SRV
    'projecteur': 'PRJ',            // Projecteur -> PRJ
    'camera': 'CAM',                // Caméra -> CAM
    'speaker': 'SPK',               // Enceinte -> SPK
    'autre': 'AUT'                  // Autre -> AUT
  }
  return mapping[libelle] || 'GEN'  // Générique si non trouvé
}

const AjoutMateriel = () => {
  const { user } = useAuthStore()
  const { materiels, addMateriel, isLoading } = useMaterielStore()
  
  const [formData, setFormData] = useState({
    id_type: '',
    description: '',
    quantite: 1,
    date_ajout: new Date().toISOString().split('T')[0]
  })
  const [generatedReference, setGeneratedReference] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const isAdmin = user?.role === 'admin_educmad'
  
  // Calculer la référence automatiquement quand le type change ou que la liste des matériels change
  useEffect(() => {
    if (!formData.id_type) {
      setGeneratedReference('')
      return
    }
    
    const selectedType = TYPES_MATERIEL.find(t => t.id === parseInt(formData.id_type))
    if (!selectedType) return
    
    const prefix = getPrefixFromType(selectedType.libelle)
    
    // Filtrer les matériels existants avec le même préfixe
    const existingRefs = materiels
      .map(m => m.reference)
      .filter(ref => ref.startsWith(prefix))
    
    // Extraire les numéros et trouver le max
    let maxNum = 0
    existingRefs.forEach(ref => {
      const numPart = ref.substring(3)
      const num = parseInt(numPart, 10)
      if (!isNaN(num) && num > maxNum) maxNum = num
    })
    
    const nextNumber = maxNum + 1
    const formattedNumber = nextNumber.toString().padStart(3, '0')
    const newRef = `${prefix}${formattedNumber}`
    setGeneratedReference(newRef)
  }, [formData.id_type, materiels])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.id_type) {
      toast.error('Veuillez sélectionner un type de matériel')
      return
    }
    
    if (formData.quantite < 0) {
      toast.error('La quantité ne peut pas être négative')
      return
    }
    
    setIsSubmitting(true)
    try {
      await addMateriel({
        reference: generatedReference,
        id_type: parseInt(formData.id_type),
        description: formData.description || null,
        quantite: formData.quantite,
        date_ajout: formData.date_ajout
      })
      toast.success(`Matériel ajouté avec succès (réf: ${generatedReference}, quantité: ${formData.quantite})`)
      
      // Réinitialiser le formulaire (sauf la date qui reste aujourd'hui)
      setFormData({
        id_type: '',
        description: '',
        quantite: 1,
        date_ajout: new Date().toISOString().split('T')[0]
      })
      setGeneratedReference('')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">⛔</div>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Accès non autorisé</h2>
        <p className="text-red-600">Seul l'admin EDUCMAD peut ajouter du matériel.</p>
      </div>
    )
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Ajouter un matériel</h1>
        <p className="text-gray-500">La référence est générée automatiquement selon le type.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de matériel *</label>
            <select
              value={formData.id_type}
              onChange={(e) => setFormData({...formData, id_type: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Sélectionner un type</option>
              {TYPES_MATERIEL.map(type => (
                <option key={type.id} value={type.id}>
                  {getTypeIcon(type.libelle)} {type.displayName}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Référence générée <span className="text-red-500">(auto)</span>
            </label>
            <input
              type="text"
              value={generatedReference}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format : 3 lettres du type + 3 chiffres auto-incrémentés.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              placeholder="Description détaillée du matériel..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantité initiale en stock *
            </label>
            <input
              type="number"
              min="0"
              value={formData.quantite}
              onChange={(e) => setFormData({...formData, quantite: parseInt(e.target.value) || 0})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'ajout</label>
            <input
              type="date"
              value={formData.date_ajout}
              onChange={(e) => setFormData({...formData, date_ajout: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || isLoading || !generatedReference}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {isSubmitting ? 'Ajout en cours...' : 'Ajouter le matériel'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  id_type: '',
                  description: '',
                  quantite: 1,
                  date_ajout: new Date().toISOString().split('T')[0]
                })
                setGeneratedReference('')
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
            >
              <X size={18} />
              Réinitialiser
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Icône pour l'affichage des types
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

export default AjoutMateriel