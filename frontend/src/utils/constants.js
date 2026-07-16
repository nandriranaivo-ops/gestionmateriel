// Types de matériel
// Types de matériel avec préfixes pour génération automatique d'ID
export const TYPES_MATERIEL = [
  { id: 1, libelle: 'ordinateur_portable', prefix: 'PC', nextNumber: 1, displayName: 'Ordinateur Portable' },
  { id: 2, libelle: 'ordinateur_bureau', prefix: 'ORD', nextNumber: 1, displayName: 'Ordinateur Bureau' },
  { id: 3, libelle: 'smartphone', prefix: 'SPH', nextNumber: 1, displayName: 'Smartphone' },
  { id: 4, libelle: 'tablette', prefix: 'TAB', nextNumber: 1, displayName: 'Tablette' },
  { id: 5, libelle: 'routeur', prefix: 'RT', nextNumber: 1, displayName: 'Routeur' },
  { id: 6, libelle: 'switch', prefix: 'SW', nextNumber: 1, displayName: 'Switch' },
  { id: 7, libelle: 'serveur', prefix: 'SRV', nextNumber: 1, displayName: 'Serveur' },
  { id: 8, libelle: 'projecteur', prefix: 'PRJ', nextNumber: 1, displayName: 'Projecteur' },
  { id: 9, libelle: 'camera', prefix: 'CAM', nextNumber: 1, displayName: 'Caméra' },
  { id: 10, libelle: 'speaker', prefix: 'SPK', nextNumber: 1, displayName: 'Speaker' },
  { id: 11, libelle: 'autre', prefix: 'AUT', nextNumber: 1, displayName: 'Autre' }
]

// Fonction pour obtenir le nom d'affichage
export const getTypeDisplayName = (libelle) => {
  const type = TYPES_MATERIEL.find(t => t.libelle === libelle)
  return type ? type.displayName : libelle
}

// Fonction pour générer un identifiant automatique
export const genererIdentifiant = (typeId, existingMateriels) => {
  const type = TYPES_MATERIEL.find(t => t.id === typeId)
  if (!type) return 'AUT001'
  
  const prefix = type.prefix
  
  // Trouver tous les identifiants existants pour ce type
  const existingIds = existingMateriels
    .filter(m => m.id_type === typeId)
    .map(m => m.reference)
    .filter(ref => ref && ref.startsWith(prefix))
  
  // Extraire les numéros et trouver le max
  let maxNumber = 0
  existingIds.forEach(id => {
    const match = id.match(new RegExp(`^${prefix}(\\d+)$`))
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxNumber) maxNumber = num
    }
  })
  
  const nextNumber = maxNumber + 1
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`
}

// Récupérer l'icône du type
export const getTypeIcon = (libelle) => {
  const icons = {
    'ordinateur_portable': '💻',
    'ordinateur_bureau': '🖥️',
    'smartphone': '📱',
    'tablette': '📟',
    'routeur': '🌐',
    'switch': '🔌',
    'serveur': '🖧',
    'projecteur': '📽️',
    'camera': '📷',
    'speaker': '🔊',
    'autre': '📦'
  }
  return icons[libelle] || '📦'
}

// États possibles
export const ETATS = [
  { value: 'en marche', label: '🟢 En marche', color: 'green' },
  { value: 'en panne', label: '🔴 En panne', color: 'red' }
]

// Rôles utilisateur
export const ROLES = {
  ADMIN: 'admin_educmad',
  RESPONSABLE: 'responsable_etab'
}

// Motifs de suppression
export const MOTIFS_SUPPRESSION = [
  'Irréparable',
  'Obsolescence',
  'Vol / Perte',
  'Transfert définitif',
  'Autre'
]

// Types de panne
export const TYPES_PANNE = [
  { value: 'materiel', label: '📟 Panne matérielle' },
  { value: 'logiciel', label: '💻 Panne logicielle' },
  { value: 'reseau', label: '🌐 Panne réseau' },
  { value: 'autre', label: '📝 Autre' }
]

// Niveaux d'urgence
export const URGENCES = [
  { value: 'faible', label: '🟢 Faible - Peut attendre', color: 'green' },
  { value: 'moyenne', label: '🟡 Moyenne - Gênant', color: 'yellow' },
  { value: 'elevee', label: '🔴 Élevée - Bloquant', color: 'red' }
]

// DREN disponibles
export const DRENS = [
  'ANALAMANGA',
  'ATSIMONDRO',
  'BOENY',
  'DIANA',
  'HAUTE MATSIA',
  'ITASY',
  'MELAKY',
  'MENABE',
  'VAKINANKARATRA'
]