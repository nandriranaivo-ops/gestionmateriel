// Middleware de gestion des erreurs 404
const notFound = (req, res, next) => {
  const error = new Error(`Route non trouvée - ${req.originalUrl}`)
  res.status(404)
  next(error)
}

// Middleware de gestion des erreurs global
const errorHandler = (err, req, res, next) => {
  // Log de l'erreur
  console.error('Erreur:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: req.user?.id_user || 'non authentifié'
  })

  // Statut par défaut
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode

  // Réponse selon l'environnement
  const response = {
    success: false,
    message: err.message || 'Erreur serveur interne'
  }

  // En développement, ajouter la stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack
  }

  // Erreurs spécifiques
  if (err.name === 'ValidationError') {
    response.message = 'Erreur de validation'
    response.details = err.details
    res.status(400)
  }

  if (err.name === 'PrismaClientValidationError') {
    response.message = 'Erreur de validation des données'
    res.status(400)
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      response.message = 'Un enregistrement avec cette valeur existe déjà'
      res.status(409)
    }
    if (err.code === 'P2025') {
      response.message = 'Enregistrement non trouvé'
      res.status(404)
    }
  }

  if (err.name === 'JsonWebTokenError') {
    response.message = 'Token invalide'
    res.status(401)
  }

  if (err.name === 'TokenExpiredError') {
    response.message = 'Token expiré'
    res.status(401)
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    response.message = 'Fichier trop volumineux'
    res.status(400)
  }

  if (err.code === 'MulterError') {
    response.message = 'Erreur lors du téléchargement du fichier'
    res.status(400)
  }

  res.status(statusCode).json(response)
}

// Middleware pour capturer les promesses non gérées
const unhandledRejection = (err) => {
  console.error('Promesse non gérée:', err)
  process.exit(1)
}

module.exports = {
  notFound,
  errorHandler,
  unhandledRejection
}