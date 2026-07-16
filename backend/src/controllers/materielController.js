const prisma = require('../config/database')

// GET tous les matériels
const getAllMateriels = async (req, res) => {
  try {
    const materiels = await prisma.materiel.findMany({
      include: { type: true }
    })
    res.json(materiels)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET un matériel par ID
const getMaterielById = async (req, res) => {
  try {
    const { id } = req.params
    const materiel = await prisma.materiel.findUnique({
      where: { id_materiel: parseInt(id) },
      include: { type: true, stock_central: true, stock_etablissements: true }
    })
    if (!materiel) return res.status(404).json({ message: 'Matériel non trouvé' })
    res.json(materiel)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// POST créer un matériel
const createMateriel = async (req, res) => {
  try {
    const { id_type, reference, quantite = 1 } = req.body

    const existing = await prisma.materiel.findFirst({ where: { reference } })
    if (existing) return res.status(400).json({ message: 'Cette référence existe déjà' })

    const materiel = await prisma.materiel.create({
      data: { id_type: parseInt(id_type), reference }
    })

    await prisma.stockCentral.create({
      data: { id_materiel: materiel.id_materiel, quantite: parseInt(quantite) }
    })

    await prisma.etatMateriel.create({
      data: { id_materiel: materiel.id_materiel, etat: 'en marche' }
    })

    await prisma.accessibiliteMateriel.create({
      data: { id_materiel: materiel.id_materiel, accessible: false }
    })

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

    res.status(201).json(materiel)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT modifier un matériel
const updateMateriel = async (req, res) => {
  try {
    const { id } = req.params
    const { reference, id_type } = req.body

    const materiel = await prisma.materiel.update({
      where: { id_materiel: parseInt(id) },
      data: { reference, id_type: parseInt(id_type) }
    })

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

    res.json(materiel)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// DELETE supprimer un matériel
const deleteMateriel = async (req, res) => {
  try {
    const { id } = req.params
    const materiel = await prisma.materiel.findUnique({ where: { id_materiel: parseInt(id) } })
    if (!materiel) return res.status(404).json({ message: 'Matériel non trouvé' })

    await prisma.stockCentral.deleteMany({ where: { id_materiel: parseInt(id) } })
    await prisma.etatMateriel.deleteMany({ where: { id_materiel: parseInt(id) } })
    await prisma.accessibiliteMateriel.deleteMany({ where: { id_materiel: parseInt(id) } })
    await prisma.materiel.delete({ where: { id_materiel: parseInt(id) } })

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

    res.json({ message: 'Matériel supprimé' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getAllMateriels,
  getMaterielById,
  createMateriel,
  updateMateriel,
  deleteMateriel
}