/*
  Warnings:

  - A unique constraint covering the columns `[id_user]` on the table `utilisateurs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX `stock_central_id_materiel_fkey` ON `stock_central`(`id_materiel`);

-- CreateIndex
CREATE UNIQUE INDEX `utilisateurs_id_user_key` ON `utilisateurs`(`id_user`);
