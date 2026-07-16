-- CreateTable
CREATE TABLE `utilisateurs` (
    `id_user` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(30) NOT NULL,
    `id_etab` INTEGER NULL,
    `photo_profil` VARCHAR(255) NOT NULL DEFAULT 'default-avatar.png',
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `date_creation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `derniere_connexion` DATETIME(3) NULL,
    `est_en_ligne` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `utilisateurs_email_key`(`email`),
    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `etablissements` (
    `id_etab` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(100) NOT NULL,
    `dren` VARCHAR(100) NULL,
    `cisco` VARCHAR(100) NULL,
    `zap` VARCHAR(100) NULL,
    `nom_directeur` VARCHAR(100) NULL,
    `contact_directeur` VARCHAR(50) NULL,
    `email_directeur` VARCHAR(100) NULL,
    `nom_responsable_info` VARCHAR(100) NULL,
    `contact_responsable_info` VARCHAR(50) NULL,
    `email_responsable_info` VARCHAR(100) NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `date_creation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_etab`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `types_materiel` (
    `id_type` INTEGER NOT NULL AUTO_INCREMENT,
    `libelle` VARCHAR(50) NOT NULL,
    `prefix` VARCHAR(10) NOT NULL,
    `displayName` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `types_materiel_libelle_key`(`libelle`),
    PRIMARY KEY (`id_type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materiels` (
    `id_materiel` INTEGER NOT NULL AUTO_INCREMENT,
    `id_type` INTEGER NOT NULL,
    `reference` VARCHAR(50) NOT NULL,
    `date_ajout` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `materiels_reference_key`(`reference`),
    PRIMARY KEY (`id_materiel`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_central` (
    `id_stock_central` INTEGER NOT NULL AUTO_INCREMENT,
    `id_materiel` INTEGER NOT NULL,
    `quantite` INTEGER NOT NULL,
    `date_mouvement` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_stock_central`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_etablissements` (
    `id_stock_etab` INTEGER NOT NULL AUTO_INCREMENT,
    `id_etab` INTEGER NOT NULL,
    `id_materiel` INTEGER NOT NULL,
    `quantite` INTEGER NOT NULL,
    `date_reception` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `stock_etablissements_id_etab_id_materiel_key`(`id_etab`, `id_materiel`),
    PRIMARY KEY (`id_stock_etab`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `etats_materiel` (
    `id_etat` INTEGER NOT NULL AUTO_INCREMENT,
    `id_materiel` INTEGER NOT NULL,
    `etat` VARCHAR(20) NOT NULL,
    `date_changement` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `etats_materiel_id_materiel_idx`(`id_materiel`),
    PRIMARY KEY (`id_etat`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accessibilites_materiel` (
    `id_accessibilite` INTEGER NOT NULL AUTO_INCREMENT,
    `id_materiel` INTEGER NOT NULL,
    `accessible` BOOLEAN NOT NULL DEFAULT false,
    `date_changement` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `accessibilites_materiel_id_materiel_idx`(`id_materiel`),
    PRIMARY KEY (`id_accessibilite`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `demandes_reparation` (
    `id_demande` INTEGER NOT NULL AUTO_INCREMENT,
    `id_etab` INTEGER NOT NULL,
    `id_ri` INTEGER NOT NULL,
    `id_materiel` INTEGER NOT NULL,
    `quantite` INTEGER NOT NULL DEFAULT 1,
    `type_panne` VARCHAR(50) NULL,
    `urgence` VARCHAR(20) NULL,
    `description` TEXT NOT NULL,
    `statut` VARCHAR(30) NOT NULL DEFAULT 'en_attente',
    `date_demande` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `date_traitement` DATETIME(3) NULL,
    `id_admin` INTEGER NULL,
    `motif_refus` TEXT NULL,

    INDEX `demandes_reparation_id_etab_idx`(`id_etab`),
    INDEX `demandes_reparation_statut_idx`(`statut`),
    PRIMARY KEY (`id_demande`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historique_actions` (
    `id_historique` INTEGER NOT NULL AUTO_INCREMENT,
    `date_action` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `id_utilisateur` INTEGER NOT NULL,
    `nom_utilisateur` VARCHAR(100) NULL,
    `role_utilisateur` VARCHAR(30) NULL,
    `id_etab` INTEGER NULL,
    `action_type` VARCHAR(50) NOT NULL,
    `entite_type` VARCHAR(50) NOT NULL,
    `entite_id` INTEGER NULL,
    `details` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,

    INDEX `historique_actions_date_action_idx`(`date_action`),
    INDEX `historique_actions_id_utilisateur_idx`(`id_utilisateur`),
    INDEX `historique_actions_action_type_idx`(`action_type`),
    PRIMARY KEY (`id_historique`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_id_etab_fkey` FOREIGN KEY (`id_etab`) REFERENCES `etablissements`(`id_etab`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materiels` ADD CONSTRAINT `materiels_id_type_fkey` FOREIGN KEY (`id_type`) REFERENCES `types_materiel`(`id_type`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_central` ADD CONSTRAINT `stock_central_id_materiel_fkey` FOREIGN KEY (`id_materiel`) REFERENCES `materiels`(`id_materiel`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_etablissements` ADD CONSTRAINT `stock_etablissements_id_etab_fkey` FOREIGN KEY (`id_etab`) REFERENCES `etablissements`(`id_etab`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_etablissements` ADD CONSTRAINT `stock_etablissements_id_materiel_fkey` FOREIGN KEY (`id_materiel`) REFERENCES `materiels`(`id_materiel`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `etats_materiel` ADD CONSTRAINT `etats_materiel_id_materiel_fkey` FOREIGN KEY (`id_materiel`) REFERENCES `materiels`(`id_materiel`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accessibilites_materiel` ADD CONSTRAINT `accessibilites_materiel_id_materiel_fkey` FOREIGN KEY (`id_materiel`) REFERENCES `materiels`(`id_materiel`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demandes_reparation` ADD CONSTRAINT `demandes_reparation_id_etab_fkey` FOREIGN KEY (`id_etab`) REFERENCES `etablissements`(`id_etab`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demandes_reparation` ADD CONSTRAINT `demandes_reparation_id_ri_fkey` FOREIGN KEY (`id_ri`) REFERENCES `utilisateurs`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demandes_reparation` ADD CONSTRAINT `demandes_reparation_id_materiel_fkey` FOREIGN KEY (`id_materiel`) REFERENCES `materiels`(`id_materiel`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demandes_reparation` ADD CONSTRAINT `demandes_reparation_id_admin_fkey` FOREIGN KEY (`id_admin`) REFERENCES `utilisateurs`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historique_actions` ADD CONSTRAINT `historique_actions_id_utilisateur_fkey` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateurs`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historique_actions` ADD CONSTRAINT `historique_actions_id_etab_fkey` FOREIGN KEY (`id_etab`) REFERENCES `etablissements`(`id_etab`) ON DELETE SET NULL ON UPDATE CASCADE;
