const express = require('express');
const router = express.Router();
const { protect, isAdminOrResponsable } = require('../middleware/authMiddleware');
const prisma = require('../config/database');

router.use(protect);

// GET /api/historique
router.get('/', isAdminOrResponsable, async (req, res) => {
    try {
        const filter = req.user.role === 'admin_educmad' ? {} : { id_etab: req.user.id_etab };

        const historique = await prisma.historiqueActions.findMany({
            where: filter,
            include: {
                utilisateur: true,
                etablissement: true,
                materiel: true           // ← AJOUTER CETTE RELATION
            },
            orderBy: { date_action: 'desc' },
            take: 100
        });

        // Renommer les champs pour le frontend (optionnel, mais plus clair)
        const formatted = historique.map(h => ({
            id_historique: h.id_historique,
            date_action: h.date_action,
            action: h.action_type,                // action_type → action
            details: h.details,
            utilisateur_nom: h.nom_utilisateur,   // nom_utilisateur → utilisateur_nom
            role_utilisateur: h.role_utilisateur,
            id_materiel: h.id_materiel,
            materiel: h.materiel,
            etablissement: h.etablissement
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;