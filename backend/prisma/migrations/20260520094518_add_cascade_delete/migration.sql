/*
  Warnings:

  - You are about to drop the column `quantite` on the `accessibilites_materiel` table. All the data in the column will be lost.
  - You are about to drop the column `quantite` on the `etats_materiel` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `accessibilites_materiel` DROP FOREIGN KEY `accessibilites_materiel_id_materiel_fkey`;

-- DropForeignKey
ALTER TABLE `demandes_reparation` DROP FOREIGN KEY `demandes_reparation_id_materiel_fkey`;

-- DropForeignKey
ALTER TABLE `etats_materiel` DROP FOREIGN KEY `etats_materiel_id_materiel_fkey`;

-- DropForeignKey
ALTER TABLE `stock_central` DROP FOREIGN KEY `stock_central_id_materiel_fkey`;

-- DropForeignKey
ALTER TABLE `stock_etablissements` DROP FOREIGN KEY `stock_etablissements_id_materiel_fkey`;

-- AlterTable
ALTER TABLE `accessibilites_materiel` DROP COLUMN `quantite`,
    ADD COLUMN `connecte` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `non_connecte` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `demandes_reparation` MODIFY `quantite` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `etats_materiel` DROP COLUMN `quantite`,
    ADD COLUMN `en_marche` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `en_panne` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `en_reparation` INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE `stock_central` ADD CONSTRAINT `stock_central_id_materiel_fkey` FOREIGN KEY (`id_materiel`) REFERENCES `materiels`(`id_materiel`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_etablissements` ADD CONSTRAINT `stock_etablissements_id_materiel_fkey` FOREIGN KEY (`id_materiel`) REFERENCES `materiels`(`id_materiel`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `etats_materiel` ADD CONSTRAINT `etats_materiel_id_materiel_fkey` FOREIGN KEY (`id_materiel`) REFERENCES `materiels`(`id_materiel`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accessibilites_materiel` ADD CONSTRAINT `accessibilites_materiel_id_materiel_fkey` FOREIGN KEY (`id_materiel`) REFERENCES `materiels`(`id_materiel`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demandes_reparation` ADD CONSTRAINT `demandes_reparation_id_materiel_fkey` FOREIGN KEY (`id_materiel`) REFERENCES `materiels`(`id_materiel`) ON DELETE CASCADE ON UPDATE CASCADE;
