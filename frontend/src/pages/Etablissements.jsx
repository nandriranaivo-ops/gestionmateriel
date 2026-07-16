import React, { useState, useEffect } from 'react'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import EtablissementForm from '../components/etablissements/EtablissementForm'
import ImportExportModal from '../components/etablissements/ImportExportModal'
import useEtablissementStore from '../store/etablissementStore'
import useUiStore from '../store/uiStore'
import { Plus, Download, Upload, Eye, Edit, Trash2 } from 'lucide-react'
import { formatDate } from '../utils/formatters'
import { exportEtablissementsToPDF } from '../utils/pdfExport'

const Etablissements = () => {
  const { etablissements, loadEtablissements, isLoading, deleteEtablissement } = useEtablissementStore()
  const { showToast, openModal, closeModal } = useUiStore()
  const [selectedEtab, setSelectedEtab] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteMotif, setDeleteMotif] = useState('')

  useEffect(() => {
    loadEtablissements()
  }, [])

  const columns = [
    { key: 'nom', label: 'Nom', sortable: true },
    { key: 'dren', label: 'DREN', sortable: true },
    { key: 'cisco', label: 'CISCO', sortable: true },
    { key: 'zap', label: 'ZAP', sortable: true },
    { key: 'nom_responsable_info', label: 'Responsable Info' },
    { key: 'date_creation', label: 'Date création', render: (val) => formatDate(val) }
  ]

  const handleDelete = async () => {
    if (selectedEtab && deleteMotif) {
      await deleteEtablissement(selectedEtab.id_etab, deleteMotif)
      showToast('Établissement supprimé avec succès', 'success')
      setShowDeleteConfirm(false)
      setSelectedEtab(null)
      setDeleteMotif('')
    } else {
      showToast('Veuillez saisir un motif', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Établissements</h1>
          <p className="text-gray-500">Gérez tous les établissements scolaires</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportEtablissementsToPDF(etablissements.filter(e => e.actif))}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={16} /> Exporter PDF
          </button>
          <button
            onClick={() => {
              setSelectedEtab(null)
              setShowForm(true)
            }}
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
        
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={etablissements.filter(e => e.actif)}
        onRowClick={(row) => {
          setSelectedEtab(row)
          setShowForm(true)
        }}
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedEtab(row)
                setShowForm(true)
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedEtab(row)
                setShowDeleteConfirm(true)
              }}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      {/* Modal Formulaire */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={selectedEtab ? 'Modifier l\'établissement' : 'Ajouter un établissement'}
        size="lg"
      >
        <EtablissementForm
          initialData={selectedEtab}
          onSuccess={() => {
            setShowForm(false)
            loadEtablissements()
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* Modal Confirmation suppression */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setSelectedEtab(null)
          setDeleteMotif('')
        }}
        title="Confirmer la suppression"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Êtes-vous sûr de vouloir supprimer l'établissement <strong>{selectedEtab?.nom}</strong> ?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motif de suppression *
            </label>
            <textarea
              value={deleteMotif}
              onChange={(e) => setDeleteMotif(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows="3"
              placeholder="Fermeture définitive, fusion, etc."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setShowDeleteConfirm(false)
                setSelectedEtab(null)
                setDeleteMotif('')
              }}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="btn-danger"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Etablissements