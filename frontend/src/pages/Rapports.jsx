import React, { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'
import useMaterielStore from '../store/materielStore'
import useEtablissementStore from '../store/etablissementStore'
import { TYPES_MATERIEL } from '../utils/constants'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { Download, FileText, Printer, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const Rapports = () => {
  const { user } = useAuthStore()
  const { materiels, stockCentral, stockEtablissements, etatsMateriel, accessibilites, demandes, reparations } = useMaterielStore()
  const { etablissements, loadEtablissements } = useEtablissementStore()
  
  const [loading, setLoading] = useState(true)
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [selectedEtablissement, setSelectedEtablissement] = useState('')
  const [rapportType, setRapportType] = useState('global')
  
  const isAdmin = user?.role === 'admin_educmad'
  const isResponsable = user?.role === 'responsable_etab'
  const responsableEtabId = user?.id_etab
  
  useEffect(() => {
    const init = async () => {
      await loadEtablissements()
      setLoading(false)
    }
    init()
  }, [])
  
  // Données pour les graphiques
  const getStockParType = () => {
    const typeMap = new Map()
    
    TYPES_MATERIEL.forEach(type => {
      typeMap.set(type.id, {
        name: type.displayName,
        central: 0,
        distribue: 0,
        total: 0,
        icon: getTypeIcon(type.libelle)
      })
    })
    
    stockCentral.forEach(item => {
      const materiel = materiels.find(m => m.id_materiel === item.id_materiel)
      if (materiel) {
        const typeData = typeMap.get(materiel.id_type)
        if (typeData) {
          typeData.central += item.quantite || 0
        }
      }
    })
    
    let filteredStocks = [...stockEtablissements]
    if (isResponsable) {
      filteredStocks = filteredStocks.filter(s => s.id_etab === responsableEtabId)
    } else if (selectedEtablissement) {
      filteredStocks = filteredStocks.filter(s => s.id_etab === parseInt(selectedEtablissement))
    }
    
    filteredStocks.forEach(item => {
      const materiel = materiels.find(m => m.id_materiel === item.id_materiel)
      if (materiel) {
        const typeData = typeMap.get(materiel.id_type)
        if (typeData) {
          typeData.distribue += item.quantite || 0
        }
      }
    })
    
    const data = Array.from(typeMap.values())
      .filter(item => item.central > 0 || item.distribue > 0)
      .map(item => ({
        ...item,
        total: item.central + item.distribue
      }))
    
    return data
  }
  
  const getEtatMateriel = () => {
    const dernierEtats = {}
    etatsMateriel.forEach(etat => {
      if (!dernierEtats[etat.id_materiel] || 
          new Date(etat.date_changement) > new Date(dernierEtats[etat.id_materiel].date_changement)) {
        dernierEtats[etat.id_materiel] = etat
      }
    })
    
    let marche = 0
    let panne = 0
    let reparations = 0
    
    Object.values(dernierEtats).forEach(etat => {
      if (etat.etat === 'en marche') marche++
      else if (etat.etat === 'en panne') panne++
      else if (etat.etat === 'en réparation') reparations++
    })
    
    return [
      { name: 'En marche', value: marche, color: '#10B981' },
      { name: 'En panne', value: panne, color: '#EF4444' },
      { name: 'En réparation', value: reparations, color: '#F59E0B' }
    ]
  }
  
  const getAccessibilite = () => {
    const dernierAccessibilites = {}
    accessibilites.forEach(acc => {
      if (!dernierAccessibilites[acc.id_materiel] || 
          new Date(acc.date_changement) > new Date(dernierAccessibilites[acc.id_materiel].date_changement)) {
        dernierAccessibilites[acc.id_materiel] = acc
      }
    })
    
    let accessible = 0
    let nonAccessible = 0
    
    Object.values(dernierAccessibilites).forEach(acc => {
      if (acc.accessible) accessible++
      else nonAccessible++
    })
    
    return [
      { name: 'Accessible', value: accessible, color: '#10B981' },
      { name: 'Non accessible', value: nonAccessible, color: '#EF4444' }
    ]
  }
  
  const getDemandesParStatut = () => {
    let filteredDemandes = [...demandes]
    
    if (isResponsable) {
      const mesMaterielsIds = stockEtablissements
        .filter(s => s.id_etab === responsableEtabId)
        .map(s => s.id_materiel)
      filteredDemandes = filteredDemandes.filter(d => mesMaterielsIds.includes(d.id_materiel))
    }
    
    if (dateDebut) {
      filteredDemandes = filteredDemandes.filter(d => new Date(d.date_demande) >= new Date(dateDebut))
    }
    if (dateFin) {
      filteredDemandes = filteredDemandes.filter(d => new Date(d.date_demande) <= new Date(dateFin))
    }
    
    const statuts = {
      en_attente: 0,
      en_cours: 0,
      terminee: 0,
      rejetee: 0
    }
    
    filteredDemandes.forEach(d => {
      if (d.statut === 'en_attente') statuts.en_attente++
      else if (d.statut === 'en_cours') statuts.en_cours++
      else if (d.statut === 'terminee') statuts.terminee++
      else if (d.statut === 'rejetee') statuts.rejetee++
    })
    
    return [
      { name: 'En attente', count: statuts.en_attente, color: '#F59E0B' },
      { name: 'En cours', count: statuts.en_cours, color: '#3B82F6' },
      { name: 'Terminée', count: statuts.terminee, color: '#10B981' },
      { name: 'Rejetée', count: statuts.rejetee, color: '#EF4444' }
    ]
  }
  
  const getDemandesEvolution = () => {
    const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    
    let filteredDemandes = [...demandes]
    if (isResponsable) {
      const mesMaterielsIds = stockEtablissements
        .filter(s => s.id_etab === responsableEtabId)
        .map(s => s.id_materiel)
      filteredDemandes = filteredDemandes.filter(d => mesMaterielsIds.includes(d.id_materiel))
    }
    
    const evolution = moisNoms.map((mois, index) => ({
      mois,
      demandes: filteredDemandes.filter(d => new Date(d.date_demande).getMonth() === index).length
    }))
    
    return evolution
  }
  
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
  
  const handleExport = () => {
    const data = {
      rapportType,
      date: new Date().toISOString(),
      utilisateur: user?.nom,
      stockParType: getStockParType(),
      etatMateriel: getEtatMateriel(),
      accessibilite: getAccessibilite(),
      demandesParStatut: getDemandesParStatut(),
      demandesEvolution: getDemandesEvolution()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport_${rapportType}_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Rapport exporté avec succès')
  }
  
  const handlePrint = () => {
    window.print()
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des rapports...</p>
        </div>
      </div>
    )
  }
  
  const stockData = getStockParType()
  const etatData = getEtatMateriel()
  const accessibiliteData = getAccessibilite()
  const demandesStatutData = getDemandesParStatut()
  const demandesEvolData = getDemandesEvolution()
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rapports et analyses</h1>
          <p className="text-gray-500">Visualisation des données et statistiques</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
          >
            <Download size={18} />
            Exporter
          </button>
          <button
            onClick={handlePrint}
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
          >
            <Printer size={18} />
            Imprimer
          </button>
        </div>
      </div>
      
      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de rapport</label>
          <select
            value={rapportType}
            onChange={(e) => setRapportType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="global">Rapport global</option>
            <option value="stock">Analyse du stock</option>
            <option value="maintenance">Analyse des maintenances</option>
          </select>
        </div>
        {isAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Établissement</label>
            <select
              value={selectedEtablissement}
              onChange={(e) => setSelectedEtablissement(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tous les établissements</option>
              {etablissements.filter(e => e.actif).map(etab => (
                <option key={etab.id_etab} value={etab.id_etab}>{etab.nom}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
      
      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock par type */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-primary-500" />
            Stock par type de matériel
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="central" name="Stock central" fill="#2E5BFF" />
                <Bar dataKey="distribue" name="Distribué" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* État du matériel */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-primary-500" />
            État du matériel
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={etatData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {etatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Accessibilité AccesMad */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-primary-500" />
            Accessibilité (AccesMad)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={accessibiliteData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {accessibiliteData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Demandes par statut */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-primary-500" />
            Demandes de réparation par statut
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandesStatutData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Nombre de demandes">
                  {demandesStatutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Évolution des demandes */}
        <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-primary-500" />
            Évolution mensuelle des demandes de réparation
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demandesEvolData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="demandes" name="Nombre de demandes" stroke="#2E5BFF" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Statistiques clés */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Résumé statistique</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{materiels.length}</p>
            <p className="text-sm text-gray-600">Types de matériel</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {stockCentral.reduce((sum, i) => sum + (i.quantite || 0), 0) + 
               stockEtablissements.reduce((sum, i) => sum + (i.quantite || 0), 0)}
            </p>
            <p className="text-sm text-gray-600">Total unités</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{demandes.length}</p>
            <p className="text-sm text-gray-600">Demandes de réparation</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{reparations.length}</p>
            <p className="text-sm text-gray-600">Réparations effectuées</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Rapports