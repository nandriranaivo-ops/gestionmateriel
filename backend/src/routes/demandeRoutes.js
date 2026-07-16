const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin, isResponsable, isAdminOrResponsable } = require('../middleware/roleMiddleware');
const prisma = require('../config/database');

router.use(protect);

// ==================== GET – Liste des demandes ====================
router.get('/', isAdminOrResponsable, async (req, res) => {
    try {
        const filter = req.user.role === 'admin_educmad' ? {} : { id_ri: req.user.id_user };
        const demandes = await prisma.demandeReparation.findMany({
            where: filter,
            include: { 
                etablissement: true, 
                materiel: { include: { type: true } }, 
                ri: true, 
                admin: true 
            },
            orderBy: { date_demande: 'desc' }
        });
        res.json(demandes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== POST – Création d'une demande (responsable) ====================
router.post('/', isResponsable, async (req, res) => {
    try {
        const { id_materiel, quantite, description, urgence, type_panne } = req.body;
        const qty = quantite ? parseInt(quantite) : 1;
        const idMateriel = parseInt(id_materiel);
        const idEtab = req.user.id_etab;

        // 1. Vérifier que le matériel existe
        const materiel = await prisma.materiel.findUnique({
            where: { id_materiel: idMateriel }
        });
        if (!materiel) {
            return res.status(404).json({ error: 'Matériel non trouvé' });
        }

        // 2. Vérifier que le matériel est dans l'établissement
        const stock = await prisma.stockEtablissement.findUnique({
            where: {
                id_etab_id_materiel: {
                    id_etab: idEtab,
                    id_materiel: idMateriel
                }
            }
        });

        if (!stock) {
            return res.status(404).json({ error: 'Matériel non trouvé dans votre établissement' });
        }

        if (qty > stock.quantite) {
            return res.status(400).json({ 
                error: `Quantité insuffisante (disponible: ${stock.quantite})` 
            });
        }

        // 3. ✅ CORRIGÉ : Vérifier qu'il y a assez d'unités EN PANNE
        const etatMateriel = await prisma.etatMateriel.findUnique({
            where: {
                id_materiel_id_etab: {
                    id_materiel: idMateriel,
                    id_etab: idEtab
                }
            }
        });

        if (!etatMateriel) {
            return res.status(400).json({ 
                error: 'Aucun état trouvé pour ce matériel dans votre établissement' 
            });
        }

        // ✅ Vérifier qu'il y a assez d'unités en panne
        if (etatMateriel.en_panne < qty) {
            return res.status(400).json({
                error: `Pas assez d'unités en panne. Disponible: ${etatMateriel.en_panne}, demandé: ${qty}`
            });
        }

        // 4. ✅ NE PAS MODIFIER L'ÉTAT ICI - Les unités sont déjà en panne
        // La demande est créée, l'état reste inchangé

        // 5. Créer la demande
        const demande = await prisma.demandeReparation.create({
            data: {
                id_etab: idEtab,
                id_ri: req.user.id_user,
                id_materiel: idMateriel,
                quantite: qty,
                description,
                urgence: urgence || 'normale',
                type_panne: type_panne || null,
                statut: 'en_attente'
            }
        });

        // 6. Historique
        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: idEtab,
                id_materiel: idMateriel,
                action_type: 'CREATION_DEMANDE',
                entite_type: 'DEMANDE_REPARATION',
                entite_id: demande.id_demande,
                details: `Création d'une demande de réparation pour ${qty} unité(s) du matériel ${materiel.reference} (en panne)`
            }
        });

        res.status(201).json({
            message: 'Demande de réparation créée avec succès',
            demande: demande
        });
    } catch (error) {
        console.error('❌ Erreur création demande:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la création de la demande',
            details: error.message 
        });
    }
});

