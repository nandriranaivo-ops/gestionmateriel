const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin, isAdminOrResponsable, isResponsable } = require('../middleware/roleMiddleware');
const prisma = require('../config/database');

router.use(protect);

// Types connectables (pour l'accessibilité)
const TYPES_CONNECTABLES = ['ordinateur_portable', 'ordinateur_bureau', 'smartphone', 'tablette'];

// ============================================
// GET – Liste des matériels
// ============================================
router.get('/', isAdminOrResponsable, async (req, res) => {
    try {
        const materiels = await prisma.materiel.findMany({ 
            include: { 
                type: true,
                stock_central: true,
                stock_etablissements: true
            } 
        });
        res.json(materiels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// GET – États des matériels
// ============================================
router.get('/etats-materiel', isAdminOrResponsable, async (req, res) => {
    try {
        const etats = await prisma.etatMateriel.findMany({
            include: { 
                materiel: {
                    include: { type: true }
                },
                etablissement: true
            },
            orderBy: { date_changement: 'desc' }
        });
        res.json(etats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// GET – Accessibilité des matériels
// ============================================
router.get('/accessibilite', isAdminOrResponsable, async (req, res) => {
    try {
        const access = await prisma.accessibiliteMateriel.findMany({
            include: { 
                materiel: {
                    include: { type: true }
                },
                etablissement: true
            },
            orderBy: { date_changement: 'desc' }
        });
        res.json(access);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// POST – Création d'un matériel (admin)
// ⚠️ Ne crée PAS d'accessibilité ni d'état
// ============================================
router.post('/', protect, isAdmin, async (req, res) => {
    try {
        const { reference, id_type, description, quantiteInitial } = req.body;
        const qty = quantiteInitial ? parseInt(quantiteInitial) : 1;

        // 1. Vérifier si la référence existe déjà
        const existingMateriel = await prisma.materiel.findUnique({
            where: { reference }
        });

        if (existingMateriel) {
            return res.status(400).json({ 
                error: 'Un matériel avec cette référence existe déjà' 
            });
        }

        // 2. Créer le matériel
        const newMateriel = await prisma.materiel.create({
            data: {
                reference,
                id_type: parseInt(id_type),
                description: description || null
            },
            include: {
                type: true
            }
        });

        // 3. Ajouter au stock central
        await prisma.stockCentral.create({
            data: { 
                id_materiel: newMateriel.id_materiel, 
                quantite: qty 
            }
        });

        // 4. ✅ NE PAS CRÉER D'ACCESSIBILITÉ NI D'ÉTAT ICI
        // Ils seront créés lors de la distribution

        // 5. Historique
        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: null,
                id_materiel: newMateriel.id_materiel,
                action_type: 'AJOUT_MATERIEL',
                entite_type: 'MATERIEL',
                entite_id: newMateriel.id_materiel,
                details: `Création du matériel ${reference} (type ${id_type}) - Quantité: ${qty}`
            }
        });

        res.status(201).json({
            message: 'Matériel créé avec succès',
            materiel: newMateriel,
            quantite: qty,
            note: 'Les états et accessibilités seront créés lors de la distribution'
        });

    } catch (error) {
        console.error('❌ Erreur création matériel:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la création du matériel',
            details: error.message 
        });
    }
});

// ============================================
// POST – Distribution d'un matériel
// ✅ Crée l'accessibilité ET l'état
// ============================================
router.post('/:id/distribuer', protect, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { id_etab, quantite } = req.body;
        const idMateriel = parseInt(id);
        const idEtab = parseInt(id_etab);
        const qty = parseInt(quantite);

        if (!idEtab || !qty || qty < 1) {
            return res.status(400).json({ error: 'Établissement et quantité requis' });
        }

        // 1. Vérifier que l'établissement existe
        const etablissement = await prisma.etablissement.findUnique({
            where: { id_etab: idEtab }
        });

        if (!etablissement) {
            return res.status(404).json({ error: 'Établissement non trouvé' });
        }

        // 2. Vérifier le stock central
        const stockCentral = await prisma.stockCentral.findUnique({
            where: { id_materiel: idMateriel }
        });

        if (!stockCentral || stockCentral.quantite < qty) {
            return res.status(400).json({ 
                error: `Stock central insuffisant (disponible: ${stockCentral?.quantite || 0})` 
            });
        }

        // 3. Vérifier si le matériel existe déjà dans l'établissement
        const existingStock = await prisma.stockEtablissement.findUnique({
            where: {
                id_etab_id_materiel: {
                    id_etab: idEtab,
                    id_materiel: idMateriel
                }
            }
        });

        // 4. Ajouter au stock de l'établissement
        if (existingStock) {
            await prisma.stockEtablissement.update({
                where: {
                    id_etab_id_materiel: {
                        id_etab: idEtab,
                        id_materiel: idMateriel
                    }
                },
                data: {
                    quantite: { increment: qty }
                }
            });
        } else {
            await prisma.stockEtablissement.create({
                data: {
                    id_etab: idEtab,
                    id_materiel: idMateriel,
                    quantite: qty
                }
            });
        }

        // 5. Retirer du stock central
        await prisma.stockCentral.update({
            where: { id_materiel: idMateriel },
            data: {
                quantite: { decrement: qty }
            }
        });

        // 6. ✅ CRÉER L'ÉTAT pour l'établissement
        const etat = await prisma.etatMateriel.create({
            data: {
                id_materiel: idMateriel,
                id_etab: idEtab,
                en_marche: qty,
                en_panne: 0,
                en_reparation: 0,
                commentaire: 'État créé lors de la distribution',
                date_changement: new Date()
            }
        });

        // 7. ✅ CRÉER L'ACCESSIBILITÉ pour l'établissement
        // Récupérer le type du matériel
        const materiel = await prisma.materiel.findUnique({
            where: { id_materiel: idMateriel },
            include: { type: true }
        });

        const estConnectable = materiel && TYPES_CONNECTABLES.includes(materiel.type.libelle);

        const accessibilite = await prisma.accessibiliteMateriel.create({
            data: {
                id_materiel: idMateriel,
                id_etab: idEtab,
                connecte: 0,
                non_connecte: estConnectable ? qty : 0,
                commentaire: estConnectable ? 'Accessibilité créée lors de la distribution' : 'Non connectable',
                date_changement: new Date()
            }
        });

        // 8. Historique
        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: idEtab,
                id_materiel: idMateriel,
                action_type: 'DISTRIBUTION',
                entite_type: 'MATERIEL',
                entite_id: idMateriel,
                details: `Distribution de ${qty} unité(s) du matériel ${materiel?.reference} vers l'établissement ${etablissement.nom}`
            }
        });

        res.status(201).json({
            message: 'Distribution réussie',
            etat,
            accessibilite,
            stockRestant: stockCentral.quantite - qty
        });

    } catch (error) {
        console.error('❌ Erreur distribution:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la distribution',
            details: error.message 
        });
    }
});

// ============================================
// PUT – Changement d'état (admin ou responsable)
// ============================================
// backend/src/routes/materielRoutes.js

// PUT – Changement d'état (admin ou responsable)
router.put('/:id/etat', protect, isResponsable, async (req, res) => {
    try {
        const { id } = req.params;
        const { etat, quantite, id_etab, commentaire } = req.body;
        const qty = parseInt(quantite);
        const idMateriel = parseInt(id);
        const idEtab = parseInt(id_etab);

        // ✅ Vérification des paramètres
        if (!etat || !qty || qty < 1 || !idEtab) {
            return res.status(400).json({ 
                error: 'Action (etat), quantité et établissement requis' 
            });
        }

        // Vérification pour responsable
        if (req.user.role === 'responsable_etab' && req.user.id_etab !== idEtab) {
            return res.status(403).json({ error: 'Non autorisé pour cet établissement' });
        }

        // Vérifier le stock
        const stock = await prisma.stockEtablissement.findFirst({
            where: { id_materiel: idMateriel, id_etab: idEtab }
        });
        if (!stock) {
            return res.status(403).json({ error: 'Matériel non présent dans cet établissement' });
        }
        if (qty > stock.quantite) {
            return res.status(400).json({ error: `Stock insuffisant (disponible: ${stock.quantite})` });
        }

        // Récupérer ou créer l'état
        let etatCourant = await prisma.etatMateriel.findUnique({
            where: { id_materiel_id_etab: { id_materiel: idMateriel, id_etab: idEtab } }
        });
        
        if (!etatCourant) {
            etatCourant = await prisma.etatMateriel.create({
                data: {
                    id_materiel: idMateriel,
                    id_etab: idEtab,
                    en_marche: stock.quantite,
                    en_panne: 0,
                    en_reparation: 0,
                    commentaire: 'État initial automatique',
                    date_changement: new Date()
                }
            });
        }

        let newEnMarche = etatCourant.en_marche;
        let newEnPanne = etatCourant.en_panne;
        let newEnReparation = etatCourant.en_reparation;

        // Logique de transition selon l'action
        switch (etat) {
            case 'reparer':
                // panne → marche
                if (newEnPanne < qty) {
                    return res.status(400).json({ error: `Pas assez d'unités en panne (disponible: ${newEnPanne})` });
                }
                newEnPanne -= qty;
                newEnMarche += qty;
                break;
            case 'mettre_en_panne':
                // marche → panne
                if (newEnMarche < qty) {
                    return res.status(400).json({ error: `Pas assez d'unités en marche (disponible: ${newEnMarche})` });
                }
                newEnMarche -= qty;
                newEnPanne += qty;
                break;
            case 'mettre_en_reparation':
                // panne → réparation
                if (newEnPanne < qty) {
                    return res.status(400).json({ error: `Pas assez d'unités en panne (disponible: ${newEnPanne})` });
                }
                newEnPanne -= qty;
                newEnReparation += qty;
                break;
            case 'terminer_reparation':
                // réparation → marche
                if (newEnReparation < qty) {
                    return res.status(400).json({ error: `Pas assez d'unités en réparation (disponible: ${newEnReparation})` });
                }
                newEnReparation -= qty;
                newEnMarche += qty;
                break;
            default:
                return res.status(400).json({ error: 'Action invalide' });
        }

        const updatedEtat = await prisma.etatMateriel.update({
            where: { id_etat: etatCourant.id_etat },
            data: {
                en_marche: newEnMarche,
                en_panne: newEnPanne,
                en_reparation: newEnReparation,
                commentaire: commentaire || null,
                date_changement: new Date()
            }
        });

        // Historique
        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: idEtab,
                id_materiel: idMateriel,
                action_type: 'CHANGEMENT_ETAT',
                entite_type: 'MATERIEL',
                entite_id: idMateriel,
                details: `${qty} unité(s) du matériel ${idMateriel} dans l'établissement ${idEtab} : ${etat}`
            }
        });

        res.json(updatedEtat);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// PUT – Changement d'accessibilité (admin ou responsable)
// ============================================
router.put('/:id/accessibilite', protect, isResponsable, async (req, res) => {
    try {
        const { id } = req.params;
        const { connecter, quantite, id_etab, commentaire } = req.body;
        const qty = parseInt(quantite);
        const idMateriel = parseInt(id);
        const idEtab = parseInt(id_etab);

        if (connecter === undefined || !qty || qty < 1 || !idEtab) {
            return res.status(400).json({ error: 'Action (connecter), quantité et établissement requis' });
        }

        if (req.user.role === 'responsable_etab' && req.user.id_etab !== idEtab) {
            return res.status(403).json({ error: 'Non autorisé pour cet établissement' });
        }

        const stock = await prisma.stockEtablissement.findFirst({
            where: { id_materiel: idMateriel, id_etab: idEtab }
        });
        if (!stock) {
            return res.status(403).json({ error: 'Matériel non présent dans cet établissement' });
        }
        if (qty > stock.quantite) {
            return res.status(400).json({ error: `Stock insuffisant (disponible: ${stock.quantite})` });
        }

        // Récupérer ou créer l'accessibilité
        let accesCourant = await prisma.accessibiliteMateriel.findUnique({
            where: { id_materiel_id_etab: { id_materiel: idMateriel, id_etab: idEtab } }
        });
        
        if (!accesCourant) {
            // Récupérer le type du matériel
            const materiel = await prisma.materiel.findUnique({
                where: { id_materiel: idMateriel },
                include: { type: true }
            });
            const estConnectable = materiel && TYPES_CONNECTABLES.includes(materiel.type.libelle);

            accesCourant = await prisma.accessibiliteMateriel.create({
                data: {
                    id_materiel: idMateriel,
                    id_etab: idEtab,
                    connecte: 0,
                    non_connecte: estConnectable ? stock.quantite : 0,
                    commentaire: estConnectable ? 'État initial automatique' : 'Non connectable',
                    date_changement: new Date()
                }
            });
        }

        let newConnecte = accesCourant.connecte;
        let newNonConnecte = accesCourant.non_connecte;

        if (connecter === true) {
            if (newNonConnecte < qty) {
                return res.status(400).json({ error: `Pas assez d'unités non connectées (disponible: ${newNonConnecte})` });
            }
            newNonConnecte -= qty;
            newConnecte += qty;
        } else {
            if (newConnecte < qty) {
                return res.status(400).json({ error: `Pas assez d'unités connectées (disponible: ${newConnecte})` });
            }
            newConnecte -= qty;
            newNonConnecte += qty;
        }

        const updatedAcces = await prisma.accessibiliteMateriel.update({
            where: { id_accessibilite: accesCourant.id_accessibilite },
            data: {
                connecte: newConnecte,
                non_connecte: newNonConnecte,
                commentaire: commentaire || null,
                date_changement: new Date()
            }
        });

        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: idEtab,
                id_materiel: idMateriel,
                action_type: 'CHANGEMENT_ACCESSIBILITE',
                entite_type: 'MATERIEL',
                entite_id: idMateriel,
                details: `${qty} unité(s) du matériel ${idMateriel} dans l'établissement ${idEtab} ${connecter ? 'connectées' : 'déconnectées'}`
            }
        });

        res.json(updatedAcces);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// PUT – Modification d'un matériel (admin)
router.put('/:id', protect, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { reference, id_type, description } = req.body;
        const idMaterielInt = parseInt(id);

        const materiel = await prisma.materiel.update({
            where: { id_materiel: idMaterielInt },
            data: { 
                reference, 
                id_type: parseInt(id_type), 
                description 
            },
            include: { type: true }
        });

        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: req.user.id_etab || null,
                id_materiel: idMaterielInt,
                action_type: 'MODIFICATION_MATERIEL',
                entite_type: 'MATERIEL',
                entite_id: idMaterielInt,
                details: `Modification du matériel ${materiel.reference}`
            }
        });

        res.json(materiel);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE – Suppression d'un matériel (admin)
router.delete('/:id', protect, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const idMaterielInt = parseInt(id);

        const materiel = await prisma.materiel.findUnique({
            where: { id_materiel: idMaterielInt }
        });
        if (!materiel) {
            return res.status(404).json({ error: 'Matériel non trouvé' });
        }

        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: req.user.id_etab || null,
                id_materiel: idMaterielInt,
                action_type: 'SUPPRESSION_MATERIEL',
                entite_type: 'MATERIEL',
                entite_id: idMaterielInt,
                details: `Suppression du matériel ${materiel.reference}`
            }
        });

        await prisma.materiel.delete({ where: { id_materiel: idMaterielInt } });

        res.json({ message: 'Matériel supprimé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;