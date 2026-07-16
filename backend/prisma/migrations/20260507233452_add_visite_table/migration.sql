-- AlterTable
ALTER TABLE `materiels` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `quantite` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `visites` (
    `id_visite` INTEGER NOT NULL AUTO_INCREMENT,
    `id_etab` INTEGER NOT NULL,
    `date_visite` DATETIME(3) NOT NULL,
    `objet` VARCHAR(191) NOT NULL,
    `observations` VARCHAR(191) NULL,
    `rapport` VARCHAR(191) NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'planifiee',
    `date_creation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `visites_id_etab_idx`(`id_etab`),
    PRIMARY KEY (`id_visite`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `visites` ADD CONSTRAINT `visites_id_etab_fkey` FOREIGN KEY (`id_etab`) REFERENCES `etablissements`(`id_etab`) ON DELETE RESTRICT ON UPDATE CASCADE;
