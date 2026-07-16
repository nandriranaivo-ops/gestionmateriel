const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' })
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Rôle ${req.user.role} non autorisé. Requis: ${roles.join(', ')}` 
      })
    }
    
    next()
  }
}

const isAdmin = checkRole(['admin_educmad'])
const isResponsable = checkRole(['responsable_etab'])
const isAdminOrResponsable = checkRole(['admin_educmad', 'responsable_etab'])

module.exports = { checkRole, isAdmin, isResponsable, isAdminOrResponsable }