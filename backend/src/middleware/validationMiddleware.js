const Joi = require('joi')

// Validation pour la connexion
const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'responsable').required(),
    etablissementId: Joi.when('role', {
      is: 'responsable',
      then: Joi.number().integer().required(),
      otherwise: Joi.optional()
    })
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    })
  }
  next()
}

// Validation pour la création d'établissement
const validateEtablissement = (req, res, next) => {
  const schema = Joi.object({
    nom: Joi.string().min(3).max(100).required(),
    dren: Joi.string().max(100),
    cisco: Joi.string().max(100),
    zap: Joi.string().max(100),
    nom_directeur: Joi.string().max(100),
    contact_directeur: Joi.string().max(50),
    email_directeur: Joi.string().email(),
    nom_responsable_info: Joi.string().max(100),
    contact_responsable_info: Joi.string().max(50),
    email_responsable_info: Joi.string().email()
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    })
  }
  next()
}

// Validation pour la création de matériel
const validateMateriel = (req, res, next) => {
  const schema = Joi.object({
    id_type: Joi.number().integer().min(1).max(11).required(),
    reference: Joi.string().min(2).max(50).required(),
    quantite: Joi.number().integer().min(1).default(1)
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    })
  }
  next()
}

// Validation pour la création d'utilisateur
const validateUtilisateur = (req, res, next) => {
  const schema = Joi.object({
    nom: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin_educmad', 'responsable_etab').required(),
    id_etab: Joi.when('role', {
      is: 'responsable_etab',
      then: Joi.number().integer().required(),
      otherwise: Joi.optional()
    })
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    })
  }
  next()
}

// Validation pour la demande de réparation
const validateDemandeReparation = (req, res, next) => {
  const schema = Joi.object({
    id_etab: Joi.number().integer().required(),
    id_materiel: Joi.number().integer().required(),
    quantite: Joi.number().integer().min(1).default(1),
    type_panne: Joi.string().valid('materiel', 'logiciel', 'reseau', 'autre'),
    urgence: Joi.string().valid('faible', 'moyenne', 'elevee'),
    description: Joi.string().min(10).required()
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    })
  }
  next()
}

// Validation pour la distribution
const validateDistribution = (req, res, next) => {
  const schema = Joi.object({
    id_materiel: Joi.number().integer().required(),
    id_etab: Joi.number().integer().required(),
    quantite: Joi.number().integer().min(1).required()
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    })
  }
  next()
}

// Validation pour le transfert
const validateTransfert = (req, res, next) => {
  const schema = Joi.object({
    id_materiel: Joi.number().integer().required(),
    id_etab_depart: Joi.number().integer().required(),
    id_etab_arrivee: Joi.number().integer().required(),
    quantite: Joi.number().integer().min(1).required()
  }).custom((value, helpers) => {
    if (value.id_etab_depart === value.id_etab_arrivee) {
      return helpers.error('Les établissements doivent être différents')
    }
    return value
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    })
  }
  next()
}

// Validation pour le changement d'état
const validateChangementEtat = (req, res, next) => {
  const schema = Joi.object({
    id_materiel: Joi.number().integer().required(),
    etat: Joi.string().valid('en marche', 'en panne').required(),
    quantite: Joi.number().integer().min(1).default(1)
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    })
  }
  next()
}

module.exports = {
  validateLogin,
  validateEtablissement,
  validateMateriel,
  validateUtilisateur,
  validateDemandeReparation,
  validateDistribution,
  validateTransfert,
  validateChangementEtat
}