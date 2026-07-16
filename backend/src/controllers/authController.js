const prisma = require('../config/database')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// --- LOGIN ---
const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.utilisateur.findUnique({ where: { email } })

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Identifiants invalides' })
    }

    const token = jwt.sign(
      { id: user.id_user, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: { id: user.id_user, nom: user.nom, role: user.role }
    })
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// --- LOGOUT ---
const logout = async (req, res) => {
  try {
    // Si tu gères les sessions en ligne dans ta BDD
    if (req.user) {
      await prisma.utilisateur.update({
        where: { id_user: req.user.id_user },
        data: { est_en_ligne: false }
      })
    }
    res.json({ message: 'Déconnexion réussie' })
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la déconnexion' })
  }
}

// --- REFRESH TOKEN (Optionnel ou Basique) ---
const refreshToken = async (req, res) => {
  try {
    // On génère simplement un nouveau token pour l'utilisateur actuel
    const newToken = jwt.sign(
      { id: req.user.id_user, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )
    res.json({ token: newToken })
  } catch (error) {
    res.status(500).json({ message: 'Erreur refresh token' })
  }
}

// ON EXPORTE LES TROIS FONCTIONS
module.exports = { login, logout, refreshToken }