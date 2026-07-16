const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Import des routes (style simple et direct)
// À placer APRÈS les middlewares de base (cors, express.json)
// mais AVANT toutes les autres routes

// ✅ ROUTE DE TEST - DOIT ÊTRE LA PREMIÈRE
app.get('/api/public/etablissements', async (req, res) => {
  try {
    const prisma = require('./src/config/database')
    const etablissements = await prisma.etablissement.findMany({
      where: { actif: true },
      select: { id_etab: true, nom: true }
    })
    res.json(etablissements)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ...
const authRoutes = require('./src/routes/authRoutes')
const demandeRoutes = require('./src/routes/demandeRoutes')
const etablissementRoutes = require('./src/routes/etablissementRoutes')
const historiqueRoutes = require('./src/routes/historiqueRoutes')
const materielRoutes = require('./src/routes/materielRoutes')
const stockRoutes = require('./src/routes/stockRoutes')
const rapportRoutes = require('./src/routes/rapportRoutes')
const reparationRoutes = require('./src/routes/reparationRoutes')
const uploadRoutes = require('./src/routes/uploadRoutes')
const utilisateurRoutes = require('./src/routes/utilisateurRoutes')
const visitesRoutes = require('./src/routes/visitesRoutes')

// Utilisation des routes
// Déclaration des routes
app.use('/api/auth', authRoutes);
app.use('/api/etablissements', etablissementRoutes);
app.use('/api/materiels', materielRoutes);
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/demandes', demandeRoutes);
app.use('/api/reparations', reparationRoutes);
app.use('/api/historique', historiqueRoutes);
app.use('/api/rapports', rapportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/visites', visitesRoutes);
app.use('/api', stockRoutes); // Pour garder /api/stock-central et /api/stock-etablissements

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() })
})

// Route 404
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} non trouvée` })
})

// Gestionnaire d'erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`)
})