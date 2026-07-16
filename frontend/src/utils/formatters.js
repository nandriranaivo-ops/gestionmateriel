import { format, formatDistance } from 'date-fns'
import { fr } from 'date-fns/locale'

export const formatDate = (date) => {
  if (!date) return ''
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
}

export const formatDateTime = (date) => {
  if (!date) return ''
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr })
}

export const formatRelativeTime = (date) => {
  if (!date) return ''
  return formatDistance(new Date(date), new Date(), { addSuffix: true, locale: fr })
}

export const formatNumber = (num) => {
  return new Intl.NumberFormat('fr-FR').format(num)
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA' }).format(amount)
}

export const getEtatBadge = (etat) => {
  if (etat === 'en marche') {
    return { label: 'En marche', color: 'bg-green-100 text-green-800', icon: '🟢' }
  }
  return { label: 'En panne', color: 'bg-red-100 text-red-800', icon: '🔴' }
}

export const getUrgenceBadge = (urgence) => {
  switch (urgence) {
    case 'faible':
      return { label: 'Faible', color: 'bg-green-100 text-green-800', icon: '🟢' }
    case 'moyenne':
      return { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' }
    case 'elevee':
      return { label: 'Élevée', color: 'bg-red-100 text-red-800', icon: '🔴' }
    default:
      return { label: urgence, color: 'bg-gray-100 text-gray-800', icon: '⚪' }
  }
}

export const getStatutDemandeBadge = (statut) => {
  switch (statut) {
    case 'en_attente':
      return { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' }
    case 'acceptee':
      return { label: 'Acceptée', color: 'bg-green-100 text-green-800', icon: '✅' }
    case 'refusee':
      return { label: 'Refusée', color: 'bg-red-100 text-red-800', icon: '❌' }
    case 'en_cours':
      return { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: '🔧' }
    case 'terminee':
      return { label: 'Terminée', color: 'bg-gray-100 text-gray-800', icon: '✔️' }
    default:
      return { label: statut, color: 'bg-gray-100 text-gray-800', icon: '📋' }
  }
}

export const getTypeMaterielIcon = (type) => {
  const icons = {
    ordinateur: '🖥️',
    smartphone: '📱',
    tablette: '📟',
    routeur: '🌐',
    switch: '🔌',
    serveur: '🖧',
    projecteur: '📽️',
    camera: '📷',
    speaker: '🔊',
    autre: '📦'
  }
  return icons[type] || '📦'
}