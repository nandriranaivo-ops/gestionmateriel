const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', async (req, res) => {
    try {
        const { email, password, role, id_etab } = req.body;
        const user = await prisma.utilisateur.findUnique({
            where: { email },
            include: { etablissement: true }
        });

        if (!user || !user.actif) return res.status(401).json({ message: 'Compte introuvable ou inactif' });

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid || user.role !== role) return res.status(401).json({ message: 'Identifiants ou rôle incorrects' });

        if (role === 'responsable_etab' && user.id_etab !== parseInt(id_etab)) {
            return res.status(401).json({ message: 'Établissement incorrect' });
        }

        await prisma.utilisateur.update({
            where: { id_user: user.id_user },
            data: { derniere_connexion: new Date(), est_en_ligne: true }
        });

        const token = jwt.sign(
            { id: user.id_user, role: user.role }, // ✅ Clé 'id' pour le middleware protect
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const { password_hash: _, ...userWithoutPassword } = user;
        res.json({ token, user: userWithoutPassword });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/logout', protect, async (req, res) => {
    try {
        await prisma.utilisateur.update({ where: { id_user: req.user.id_user }, data: { est_en_ligne: false } });
        res.json({ message: 'Déconnecté' });
    } catch (error) { res.json({ message: 'Déconnecté' }); }
});

router.get('/me', protect, (req, res) => res.json(req.user));

module.exports = router;