const prisma = require('../config/database')

// GET statistiques générales
const getStats = async (req, res) => {
  try {
    const totalMateriels = await prisma.materiel.count()
    const totalEtablissements = await prisma.etablissement.count({ where: { actif: true } })
    const totalUtilisateurs = await prisma.utilisateur.count({ where: { actif: true } })

    const stockCentral = await prisma.stockCentral.aggregate({
      _sum: { quantite: true }
    })
    const stockDistribue = await prisma.stockEtablissement.aggregate({
      _sum: { quantite: true }
    })

    const dernierEtat = await prisma.etatMateriel.groupBy({
      by: ['id_materiel'],
      _max: { date_changement: true }
    })

    res.json({
      totalMateriels,
      totalEtablissements,
      totalUtilisateurs,
      totalStockCentral: stockCentral._sum.quantite || 0,
      totalStockDistribue: stockDistribue._sum.quantite || 0
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET répartition par type
const getRepartitionParType = async (req, res) => {
  try {
    const types = await prisma.typeMateriel.findMany({
      include: {
        materiels: {
          include: {
            stock_central: true,
            stock_etablissements: true
          }
        }
      }
    })

    const result = types.map(type => {
      let totalUnites = 0
      let distribue = 0

      type.materiels.forEach(materiel => {
        materiel.stock_central.forEach(s => totalUnites += s.quantite)
        materiel.stock_etablissements.forEach(s => {
          totalUnites += s.quantite
          distribue += s.quantite
        })
      })

      return {
        id: type.id_type,
        nom: type.displayName,
        libelle: type.libelle,
        totalUnites,
        distribue
      }
    })

    res.json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET répartition par établissement
const getRepartitionParEtablissement = async (req, res) => {
  try {
    const etablissements = await prisma.etablissement.findMany({
      where: { actif: true },
      include: {
        stock_etablissements: {
          include: { materiel: true }
        }
      }
    })

    const result = etablissements.map(etab => {
      let totalUnites = 0
      let pannes = 0

      etab.stock_etablissements.forEach(stock => {
        totalUnites += stock.quantite
      })

      return {
        id: etab.id_etab,
        nom: etab.nom,
        totalUnites,
        pannes
      }
    })

    res.json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET évolution des pannes
const getEvolutionPannes = async (req, res) => {
  try {
    const { periode = '6' } = req.query
    const mois = parseInt(periode)

    const dateLimite = new Date()
    dateLimite.setMonth(dateLimite.getMonth() - mois)

    const pannes = await prisma.etatMateriel.findMany({
      where: {
        etat: 'en panne',
        date_changement: { gte: dateLimite }
      },
      orderBy: { date_changement: 'asc' }
    })

    const moisMap = new Map()
    const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

    pannes.forEach(panne => {
      const date = new Date(panne.date_changement)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const nom = `${moisNoms[date.getMonth()]} ${date.getFullYear()}`

      if (!moisMap.has(key)) {
        moisMap.set(key, { mois: nom, count: 0 })
      }
      moisMap.get(key).count++
    })

    const result = Array.from(moisMap.values())
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getStats,
  getRepartitionParType,
  getRepartitionParEtablissement,
  getEvolutionPannes
}