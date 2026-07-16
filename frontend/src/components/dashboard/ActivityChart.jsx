import React, { useEffect, useState } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { localStorageService } from '../../utils/localStorage'
import { use } from 'react'

const ActivityChart = () => {
  const [timeRange, setTimeRange] = useState('6months')
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [accessibiliteData, setAccessibiliteData] = useState([])
  const [stats, setStats] = useState({
    totalMateriels: 0,
    totalAccessibles: 0,
    totalPanne: 0,
    totalMarche: 0,
    pannesMois: 0,
    reparationsMois: 0,
    tauxPanne: 0
  })

  useEffect(() => {
    loadChartData()
  }, [timeRange])

  const loadChartData = () => {
    setLoading(true)
    try {
      const etats = useEtatsMaterielStore.getState().loadEtatsMateriel() || []
      const materiels = useMaterielsStore.getState().loadMateriels() || []
      const accessibilites = useAccessibilitesStore.getState().loadAccessibilites() || []

      // ==================== STATISTIQUES GLOBALES ====================
      let totalPanne = 0
      let totalMarche = 0
      materiels.forEach(materiel => {
        const etat = useDernierEtatStore.getState().loadDernierEtat(materiel.id_materiel)
        if (etat === 'en panne') totalPanne++
        else totalMarche++
      })

      let totalAccessibles = 0
      materiels.forEach(materiel => {
        const acces = useDerniereAccessibiliteStore.getState().loadAccessibilitesDerniereAccessibilite(materiel.id_materiel)
        if (acces) totalAccessibles++
      })

      // Pannes et réparations du mois en cours
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      let pannesMois = 0
      let reparationsMois = 0
      
      etats.forEach(etat => {
        const date = new Date(etat.date_changement)
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          if (etat.etat === 'en panne') pannesMois++
          else reparationsMois++
        }
      })

      setStats({
        totalMateriels: materiels.length,
        totalAccessibles,
        totalPanne,
        totalMarche,
        pannesMois,
        reparationsMois,
        tauxPanne: materiels.length > 0 ? (totalPanne / materiels.length) * 100 : 0
      })

      // ==================== DONNÉES POUR L'ÉVOLUTION (COURBES CONTINUES) ====================
      const moisMap = new Map()
      const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

      // Initialiser les 12 derniers mois
      for (let i = 0; i < 12; i++) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const moisKey = `${date.getFullYear()}-${date.getMonth()}`
        const moisNom = `${moisNoms[date.getMonth()]} ${date.getFullYear()}`
        moisMap.set(moisKey, {
          mois: moisNom,
          moisKey: moisKey,
          pannes: 0,
          enMarche: 0,
          accessibles: 0
        })
      }

      // Compter les pannes et réparations par mois
      etats.forEach(etat => {
        if (etat && etat.date_changement) {
          const date = new Date(etat.date_changement)
          if (!isNaN(date.getTime())) {
            const moisKey = `${date.getFullYear()}-${date.getMonth()}`
            if (moisMap.has(moisKey)) {
              if (etat.etat === 'en panne') {
                moisMap.get(moisKey).pannes++
              } else {
                moisMap.get(moisKey).enMarche++
              }
            }
          }
        }
      })

      // Compter les accessibilités par mois
      accessibilites.forEach(acc => {
        if (acc && acc.date_changement && acc.accessible) {
          const date = new Date(acc.date_changement)
          if (!isNaN(date.getTime())) {
            const moisKey = `${date.getFullYear()}-${date.getMonth()}`
            if (moisMap.has(moisKey)) {
              moisMap.get(moisKey).accessibles++
            }
          }
        }
      })

      // Calculer les cumulés pour les courbes
      let cumulPannes = 0
      let cumulAccessibles = 0
      let cumulEnMarche = 0

      const sortedData = Array.from(moisMap.keys()).sort()
      const evolutionData = []
      
      sortedData.forEach(moisKey => {
        const moisData = moisMap.get(moisKey)
        cumulPannes += moisData.pannes
        cumulAccessibles += moisData.accessibles
        cumulEnMarche += moisData.enMarche
        
        evolutionData.push({
          mois: moisData.mois,
          nouvellesPannes: moisData.pannes,
          nouvellesAccessibles: moisData.accessibles,
          nouvellesEnMarche: moisData.enMarche,
          totalPannes: cumulPannes,
          totalAccessibles: cumulAccessibles,
          totalEnMarche: cumulEnMarche
        })
      })

      // Filtrer selon la période
      let filteredData = evolutionData
      if (timeRange === '3months') {
        filteredData = evolutionData.slice(-3)
      } else if (timeRange === '6months') {
        filteredData = evolutionData.slice(-6)
      }

      setChartData(filteredData)

      // ==================== DONNÉES D'ACCESSIBILITÉ FINALES ====================
      const typesAccess = [
        { id: 1, nom: 'Ordinateur' },
        { id: 2, nom: 'Smartphone' },
        { id: 3, nom: 'Tablette' }
      ]

      const accessData = typesAccess.map(type => {
        let accessibles = 0
        let nonAccessibles = 0
        
        materiels.forEach(materiel => {
          if (materiel.id_type === type.id) {
            const acces = useDerniereAccessibiliteStore.getState().loadDerniereAccessibilite(materiel.id_materiel)
            if (acces) accessibles++
            else nonAccessibles++
          }
        })
        
        return {
          type: type.nom,
          accessibles,
          nonAccessibles,
          total: accessibles + nonAccessibles
        }
      }).filter(item => item.total > 0)

      setAccessibiliteData(accessData)

    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-10 text-gray-500">Chargement des statistiques...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ==================== BOÎTES (CARTES) DES NOMBRES ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg border-l-4 border-red-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total en panne</p>
              <p className="text-3xl font-bold text-red-600">{stats.totalPanne}</p>
              <p className="text-xs text-gray-400 mt-1">sur {stats.totalMateriels} matériels</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔴</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: `${stats.tauxPanne}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Taux de panne: {stats.tauxPanne.toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-l-4 border-green-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total en marche</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalMarche}</p>
              <p className="text-xs text-gray-400 mt-1">sur {stats.totalMateriels} matériels</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🟢</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${100 - stats.tauxPanne}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Disponibilité: {(100 - stats.tauxPanne).toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-l-4 border-orange-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Nouvelles pannes (ce mois)</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pannesMois}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">vs {stats.reparationsMois} réparations</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-l-4 border-blue-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Accessibles plateforme</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalAccessibles}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🌐</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {stats.totalMateriels > 0 ? ((stats.totalAccessibles / stats.totalMateriels) * 100).toFixed(1) : 0}% du total
          </p>
        </div>
      </div>

      {/* ==================== SÉLECTEUR DE PÉRIODE ==================== */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setTimeRange('3months')}
          className={`px-3 py-1 rounded-lg text-sm transition ${
            timeRange === '3months' 
              ? 'bg-primary-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          3 mois
        </button>
        <button
          onClick={() => setTimeRange('6months')}
          className={`px-3 py-1 rounded-lg text-sm transition ${
            timeRange === '6months' 
              ? 'bg-primary-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          6 mois
        </button>
      </div>

      {/* ==================== COURBE 1: PANNES (ROUGE) vs EN MARCHE (VERT) ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          📈 Évolution des matériels - 🔴 Pannes vs 🟢 En marche
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalPannes" 
                stroke="#EF4444" 
                strokeWidth={3}
                dot={false}
                name="🔴 Total des matériels en panne"
              />
              <Line 
                type="monotone" 
                dataKey="totalEnMarche" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={false}
                name="🟢 Total des matériels en marche"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">
          🔴 Rouge = Matériels en panne | 🟢 Vert = Matériels en marche - Évolution continue dans le temps
        </p>
      </div>

      {/* ==================== COURBE 2: ACCESSIBILITÉ (BLEU) vs NON ACCESSIBLES (GRIS) ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          🌐 Accessibilité à la plateforme - 🔵 Accessibles vs ⚪ Non accessibles
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalAccessibles" 
                stroke="#2E5BFF" 
                strokeWidth={3}
                dot={false}
                name="🔵 Total des matériels accessibles"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">
          🔵 Bleu = Matériels accessibles à la plateforme - Évolution continue dans le temps
        </p>
      </div>

      {/* ==================== COURBE 3: NOUVELLES PANNES PAR MOIS ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          📊 Nouvelles pannes par mois - 🔴 Courbe rouge
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="nouvellesPannes" 
                stroke="#EF4444" 
                fill="#FEE2E2"
                name="🔴 Nouvelles pannes"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">
          🔴 Rouge = Nombre de nouvelles pannes par mois - Évolution continue
        </p>
      </div>

      {/* ==================== COURBE 4: COMPARAISON PANNES vs ACCESSIBILITÉ ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          📈 Comparaison - 🔴 Pannes vs 🔵 Accessibles
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalPannes" 
                stroke="#EF4444" 
                strokeWidth={3}
                dot={false}
                name="🔴 Matériels en panne"
              />
              <Line 
                type="monotone" 
                dataKey="totalAccessibles" 
                stroke="#2E5BFF" 
                strokeWidth={3}
                dot={false}
                name="🔵 Matériels accessibles"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">
          🔴 Rouge = En panne | 🔵 Bleu = Accessibles - Comparaison des tendances
        </p>
      </div>

      {/* ==================== RÉSUMÉ DES NOMBRES ==================== */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-700 mb-3">📋 Résumé des nombres</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-500">Total matériels</p>
            <p className="text-xl font-bold text-gray-800">{stats.totalMateriels}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">🟢 En marche</p>
            <p className="text-xl font-bold text-green-600">{stats.totalMarche}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">🔴 En panne</p>
            <p className="text-xl font-bold text-red-600">{stats.totalPanne}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">🔵 Accessibles</p>
            <p className="text-xl font-bold text-blue-600">{stats.totalAccessibles}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">⚠️ Pannes (mois)</p>
            <p className="text-xl font-bold text-orange-600">{stats.pannesMois}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityChart