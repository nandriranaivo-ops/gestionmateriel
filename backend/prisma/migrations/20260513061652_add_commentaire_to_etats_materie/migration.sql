/*
  Warnings:

  - Added the required column `commentaire` to the `etats_materiel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `etats_materiel` ADD COLUMN `commentaire` VARCHAR(191) NOT NULL;
