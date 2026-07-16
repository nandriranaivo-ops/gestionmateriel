const prisma = require('../config/database')

// GET stock central
const getStockCentral = async (req, res) => {
  try {
    const stock = await prisma.stockCentral.findMany({
      include: { materiel: { include: { type: true } } }
    })
    res.json(stock)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET stock d'un établissement
const getStockEtablissement = async (req, res) => {
  try {
    const { id } = req.params
    const stock = await prisma.stockEtablissement.findMany({
      where: { id_etab: parseInt(id) },
      include: { materiel: { include: { type: true } } }
    })
    res.json(stock)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET tous les stocks établissements
const getAllStockEtablissements = async (req, res) => {
  try {
    const stock = await prisma.stockEtablissement.findMany({
      include: { materiel: { include: { type: true } }, etablissement: true }
    })
    res.json(stock)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// POST distribuer du matériel (stock central → établissement)
const distribuer = async (req, res) => {
  try {
    const { id_materiel, id_etab, quantite } = req.body

    const stockCentral = await prisma.stockCentral.findFirst({
      where: { id_materiel: parseInt(id_materiel) }
    })
    if (!stockCentral || stockCentral.quantite < quantite) {
      return res.status(400).json({ message: 'Stock central insuffisant' })
    }

    await prisma.stockCentral.update({
      where: { id_stock_central: stockCentral.id_stock_central },
      data: { quantite: stockCentral.quantite - quantite }
    })

    const existingStock = await prisma.stockEtablissement.findFirst({
      where: { id_etab: parseInt(id_etab), id_materiel: parseInt(id_materiel) }
    })

    if (existingStock) {
      await prisma.stockEtablissement.update({
        where: { id_stock_etab: existingStock.id_stock_etab },
        data: { quantite: existingStock.quantite + quantite }
      })
    } else {
      await prisma.stockEtablissement.create({
        data: {
          id_etab: parseInt(id_etab),
          id_materiel: parseInt(id_materiel),
          quantite: parseInt(quantite)
        }
      })
    }

    await prisma.historiqueActions.create({
      data: {
        date_action: new Date(),
        id_utilisateur: req.user.id_user,
        nom_utilisateur: req.user.nom,
        role_utilisateur: req.user.role,
        id_etab: id_etab || null,
        id_materiel: id_materiel, // ← à renseigner
        action_type: '...',
        entite_type: '...',
        entite_id: '...',
        details: '...'
      }
    })

    res.json({ success: true, message: 'Distribution effectuée' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// POST transférer entre établissements
const transferer = async (req, res) => {
  try {
    const { id_materiel, id_etab_depart, id_etab_arrivee, quantite } = req.body

    const stockDepart = await prisma.stockEtablissement.findFirst({
      where: { id_etab: parseInt(id_etab_depart), id_materiel: parseInt(id_materiel) }
    })
    if (!stockDepart || stockDepart.quantite < quantite) {
      return res.status(400).json({ message: 'Stock insuffisant dans l\'établissement de départ' })
    }

    await prisma.stockEtablissement.update({
      where: { id_stock_etab: stockDepart.id_stock_etab },
      data: { quantite: stockDepart.quantite - quantite }
    })

    const stockArrivee = await prisma.stockEtablissement.findFirst({
      where: { id_etab: parseInt(id_etab_arrivee), id_materiel: parseInt(id_materiel) }
    })

    if (stockArrivee) {
      await prisma.stockEtablissement.update({
        where: { id_stock_etab: stockArrivee.id_stock_etab },
        data: { quantite: stockArrivee.quantite + quantite }
      })
    } else {
      await prisma.stockEtablissement.create({
        data: {
          id_etab: parseInt(id_etab_arrivee),
          id_materiel: parseInt(id_materiel),
          quantite: parseInt(quantite)
        }
      })
    }

    await prisma.historiqueActions.create({
      data: {
        date_action: new Date(),
        id_utilisateur: req.user.id_user,
        nom_utilisateur: req.user.nom,
        role_utilisateur: req.user.role,
        id_etab: id_etab || null,
        id_materiel: id_materiel, // ← à renseigner
        action_type: '...',
        entite_type: '...',
        entite_id: '...',
        details: '...'
      }
    })

    res.json({ success: true, message: 'Transfert effectué' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getStockCentral,
  getStockEtablissement,
  getAllStockEtablissements,
  distribuer,
  transferer
}