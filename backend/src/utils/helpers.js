const crypto = require('crypto')

// Générer un token aléatoire
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex')
}

// Formater la date
const formatDate = (date, format = 'dd/MM/yyyy') => {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')

  if (format === 'dd/MM/yyyy HH:mm') {
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }
  return `${day}/${month}/${year}`
}

// Calculer la différence entre deux dates (en jours)
const daysBetween = (date1, date2) => {
  const diffTime = Math.abs(new Date(date2) - new Date(date1))
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Vérifier si une chaîne est un email valide
const isValidEmail = (email) => {
  const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/
  return re.test(email)
}

// Vérifier si une chaîne est un numéro de téléphone valide
const isValidPhone = (phone) => {
  const re = /^[0-9\s\/\+]+$/
  return re.test(phone)
}

// Nettoyer un objet (supprimer les valeurs null/undefined)
const cleanObject = (obj) => {
  const result = {}
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) {
      result[key] = obj[key]
    }
  }
  return result
}

// Pagination
const paginate = (data, page = 1, limit = 10) => {
  const start = (page - 1) * limit
  const end = start + limit
  const paginatedData = data.slice(start, end)

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: data.length,
      pages: Math.ceil(data.length / limit)
    }
  }
}

// Grouper par clé
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key]
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {})
}

// Calculer le pourcentage
const calculatePercentage = (value, total) => {
  if (total === 0) return 0
  return (value / total) * 100
}

// Arrondir à 2 décimales
const roundToTwo = (num) => {
  return Math.round(num * 100) / 100
}

// Tronquer une chaîne
const truncate = (str, length = 50) => {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

// Générer un identifiant unique
const generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}${timestamp}${random}`.toUpperCase()
}

// Valider un UUID
const isValidUUID = (uuid) => {
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return re.test(uuid)
}

// Attendre un certain temps
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Retry une fonction
const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn()
  } catch (error) {
    if (retries === 0) throw error
    await sleep(delay)
    return retry(fn, retries - 1, delay * 2)
  }
}

module.exports = {
  generateRandomToken,
  formatDate,
  daysBetween,
  isValidEmail,
  isValidPhone,
  cleanObject,
  paginate,
  groupBy,
  calculatePercentage,
  roundToTwo,
  truncate,
  generateUniqueId,
  isValidUUID,
  sleep,
  retry
}