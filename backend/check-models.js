const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkModels() {
  console.log('📋 Modèles disponibles dans Prisma:\n')
  
  // Lister tous les modèles
  const models = Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$'))
  
  console.log('Modèles trouvés:')
  models.forEach(model => {
    console.log(`  - ${model}`)
  })
  
  // Vérifier spécifiquement les modèles d'état et accessibilité
  console.log('\n🔍 Recherche des modèles spécifiques:')
  
  const possibleEtatNames = ['etatMateriel', 'etat_materiel', 'etats_materiel', 'EtatMateriel']
  const possibleAccessNames = ['accessibiliteMateriel', 'accessibilite', 'accessibilite_materiel', 'AccessibiliteMateriel']
  
  possibleEtatNames.forEach(name => {
    if (prisma[name]) {
      console.log(`✅ Modèle état trouvé: ${name}`)
    } else {
      console.log(`❌ Modèle état non trouvé: ${name}`)
    }
  })
  
  possibleAccessNames.forEach(name => {
    if (prisma[name]) {
      console.log(`✅ Modèle accessibilité trouvé: ${name}`)
    } else {
      console.log(`❌ Modèle accessibilité non trouvé: ${name}`)
    }
  })
}

checkModels()
  .catch(console.error)
  .finally(() => prisma.$disconnect())