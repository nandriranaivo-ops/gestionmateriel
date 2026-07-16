const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin, isAdminOrResponsable } = require('../middleware/roleMiddleware');
const prisma = require('../config/database');

router.use(protect);

// GET – Liste des réparations terminées
router.get('/', isAdminOrResponsable, async (req, res) => {
    try {
        const filter = { statut: 'terminee' };
        if (req.user.role === 'responsable_etab') {
            filter.id_etab = req.user.id_etab;
        }

        const reparations = await prisma.demandeReparation.findMany({
            where: filter,
            include: {
                etablissement: true,
                materiel: { include: { type: true } },
                ri: true
            }
        });
        res.json(reparations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT – Terminer une réparation (admin)
router.put('/:id/terminer', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { cout, duree, notes } = req.body;

        // Mettre à jour la demande avec statut 'terminee'
        const demande = await prisma.demandeReparation.update({
            where: { id_demande: parseInt(id) },
            data: { statut: 'terminee', date_traitement: new Date() }
        });

        // Créer une entrée dans la table reparation (si elle existe)
        // Selon ton schéma, il y a peut-être une table `reparation` distincte.
        // Ici on suppose qu'on ajoute des infos de réparation.
        const reparation = await prisma.reparation.create({
            data: {
                id_demande: demande.id_demande,
                cout: cout ? parseFloat(cout) : null,
                duree: duree,
                notes: notes || null,
                statut: 'terminee',
                date_debut: new Date(),
                date_fin: new Date()
            }
        });

        // Mettre à jour l'état du matériel (remis en marche)
        await prisma.etatMateriel.create({
            data: {
                id_materiel: demande.id_materiel,
                etat: 'en marche',
                commentaire: `Réparation terminée`
            }
        });

        // Historique
        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: req.user.id_etab,
                id_materiel: demande.id_materiel, // ← à renseigner
                action_type: 'TERMINER_REPARATION',
                entite_type: 'REPARATION',
                entite_id: reparation.id_reparation,
                details: `Réparation terminée pour le matériel ${materiel.nom}`
            }
        });

        res.json(reparation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;