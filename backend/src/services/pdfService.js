const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')

// Génération de PDF pour un établissement
const generateEtablissementPDF = async (etablissement, stock) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 })
      const buffers = []
      const filename = `etablissement_${etablissement.id_etab}.pdf`

      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers)
        resolve({ filename, data: pdfData })
      })
      doc.on('error', reject)

      // En-tête
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .text('EDUCMAD', { align: 'center' })
        .moveDown(0.5)

      doc.fontSize(16)
        .text(`Fiche établissement - ${etablissement.nom}`, { align: 'center' })
        .moveDown(1)

      // Informations générales
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Informations générales', { underline: true })
        .moveDown(0.5)

      doc.font('Helvetica')
        .text(`Nom: ${etablissement.nom}`)
        .text(`DREN: ${etablissement.dren || 'Non renseigné'}`)
        .text(`CISCO: ${etablissement.cisco || 'Non renseigné'}`)
        .text(`ZAP: ${etablissement.zap || 'Non renseigné'}`)
        .moveDown(1)

      // Contact direction
      doc.font('Helvetica-Bold')
        .text('Contact direction', { underline: true })
        .moveDown(0.5)

      doc.font('Helvetica')
        .text(`Directeur: ${etablissement.nom_directeur || 'Non renseigné'}`)
        .text(`Contact: ${etablissement.contact_directeur || 'Non renseigné'}`)
        .text(`Email: ${etablissement.email_directeur || 'Non renseigné'}`)
        .moveDown(1)

      // Contact RI
      doc.font('Helvetica-Bold')
        .text('Responsable informatique', { underline: true })
        .moveDown(0.5)

      doc.font('Helvetica')
        .text(`Nom: ${etablissement.nom_responsable_info || 'Non renseigné'}`)
        .text(`Contact: ${etablissement.contact_responsable_info || 'Non renseigné'}`)
        .text(`Email: ${etablissement.email_responsable_info || 'Non renseigné'}`)
        .moveDown(1)

      // Stock
      if (stock && stock.length > 0) {
        doc.font('Helvetica-Bold')
          .text('Stock actuel', { underline: true })
          .moveDown(0.5)

        const tableTop = doc.y
        let currentY = tableTop

        // En-têtes tableau
        doc.font('Helvetica-Bold')
          .text('Matériel', 50, currentY)
          .text('Type', 150, currentY)
          .text('Quantité', 250, currentY)
          .text('État', 320, currentY)

        currentY += 20
        doc.font('Helvetica')

        stock.forEach(item => {
          if (currentY > 700) {
            doc.addPage()
            currentY = 50
          }
          doc.text(item.reference || '-', 50, currentY)
          doc.text(item.type || '-', 150, currentY)
          doc.text(item.quantite.toString(), 250, currentY)
          doc.text(item.etat || '-', 320, currentY)
          currentY += 20
        })
      }

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

// Génération de rapport mensuel PDF
const generateRapportMensuelPDF = async (stats, pannesParMois, topMateriels) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 })
      const buffers = []
      const filename = `rapport_mensuel_${new Date().toISOString().split('T')[0]}.pdf`

      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers)
        resolve({ filename, data: pdfData })
      })
      doc.on('error', reject)

      const date = new Date()
      const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

      // En-tête
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .text('EDUCMAD', { align: 'center' })
        .moveDown(0.5)

      doc.fontSize(16)
        .text(`Rapport mensuel - ${moisNoms[date.getMonth()]} ${date.getFullYear()}`, { align: 'center' })
        .moveDown(1)

      // Statistiques générales
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Statistiques générales', { underline: true })
        .moveDown(0.5)

      doc.font('Helvetica')
        .text(`Total matériels: ${stats.totalMateriels}`)
        .text(`Total établissements: ${stats.totalEtablissements}`)
        .text(`Total utilisateurs: ${stats.totalUtilisateurs}`)
        .text(`Stock central: ${stats.totalStockCentral} unités`)
        .text(`Stock distribué: ${stats.totalStockDistribue} unités`)
        .moveDown(1)

      // Évolution des pannes
      if (pannesParMois && pannesParMois.length > 0) {
        doc.font('Helvetica-Bold')
          .text('Évolution des pannes', { underline: true })
          .moveDown(0.5)

        doc.font('Helvetica')
        pannesParMois.forEach(panne => {
          doc.text(`${panne.mois}: ${panne.count} panne(s)`)
        })
        .moveDown(1)
      }

      // Top matériels
      if (topMateriels && topMateriels.length > 0) {
        doc.font('Helvetica-Bold')
          .text('Top 5 des matériels les plus distribués', { underline: true })
          .moveDown(0.5)

        doc.font('Helvetica')
        topMateriels.forEach((m, index) => {
          doc.text(`${index + 1}. ${m.reference}: ${m.quantite} unités`)
        })
      }

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = {
  generateEtablissementPDF,
  generateRapportMensuelPDF
}