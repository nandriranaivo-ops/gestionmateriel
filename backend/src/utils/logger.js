const fs = require('fs')
const path = require('path')

const LOG_DIR = path.join(__dirname, '../../logs')

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

// Fonction pour écrire dans les logs
const writeLog = (level, message, data = null) => {
  const timestamp = new Date().toISOString()
  const logLine = `[${timestamp}] [${level}] ${message}${data ? ' - ' + JSON.stringify(data) : ''}\n`
  
  fs.appendFileSync(path.join(LOG_DIR, 'combined.log'), logLine)
  
  if (level === 'ERROR') {
    fs.appendFileSync(path.join(LOG_DIR, 'error.log'), logLine)
  }
  
  console.log(logLine.trim())
}

// Fonctions de log
const logInfo = (message, data = null) => writeLog('INFO', message, data)
const logError = (message, data = null) => writeLog('ERROR', message, data)
const logWarn = (message, data = null) => writeLog('WARN', message, data)
const logDebug = (message, data = null) => {
  if (process.env.NODE_ENV === 'development') writeLog('DEBUG', message, data)
}

// Middleware Express - C'EST CETTE FONCTION QUI MANQUAIT
const logMiddleware = (req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    logInfo(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`, {
      ip: req.ip,
      userAgent: req.get('user-agent')
    })
  })
  next()
}

module.exports = { logInfo, logError, logWarn, logDebug, logMiddleware }