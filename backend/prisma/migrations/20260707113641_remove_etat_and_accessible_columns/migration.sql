/*
  Warnings:

  - You are about to drop the column `accessible` on the `accessibilites_materiel` table. All the data in the column will be lost.
  - You are about to drop the column `etat` on the `etats_materiel` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id_materiel,id_etab]` on the table `accessibilites_materiel` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_materiel,id_etab]` on the table `etats_materiel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_etab` to the `accessibilites_materiel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_etab` to the `etats_materiel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `accessibilites_materiel` DROP COLUMN `accessible`,
    ADD COLUMN `id_etab` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `etats_materiel` DROP COLUMN `etat`,
    ADD COLUMN `id_etab` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `accessibilites_materiel_id_etab_idx` ON `accessibilites_materiel`(`id_etab`);

-- CreateIndex
CREATE UNIQUE INDEX `accessibilites_materiel_id_materiel_id_etab_key` ON `accessibilites_materiel`(`id_materiel`, `id_etab`);

-- CreateIndex
CREATE INDEX `etats_materiel_id_etab_idx` ON `etats_materiel`(`id_etab`);

-- CreateIndex
CREATE UNIQUE INDEX `etats_materiel_id_materiel_id_etab_key` ON `etats_materiel`(`id_materiel`, `id_etab`);

-- AddForeignKey
ALTER TABLE `etats_materiel` ADD CONSTRAINT `etats_materiel_id_etab_fkey` FOREIGN KEY (`id_etab`) REFERENCES `etablissements`(`id_etab`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accessibilites_materiel` ADD CONSTRAINT `accessibilites_materiel_id_etab_fkey` FOREIGN KEY (`id_etab`) REFERENCES `etablissements`(`id_etab`) ON DELETE RESTRICT ON UPDATE CASCADE;
