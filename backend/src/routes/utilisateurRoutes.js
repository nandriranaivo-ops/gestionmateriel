const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../config/database');

// ========== Configuration Multer pour l'upload de photo ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id_user}-${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seules les images sont autorisées'), false);
  }
});

// ========== ROUTES ACCESSIBLES À TOUT UTILISATEUR AUTHENTIFIÉ ==========
// Ces routes sont protégées par `protect` mais PAS par `isAdmin`

// ✅ PUT – Mise à jour de la photo de profil (pour l'utilisateur connecté)
router.put('/photo-profil', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }

    const userId = req.user.id_user;
    const oldUser = await prisma.utilisateur.findUnique({
      where: { id_user: userId }
    });

    if (!oldUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Supprimer l'ancienne photo si ce n'est pas la default
    if (oldUser.photo_profil && oldUser.photo_profil !== 'default-avatar.png') {
      const oldPath = path.join(__dirname, '../../uploads', oldUser.photo_profil);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const updatedUser = await prisma.utilisateur.update({
      where: { id_user: userId },
      data: { photo_profil: req.file.filename }
    });

    // Historique
    await prisma.historiqueActions.create({
      data: {
        date_action: new Date(),
        id_utilisateur: req.user.id_user,
        nom_utilisateur: req.user.nom,
        role_utilisateur: req.user.role,
        id_etab: req.user.id_etab || null,
        id_materiel: null,
        action_type: 'MODIFICATION_PHOTO_PROFIL',
        entite_type: 'UTILISATEUR',
        entite_id: userId,
        details: 'Modification de la photo de profil'
      }
    });

    res.json({
      message: 'Photo mise à jour avec succès',
      photo_profil: req.file.filename
    });
  } catch (error) {
    console.error('❌ Erreur upload photo:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ PUT – Mise à jour du profil (nom, email) pour l'utilisateur connecté
router.put('/profile', protect, async (req, res) => {
  try {
    const userId = req.user.id_user;
    const { nom, email } = req.body;

    // Vérifier l'unicité de l'email si modifié
    if (email) {
      const existing = await prisma.utilisateur.findUnique({
        where: { email }
      });
      if (existing && existing.id_user !== userId) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre utilisateur.' });
      }
    }

    const updatedUser = await prisma.utilisateur.update({
      where: { id_user: userId },
      data: { nom, email }
    });

    // Historique
    await prisma.historiqueActions.create({
      data: {
        date_action: new Date(),
        id_utilisateur: req.user.id_user,
        nom_utilisateur: req.user.nom,
        role_utilisateur: req.user.role,
        id_etab: req.user.id_etab || null,
        id_materiel: null,
        action_type: 'MODIFICATION_PROFIL',
        entite_type: 'UTILISATEUR',
        entite_id: userId,
        details: 'Modification du profil'
      }
    });

    delete updatedUser.password_hash;
    res.json(updatedUser);
  } catch (error) {
    console.error('❌ Erreur modification profil:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ PUT – Changement de mot de passe pour l'utilisateur connecté
router.put('/password', protect, async (req, res) => {
  try {
    const userId = req.user.id_user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis' });
    }

    const user = await prisma.utilisateur.findUnique({
      where: { id_user: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe actuel
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.utilisateur.update({
      where: { id_user: userId },
      data: { password_hash: hashedPassword }
    });

    // Historique
    await prisma.historiqueActions.create({
      data: {
        date_action: new Date(),
        id_utilisateur: req.user.id_user,
        nom_utilisateur: req.user.nom,
        role_utilisateur: req.user.role,
        id_etab: req.user.id_etab || null,
        id_materiel: null,
        action_type: 'CHANGEMENT_MOT_DE_PASSE',
        entite_type: 'UTILISATEUR',
        entite_id: userId,
        details: 'Changement de mot de passe'
      }
    });

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('❌ Erreur changement mot de passe:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ROUTES RÉSERVÉES À L'ADMIN ==========
// Toutes les routes ci-dessous sont protégées par `isAdmin`

router.use(protect);
router.use(isAdmin);

// GET – Liste des utilisateurs
router.get('/', async (req, res) => {
  try {
    const utilisateurs = await prisma.utilisateur.findMany({
      select: {
        id_user: true,
        nom: true,
        email: true,
        role: true,
        id_etab: true,
        actif: true,
        photo_profil: true,
        etablissement: true
      },
      orderBy: { date_creation: 'desc' }
    });
    res.json(utilisateurs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST – Création d'un utilisateur (admin)
router.post('/', async (req, res) => {
  try {
    const { password, ...data } = req.body;

    // Vérifier que l'email n'est pas déjà utilisé
    const existingEmail = await prisma.utilisateur.findUnique({
      where: { email: data.email }
    });
    if (existingEmail) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre utilisateur.' });
    }

    // Si c'est un responsable_etab, vérifier qu'il n'y en a pas déjà un pour l'établissement
    if (data.role === 'responsable_etab' && data.id_etab) {
      const existingRI = await prisma.utilisateur.findFirst({
        where: {
          role: 'responsable_etab',
          id_etab: data.id_etab
        }
      });
      if (existingRI) {
        return res.status(400).json({ error: 'Un responsable existe déjà pour cet établissement.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.utilisateur.create({
      data: {
        ...data,
        password_hash: hashedPassword,
        actif: true,
        date_creation: new Date()
      }
    });

    await prisma.historiqueActions.create({
      data: {
        date_action: new Date(),
        id_utilisateur: req.user.id_user,
        nom_utilisateur: req.user.nom,
        role_utilisateur: req.user.role,
        id_etab: data.id_etab || null,
        id_materiel: null,
        action_type: 'CREATION_UTILISATEUR',
        entite_type: 'UTILISATEUR',
        entite_id: user.id_user,
        details: `Création de l'utilisateur ${user.nom} (${user.role})`
      }
    });

    delete user.password_hash;
    res.status(201).json(user);
  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre utilisateur.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT – Modification d'un utilisateur (admin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { password, ...data } = req.body;
    const userId = parseInt(id);

    const currentUser = await prisma.utilisateur.findUnique({
      where: { id_user: userId }
    });
    if (!currentUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (data.email && data.email !== currentUser.email) {
      const existingEmail = await prisma.utilisateur.findUnique({
        where: { email: data.email }
      });
      if (existingEmail) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre utilisateur.' });
      }
    }

    if (data.role === 'responsable_etab' && data.id_etab) {
      const existingRI = await prisma.utilisateur.findFirst({
        where: {
          role: 'responsable_etab',
          id_etab: data.id_etab,
          id_user: { not: userId }
        }
      });
      if (existingRI) {
        return res.status(400).json({ error: 'Un responsable existe déjà pour cet établissement.' });
      }
    }

    const updateData = { ...data };
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.utilisateur.update({
      where: { id_user: userId },
      data: updateData
    });

    await prisma.historiqueActions.create({
      data: {
        date_action: new Date(),
        id_utilisateur: req.user.id_user,
        nom_utilisateur: req.user.nom,
        role_utilisateur: req.user.role,
        id_etab: data.id_etab || currentUser.id_etab || null,
        id_materiel: null,
        action_type: 'MODIFICATION_UTILISATEUR',
        entite_type: 'UTILISATEUR',
        entite_id: userId,
        details: `Modification de l'utilisateur ${user.nom}`
      }
    });

    delete user.password_hash;
    res.json(user);
  } catch (error) {
    console.error('❌ Erreur modification utilisateur:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre utilisateur.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE – Suppression d'un utilisateur (admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    const user = await prisma.utilisateur.findUnique({
      where: { id_user: userId }
    });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (user.id_user === req.user.id_user) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }

    await prisma.utilisateur.delete({
      where: { id_user: userId }
    });

    await prisma.historiqueActions.create({
      data: {
        date_action: new Date(),
        id_utilisateur: req.user.id_user,
        nom_utilisateur: req.user.nom,
        role_utilisateur: req.user.role,
        id_etab: user.id_etab || null,
        id_materiel: null,
        action_type: 'SUPPRESSION_UTILISATEUR',
        entite_type: 'UTILISATEUR',
        entite_id: userId,
        details: `Suppression de l'utilisateur ${user.nom}`
      }
    });

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;