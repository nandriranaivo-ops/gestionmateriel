const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin, isAdminOrResponsable } = require('../middleware/roleMiddleware');
const prisma = require('../config/database');

router.use(protect);

// Types connectables (pour l'accessibilité)
const TYPES_CONNECTABLES = ['ordinateur_portable', 'ordinateur_bureau', 'smartphone', 'tablette'];

// ==================== STOCK CENTRAL ====================
router.get('/stock-central', isAdminOrResponsable, async (req, res) => {
    try {
        const stock = await prisma.stockCentral.findMany({
            include: { materiel: { include: { type: true } } }
        });
        res.json(stock);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/stock-central', isAdmin, async (req, res) => {
    try {
        const { id_materiel, quantite } = req.body;
        const idMaterielInt = parseInt(id_materiel);
        const quantiteInt = parseInt(quantite);

        let stock = await prisma.stockCentral.findUnique({
            where: { id_materiel: idMaterielInt }
        });
        if (stock) {
            stock = await prisma.stockCentral.update({
                where: { id_materiel: idMaterielInt },
                data: { quantite: { increment: quantiteInt } }
            });
        } else {
            stock = await prisma.stockCentral.create({
                data: { id_materiel: idMaterielInt, quantite: quantiteInt }
            });
        }

        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: null,
                id_materiel: idMaterielInt,
                action_type: 'AJOUT_STOCK_CENTRAL',
                entite_type: 'STOCK_CENTRAL',
                entite_id: stock.id_stock_central,
                details: `Ajout de ${quantiteInt} unité(s) au stock central pour le matériel ${idMaterielInt}`
            }
        });
        res.status(201).json(stock);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/stock-central/:id/remove', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantite } = req.body;
        const quantiteInt = parseInt(quantite);

        const stock = await prisma.stockCentral.update({
            where: { id_stock_central: parseInt(id) },
            data: { quantite: { decrement: quantiteInt } }
        });

        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: null,
                id_materiel: stock.id_materiel,
                action_type: 'RETRAIT_STOCK_CENTRAL',
                entite_type: 'STOCK_CENTRAL',
                entite_id: stock.id_stock_central,
                details: `Retrait de ${quantiteInt} unité(s) du stock central pour le matériel ${stock.id_materiel}`
            }
        });
        res.json(stock);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== STOCK ÉTABLISSEMENTS ====================
