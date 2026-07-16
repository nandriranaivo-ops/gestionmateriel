const fs = require('fs')
const path = require('path')
const prisma = require('../config/database')

// Chemin des logs
const LOG_DIR = path.join(__dirname, '../../logs')
const COMBINED_LOG = path.join(LOG_DIR, 'combined.log')
const ERROR_LOG = path.join(LOG_DIR, 'error.log')

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

// Écrire dans le log
const writeLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  }

  const logLine = JSON.stringify(logEntry) + '\n'

  // Écrire dans le log combiné
  fs.appendFileSync(COMBINED_LOG, logLine)

  // Écrire dans le log d'erreur si nécessaire
  if (level === 'ERROR') {
    fs.appendFileSync(ERROR_LOG, logLine)
  }

  // Afficher dans la console
  console.log(`[${timestamp}] ${level}: ${message}`)
}

// Log information
const info = (message, meta = {}) => {
  writeLog('INFO', message, meta)
}

// Log erreur
const error = (message, meta = {}) => {
  writeLog('ERROR', message, meta)
}

// Log debug (seulement en développement)
const debug = (message, meta = {}) => {
  if (process.env.NODE_ENV === 'development') {
    writeLog('DEBUG', message, meta)
  }
}

// Log warning
const warn = (message, meta = {}) => {
  writeLog('WARN', message, meta)
}

// Enregistrer une action dans la base de données
const logDatabaseAction = async (userId, userName, userRole, actionType, entiteType, entiteId, details, req = null) => {
  try {
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
    info(`Action enregistrée: ${actionType} sur ${entiteType}`, { userId, entiteId })
  } catch (err) {
    error('Erreur lors de l\'enregistrement de l\'action', { error: err.message })
  }
}

// Nettoyer les vieux logs
const cleanOldLogs = (daysToKeep = 30) => {
  const now = Date.now()
  const cutoffTime = now - (daysToKeep * 24 * 60 * 60 * 1000)

  const cleanFile = (filePath) => {
    if (!fs.existsSync(filePath)) return

    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n').filter(Boolean)
    const newLines = lines.filter(line => {
      try {
        const entry = JSON.parse(line)
        return new Date(entry.timestamp).getTime() > cutoffTime
      } catch {
        return true
      }
    })

    fs.writeFileSync(filePath, newLines.join('\n') + (newLines.length ? '\n' : ''))
  }

  cleanFile(COMBINED_LOG)
  cleanFile(ERROR_LOG)
  info(`Logs nettoyés (conservation: ${daysToKeep} jours)`)
}

module.exports = {
  info,
  error,
  debug,
  warn,
  logDatabaseAction,
  cleanOldLogs
}