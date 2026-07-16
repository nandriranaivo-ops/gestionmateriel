const path = require('path')
const fs = require('fs')
const prisma = require('../config/database')

// Configuration multer
const multer = require('multer')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profiles')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `profile-${uniqueSuffix}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    cb(null, true)
  } else {
    cb(new Error('Seules les images sont autorisées'))
  }
}

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 2097152 },
  fileFilter
})

// Upload photo de profil
const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier téléchargé' })
    }

    const photoUrl = `/uploads/profiles/${req.file.filename}`

    await prisma.utilisateur.update({
      where: { id_user: req.user.id_user },
      data: { photo_profil: photoUrl }
    })

    await prisma.historiqueActions.create({
      data: {
        date_action: new Date(),
        id_utilisateur: req.user.id_user,
        nom_utilisateur: req.user.nom,
        role_utilisateur: req.user.role,
        id_etab: id_etab || null,
        id_materiel: id_materiel, // ← à renseigner
        action_type: '...',
        entite_type: '...',
        entite_id: '...',
        details: '...'
      }
    })

    res.json({ success: true, photoUrl })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Supprimer photo de profil
const deletePhoto = async (req, res) => {
  try {
    const user = await prisma.utilisateur.findUnique({
      where: { id_user: req.user.id_user }
    })

    if (user.photo_profil && user.photo_profil !== 'default-avatar.png') {
      const filePath = path.join(__dirname, '../../', user.photo_profil)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    await prisma.utilisateur.update({
      where: { id_user: req.user.id_user },
      data: { photo_profil: 'default-avatar.png' }
    })

    res.json({ success: true, message: 'Photo supprimée' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { upload, uploadPhoto, deletePhoto }