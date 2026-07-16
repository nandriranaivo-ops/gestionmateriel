const bcrypt = require('bcryptjs')
const prisma = require('../config/database')

// GET tous les utilisateurs
const getAllUtilisateurs = async (req, res) => {
  try {
    const utilisateurs = await prisma.utilisateur.findMany({
      include: { etablissement: true },
      orderBy: { date_creation: 'desc' }
    })
    const { password_hash, ...usersWithoutPassword } = utilisateurs
    res.json(utilisateurs)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET un utilisateur par ID
const getUtilisateurById = async (req, res) => {
  try {
    const { id } = req.params
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id_user: parseInt(id) },
      include: { etablissement: true }
    })
    if (!utilisateur) return res.status(404).json({ message: 'Utilisateur non trouvé' })
    const { password_hash, ...userWithoutPassword } = utilisateur
    res.json(userWithoutPassword)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// POST créer un utilisateur
const createUtilisateur = async (req, res) => {
  try {
    const { nom, email, password, role, id_etab } = req.body

    const existing = await prisma.utilisateur.findFirst({ where: { email } })
    if (existing) return res.status(400).json({ message: 'Cet email existe déjà' })

    const password_hash = await bcrypt.hash(password, 10)

    const utilisateur = await prisma.utilisateur.create({
      data: {
        nom, email, password_hash, role,
        id_etab: role === 'responsable_etab' ? parseInt(id_etab) : null,
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

    const { password_hash: _, ...userWithoutPassword } = utilisateur
    res.status(201).json(userWithoutPassword)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT modifier un utilisateur
const updateUtilisateur = async (req, res) => {
  try {
    const { id } = req.params
    const { nom, email, role, id_etab, actif } = req.body

    const utilisateur = await prisma.utilisateur.update({
      where: { id_user: parseInt(id) },
      data: {
        nom, email, role,
        id_etab: role === 'responsable_etab' ? parseInt(id_etab) : null,
        actif
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

    const { password_hash, ...userWithoutPassword } = utilisateur
    res.json(userWithoutPassword)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// DELETE supprimer un utilisateur
const deleteUtilisateur = async (req, res) => {
  try {
    const { id } = req.params
    const utilisateur = await prisma.utilisateur.findUnique({ where: { id_user: parseInt(id) } })
    if (!utilisateur) return res.status(404).json({ message: 'Utilisateur non trouvé' })

    await prisma.utilisateur.delete({ where: { id_user: parseInt(id) } })

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

    res.json({ message: 'Utilisateur supprimé' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getAllUtilisateurs,
  getUtilisateurById,
  createUtilisateur,
  updateUtilisateur,
  deleteUtilisateur
}