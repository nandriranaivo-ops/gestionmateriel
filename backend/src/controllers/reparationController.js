const prisma = require('../config/database')

// GET toutes les réparations
const getAllReparations = async (req, res) => {
  try {
    const reparations = await prisma.reparation.findMany({
      include: {
        etablissement: true,
        materiel: { include: { type: true } },
        demande: true
      },
      orderBy: { date_debut: 'desc' }
    })
    res.json(reparations)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET réparations par établissement
const getReparationsByEtablissement = async (req, res) => {
  try {
    const { id } = req.params
    const reparations = await prisma.reparation.findMany({
      where: { id_etab: parseInt(id) },
      include: { materiel: { include: { type: true } }, demande: true },
      orderBy: { date_debut: 'desc' }
    })
    res.json(reparations)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// POST créer une réparation
const createReparation = async (req, res) => {
  try {
    const { id_etab, id_materiel, quantite, date_debut, duree_jours, lieu, notes } = req.body

    const reparation = await prisma.reparation.create({
      data: {
        id_etab: parseInt(id_etab),
        id_materiel: parseInt(id_materiel),
        quantite: quantite || 1,
        date_debut: date_debut ? new Date(date_debut) : new Date(),
        duree_jours: parseInt(duree_jours) || 1,
        lieu,
        notes,
        statut: 'en_cours'
      }
    })

    // Marquer le matériel comme en panne
    await prisma.etatMateriel.createMany({
      data: Array(quantite || 1).fill({
        id_materiel: parseInt(id_materiel),
        etat: 'en panne',
        date_changement: new Date()
      })
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

    res.status(201).json(reparation)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT terminer une réparation
const terminerReparation = async (req, res) => {
  try {
    const { id } = req.params
    const reparation = await prisma.reparation.findUnique({
      where: { id_reparation: parseInt(id) }
    })
    if (!reparation) return res.status(404).json({ message: 'Réparation non trouvée' })

    const updated = await prisma.reparation.update({
      where: { id_reparation: parseInt(id) },
      data: { statut: 'terminee', date_fin: new Date() }
    })

    await prisma.etatMateriel.createMany({
      data: Array(reparation.quantite).fill({
        id_materiel: reparation.id_materiel,
        etat: 'en marche',
        date_changement: new Date()
      })
    })

    if (reparation.id_demande) {
      await prisma.demandeReparation.update({
        where: { id_demande: reparation.id_demande },
        data: { statut: 'terminee' }
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

    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getAllReparations,
  getReparationsByEtablissement,
  createReparation,
  terminerReparation
}