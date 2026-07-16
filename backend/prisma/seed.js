const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

  // ===== 1. Types de matériel =====
  console.log('📦 Création des types de matériel...')
  const types = [
    { id_type: 1, libelle: 'ordinateur_portable',  displayName: 'Ordinateur Portable',  prefix: 'ORP' },
    { id_type: 2, libelle: 'ordinateur_bureau',    displayName: 'Ordinateur Bureau',    prefix: 'ORB' },
    { id_type: 3, libelle: 'smartphone',           displayName: 'Smartphone',           prefix: 'SMP' },
    { id_type: 4, libelle: 'tablette',             displayName: 'Tablette',             prefix: 'TAB' },
    { id_type: 5, libelle: 'routeur',              displayName: 'Routeur',              prefix: 'ROU' },
    { id_type: 6, libelle: 'switch',               displayName: 'Switch',               prefix: 'SWI' },
    { id_type: 7, libelle: 'serveur',              displayName: 'Serveur',              prefix: 'SRV' },
    { id_type: 8, libelle: 'projecteur',           displayName: 'Projecteur',           prefix: 'PRJ' },
  ]

  for (const type of types) {
    await prisma.typeMateriel.upsert({
      where: { id_type: type.id_type },
      update: {},
      create: type,
    })
  }
  console.log(`✓ ${types.length} types créés`)

  // ===== 2. Établissements =====
  console.log('🏫 Création des établissements...')
  const etablissements = [
    { id_etab: 1, nom: 'Lycée Ambanitsena', actif: true },
    { id_etab: 2, nom: 'Collège Andohalo', actif: true },
  ]
  for (const etab of etablissements) {
    await prisma.etablissement.upsert({
      where: { id_etab: etab.id_etab },
      update: {},
      create: etab,
    })
  }
  console.log(`✓ ${etablissements.length} établissements créés`)

  // ===== 3. Utilisateurs =====
  console.log('👤 Création des utilisateurs...')
  const adminPassword = await bcrypt.hash('admin123', 10)
  const respPassword = await bcrypt.hash('resp123', 10)

  const users = [
    { id_user: 1, email: 'admin@educmad.mg', password_hash: adminPassword, nom: 'Admin EDUCMAD', role: 'admin_educmad', actif: true },
    { id_user: 2, email: 'responsable@lycee-a.mg', password_hash: respPassword, nom: 'Responsable Lycée', role: 'responsable_etab', id_etab: 1, actif: true },
  ]
  for (const user of users) {
    await prisma.utilisateur.upsert({
      where: { id_user: user.id_user },
      update: {},
      create: user,
    })
  }
  console.log(`✓ ${users.length} utilisateurs créés`)

  // ===== 4. Matériels =====
  console.log('💻 Création des matériels...')
  const materiels = [
    { id_materiel: 1, reference: 'ORB001', id_type: 2, description: 'Ordinateur de bureau Dell' },
    { id_materiel: 2, reference: 'ORP001', id_type: 1, description: 'Ordinateur portable HP' },
  ]
  for (const mat of materiels) {
    await prisma.materiel.upsert({
      where: { id_materiel: mat.id_materiel },
      update: {},
      create: mat,
    })
  }
  console.log(`✓ ${materiels.length} matériels créés`)

  // ===== 5. Stock central =====
  console.log('📊 Stock central...')
  const stockCentral = [
    { id_stock_central: 1, id_materiel: 1, quantite: 10 },
    { id_stock_central: 2, id_materiel: 2, quantite: 5 },
  ]
  for (const stock of stockCentral) {
    await prisma.stockCentral.upsert({
      where: { id_stock_central: stock.id_stock_central },
      update: {},
      create: stock,
    })
  }
  console.log(`✓ ${stockCentral.length} lignes stock central`)

  // ===== 6. Stock établissements (exemple) =====
  console.log('🏪 Stock établissements...')
  const stockEtab = [
    { id_stock_etab: 1, id_materiel: 1, id_etab: 1, quantite: 3 },
    { id_stock_etab: 2, id_materiel: 2, id_etab: 2, quantite: 2 },
  ]
  for (const se of stockEtab) {
    await prisma.stockEtablissement.upsert({
      where: { id_stock_etab: se.id_stock_etab },
      update: {},
      create: se,
    })
  }
  console.log(`✓ ${stockEtab.length} lignes stock établissements`)

  // ===== (Optionnel) Visites =====
  // Si la table Visite existe, vous pouvez ajouter des données ici
  // ...

  console.log('🎉 Seeding terminé avec succès !')
}

main()
  .catch((e) => {
    console.error('❌ Erreur seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })