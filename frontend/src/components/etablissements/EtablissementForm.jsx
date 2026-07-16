import React, { useState } from 'react'
import useEtablissementStore from '../../store/etablissementStore'
import useUiStore from '../../store/uiStore'
import { DRENS } from '../../utils/constants'
import { validateForm, validateEmail } from '../../utils/validators'

const EtablissementForm = ({ initialData, onSuccess, onCancel }) => {
  const { addEtablissement, updateEtablissement } = useEtablissementStore()
  const { showToast, setLoading } = useUiStore()
  
  const [formData, setFormData] = useState({
    nom: initialData?.nom || '',
    dren: initialData?.dren || '',
    cisco: initialData?.cisco || '',
    zap: initialData?.zap || '',
    nom_directeur: initialData?.nom_directeur || '',
    contact_directeur: initialData?.contact_directeur || '',
    email_directeur: initialData?.email_directeur || '',
    nom_responsable_info: initialData?.nom_responsable_info || '',
    contact_responsable_info: initialData?.contact_responsable_info || '',
    email_responsable_info: initialData?.email_responsable_info || '',
    creer_compte_ri: true
  })
  
  const [errors, setErrors] = useState({})
  
  // ✅ Transformation en majuscule
  const toUpperCase = (value) => value ? value.toUpperCase() : ''
  
  // ✅ Validation numéro portable malgache (032/033/034/038 + 7 chiffres)
  const validateMalagasyPhone = (phone) => {
    if (!phone) return true // facultatif
    const cleaned = phone.replace(/\s/g, '')
    const regex = /^(032|033|034|038)\d{7}$/
    return regex.test(cleaned)
  }
  
  // ✅ Règles de validation enrichies
  const rules = {
    nom: { 
      required: true, 
      requiredMessage: 'Le nom est requis',
      transform: toUpperCase
    },
    dren: { 
      required: true, 
      requiredMessage: 'La DREN est requise',
      transform: toUpperCase
    },
    cisco: { 
      required: true, 
      requiredMessage: 'Le CISCO est requis',
      transform: toUpperCase
    },
    zap: { 
      required: true, 
      requiredMessage: 'La ZAP est requise',
      transform: toUpperCase
    },
    nom_directeur: { 
      required: true, 
      requiredMessage: 'Le nom du directeur est requis' 
    },
    contact_directeur: { 
      required: true, 
      requiredMessage: 'Le contact est requis',
      validate: (value) => {
        if (!validateMalagasyPhone(value)) {
          return 'Le numéro doit être un portable malgache (032/033/034/038 + 7 chiffres)'
        }
        return null
      }
    },
    email_directeur: { 
      required: true, 
      email: true, 
      requiredMessage: 'L\'email est requis', 
      emailMessage: 'Email invalide' 
    },
    email_responsable_info: { 
      email: true, 
      emailMessage: 'Email invalide' 
    },
    contact_responsable_info: {
      validate: (value) => {
        if (value && !validateMalagasyPhone(value)) {
          return 'Le numéro doit être un portable malgache (032/033/034/038 + 7 chiffres)'
        }
        return null
      }
    }
  }
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let newValue = type === 'checkbox' ? checked : value
    
    // ✅ Majuscule automatique pour les champs texte clés
    if (['nom', 'dren', 'cisco', 'zap'].includes(name)) {
      newValue = toUpperCase(value)
    }
    
    // ✅ Nettoyage des numéros : garder uniquement les chiffres
    if (name === 'contact_directeur' || name === 'contact_responsable_info') {
      newValue = value.replace(/\D/g, '')
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }
  
  // ✅ Formatage d'affichage des numéros (format malgache : 032 12 345 67)
  const formatPhoneDisplay = (value) => {
    if (!value) return ''
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 5) return `${cleaned.slice(0,3)} ${cleaned.slice(3)}`
    if (cleaned.length <= 8) return `${cleaned.slice(0,3)} ${cleaned.slice(3,5)} ${cleaned.slice(5)}`
    return `${cleaned.slice(0,3)} ${cleaned.slice(3,5)} ${cleaned.slice(5,8)} ${cleaned.slice(8,10)}`
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation via les règles
    const validationErrors = validateForm(formData, rules)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      showToast('Veuillez corriger les erreurs', 'error')
      return
    }
    
    setLoading(true)
    try {
      // On s'assure que les champs sont en majuscule avant l'envoi
      const dataToSend = { ...formData }
      ;['nom', 'dren', 'cisco', 'zap'].forEach(field => {
        if (dataToSend[field]) dataToSend[field] = dataToSend[field].toUpperCase()
      })
      
      if (initialData) {
        await updateEtablissement(initialData.id_etab, dataToSend)
        showToast('Établissement modifié avec succès', 'success')
      } else {
        await addEtablissement(dataToSend)
        showToast('Établissement ajouté avec succès', 'success')
      }
      onSuccess()
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom de l'établissement *
          </label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            className={`input-field ${errors.nom ? 'border-red-500' : ''}`}
            placeholder="Ex: LYCEE AMBANITSENA"
          />
          {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            DREN *
          </label>
          <select
            name="dren"
            value={formData.dren}
            onChange={handleChange}
            className={`input-field ${errors.dren ? 'border-red-500' : ''}`}
          >
            <option value="">Sélectionnez une DREN</option>
            {DRENS.map(dren => (
              <option key={dren} value={dren}>{dren}</option>
            ))}
          </select>
          {errors.dren && <p className="text-red-500 text-xs mt-1">{errors.dren}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CISCO *
          </label>
          <input
            type="text"
            name="cisco"
            value={formData.cisco}
            onChange={handleChange}
            className={`input-field ${errors.cisco ? 'border-red-500' : ''}`}
            placeholder="Ex: CISCO 1"
          />
          {errors.cisco && <p className="text-red-500 text-xs mt-1">{errors.cisco}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ZAP *
          </label>
          <input
            type="text"
            name="zap"
            value={formData.zap}
            onChange={handleChange}
            className={`input-field ${errors.zap ? 'border-red-500' : ''}`}
            placeholder="Ex: ZAP 2"
          />
          {errors.zap && <p className="text-red-500 text-xs mt-1">{errors.zap}</p>}
        </div>
      </div>
      
      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-800 mb-3">Contact Direction</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du Directeur *
            </label>
            <input
              type="text"
              name="nom_directeur"
              value={formData.nom_directeur}
              onChange={handleChange}
              className={`input-field ${errors.nom_directeur ? 'border-red-500' : ''}`}
            />
            {errors.nom_directeur && <p className="text-red-500 text-xs mt-1">{errors.nom_directeur}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Directeur *
            </label>
            <input
              type="text"
              name="contact_directeur"
              value={formatPhoneDisplay(formData.contact_directeur)}
              onChange={handleChange}
              className={`input-field ${errors.contact_directeur ? 'border-red-500' : ''}`}
              placeholder="032 12 345 67"
              maxLength="14"
            />
            {errors.contact_directeur && <p className="text-red-500 text-xs mt-1">{errors.contact_directeur}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Directeur *
            </label>
            <input
              type="email"
              name="email_directeur"
              value={formData.email_directeur}
              onChange={handleChange}
              className={`input-field ${errors.email_directeur ? 'border-red-500' : ''}`}
            />
            {errors.email_directeur && <p className="text-red-500 text-xs mt-1">{errors.email_directeur}</p>}
          </div>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-800 mb-3">Contact Responsable Informatique</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du RI
            </label>
            <input
              type="text"
              name="nom_responsable_info"
              value={formData.nom_responsable_info}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact RI
            </label>
            <input
              type="text"
              name="contact_responsable_info"
              value={formatPhoneDisplay(formData.contact_responsable_info)}
              onChange={handleChange}
              className={`input-field ${errors.contact_responsable_info ? 'border-red-500' : ''}`}
              placeholder="032 12 345 67"
              maxLength="14"
            />
            {errors.contact_responsable_info && <p className="text-red-500 text-xs mt-1">{errors.contact_responsable_info}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email RI
            </label>
            <input
              type="email"
              name="email_responsable_info"
              value={formData.email_responsable_info}
              onChange={handleChange}
              className={`input-field ${errors.email_responsable_info ? 'border-red-500' : ''}`}
            />
            {errors.email_responsable_info && <p className="text-red-500 text-xs mt-1">{errors.email_responsable_info}</p>}
          </div>
        </div>
        
        {!initialData && (
          <div className="mt-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="creer_compte_ri"
                checked={formData.creer_compte_ri}
                onChange={handleChange}
              />
              <span className="text-sm text-gray-700">Créer automatiquement le compte du responsable informatique</span>
            </label>
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Annuler
        </button>
        <button type="submit" className="btn-primary">
          {initialData ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </form>
  )
}

export default EtablissementForm