router.put('/stock-etablissements/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { delta } = req.body;
        const stock = await prisma.stockEtablissement.update({
            where: { id_stock_etab: parseInt(id) },
            data: { quantite: { increment: parseInt(delta) } }
        });
        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: stock.id_etab,
                id_materiel: stock.id_materiel,
                action_type: 'MODIFICATION_STOCK_ETABLISSEMENT',
                entite_type: 'STOCK_ETABLISSEMENT',
                entite_id: stock.id_stock_etab,
                details: `Modification du stock (delta ${delta}) dans l'établissement ${stock.id_etab}`
            }
        });
        res.json(stock);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/stock-etablissements', isAdminOrResponsable, async (req, res) => {
    try {
        const filter = req.user.role === 'admin_educmad' ? {} : { id_etab: req.user.id_etab };
        const stock = await prisma.stockEtablissement.findMany({
            where: filter,
            include: { materiel: { include: { type: true } }, etablissement: true }
        });
        res.json(stock);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== DISTRIBUTION (CORRIGÉ) ====================
router.post('/distribution', isAdmin, async (req, res) => {
    try {
        const { id_materiel, id_etab, quantite } = req.body;
        const qty = parseInt(quantite);
        const idMaterielInt = parseInt(id_materiel);
        const idEtabInt = parseInt(id_etab);

        // 1. Vérifier et décrémenter le stock central
        const stockCentral = await prisma.stockCentral.findUnique({
            where: { id_materiel: idMaterielInt }
        });
        if (!stockCentral || stockCentral.quantite < qty) {
            return res.status(400).json({ error: 'Stock central insuffisant' });
        }
        await prisma.stockCentral.update({
            where: { id_materiel: idMaterielInt },
            data: { quantite: { decrement: qty } }
        });

        // 2. Incrémenter le stock de l'établissement
        const existing = await prisma.stockEtablissement.findUnique({
            where: {
                id_etab_id_materiel: { id_etab: idEtabInt, id_materiel: idMaterielInt }
            }
        });
        let nouveauStock;
        if (existing) {
            nouveauStock = await prisma.stockEtablissement.update({
                where: { id_stock_etab: existing.id_stock_etab },
                data: { quantite: { increment: qty } }
            });
        } else {
            nouveauStock = await prisma.stockEtablissement.create({
                data: { id_etab: idEtabInt, id_materiel: idMaterielInt, quantite: qty }
            });
        }

        // 3. ✅ CORRIGÉ : Gérer l'état du matériel (SANS 'etat')
        const existingEtat = await prisma.etatMateriel.findUnique({
            where: {
                id_materiel_id_etab: { id_materiel: idMaterielInt, id_etab: idEtabInt }
            }
        });

        if (existingEtat) {
            await prisma.etatMateriel.update({
                where: {
                    id_materiel_id_etab: { id_materiel: idMaterielInt, id_etab: idEtabInt }
                },
                data: {
                    en_marche: { increment: qty },
                    date_changement: new Date()
                }
            });
        } else {
            await prisma.etatMateriel.create({
                data: {
                    id_materiel: idMaterielInt,
                    id_etab: idEtabInt,
                    en_marche: qty,
                    en_panne: 0,
                    en_reparation: 0,
                    commentaire: 'Distribution initiale',
                    date_changement: new Date()
                }
            });
        }

        // 4. ✅ CORRIGÉ : Gérer l'accessibilité (SANS 'accessible')
        // Récupérer le type du matériel pour savoir s'il est connectable
        const materiel = await prisma.materiel.findUnique({
            where: { id_materiel: idMaterielInt },
            include: { type: true }
        });
        const estConnectable = materiel && materiel.type && TYPES_CONNECTABLES.includes(materiel.type.libelle);

        const existingAcces = await prisma.accessibiliteMateriel.findUnique({
            where: {
                id_materiel_id_etab: { id_materiel: idMaterielInt, id_etab: idEtabInt }
            }
        });

        if (existingAcces) {
            await prisma.accessibiliteMateriel.update({
                where: {
                    id_materiel_id_etab: { id_materiel: idMaterielInt, id_etab: idEtabInt }
                },
                data: {
                    non_connecte: { increment: estConnectable ? qty : 0 },
                    date_changement: new Date()
                }
            });
        } else {
            await prisma.accessibiliteMateriel.create({
                data: {
                    id_materiel: idMaterielInt,
                    id_etab: idEtabInt,
                    connecte: 0,
                    non_connecte: estConnectable ? qty : 0,
                    commentaire: estConnectable ? 'Distribution initiale' : 'Non connectable',
                    date_changement: new Date()
                }
            });
        }

        // 5. Historique de distribution
        const etablissement = await prisma.etablissement.findUnique({ where: { id_etab: idEtabInt } });
        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: idEtabInt,
                id_materiel: idMaterielInt,
                action_type: 'DISTRIBUTION',
                entite_type: 'STOCK_ETABLISSEMENT',
                entite_id: nouveauStock.id_stock_etab,
                details: `Distribution de ${qty} ${materiel?.reference || 'matériel'} vers ${etablissement?.nom || 'établissement'}`
            }
        });

        res.json({
            message: 'Distribution réussie',
            stock: nouveauStock
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== TRANSFERT (CORRIGÉ) ====================
router.post('/transfert', isAdmin, async (req, res) => {
    try {
        const { id_materiel, id_etab_source, id_etab_dest, quantite } = req.body;
        const qty = parseInt(quantite);
        const idMaterielInt = parseInt(id_materiel);
        const idSource = parseInt(id_etab_source);
        const idDest = parseInt(id_etab_dest);

        // 1. Vérifier stock source
        const stockSource = await prisma.stockEtablissement.findUnique({
            where: {
                id_etab_id_materiel: { id_etab: idSource, id_materiel: idMaterielInt }
            }
        });
        if (!stockSource || stockSource.quantite < qty) {
            return res.status(400).json({ error: 'Stock source insuffisant' });
        }

        // 2. Décrémenter stock source
        await prisma.stockEtablissement.update({
            where: { id_stock_etab: stockSource.id_stock_etab },
            data: { quantite: { decrement: qty } }
        });

        // 3. Incrémenter stock destination
        const existingDest = await prisma.stockEtablissement.findUnique({
            where: {
                id_etab_id_materiel: { id_etab: idDest, id_materiel: idMaterielInt }
            }
        });
        let stockDest;
        if (existingDest) {
            stockDest = await prisma.stockEtablissement.update({
                where: { id_stock_etab: existingDest.id_stock_etab },
                data: { quantite: { increment: qty } }
            });
        } else {
            stockDest = await prisma.stockEtablissement.create({
                data: { id_etab: idDest, id_materiel: idMaterielInt, quantite: qty }
            });
        }

        // 4. ✅ CORRIGÉ : Transférer l'état (SANS 'etat')
        // Source : décrémenter en_marche
        const etatSource = await prisma.etatMateriel.findUnique({
            where: { id_materiel_id_etab: { id_materiel: idMaterielInt, id_etab: idSource } }
        });
        if (etatSource) {
            await prisma.etatMateriel.update({
                where: { id_materiel_id_etab: { id_materiel: idMaterielInt, id_etab: idSource } },
                data: {
                    en_marche: { decrement: qty },
                    date_changement: new Date()
                }
            });
        }

        // Destination : incrémenter en_marche
        const etatDest = await prisma.etatMateriel.findUnique({
            where: { id_materiel_id_etab: { id_materiel: idMaterielInt, id_etab: idDest } }
        });
        if (etatDest) {
            await prisma.etatMateriel.update({
                where: { id_materiel_id_etab: { id_materiel: idMaterielInt, id_etab: idDest } },
                data: {
                    en_marche: { increment: qty },
                    date_changement: new Date()
                }
            });
        } else {
            await prisma.etatMateriel.create({
                data: {
                    id_materiel: idMaterielInt,
                    id_etab: idDest,
                    en_marche: qty,
                    en_panne: 0,
                    en_reparation: 0,
                    commentaire: 'Transfert reçu',
                    date_changement: new Date()
                }
            });
        }

        // 5. ✅ CORRIGÉ : Transférer l'accessibilité (SANS 'accessible')
        // Récupérer le type du matériel
        const materiel = await prisma.materiel.findUnique({
            where: { id_materiel: idMaterielInt },
            include: { type: true }
        });
        const estConnectable = materiel && materiel.type && TYPES_CONNECTABLES.includes(materiel.type.libelle);

        if (estConnectable) {
            // Source : décrémenter non_connecte
            const accesSource = await prisma.accessibiliteMateriel.findUnique({
                where: { id_materiel_id_etab: { id_materiel: idMaterielInt, id_etab: idSource } }
            });
            if (accesSource && accesSource.non_connecte >= qty) {
                await prisma.accessibiliteMateriel.update({
                    where: { id_accessibilite: accesSource.id_accessibilite },
                    data: {
                        non_connecte: { decrement: qty },
                        date_changement: new Date()
                    }
                });
            }

            // Destination : incrémenter non_connecte
            const accesDest = await prisma.accessibiliteMateriel.findUnique({
                where: { id_materiel_id_etab: { id_materiel: idMaterielInt, id_etab: idDest } }
            });
            if (accesDest) {
                await prisma.accessibiliteMateriel.update({
                    where: { id_accessibilite: accesDest.id_accessibilite },
                    data: {
                        non_connecte: { increment: qty },
                        date_changement: new Date()
                    }
                });
            } else {
                await prisma.accessibiliteMateriel.create({
                    data: {
                        id_materiel: idMaterielInt,
                        id_etab: idDest,
                        connecte: 0,
                        non_connecte: qty,
                        commentaire: 'Transfert reçu',
                        date_changement: new Date()
                    }
                });
            }
        }

        // 6. Historique
        const etabSource = await prisma.etablissement.findUnique({ where: { id_etab: idSource } });
        const etabDest = await prisma.etablissement.findUnique({ where: { id_etab: idDest } });
        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: idDest,
                id_materiel: idMaterielInt,
                action_type: 'TRANSFERT',
                entite_type: 'STOCK_ETABLISSEMENT',
                entite_id: stockDest.id_stock_etab,
                details: `Transfert de ${qty} ${materiel?.reference || 'matériel'} de ${etabSource?.nom || 'source'} vers ${etabDest?.nom || 'destination'}`
            }
        });

        res.json({ 
            message: 'Transfert effectué avec succès', 
            stockDest 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;