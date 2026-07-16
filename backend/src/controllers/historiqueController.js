const prisma = require('../config/database')

// GET tout l'historique
const getAllHistorique = async (req, res) => {
  try {
    const { limit = 100, page = 1, action_type, id_utilisateur, id_etab, startDate, endDate } = req.query

    const where = {}
    if (action_type) where.action_type = action_type
    if (id_utilisateur) where.id_utilisateur = parseInt(id_utilisateur)
    if (id_etab) where.id_etab = parseInt(id_etab)
    if (startDate) where.date_action = { gte: new Date(startDate) }
    if (endDate) where.date_action = { ...where.date_action, lte: new Date(endDate) }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [historique, total] = await Promise.all([
      prisma.historiqueActions.findMany({
        where,
        include: { utilisateur: true, etablissement: true },
        orderBy: { date_action: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.historiqueActions.count({ where })
    ])

    res.json({
      data: historique,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET historique par utilisateur
const getHistoriqueByUser = async (req, res) => {
  try {
    const { id } = req.params
    const historique = await prisma.historiqueActions.findMany({
      where: { id_utilisateur: parseInt(id) },
      include: { etablissement: true },
      orderBy: { date_action: 'desc' },
      take: 50
    })
    res.json(historique)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET historique par établissement
const getHistoriqueByEtablissement = async (req, res) => {
  try {
    const { id } = req.params
    const historique = await prisma.historiqueActions.findMany({
      where: { id_etab: parseInt(id) },
      include: { utilisateur: true },
      orderBy: { date_action: 'desc' },
      take: 50
    })
    res.json(historique)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET types d'actions disponibles
const getActionTypes = async (req, res) => {
  try {
    const actions = await prisma.historiqueActions.groupBy({
      by: ['action_type'],
      _count: { action_type: true }
    })
    res.json(actions.map(a => ({ type: a.action_type, count: a._count.action_type })))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getAllHistorique,
  getHistoriqueByUser,
  getHistoriqueByEtablissement,
  getActionTypes
}