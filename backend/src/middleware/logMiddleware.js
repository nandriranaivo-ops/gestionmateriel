const prisma = require('../config/database')

// Journalisation des actions
const logAction = async (req, res, next) => {
  const startTime = Date.now()

  // Sauvegarder la méthode originale de réponse
  const originalJson = res.json

  // Surcharger res.json pour capturer la réponse
  res.json = function (data) {
    const duration = Date.now() - startTime

    // Enregistrer dans la base de données si utilisateur connecté
    if (req.user && req.user.id_user) {
      const actionType = getActionType(req.method, req.path)
      const entiteType = getEntityType(req.path)

      prisma.historiqueActions.create({
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
      }).catch(err => console.error('Erreur log:', err))
    }

    // Enregistrer dans la console
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`)

    originalJson.call(this, data)
  }

  next()
}

// Déterminer le type d'action
const getActionType = (method, path) => {
  if (method === 'GET') return 'READ'
  if (method === 'POST') return 'CREATE'
  if (method === 'PUT' || method === 'PATCH') return 'UPDATE'
  if (method === 'DELETE') return 'DELETE'
  return 'UNKNOWN'
}

// Déterminer le type d'entité
const getEntityType = (path) => {
  if (path.includes('/auth')) return 'auth'
  if (path.includes('/etablissements')) return 'etablissement'
  if (path.includes('/materiels')) return 'materiel'
  if (path.includes('/utilisateurs')) return 'utilisateur'
  if (path.includes('/demandes')) return 'demande_reparation'
  if (path.includes('/reparations')) return 'reparation'
  if (path.includes('/stock')) return 'stock'
  if (path.includes('/rapports')) return 'rapport'
  if (path.includes('/historique')) return 'historique'
  return 'unknown'
}

// Middleware pour enregistrer les actions spécifiques
const logSpecificAction = (actionType, entiteType) => {
  return async (req, res, next) => {
    const originalJson = res.json

    res.json = function (data) {
      if (req.user && req.user.id_user && (res.statusCode === 200 || res.statusCode === 201)) {
        prisma.historiqueActions.create({
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
        }).catch(err => console.error('Erreur log:', err))
      }
      originalJson.call(this, data)
    }
    next()
  }
}

module.exports = { logAction, logSpecificAction }