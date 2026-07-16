import React, { useState } from 'react'
import { Download, Upload, FileText } from 'lucide-react'
import useEtablissementStore from '../../store/etablissementStore'
import useUiStore from '../../store/uiStore'

const ImportExportModal = ({ onClose }) => {
  const { etablissements, loadEtablissements } = useEtablissementStore()
  const { showToast, setLoading } = useUiStore()
  const [importFile, setImportFile] = useState(null)
  const [importPreview, setImportPreview] = useState([])
  
  // Export CSV
  const handleExport = () => {
    const headers = ['NOM', 'DREN', 'CISCO', 'ZAP', 'NOM_DIRECTEUR', 'CONTACT_DIRECTEUR', 'EMAIL_DIRECTEUR', 'NOM_RI', 'CONTACT_RI', 'EMAIL_RI']
    
    const rows = etablissements.map(etab => [
      etab.nom,
      etab.dren,
      etab.cisco,
      etab.zap,
      etab.nom_directeur,
      etab.contact_directeur,
      etab.email_directeur,
      etab.nom_responsable_info,
      etab.contact_responsable_info,
      etab.email_responsable_info
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.setAttribute('download', `etablissements_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    showToast('Export réussi', 'success')
    onClose()
  }
  
  // Import CSV
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target.result
      const lines = content.split('\n')
      const headers = lines[0].split(';')
      
      const preview = []
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(';')
          const row = {}
          headers.forEach((header, idx) => {
            row[header] = values[idx] || ''
          })
          preview.push(row)
        }
      }
      setImportPreview(preview)
      setImportFile(file)
    }
    reader.readAsText(file, 'utf-8')
  }
  
  const handleImport = async () => {
    if (!importFile) {
      showToast('Veuillez sélectionner un fichier', 'error')
      return
    }
    
    setLoading(true)
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target.result
      const lines = content.split('\n')
      const headers = lines[0].split(';')
      
      let successCount = 0
      let errorCount = 0
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(';')
          const etabData = {}
          headers.forEach((header, idx) => {
            etabData[header.toLowerCase()] = values[idx] || ''
          })
          
          try {
            await useEtablissementStore.getState().addEtablissement({
              nom: etabData.nom,
              dren: etabData.dren,
              cisco: etabData.cisco,
              zap: etabData.zap,
              nom_directeur: etabData.nom_directeur,
              contact_directeur: etabData.contact_directeur,
              email_directeur: etabData.email_directeur,
              nom_responsable_info: etabData.nom_ri,
              contact_responsable_info: etabData.contact_ri,
              email_responsable_info: etabData.email_ri
            })
            successCount++
          } catch (error) {
            errorCount++
          }
        }
      }
      
      await loadEtablissements()
      setLoading(false)
      showToast(`Import terminé : ${successCount} ajoutés, ${errorCount} erreurs`, successCount > 0 ? 'success' : 'error')
      onClose()
    }
    reader.readAsText(importFile, 'utf-8')
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Download size={20} className="text-green-600" />
            <h3 className="font-semibold text-gray-800">Exporter</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Exportez tous les établissements au format CSV
          </p>
          <button onClick={handleExport} className="btn-primary w-full flex items-center justify-center gap-2">
            <Download size={16} /> Exporter CSV
          </button>
        </div>
        
        {/* Import Section */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Upload size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-800">Importer</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Importez des établissements depuis un fichier CSV
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {importPreview.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Aperçu ({importPreview.length} lignes)</p>
              <div className="bg-gray-50 rounded p-2 text-xs overflow-x-auto">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(importPreview, null, 2)}
                </pre>
              </div>
              <button onClick={handleImport} className="btn-primary w-full mt-3 flex items-center justify-center gap-2">
                <Upload size={16} /> Importer
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="border-t pt-4">
        <p className="text-xs text-gray-400 text-center">
          Format CSV attendu : NOM;DREN;CISCO;ZAP;NOM_DIRECTEUR;CONTACT_DIRECTEUR;EMAIL_DIRECTEUR;NOM_RI;CONTACT_RI;EMAIL_RI
        </p>
      </div>
    </div>
  )
}

export default ImportExportModal