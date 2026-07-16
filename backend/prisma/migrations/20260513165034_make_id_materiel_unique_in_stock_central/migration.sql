/*
  Warnings:

  - A unique constraint covering the columns `[id_materiel]` on the table `stock_central` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `stock_central_id_materiel_key` ON `stock_central`(`id_materiel`);
