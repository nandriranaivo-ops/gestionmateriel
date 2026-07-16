-- AlterTable
ALTER TABLE `historique_actions` ADD COLUMN `id_materiel` INTEGER NULL;

-- CreateIndex
CREATE INDEX `historique_actions_id_materiel_idx` ON `historique_actions`(`id_materiel`);

-- AddForeignKey
ALTER TABLE `historique_actions` ADD CONSTRAINT `historique_actions_id_materiel_fkey` FOREIGN KEY (`id_materiel`) REFERENCES `materiels`(`id_materiel`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `historique_actions` RENAME INDEX `historique_actions_id_etab_fkey` TO `historique_actions_id_etab_idx`;
