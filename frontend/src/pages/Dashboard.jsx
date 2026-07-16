import React, { useEffect, useState, useCallback } from 'react'
import useAuthStore from '../store/authStore'
import useEtablissementStore from '../store/etablissementStore'
import useMaterielStore from '../store/materielStore'
import { TYPES_MATERIEL } from '../utils/constants'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Package, BarChart3, Building2, AlertCircle, TrendingUp } from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuthStore()
  const { etablissements, loadEtablissements } = useEtablissementStore()
  const { materiels, stockCentral, stockEtablissements, etatsMateriel, accessibilites, loadAllData } = useMaterielStore()

  const [stats, setStats] = useState({
    totalMateriels: 0,
    totalStockCentral: 0,
    totalDistribue: 0,
    nbEtablissements: 0,
    totalPanne: 0,
    totalAccessibles: 0,
    tauxPanne: 0,
    tauxAccessibilite: 0
  })

  const [materielsParType, setMaterielsParType] = useState([])
  const [panneData, setPanneData] = useState([])
  const [accessibiliteData, setAccessibiliteData] = useState([])
  const [materielsList, setMaterielsList] = useState([])
  const [recapData, setRecapData] = useState([])
  const [selectedEtablissement, setSelectedEtablissement] = useState(null)
  const [activeTab, setActiveTab] = useState('stats')
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.role === 'admin_educmad'
  const isResponsable = user?.role === 'responsable_etab'
  const responsableEtabId = user?.id_etab

  // Initialisation
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await loadAllData()
      await loadEtablissements()
      setLoading(false)
    }
    init()
  }, [])

  // Fonction utilitaire pour obtenir les derniers états
  const getLatestStates = useCallback((items, idField, dateField) => {
    const latest = {}
    items.forEach(item => {
      const key = item[idField]
      if (!latest[key] || new Date(item[dateField]) > new Date(latest[key][dateField])) {
        latest[key] = item
      }
    })
    return latest
  }, [])

  // Fonction pour obtenir les quantités par établissement
  const getQuantitesParEtab = useCallback((idMateriel, idEtab = null) => {
    const stockItems = stockEtablissements.filter(s => 
      s.id_materiel === idMateriel && 
      (idEtab ? s.id_etab === idEtab : true)
    )
    return stockItems.reduce((sum, item) => sum + (item.quantite || 0), 0)
  }, [stockEtablissements])

  // Calcul des statistiques - ADMIN
  const calculateStatsAdmin = useCallback(() => {
    const totalMateriels = materiels.length || 0
    const totalStockCentral = stockCentral.reduce((sum, item) => sum + (item.quantite || 0), 0)
    const totalDistribue = stockEtablissements.reduce((sum, item) => sum + (item.quantite || 0), 0)
    const nbEtablissements = etablissements.filter(e => e.actif).length || 0
    
    // Calcul des pannes - Utiliser en_panne
    let totalPanne = 0
    const derniersEtats = getLatestStates(etatsMateriel, 'id_materiel', 'date_changement')
    
    Object.values(derniersEtats).forEach(etat => {
      totalPanne += (etat.en_panne || 0)
    })
    
    // Calcul des accessibilités - Utiliser connecte
    let totalAccessibles = 0
    const derniersAcces = getLatestStates(accessibilites, 'id_materiel', 'date_changement')
    
    Object.values(derniersAcces).forEach(acces => {
      totalAccessibles += (acces.connecte || 0)
    })
    
    const totalUnites = totalStockCentral + totalDistribue
    const tauxPanne = totalUnites > 0 ? (totalPanne / totalUnites) * 100 : 0
    const tauxAccessibilite = totalUnites > 0 ? (totalAccessibles / totalUnites) * 100 : 0

    setStats({
      totalMateriels,
      totalStockCentral,
      totalDistribue,
      nbEtablissements,
      totalPanne,
      totalAccessibles,
      tauxPanne,
      tauxAccessibilite
    })
  }, [materiels, stockCentral, stockEtablissements, etablissements, etatsMateriel, accessibilites, getLatestStates])

  // Calcul des statistiques - RESPONSABLE
  const calculateStatsResponsable = useCallback(() => {
    const monStock = stockEtablissements.filter(s => s.id_etab === responsableEtabId)
    const mesMaterielsIds = monStock.map(s => s.id_materiel)
    const mesMateriels = materiels.filter(m => mesMaterielsIds.includes(m.id_materiel))

    const totalMateriels = mesMateriels.length || 0
    const totalDistribue = monStock.reduce((sum, item) => sum + (item.quantite || 0), 0)

    // Calcul des pannes
    let totalPanne = 0
    const derniersEtats = getLatestStates(
      etatsMateriel.filter(e => e.id_etab === responsableEtabId),
      'id_materiel',
      'date_changement'
    )
    
    Object.values(derniersEtats).forEach(etat => {
      totalPanne += (etat.en_panne || 0)
    })

    // Calcul des accessibilités
    let totalAccessibles = 0
    const derniersAcces = getLatestStates(
      accessibilites.filter(a => a.id_etab === responsableEtabId),
      'id_materiel',
      'date_changement'
    )
    
    Object.values(derniersAcces).forEach(acces => {
      totalAccessibles += (acces.connecte || 0)
    })

    const tauxPanne = totalDistribue > 0 ? (totalPanne / totalDistribue) * 100 : 0
    const tauxAccessibilite = totalDistribue > 0 ? (totalAccessibles / totalDistribue) * 100 : 0

    setStats({
      totalMateriels,
      totalStockCentral: 0,
      totalDistribue,
      nbEtablissements: 0,
      totalPanne,
      totalAccessibles,
      tauxPanne,
      tauxAccessibilite
    })
  }, [materiels, stockEtablissements, etatsMateriel, accessibilites, responsableEtabId, getLatestStates])

  // Calcul des matériels par type
  const calculateMaterielsParType = useCallback(() => {
    const typeMap = new Map()
    
    TYPES_MATERIEL.forEach(type => {
      typeMap.set(type.id, {
        id: type.id,
        nom: type.displayName,
        icon: getTypeIcon(type.libelle),
        count: 0,
        totalQuantite: 0
      })
    })

    const stockItems = isResponsable 
      ? stockEtablissements.filter(s => s.id_etab === responsableEtabId)
      : stockEtablissements

    stockItems.forEach(item => {
      const materiel = materiels.find(m => m.id_materiel === item.id_materiel)
      if (materiel) {
        const typeData = typeMap.get(materiel.id_type)
        if (typeData) {
          typeData.count++
          typeData.totalQuantite += (item.quantite || 0)
        }
      }
    })

    const data = Array.from(typeMap.values()).filter(item => item.count > 0)
    setMaterielsParType(data)
  }, [materiels, stockEtablissements, isResponsable, responsableEtabId])

  // Récapitulatif des données
  const calculateRecapData = useCallback(() => {
    const typeMap = new Map()

    TYPES_MATERIEL.forEach(type => {
      typeMap.set(type.id, {
        type: type.displayName,
        totalUnites: 0,
        enMarche: 0,
        enPanne: 0,
        enReparation: 0,
        connecte: 0,
        nonConnecte: 0,
        distribue: 0
      })
    })

    // Récupérer les derniers états et accessibilités
    const derniersEtats = getLatestStates(etatsMateriel, 'id_materiel', 'date_changement')
    const derniersAcces = getLatestStates(accessibilites, 'id_materiel', 'date_changement')

    // Filtrer les stocks
    let filteredStockEtab = stockEtablissements
    if (isResponsable) {
      filteredStockEtab = stockEtablissements.filter(s => s.id_etab === responsableEtabId)
    } else if (selectedEtablissement) {
      filteredStockEtab = stockEtablissements.filter(s => s.id_etab === selectedEtablissement)
    }

    // Traiter les stocks des établissements
    filteredStockEtab.forEach(item => {
      const materiel = materiels.find(m => m.id_materiel === item.id_materiel)
      if (materiel) {
        const typeData = typeMap.get(materiel.id_type)
        if (typeData) {
          const quantite = item.quantite || 0
          typeData.totalUnites += quantite
          typeData.distribue += quantite

          // État du matériel
          const etat = derniersEtats[item.id_materiel]
          if (etat) {
            typeData.enMarche += (etat.en_marche || 0)
            typeData.enPanne += (etat.en_panne || 0)
            typeData.enReparation += (etat.en_reparation || 0)
          } else {
            // Si pas d'état, tout est en marche par défaut
            typeData.enMarche += quantite
          }

          // Accessibilité
          const acces = derniersAcces[item.id_materiel]
          if (acces) {
            typeData.connecte += (acces.connecte || 0)
            typeData.nonConnecte += (acces.non_connecte || 0)
          }
        }
      }
    })

    // Stock central (seulement pour admin et si aucun établissement sélectionné)
    if (isAdmin && !selectedEtablissement) {
      stockCentral.forEach(item => {
        const materiel = materiels.find(m => m.id_materiel === item.id_materiel)
        if (materiel) {
          const typeData = typeMap.get(materiel.id_type)
          if (typeData) {
            typeData.totalUnites += item.quantite
            typeData.enMarche += item.quantite
          }
        }
      })
    }

    const data = Array.from(typeMap.values())
      .filter(item => item.totalUnites > 0)
      .sort((a, b) => b.totalUnites - a.totalUnites)

    setRecapData(data)
  }, [materiels, stockCentral, stockEtablissements, etatsMateriel, accessibilites, 
      selectedEtablissement, isAdmin, isResponsable, responsableEtabId, getLatestStates])

  // Chargement de la liste des matériels
  const loadMaterielsList = useCallback(() => {
    let filteredMateriels = [...materiels]

    if (isResponsable) {
      const stockInEtab = stockEtablissements.filter(s => s.id_etab === responsableEtabId)
      const materielIds = stockInEtab.map(s => s.id_materiel)
      filteredMateriels = materiels.filter(m => materielIds.includes(m.id_materiel))
    } else if (selectedEtablissement) {
      const stockInEtab = stockEtablissements.filter(s => s.id_etab === selectedEtablissement)
      const materielIds = stockInEtab.map(s => s.id_materiel)
      filteredMateriels = materiels.filter(m => materielIds.includes(m.id_materiel))
    }

    const list = filteredMateriels.map(materiel => {
      const type = TYPES_MATERIEL.find(t => t.id === materiel.id_type)
      
      let quantite = 0
      if (isResponsable) {
        quantite = stockEtablissements
          .filter(s => s.id_materiel === materiel.id_materiel && s.id_etab === responsableEtabId)
          .reduce((sum, s) => sum + (s.quantite || 0), 0)
      } else if (selectedEtablissement) {
        quantite = stockEtablissements
          .filter(s => s.id_materiel === materiel.id_materiel && s.id_etab === selectedEtablissement)
          .reduce((sum, s) => sum + (s.quantite || 0), 0)
      } else {
        const quantiteCentral = stockCentral.find(s => s.id_materiel === materiel.id_materiel)?.quantite || 0
        const quantiteEtab = stockEtablissements
          .filter(s => s.id_materiel === materiel.id_materiel)
          .reduce((sum, s) => sum + (s.quantite || 0), 0)
        quantite = quantiteCentral + quantiteEtab
      }

      return {
        id: materiel.id_materiel,
        reference: materiel.reference || 'N/A',
        type: type?.displayName || 'Inconnu',
        quantite: quantite,
        date_ajout: materiel.date_ajout || '-'
      }
    }).filter(item => item.quantite > 0)

    setMaterielsList(list)
  }, [materiels, stockCentral, stockEtablissements, selectedEtablissement, isResponsable, responsableEtabId])

  // Effet principal
  useEffect(() => {
    if (!loading && materiels.length > 0) {
      if (isAdmin || isResponsable) {
        calculateStatsAdmin()
        calculateMaterielsParType()
        calculateRecapData()
        loadMaterielsList()
        generateSimulatedData()
      }
    }
  }, [materiels, stockCentral, stockEtablissements, etatsMateriel, accessibilites, 
      selectedEtablissement, loading, isAdmin, isResponsable])

  // Données simulées pour les graphiques
  const generateSimulatedData = useCallback(() => {
    const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun']
    const types = ['Ordinateur Portable', 'Ordinateur Bureau', 'Smartphone', 'Tablette']

    const simulatedPanne = moisNoms.map((mois, idx) => {
      const row = { mois }
      types.forEach(type => {
        row[type] = Math.floor(Math.random() * 10) + idx
      })
      return row
    })

    const simulatedAccessibilite = moisNoms.map((mois, idx) => ({
      mois,
      'Ordinateur Portable': Math.floor(Math.random() * 20) + 10 - idx,
      'Ordinateur Bureau': Math.floor(Math.random() * 15) + 10 - idx,
      Smartphone: Math.floor(Math.random() * 15) + 15,
      Tablette: Math.floor(Math.random() * 10) + 5 + idx
    }))

    setPanneData(simulatedPanne)
    setAccessibiliteData(simulatedAccessibilite)
  }, [])

  const getTypeIcon = (libelle) => {
    const icons = {
      'ordinateur_portable': '💻',
      'ordinateur_bureau': '🖥️',
      'smartphone': '📱',
      'tablette': '📟',
      'routeur': '🌐',
      'switch': '🔌',
      'serveur': '🖧',
      'projecteur': '📽️',
      'camera': '📷',
      'speaker': '🔊',
      'autre': '📦'
    }
    return icons[libelle] || '📦'
  }

  const getTypeColor = (type) => {
    const colors = {
      'Ordinateur Portable': '#EF4444',
      'Ordinateur Bureau': '#F97316',
      'Smartphone': '#10B981',
      'Tablette': '#2E5BFF',
      'Routeur': '#F59E0B',
      'Switch': '#8B5CF6',
      'Serveur': '#EC4899',
      'Projecteur': '#06B6D4',
      'Caméra': '#84CC16',
      'Speaker': '#F97316',
      'Autre': '#6B7280'
    }
    return colors[type] || '#6B7280'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des données...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">
            Bonjour {user?.nom || 'Utilisateur'}, bienvenue sur votre espace de gestion
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg border-l-4 border-blue-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total unités</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalStockCentral + stats.totalDistribue}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Package size={24} className="text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-l-4 border-green-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Types de matériel</p>
              <p className="text-3xl font-bold text-green-600">{materielsParType.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <BarChart3 size={24} className="text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-l-4 border-purple-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {isAdmin ? 'Matériels distribués' : 'Unités dans mon établissement'}
              </p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalDistribue}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              {isAdmin ? <TrendingUp size={24} className="text-purple-500" /> : <Building2 size={24} className="text-purple-500" />}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-l-4 border-red-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unités en panne</p>
              <p className="text-3xl font-bold text-red-600">{stats.totalPanne}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle size={24} className="text-red-500" />
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min(stats.tauxPanne, 100)}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Taux: {stats.tauxPanne.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Types de matériels */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {materielsParType.map((type) => (
          <div key={type.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center hover:shadow-md transition">
            <div className="text-2xl mb-1">{type.icon}</div>
            <p className="text-xs font-medium text-gray-700 truncate">{type.nom}</p>
            <p className="text-xl font-bold text-primary-600 mt-1">{type.totalQuantite || type.count}</p>
            <p className="text-xs text-gray-400">({type.count} modèle{type.count > 1 ? 's' : ''})</p>
          </div>
        ))}
      </div>

      {/* Navigation des onglets */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 font-medium transition whitespace-nowrap ${activeTab === 'stats'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            📊 Détail des stocks
          </button>
          <button
            onClick={() => setActiveTab('courbes')}
            className={`px-4 py-2 font-medium transition whitespace-nowrap ${activeTab === 'courbes'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            📈 Évolutions
          </button>
          <button
            onClick={() => setActiveTab('materiels')}
            className={`px-4 py-2 font-medium transition whitespace-nowrap ${activeTab === 'materiels'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            📋 Liste des matériels
          </button>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <select
              value={selectedEtablissement || ''}
              onChange={(e) => setSelectedEtablissement(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tous les établissements</option>
              {etablissements.filter(e => e.actif).map(etab => (
                <option key={etab.id_etab} value={etab.id_etab}>{etab.nom}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Onglet Statistiques */}
      {activeTab === 'stats' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-800 p-4 border-b bg-gray-50">
            {isAdmin
              ? (selectedEtablissement
                ? `📋 Stock de l'établissement : ${etablissements.find(e => e.id_etab === selectedEtablissement)?.nom}`
                : '📋 Récapitulatif des matériels par type')
              : '📋 Mon stock par type de matériel'}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total unités</th>
                  {isAdmin && <th className="px-4 py-3 text-center text-xs font-medium text-blue-600">Distribué</th>}
                  <th className="px-4 py-3 text-center text-xs font-medium text-green-600">En marche</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-red-600">En panne</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-yellow-600">En réparation</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-teal-600">Connecté</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Non connecté</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recapData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getTypeIconByDisplayName(item.type)} {item.type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold text-gray-800">
                      {item.totalUnites}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-blue-600 font-medium">
                        {item.distribue || 0}
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-green-600 font-medium">
                      {item.enMarche}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-red-600 font-medium">
                      {item.enPanne}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-yellow-600 font-medium">
                      {item.enReparation}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-teal-600 font-medium">
                      {item.connecte}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500 font-medium">
                      {item.nonConnecte}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">TOTAL</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-gray-800">
                    {recapData.reduce((sum, item) => sum + item.totalUnites, 0)}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-blue-600">
                      {recapData.reduce((sum, item) => sum + (item.distribue || 0), 0)}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-green-600">
                    {recapData.reduce((sum, item) => sum + item.enMarche, 0)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-red-600">
                    {recapData.reduce((sum, item) => sum + item.enPanne, 0)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-yellow-600">
                    {recapData.reduce((sum, item) => sum + item.enReparation, 0)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-teal-600">
                    {recapData.reduce((sum, item) => sum + item.connecte, 0)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-gray-500">
                    {recapData.reduce((sum, item) => sum + item.nonConnecte, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Onglet Courbes */}
      {activeTab === 'courbes' && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              📈 Évolution des pannes par type de matériel
            </h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={panneData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {panneData.length > 0 && Object.keys(panneData[0])
                    .filter(key => key !== 'mois')
                    .slice(0, 6)
                    .map(type => (
                      <Line
                        key={type}
                        type="monotone"
                        dataKey={type}
                        stroke={getTypeColor(type)}
                        strokeWidth={2}
                        dot={false}
                        name={type}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              🌐 Évolution de l'accessibilité (connectés)
            </h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accessibiliteData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {accessibiliteData.length > 0 && Object.keys(accessibiliteData[0])
                    .filter(key => key !== 'mois')
                    .slice(0, 4)
                    .map(type => (
                      <Line
                        key={type}
                        type="monotone"
                        dataKey={type}
                        stroke={getTypeColor(type)}
                        strokeWidth={2}
                        dot={false}
                        name={type}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Onglet Liste des matériels */}
      {activeTab === 'materiels' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date ajout</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materielsList.length > 0 ? (
                  materielsList.map((materiel, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {materiel.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {materiel.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                        {materiel.quantite}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {materiel.date_ajout}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Aucun matériel trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Fonction utilitaire pour obtenir l'icône depuis le nom d'affichage
const getTypeIconByDisplayName = (displayName) => {
  const map = {
    'Ordinateur Portable': '💻',
    'Ordinateur Bureau': '🖥️',
    'Smartphone': '📱',
    'Tablette': '📟',
    'Routeur': '🌐',
    'Switch': '🔌',
    'Serveur': '🖧',
    'Projecteur': '📽️',
    'Caméra': '📷',
    'Speaker': '🔊',
    'Autre': '📦'
  }
  return map[displayName] || '📦'
}

export default Dashboard