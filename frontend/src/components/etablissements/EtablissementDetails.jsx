import React from 'react'
import { Building2, MapPin, User, Phone, Mail, Package } from 'lucide-react'
import { formatDate } from '../../utils/formatters'

const EtablissementDetails = ({ etablissement, onClose, onViewStock }) => {
  if (!etablissement) return null
  
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-100 rounded-full">
            <Building2 size={24} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{etablissement.nom}</h2>
            <p className="text-sm text-gray-500">ID: {etablissement.id_etab}</p>
          </div>
        </div>
        <button
          onClick={onViewStock}
          className="btn-primary flex items-center gap-2"
        >
          <Package size={16} /> Voir le stock
        </button>
      </div>
      
      {/* Localisation */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MapPin size={18} /> Localisation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">DREN</p>
            <p className="font-medium">{etablissement.dren || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">CISCO</p>
            <p className="font-medium">{etablissement.cisco || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ZAP</p>
            <p className="font-medium">{etablissement.zap || '-'}</p>
          </div>
        </div>
      </div>
      
      {/* Direction */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <User size={18} /> Direction
        </h3>
        <div className="space-y-2">
          <p><span className="text-gray-500">Nom:</span> {etablissement.nom_directeur || '-'}</p>
          <p className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400" />
            <span className="text-gray-500">Contact:</span> {etablissement.contact_directeur || '-'}
          </p>
          <p className="flex items-center gap-2">
            <Mail size={14} className="text-gray-400" />
            <span className="text-gray-500">Email:</span> {etablissement.email_directeur || '-'}
          </p>
        </div>
      </div>
      
      {/* Responsable Informatique */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          💻 Responsable Informatique
        </h3>
        <div className="space-y-2">
          <p><span className="text-gray-500">Nom:</span> {etablissement.nom_responsable_info || '-'}</p>
          <p className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400" />
            <span className="text-gray-500">Contact:</span> {etablissement.contact_responsable_info || '-'}
          </p>
          <p className="flex items-center gap-2">
            <Mail size={14} className="text-gray-400" />
            <span className="text-gray-500">Email:</span> {etablissement.email_responsable_info || '-'}
          </p>
        </div>
      </div>
      
      {/* Informations supplémentaires */}
      <div className="text-xs text-gray-400 text-center pt-4 border-t">
        Créé le {formatDate(etablissement.date_creation)}
      </div>
    </div>
  )
}

export default EtablissementDetails