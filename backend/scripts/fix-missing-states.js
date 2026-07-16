const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAll() {
    const materiels = await prisma.materiel.findMany();

    for (const m of materiels) {
        // 1. Quantité totale = stock central + stock dans les établissements
        const stockCentral = await prisma.stockCentral.findUnique({
            where: { id_materiel: m.id_materiel }
        });
        const qtyCentral = stockCentral?.quantite || 0;

        const stocksEtab = await prisma.stockEtablissement.findMany({
            where: { id_materiel: m.id_materiel }
        });
        const qtyEtab = stocksEtab.reduce((sum, s) => sum + s.quantite, 0);
        const total = qtyCentral + qtyEtab;

        // 2. État du matériel
        const etat = await prisma.etatMateriel.findFirst({
            where: { id_materiel: m.id_materiel },
            orderBy: { date_changement: 'desc' }
        });

        if (etat) {
            // Mise à jour : tout en marche
            await prisma.etatMateriel.update({
                where: { id_etat: etat.id_etat },
                data: {
                    en_marche: total,
                    en_panne: 0,
                    en_reparation: 0,
                    commentaire: 'Correction automatique',
                    date_changement: new Date()
                }
            });
        } else {
            await prisma.etatMateriel.create({
                data: {
                    id_materiel: m.id_materiel,
                    etat: 'en_marche',
                    en_marche: total,
                    en_panne: 0,
                    en_reparation: 0,
                    commentaire: 'État initial corrigé',
                    date_changement: new Date()
                }
            });
        }

        // 3. Accessibilité : tout non connecté par défaut
        const acces = await prisma.accessibiliteMateriel.findFirst({
            where: { id_materiel: m.id_materiel },
            orderBy: { date_changement: 'desc' }
        });

        if (acces) {
            await prisma.accessibiliteMateriel.update({
                where: { id_accessibilite: acces.id_accessibilite },
                data: {
                    connecte: 0,
                    non_connecte: total,
                    commentaire: 'Correction automatique',
                    date_changement: new Date()
                }
            });
        } else {
            await prisma.accessibiliteMateriel.create({
                data: {
                    id_materiel: m.id_materiel,
                    accessible: false,
                    connecte: 0,
                    non_connecte: total,
                    commentaire: 'État initial corrigé',
                    date_changement: new Date()
                }
            });
        }

        console.log(`✅ Matériel ${m.id_materiel} (${m.reference}) : total = ${total}`);
    }

    await prisma.$disconnect();
    console.log('🎉 Correction terminée pour tous les matériels');
}

fixAll().catch(console.error);