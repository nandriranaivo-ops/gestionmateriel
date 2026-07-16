import jsPDF from 'jspdf'

// Export des établissements en PDF
export const exportEtablissementsToPDF = (etablissements) => {
  const doc = new jsPDF('landscape', 'mm', 'a4')
  
  // Titre
  doc.setFontSize(18)
  doc.setTextColor(30, 58, 95)
  doc.text('Liste des établissements - EDUCMAD', 14, 20)
  
  // Date
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Exporté le ${new Date().toLocaleString('fr-FR')}`, 14, 30)
  
  let y = 50
  const colX = [14, 50, 85, 115, 150, 185, 210, 245]
  
  // En-têtes - TOUS LES EN-TÊTES
  doc.setFillColor(30, 58, 95)
  doc.setTextColor(255, 255, 255)
  doc.setFont(undefined, 'bold')
  
  doc.rect(colX[0], y, 32, 8, 'F')
  doc.text('Nom', colX[0] + 2, y + 5)
  doc.rect(colX[1], y, 31, 8, 'F')
  doc.text('DREN', colX[1] + 2, y + 5)
  doc.rect(colX[2], y, 26, 8, 'F')
  doc.text('CISCO', colX[2] + 2, y + 5)
  doc.rect(colX[3], y, 31, 8, 'F')
  doc.text('ZAP', colX[3] + 2, y + 5)
  doc.rect(colX[4], y, 31, 8, 'F')
  doc.text('Directeur', colX[4] + 2, y + 5)
  doc.rect(colX[5], y, 21, 8, 'F')
  doc.text('Contact', colX[5] + 2, y + 5)
  doc.rect(colX[6], y, 31, 8, 'F')
  doc.text('Email', colX[6] + 2, y + 5)
  doc.rect(colX[7], y, 31, 8, 'F')
  doc.text('RI', colX[7] + 2, y + 5)
  
  // Lignes
  doc.setTextColor(0, 0, 0)
  doc.setFont(undefined, 'normal')
  y += 8
  
  for (const etab of etablissements) {
    if (y > 270) {
      doc.addPage()
      y = 20
      doc.setFillColor(30, 58, 95)
      doc.setTextColor(255, 255, 255)
      doc.setFont(undefined, 'bold')
      doc.rect(colX[0], y, 32, 8, 'F')
      doc.text('Nom', colX[0] + 2, y + 5)
      doc.rect(colX[1], y, 31, 8, 'F')
      doc.text('DREN', colX[1] + 2, y + 5)
      doc.rect(colX[2], y, 26, 8, 'F')
      doc.text('CISCO', colX[2] + 2, y + 5)
      doc.rect(colX[3], y, 31, 8, 'F')
      doc.text('ZAP', colX[3] + 2, y + 5)
      doc.rect(colX[4], y, 31, 8, 'F')
      doc.text('Directeur', colX[4] + 2, y + 5)
      doc.rect(colX[5], y, 21, 8, 'F')
      doc.text('Contact', colX[5] + 2, y + 5)
      doc.rect(colX[6], y, 31, 8, 'F')
      doc.text('Email', colX[6] + 2, y + 5)
      doc.rect(colX[7], y, 31, 8, 'F')
      doc.text('RI', colX[7] + 2, y + 5)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      y += 8
    }
    
    doc.text(etab.nom?.substring(0, 20) || '-', colX[0] + 2, y + 4)
    doc.text(etab.dren?.substring(0, 15) || '-', colX[1] + 2, y + 4)
    doc.text(etab.cisco?.substring(0, 12) || '-', colX[2] + 2, y + 4)
    doc.text(etab.zap?.substring(0, 15) || '-', colX[3] + 2, y + 4)
    doc.text(etab.nom_directeur?.substring(0, 20) || '-', colX[4] + 2, y + 4)
    doc.text(etab.contact_directeur?.substring(0, 15) || '-', colX[5] + 2, y + 4)
    doc.text((etab.email_directeur?.substring(0, 20) || '-'), colX[6] + 2, y + 4)
    doc.text(etab.nom_responsable_info?.substring(0, 20) || '-', colX[7] + 2, y + 4)
    y += 6
  }
  
  doc.save(`etablissements_${new Date().toISOString().split('T')[0]}.pdf`)
}

// Export du stock central en PDF
export const exportStockCentralToPDF = (stockCentral, materiels) => {
  const doc = new jsPDF('portrait', 'mm', 'a4')
  
  doc.setFontSize(18)
  doc.setTextColor(30, 58, 95)
  doc.text('Stock Central EDUCMAD', 14, 20)
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Exporté le ${new Date().toLocaleString('fr-FR')}`, 14, 30)
  
  const totalStock = stockCentral.reduce((sum, item) => sum + item.quantite, 0)
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Total unités en stock : ${totalStock}`, 14, 45)
  
  let y = 60
  const colX = [14, 65, 130, 170]
  
  // En-têtes
  doc.setFillColor(30, 58, 95)
  doc.setTextColor(255, 255, 255)
  doc.setFont(undefined, 'bold')
  
  doc.rect(colX[0], y, 48, 8, 'F')
  doc.text('Référence', colX[0] + 2, y + 5)
  doc.rect(colX[1], y, 62, 8, 'F')
  doc.text('Type', colX[1] + 2, y + 5)
  doc.rect(colX[2], y, 37, 8, 'F')
  doc.text('Quantité', colX[2] + 2, y + 5)
  doc.rect(colX[3], y, 37, 8, 'F')
  doc.text('Date ajout', colX[3] + 2, y + 5)
  
  // Lignes
  doc.setTextColor(0, 0, 0)
  doc.setFont(undefined, 'normal')
  y += 8
  
  for (const item of stockCentral) {
    if (y > 270) {
      doc.addPage()
      y = 20
      doc.setFillColor(30, 58, 95)
      doc.setTextColor(255, 255, 255)
      doc.setFont(undefined, 'bold')
      doc.rect(colX[0], y, 48, 8, 'F')
      doc.text('Référence', colX[0] + 2, y + 5)
      doc.rect(colX[1], y, 62, 8, 'F')
      doc.text('Type', colX[1] + 2, y + 5)
      doc.rect(colX[2], y, 37, 8, 'F')
      doc.text('Quantité', colX[2] + 2, y + 5)
      doc.rect(colX[3], y, 37, 8, 'F')
      doc.text('Date ajout', colX[3] + 2, y + 5)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      y += 8
    }
    
    const materiel = materiels.find(m => m.id_materiel === item.id_materiel)
    const typeNom = materiel?.id_type === 1 ? 'Ordinateur Portable' :
                    materiel?.id_type === 2 ? 'Ordinateur Bureau' :
                    materiel?.id_type === 3 ? 'Smartphone' :
                    materiel?.id_type === 4 ? 'Tablette' :
                    materiel?.id_type === 5 ? 'Routeur' :
                    materiel?.id_type === 6 ? 'Switch' :
                    materiel?.id_type === 7 ? 'Serveur' :
                    materiel?.id_type === 8 ? 'Projecteur' : 'Autre'
    
    doc.text(materiel?.reference?.substring(0, 20) || '-', colX[0] + 2, y + 4)
    doc.text(typeNom.substring(0, 20), colX[1] + 2, y + 4)
    doc.text(item.quantite.toString(), colX[2] + 2, y + 4)
    doc.text(materiel?.date_ajout || '-', colX[3] + 2, y + 4)
    y += 6
  }
  
  doc.save(`stock_central_${new Date().toISOString().split('T')[0]}.pdf`)
}

// Export de l'historique en PDF - SANS COLONNE ACTION
export const exportHistoriqueToPDF = (historique) => {
  const doc = new jsPDF('landscape', 'mm', 'a4')
  
  doc.setFontSize(18)
  doc.setTextColor(30, 58, 95)
  doc.text('Historique des actions - EDUCMAD', 14, 20)
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Exporté le ${new Date().toLocaleString('fr-FR')}`, 14, 30)
  
  let y = 50
  const colX = [14, 55, 95, 140, 190]
  
  // En-têtes - TOUS LES EN-TÊTES (SANS COLONNE ACTION)
  doc.setFillColor(30, 58, 95)
  doc.setTextColor(255, 255, 255)
  doc.setFont(undefined, 'bold')
  
  doc.rect(colX[0], y, 38, 8, 'F')
  doc.text('Date', colX[0] + 2, y + 5)
  doc.rect(colX[1], y, 37, 8, 'F')
  doc.text('Utilisateur', colX[1] + 2, y + 5)
  doc.rect(colX[2], y, 42, 8, 'F')
  doc.text("Type d'action", colX[2] + 2, y + 5)
  doc.rect(colX[3], y, 47, 8, 'F')
  doc.text('Établissement', colX[3] + 2, y + 5)
  doc.rect(colX[4], y, 80, 8, 'F')
  doc.text('Détails', colX[4] + 2, y + 5)
  
  // Lignes
  doc.setTextColor(0, 0, 0)
  doc.setFont(undefined, 'normal')
  y += 8
  
  for (const action of historique.slice(0, 100)) {
    if (y > 270) {
      doc.addPage()
      y = 20
      doc.setFillColor(30, 58, 95)
      doc.setTextColor(255, 255, 255)
      doc.setFont(undefined, 'bold')
      doc.rect(colX[0], y, 38, 8, 'F')
      doc.text('Date', colX[0] + 2, y + 5)
      doc.rect(colX[1], y, 37, 8, 'F')
      doc.text('Utilisateur', colX[1] + 2, y + 5)
      doc.rect(colX[2], y, 42, 8, 'F')
      doc.text("Type d'action", colX[2] + 2, y + 5)
      doc.rect(colX[3], y, 47, 8, 'F')
      doc.text('Établissement', colX[3] + 2, y + 5)
      doc.rect(colX[4], y, 80, 8, 'F')
      doc.text('Détails', colX[4] + 2, y + 5)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      y += 8
    }
    
    // Récupérer le nom de l'établissement
    let etablissementNom = 'Tous'
    if (action.id_etab === 'stock_central') {
      etablissementNom = '📦 Stock central'
    } else if (action.id_etab) {
      const etablissements = JSON.parse(localStorage.getItem('gestionmateriel_etablissements') || '[]')
      const etab = etablissements.find(e => e.id_etab === action.id_etab)
      etablissementNom = etab?.nom || 'Tous'
    }
    
    // Libellé de l'action
    const actionLabels = {
      'CREATE': 'Création',
      'UPDATE': 'Modification',
      'DELETE': 'Suppression',
      'DISTRIBUTION': 'Distribution',
      'TRANSFERT': 'Transfert',
      'REPARATION': 'Réparation',
      'CHANGE_ETAT': 'Changement état',
      'CHANGE_ACCESSIBILITE': 'Changement accès'
    }
    const actionLabel = actionLabels[action.action_type] || action.action_type
    
    doc.text(new Date(action.date_action).toLocaleString('fr-FR'), colX[0] + 2, y + 4)
    doc.text((action.nom_utilisateur || '-').substring(0, 20), colX[1] + 2, y + 4)
    doc.text(actionLabel.substring(0, 15), colX[2] + 2, y + 4)
    doc.text(etablissementNom.substring(0, 20), colX[3] + 2, y + 4)
    doc.text((action.details || '-').substring(0, 60), colX[4] + 2, y + 4)
    y += 6
  }
  
  doc.save(`historique_${new Date().toISOString().split('T')[0]}.pdf`)
}