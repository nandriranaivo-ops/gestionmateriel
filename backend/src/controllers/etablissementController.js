const prisma = require('../config/database')

// GET tous les établissements
const getAllEtablissements = async (req, res) => {
  try {
    const { dren, actif, search } = req.query

    const where = {}
    if (dren) where.dren = dren
    if (actif !== undefined) where.actif = actif === 'true'
    if (search) {
      where.OR = [
        { nom: { contains: search } },
        { dren: { contains: search } }
      ]
    }

    const etablissements = await prisma.etablissement.findMany({
      where,
      include: {
        utilisateurs: { where: { role: 'responsable_etab' } },
        _count: { select: { stock_etablissements: true, demandes: true } }
      },
      orderBy: { nom: 'asc' }
    })

    res.json(etablissements)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET un établissement par ID
const getEtablissementById = async (req, res) => {
  try {
    const { id } = req.params

    const etablissement = await prisma.etablissement.findUnique({
      where: { id_etab: parseInt(id) },
      include: {
        utilisateurs: { where: { role: 'responsable_etab' } },
        stock_etablissements: { include: { materiel: { include: { type: true } } } },
        demandes: { orderBy: { date_demande: 'desc' }, take: 10 }
      }
    })

    if (!etablissement) return res.status(404).json({ message: 'Établissement non trouvé' })
    res.json(etablissement)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// POST créer un établissement
const createEtablissement = async (req, res) => {
  try {
    const {
      nom, dren, cisco, zap,
      nom_directeur, contact_directeur, email_directeur,
      nom_responsable_info, contact_responsable_info, email_responsable_info
    } = req.body

    const existing = await prisma.etablissement.findFirst({ where: { nom } })
    if (existing) return res.status(400).json({ message: 'Cet établissement existe déjà' })

    const etablissement = await prisma.etablissement.create({
      data: {
        nom, dren, cisco, zap,
        nom_directeur, contact_directeur, email_directeur,
        nom_responsable_info, contact_responsable_info, email_responsable_info,
        actif: true
      }
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

    res.status(201).json(etablissement)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT modifier un établissement
const updateEtablissement = async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body

    const etablissement = await prisma.etablissement.update({
      where: { id_etab: parseInt(id) },
      data: {
        nom: data.nom, dren: data.dren, cisco: data.cisco, zap: data.zap,
        nom_directeur: data.nom_directeur, contact_directeur: data.contact_directeur,
        email_directeur: data.email_directeur, nom_responsable_info: data.nom_responsable_info,
        contact_responsable_info: data.contact_responsable_info, email_responsable_info: data.email_responsable_info
      }
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

    res.json(etablissement)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// DELETE supprimer un établissement (soft delete)
const deleteEtablissement = async (req, res) => {
  try {
    const { id } = req.params
    const { motif } = req.body

    const etablissement = await prisma.etablissement.update({
      where: { id_etab: parseInt(id) },
      data: { actif: false }
    })

    await prisma.utilisateur.updateMany({
      where: { id_etab: parseInt(id), role: 'responsable_etab' },
      data: { actif: false }
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

    res.json({ message: 'Établissement supprimé' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getAllEtablissements,
  getEtablissementById,
  createEtablissement,
  updateEtablissement,
  deleteEtablissement
}