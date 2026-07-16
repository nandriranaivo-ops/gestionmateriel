const nodemailer = require('nodemailer')

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// Envoi d'email de bienvenue
const sendWelcomeEmail = async (email, nom, password) => {
  try {
    const mailOptions = {
      from: `"EDUCMAD" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Bienvenue sur EDUCMAD - Gestion de matériel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E3A5F;">Bienvenue sur EDUCMAD</h2>
          <p>Bonjour <strong>${nom}</strong>,</p>
          <p>Votre compte a été créé avec succès sur la plateforme EDUCMAD.</p>
          <p>Voici vos identifiants de connexion :</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Mot de passe temporaire :</strong> ${password}</p>
          </div>
          <p>Nous vous recommandons de changer votre mot de passe lors de votre première connexion.</p>
          <a href="${process.env.FRONTEND_URL}" style="display: inline-block; background-color: #2E5BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Accéder à la plateforme</a>
          <hr style="margin: 30px 0 20px;">
          <p style="color: #666; font-size: 12px;">Cet email est généré automatiquement, merci de ne pas y répondre.</p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log(`Email de bienvenue envoyé à ${email}`)
    return true
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return false
  }
}

// Envoi d'email de réinitialisation de mot de passe
const sendResetPasswordEmail = async (email, nom, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

    const mailOptions = {
      from: `"EDUCMAD" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe - EDUCMAD',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E3A5F;">Réinitialisation de mot de passe</h2>
          <p>Bonjour <strong>${nom}</strong>,</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
          <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #2E5BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Réinitialiser mon mot de passe</a>
          <p>Ce lien expirera dans 1 heure.</p>
          <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          <hr style="margin: 30px 0 20px;">
          <p style="color: #666; font-size: 12px;">Cet email est généré automatiquement, merci de ne pas y répondre.</p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log(`Email de réinitialisation envoyé à ${email}`)
    return true
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return false
  }
}

// Envoi de notification de demande de réparation
const sendDemandeNotification = async (email, nom, demande) => {
  try {
    const mailOptions = {
      from: `"EDUCMAD" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Nouvelle demande de réparation - EDUCMAD',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E3A5F;">Nouvelle demande de réparation</h2>
          <p>Bonjour <strong>${nom}</strong>,</p>
          <p>Une nouvelle demande de réparation a été soumise.</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Matériel :</strong> ${demande.materiel}</p>
            <p><strong>Quantité :</strong> ${demande.quantite}</p>
            <p><strong>Urgence :</strong> ${demande.urgence}</p>
            <p><strong>Description :</strong> ${demande.description}</p>
          </div>
          <a href="${process.env.FRONTEND_URL}/demandes" style="display: inline-block; background-color: #2E5BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir la demande</a>
          <hr style="margin: 30px 0 20px;">
          <p style="color: #666; font-size: 12px;">Cet email est généré automatiquement, merci de ne pas y répondre.</p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log(`Notification de demande envoyée à ${email}`)
    return true
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return false
  }
}

// Envoi de notification de réparation terminée
const sendReparationTermineeEmail = async (email, nom, reparation) => {
  try {
    const mailOptions = {
      from: `"EDUCMAD" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Réparation terminée - EDUCMAD',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E3A5F;">Réparation terminée</h2>
          <p>Bonjour <strong>${nom}</strong>,</p>
          <p>La réparation du matériel suivant a été terminée :</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Matériel :</strong> ${reparation.materiel}</p>
            <p><strong>Quantité :</strong> ${reparation.quantite}</p>
            <p><strong>Durée :</strong> ${reparation.duree_jours} jours</p>
          </div>
          <p>Le matériel est maintenant disponible et fonctionnel.</p>
          <hr style="margin: 30px 0 20px;">
          <p style="color: #666; font-size: 12px;">Cet email est généré automatiquement, merci de ne pas y répondre.</p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log(`Email de réparation terminée envoyé à ${email}`)
    return true
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return false
  }
}

module.exports = {
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendDemandeNotification,
  sendReparationTermineeEmail
}