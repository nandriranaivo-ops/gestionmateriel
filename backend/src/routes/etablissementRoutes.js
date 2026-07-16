const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin, isAdminOrResponsable } = require('../middleware/roleMiddleware');
const prisma = require('../config/database');

// ✅ Validation des numéros malgaches
const validateMalagasyPhone = (phone) => {
    if (!phone) return true;
    const cleaned = phone.replace(/\s/g, '');
    const regex = /^(032|033|034|038|020)\d{7}$/;
    return regex.test(cleaned);
};

// ✅ Route publique pour la sélection (login)
router.get('/selection', async (req, res) => {
    try {
        const etabs = await prisma.etablissement.findMany({
            where: { actif: true },
            select: { id_etab: true, nom: true },
            orderBy: { nom: 'asc' }
        });
        res.json(etabs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ GET – Liste des établissements
router.get('/', protect, isAdminOrResponsable, async (req, res) => {
    try {
        let etabs;
        if (req.user.role === 'admin_educmad') {
            etabs = await prisma.etablissement.findMany({
                where: { actif: true },
                orderBy: { nom: 'asc' }
            });
        } else {
            etabs = await prisma.etablissement.findMany({
                where: { actif: true, id_etab: req.user.id_etab },
                orderBy: { nom: 'asc' }
            });
        }
        res.json(etabs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ POST – Création d'un établissement (admin)
router.post('/', protect, isAdmin, async (req, res) => {
    try {
        // 1. Champs autorisés (on ignore _compte_ri, etc.)
        const allowedFields = [
            'nom', 'dren', 'cisco', 'zap',
            'nom_directeur', 'contact_directeur', 'email_directeur',
            'nom_responsable_info', 'contact_responsable_info', 'email_responsable_info'
        ];
        const data = {};
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                data[key] = req.body[key];
            }
        }

        // 2. Validation du nom (obligatoire)
        if (!data.nom) {
            return res.status(400).json({ error: 'Le nom de l\'établissement est requis' });
        }

        // 3. Validation des numéros malgaches
        if (data.contact_directeur && !validateMalagasyPhone(data.contact_directeur)) {
            return res.status(400).json({
                error: 'Le numéro du directeur doit être un numéro malgache valide (ex: 0321234567)'
            });
        }
        if (data.contact_responsable_info && !validateMalagasyPhone(data.contact_responsable_info)) {
            return res.status(400).json({
                error: 'Le numéro du responsable info doit être un numéro malgache valide'
            });
        }

        // 4. Création
        const etablissement = await prisma.etablissement.create({
            data: {
                ...data,
                actif: true,
                date_creation: new Date()
            }
        });

        // 5. Historique
        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: etablissement.id_etab,
                id_materiel: null,
                action_type: 'CREATION_ETABLISSEMENT',
                entite_type: 'ETABLISSEMENT',
                entite_id: etablissement.id_etab,
                details: `Création de l'établissement ${etablissement.nom}`
            }
        });

        res.status(201).json({
            message: 'Établissement créé avec succès',
            etablissement
        });
    } catch (error) {
        console.error('❌ Erreur création établissement:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Un établissement avec ce nom existe déjà' });
        }
        res.status(500).json({
            error: 'Erreur lors de la création de l\'établissement',
            details: error.message
        });
    }
});

// ✅ PUT – Modification d'un établissement (admin)
router.put('/:id', protect, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const idEtab = parseInt(id);

        // 1. Champs autorisés
        const allowedFields = [
            'nom', 'dren', 'cisco', 'zap',
            'nom_directeur', 'contact_directeur', 'email_directeur',
            'nom_responsable_info', 'contact_responsable_info', 'email_responsable_info',
            'actif'
        ];
        const data = {};
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                data[key] = req.body[key];
            }
        }

        // 2. Validation des numéros (si présents)
        if (data.contact_directeur && !validateMalagasyPhone(data.contact_directeur)) {
            return res.status(400).json({
                error: 'Le numéro du directeur doit être un numéro malgache valide'
            });
        }
        if (data.contact_responsable_info && !validateMalagasyPhone(data.contact_responsable_info)) {
            return res.status(400).json({
                error: 'Le numéro du responsable info doit être un numéro malgache valide'
            });
        }

        // 3. Mise à jour
        const etablissement = await prisma.etablissement.update({
            where: { id_etab: idEtab },
            data: data
        });

        // 4. Historique
        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: idEtab,
                id_materiel: null,
                action_type: 'MODIFICATION_ETABLISSEMENT',
                entite_type: 'ETABLISSEMENT',
                entite_id: idEtab,
                details: `Modification de l'établissement ${etablissement.nom}`
            }
        });

        res.json({
            message: 'Établissement modifié avec succès',
            etablissement
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ DELETE – Désactiver un établissement (soft delete)
router.delete('/:id', protect, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const idEtab = parseInt(id);
        const { motif } = req.body;

        const etablissement = await prisma.etablissement.update({
            where: { id_etab: idEtab },
            data: { actif: false }
        });

        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: idEtab,
                id_materiel: null,
                action_type: 'SUPPRESSION_ETABLISSEMENT',
                entite_type: 'ETABLISSEMENT',
                entite_id: idEtab,
                details: `Désactivation de l'établissement ${etablissement.nom}${motif ? ' - Motif: ' + motif : ''}`
            }
        });

        res.json({ message: 'Établissement désactivé avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;