// ==================== PUT – Modification d'une demande (responsable) ====================
router.put('/:id', isResponsable, async (req, res) => {
    try {
        const { id } = req.params;
        const { description, urgence, type_panne } = req.body;
        const idDemande = parseInt(id);

        const existing = await prisma.demandeReparation.findUnique({
            where: { id_demande: idDemande }
        });
        
        if (!existing) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }
        
        if (existing.id_ri !== req.user.id_user) {
            return res.status(403).json({ error: 'Non autorisé' });
        }
        
        if (existing.statut !== 'en_attente') {
            return res.status(400).json({ error: 'Modification impossible, demande déjà traitée' });
        }

        const updated = await prisma.demandeReparation.update({
            where: { id_demande: idDemande },
            data: { 
                description, 
                urgence, 
                type_panne: type_panne || null 
            }
        });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== PUT – Traitement d'une demande (admin) ====================
router.put('/:id/traiter', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, motif_refus } = req.body;
        const idDemande = parseInt(id);

        // 1. Récupérer la demande
        const demande = await prisma.demandeReparation.findUnique({
            where: { id_demande: idDemande },
            include: { 
                materiel: true, 
                etablissement: true 
            }
        });
        
        if (!demande) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }

        // ✅ Transitions autorisées
        const transitionsAutorisees = {
            'en_attente': ['en_cours', 'rejetee'],
            'en_cours': ['terminee']
        };

        const transitions = transitionsAutorisees[demande.statut];
        if (!transitions || !transitions.includes(statut)) {
            return res.status(400).json({ 
                error: `Transition impossible de "${demande.statut}" vers "${statut}". Transitions autorisées: ${transitions ? transitions.join(', ') : 'aucune'}` 
            });
        }

        const qty = demande.quantite;
        const idMateriel = demande.id_materiel;
        const idEtab = demande.id_etab;

        // 2. Récupérer l'état actuel
        let etatCourant = await prisma.etatMateriel.findUnique({
            where: {
                id_materiel_id_etab: {
                    id_materiel: idMateriel,
                    id_etab: idEtab
                }
            }
        });

        if (!etatCourant) {
            const stock = await prisma.stockEtablissement.findUnique({
                where: {
                    id_etab_id_materiel: {
                        id_etab: idEtab,
                        id_materiel: idMateriel
                    }
                }
            });

            etatCourant = await prisma.etatMateriel.create({
                data: {
                    id_materiel: idMateriel,
                    id_etab: idEtab,
                    en_marche: stock?.quantite || 0,
                    en_panne: 0,
                    en_reparation: 0,
                    commentaire: 'État initial (créé automatiquement)',
                    date_changement: new Date()
                }
            });
        }

        let newEnMarche = etatCourant.en_marche;
        let newEnPanne = etatCourant.en_panne;
        let newEnReparation = etatCourant.en_reparation;
        let actionDetail = '';

        // 3. ✅ CORRIGÉ : Appliquer la transition selon le statut
        switch (statut) {
            case 'en_cours':
                // en_attente → en_cours : panne → réparation
                if (demande.statut === 'en_attente') {
                    if (etatCourant.en_panne < qty) {
                        return res.status(400).json({ 
                            error: `Pas assez d'unités en panne (disponible: ${etatCourant.en_panne})` 
                        });
                    }
                    newEnPanne -= qty;
                    newEnReparation += qty;
                    actionDetail = `${qty} unité(s) passée(s) de panne à réparation`;
                }
                break;
                
            case 'terminee':
                // en_cours → terminee : réparation → marche
                if (demande.statut === 'en_cours') {
                    if (etatCourant.en_reparation < qty) {
                        return res.status(400).json({ 
                            error: `Pas assez d'unités en réparation (disponible: ${etatCourant.en_reparation})` 
                        });
                    }
                    newEnReparation -= qty;
                    newEnMarche += qty;
                    actionDetail = `${qty} unité(s) passée(s) de réparation à marche`;
                }
                break;
                
            case 'rejetee':
                // en_attente → rejetee : panne → rien (reste en panne)
                if (demande.statut === 'en_attente') {
                    // ✅ Les unités restent en panne
                    actionDetail = `Demande rejetée - ${qty} unité(s) restent en panne`;
                }
                break;
                
            default:
                return res.status(400).json({ 
                    error: 'Statut invalide. Utilisez: en_cours, terminee, rejetee' 
                });
        }

        // 4. ✅ Mettre à jour l'état (sauf pour rejetee en_attente)
        if (statut !== 'rejetee' || demande.statut === 'en_cours') {
            await prisma.etatMateriel.update({
                where: {
                    id_materiel_id_etab: {
                        id_materiel: idMateriel,
                        id_etab: idEtab
                    }
                },
                data: {
                    en_marche: newEnMarche,
                    en_panne: newEnPanne,
                    en_reparation: newEnReparation,
                    commentaire: `Demande #${idDemande} - ${statut}${motif_refus ? ' : ' + motif_refus : ''}`,
                    date_changement: new Date()
                }
            });
        }

        // 5. Mettre à jour la demande
        const updatedDemande = await prisma.demandeReparation.update({
            where: { id_demande: idDemande },
            data: {
                statut: statut,
                id_admin: req.user.id_user,
                date_traitement: new Date(),
                motif_refus: motif_refus || null
            }
        });

        // 6. Historique
        await prisma.historiqueActions.create({
            data: {
                date_action: new Date(),
                id_utilisateur: req.user.id_user,
                nom_utilisateur: req.user.nom,
                role_utilisateur: req.user.role,
                id_etab: idEtab,
                id_materiel: idMateriel,
                action_type: 'TRAITEMENT_DEMANDE',
                entite_type: 'DEMANDE_REPARATION',
                entite_id: idDemande,
                details: `Demande #${idDemande} ${statut} - ${actionDetail || motif_refus ? 'Motif: ' + motif_refus : ''}`
            }
        });

        res.json({
            message: `Demande ${statut} avec succès`,
            demande: updatedDemande,
            etat: {
                en_marche: newEnMarche,
                en_panne: newEnPanne,
                en_reparation: newEnReparation
            }
        });
    } catch (error) {
        console.error('❌ Erreur traitement demande:', error);
        res.status(500).json({ 
            error: 'Erreur lors du traitement de la demande',
            details: error.message 
        });
    }
});

// ==================== DELETE – Supprimer une demande ====================
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const idDemande = parseInt(id);

        const demande = await prisma.demandeReparation.findUnique({
            where: { id_demande: idDemande }
        });

        if (!demande) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }

        // Si la demande est en attente, on peut la supprimer sans effet
        // Si elle est en cours, on remet les unités en panne
        if (demande.statut === 'en_cours') {
            const etatCourant = await prisma.etatMateriel.findUnique({
                where: {
                    id_materiel_id_etab: {
                        id_materiel: demande.id_materiel,
                        id_etab: demande.id_etab
                    }
                }
            });

            if (etatCourant) {
                await prisma.etatMateriel.update({
                    where: {
                        id_materiel_id_etab: {
                            id_materiel: demande.id_materiel,
                            id_etab: demande.id_etab
                        }
                    },
                    data: {
                        en_marche: etatCourant.en_marche,
                        en_panne: etatCourant.en_panne + demande.quantite,
                        en_reparation: etatCourant.en_reparation - demande.quantite,
                        commentaire: `Annulation de la demande #${idDemande}`,
                        date_changement: new Date()
                    }
                });
            }
        }

        await prisma.demandeReparation.delete({
            where: { id_demande: idDemande }
        });

        res.json({ message: 'Demande supprimée avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;