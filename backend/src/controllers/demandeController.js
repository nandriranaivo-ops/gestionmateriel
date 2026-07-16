const prisma = require('../config/database')

// GET toutes les demandes
const getAllDemandes = async (req, res) => {
  try {
    const { etablissementId, statut } = req.query
    const where = {}
    if (etablissementId) where.id_etab = parseInt(etablissementId)
    if (statut) where.statut = statut

    const demandes = await prisma.demandeReparation.findMany({
      where,
      include: {
        etablissement: true,
        ri: { select: { id_user: true, nom: true, email: true } },
        materiel: { include: { type: true } },
        admin: { select: { id_user: true, nom: true } }
      },
      orderBy: { date_demande: 'desc' }
    })
    res.json(demandes)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET demandes par établissement
const getDemandesByEtablissement = async (req, res) => {
  try {
    const { id } = req.params
    const demandes = await prisma.demandeReparation.findMany({
      where: { id_etab: parseInt(id) },
      include: { materiel: { include: { type: true } }, admin: true },
      orderBy: { date_demande: 'desc' }
    })
    res.json(demandes)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// POST créer une demande
const createDemande = async (req, res) => {
  try {
    const { id_etab, id_materiel, quantite, type_panne, urgence, description } = req.body

    const demande = await prisma.demandeReparation.create({
      data: {
        id_etab: parseInt(id_etab),
        id_ri: req.user.id_user,
        id_materiel: parseInt(id_materiel),
        quantite: quantite || 1,
        type_panne,
        urgence,
        description,
        statut: 'en_attente'
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

    res.status(201).json(demande)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT accepter une demande
const accepterDemande = async (req, res) => {
  try {
    const { id } = req.params
    const { date_debut, duree_jours, lieu, notes } = req.body

    const demande = await prisma.demandeReparation.update({
      where: { id_demande: parseInt(id) },
      data: {
        statut: 'acceptee',
        date_traitement: new Date(),
        id_admin: req.user.id_user,
        date_debut_reparation: date_debut ? new Date(date_debut) : null,
        duree_jours: duree_jours ? parseInt(duree_jours) : null,
        lieu_reparation: lieu,
        notes_reparation: notes
      }
    })

    await prisma.reparation.create({
      data: {
        id_etab: demande.id_etab,
        id_materiel: demande.id_materiel,
        id_demande: demande.id_demande,
        quantite: demande.quantite,
        date_debut: date_debut ? new Date(date_debut) : new Date(),
        duree_jours: duree_jours ? parseInt(duree_jours) : 1,
        lieu,
        notes,
        statut: 'en_cours'
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

    res.json(demande)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT refuser une demande
const refuserDemande = async (req, res) => {
  try {
    const { id } = req.params
    const { motif_refus } = req.body

    const demande = await prisma.demandeReparation.update({
      where: { id_demande: parseInt(id) },
      data: {
        statut: 'refusee',
        date_traitement: new Date(),
        id_admin: req.user.id_user,
        motif_refus
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

    res.json(demande)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT terminer une demande (réparation terminée)
const terminerDemande = async (req, res) => {
  try {
    const { id } = req.params

    const demande = await prisma.demandeReparation.update({
      where: { id_demande: parseInt(id) },
      data: {
        statut: 'terminee',
        date_traitement: new Date(),
        id_admin: req.user.id_user
      }
    })

    await prisma.reparation.updateMany({
      where: { id_demande: parseInt(id) },
      data: { statut: 'terminee', date_fin: new Date() }
    })

    await prisma.etatMateriel.createMany({
      data: Array(demande.quantite).fill({
        id_materiel: demande.id_materiel,
        etat: 'en marche',
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

    res.json(demande)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getAllDemandes,
  getDemandesByEtablissement,
  createDemande,
  accepterDemande,
  refuserDemande,
  terminerDemande
}