const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const prisma = require('../config/database');

router.use(protect);
router.use(isAdmin);

// GET /api/rapports/stock
router.get('/stock', async (req, res) => {
    try {
        const stockCentral = await prisma.stockCentral.findMany({
            include: { materiel: { include: { type: true } } }
        });
        const stockEtablissements = await prisma.stockEtablissement.findMany({
            include: { materiel: true, etablissement: true }
        });
        res.json({ stockCentral, stockEtablissements });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/rapports/pannes
router.get('/pannes', async (req, res) => {
    try {
        const pannes = await prisma.etatMateriel.findMany({
            where: { etat: 'en panne' },
            include: { materiel: true }
        });
        res.json(pannes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;