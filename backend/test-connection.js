const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  console.log('🔍 Test de connexion à MySQL...')
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test, DATABASE() as db, NOW() as time`
    console.log('✅ Connexion réussie !')
    console.log('📊 Résultat:', result)
    
    // Vérifier les tables
    const tables = await prisma.$queryRaw`SHOW TABLES`
    console.log('📋 Tables:', tables)
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    
    if (error.message.includes('Can\'t reach database server')) {
      console.log('\n💡 SOLUTION:')
      console.log('   1. Lancez XAMPP Control Panel')
      console.log('   2. Cliquez sur "Start" pour MySQL')
      console.log('   3. Attendez que le statut devienne vert')
      console.log('   4. Réexécutez ce script')
    } else if (error.message.includes('Unknown database')) {
      console.log('\n💡 SOLUTION:')
      console.log('   Créez la base avec: mysql -u root -e "CREATE DATABASE educmad"')
    }
  } finally {
    await prisma.$disconnect()
  }
}

test()