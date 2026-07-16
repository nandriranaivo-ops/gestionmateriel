-- AlterTable
ALTER TABLE `accessibilites_materiel` ADD COLUMN `commentaire` VARCHAR(191) NULL,
    ADD COLUMN `quantite` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `etats_materiel` ADD COLUMN `quantite` INTEGER NOT NULL DEFAULT 1,
    MODIFY `commentaire` VARCHAR(191) NULL;
