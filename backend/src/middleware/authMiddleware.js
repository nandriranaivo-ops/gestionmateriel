const jwt = require('jsonwebtoken')
const prisma = require('../config/database')

/**
 * 1. PROTECTION - Vérifie si l'utilisateur est connecté via le Token
 * Conforme à ton authController (qui utilise 'id' dans le token)
 */
const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.startsWith('Bearer') 
                ? req.headers.authorization.split(' ')[1] 
                : null;

    if (!token) return res.status(401).json({ message: 'Accès refusé - Token manquant' });

    // On décode le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // On cherche l'utilisateur dans la base avec l'ID du token
    const user = await prisma.utilisateur.findUnique({
      where: { id_user: decoded.id } 
    });

    if (!user || !user.actif) {
      return res.status(401).json({ message: 'Utilisateur non trouvé ou compte inactif' });
    }

    // On attache l'utilisateur complet à la requête (req.user)
    req.user = user; 
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Session expirée ou token invalide' });
  }
}

/**
 * 2. RESTRICTION - Vérifie si le rôle de l'utilisateur est autorisé
 * Prend un ou plusieurs rôles en paramètres : restrictTo('admin', 'responsable')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user est rempli par le middleware 'protect' juste avant
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Accès interdit - Rôle ${req.user.role} non autorisé. Requis: ${roles.join(', ')}` 
      });
    }
    next();
  }
}

// 3. RACCOURCIS (Pour garder la lisibilité dans tes routes)
const isAdmin = restrictTo('admin_educmad');
const isResponsable = restrictTo('responsable_etab');
const isAdminOrResponsable = restrictTo('admin_educmad', 'responsable_etab');

module.exports = { 
  protect, 
  restrictTo, 
  isAdmin, 
  isResponsable, 
  isAdminOrResponsable 
};