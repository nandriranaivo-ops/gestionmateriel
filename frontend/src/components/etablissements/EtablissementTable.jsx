import React from 'react'
import DataTable from '../common/DataTable'
import { formatDate } from '../../utils/formatters'
import { Eye, Edit, Trash2, Package } from 'lucide-react'

const EtablissementTable = ({ data, onView, onEdit, onDelete, onViewStock }) => {
  const columns = [
    { key: 'nom', label: 'Nom', sortable: true },
    { key: 'dren', label: 'DREN', sortable: true },
    { key: 'cisco', label: 'CISCO', sortable: true },
    { key: 'zap', label: 'ZAP', sortable: true },
    { key: 'nom_responsable_info', label: 'Responsable Info' },
    { key: 'date_creation', label: 'Date création', render: (val) => formatDate(val) }
  ]
  
  const actions = (row) => (
    <div className="flex gap-2 justify-end">
      <button
        onClick={() => onViewStock(row)}
        className="text-purple-600 hover:text-purple-800"
        title="Voir le stock"
      >
        <Package size={16} />
      </button>
      <button
        onClick={() => onView(row)}
        className="text-blue-600 hover:text-blue-800"
        title="Voir les détails"
      >
        <Eye size={16} />
      </button>
      <button
        onClick={() => onEdit(row)}
        className="text-green-600 hover:text-green-800"
        title="Modifier"
      >
        <Edit size={16} />
      </button>
      <button
        onClick={() => onDelete(row)}
        className="text-red-600 hover:text-red-800"
        title="Supprimer"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
  
  return (
    <DataTable
      columns={columns}
      data={data}
      actions={actions}
      searchable={true}
      searchPlaceholder="Rechercher un établissement..."
    />
  )
}

export default EtablissementTable