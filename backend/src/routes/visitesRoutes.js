const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin, isAdminOrResponsable } = require('../middleware/roleMiddleware');
const prisma = require('../config/database');

router.use(protect);

// GET – Liste des visites (selon le rôle)
router.get('/', isAdminOrResponsable, async (req, res) => {
    try {
        let filter = {};
        if (req.user.role !== 'admin_educmad') {
            filter = { id_etab: req.user.id_etab };
        }
        const visites = await prisma.visite.findMany({
            where: filter,
            include: { etablissement: true }
        });
        res.json(visites);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// POST – Créer une visite (admin)
router.post('/', isAdmin, async (req, res) => {
    try {
        const { id_etab, date_visite, objet, observations, rapport } = req.body;
        
        // ✅ Vérifier que la date est valide et au moins 1 jour après aujourd'hui
        const now = new Date();
        now.setHours(0, 0, 0, 0); // aujourd'hui minuit
        const dateVisite = new Date(date_visite);
        dateVisite.setHours(0, 0, 0, 0); // minuit du jour choisi
        
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1); // demain minuit
        
        if (dateVisite < tomorrow) {
            return res.status(400).json({ 
                error: 'La date de visite doit être au minimum 1 jour après aujourd\'hui (demain).' 
            });
        }
        
        const visite = await prisma.visite.create({
            data: {
                id_etab: parseInt(id_etab),
                date_visite: dateVisite,
                objet,
                observations: observations || null,
                rapport: rapport || null,
                statut: 'planifiee'
            },
            include: { etablissement: true }
        });
        // Historique
        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: req.user.id_etab || null,
                id_materiel: null,
                action_type: 'CREATION_VISITE',
                entite_type: 'VISITE',
                entite_id: visite.id_visite,
                details: `Création de la visite: ${visite.objet}`
            }
        });
        res.status(201).json(visite);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// PUT – Modifier une visite (admin)
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { date_visite, objet, observations, rapport, statut } = req.body;
        const idVisite = parseInt(id);
        
        // Récupérer la visite existante pour vérifier le statut
        const existingVisite = await prisma.visite.findUnique({
            where: { id_visite: idVisite }
        });
        if (!existingVisite) {
            return res.status(404).json({ error: 'Visite non trouvée' });
        }
        
        // Si la date est modifiée, vérifier la même condition
        let newDate = undefined;
        if (date_visite) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const dateVisite = new Date(date_visite);
            dateVisite.setHours(0, 0, 0, 0);
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (dateVisite < tomorrow) {
                return res.status(400).json({ 
                    error: 'La date de visite doit être au minimum 1 jour après aujourd\'hui (demain).' 
                });
            }
            newDate = dateVisite;
        }
        
        const visite = await prisma.visite.update({
            where: { id_visite: idVisite },
            data: {
                date_visite: newDate,
                objet,
                observations,
                rapport,
                statut
            },
            include: { etablissement: true }
        });
        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: req.user.id_etab || null,
                id_materiel: null,
                action_type: 'MODIFICATION_VISITE',
                entite_type: 'VISITE',
                entite_id: idVisite,
                details: `Visite modifiée: ${visite.objet}`
            }
        });
        res.json(visite);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE – Supprimer une visite (admin)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const visite = await prisma.visite.delete({
            where: { id_visite: parseInt(id) }
        });
        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: req.user.id_etab || null,
                id_materiel: null,
                action_type: 'SUPPRESSION_VISITE',
                entite_type: 'VISITE',
                entite_id: parseInt(id),
                details: `Visite supprimée: ${visite.objet}`
            }
        });
        res.json({ message: 'Visite supprimée avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;