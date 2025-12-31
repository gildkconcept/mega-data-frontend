import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const pdfService = {
  // Générer un PDF pour les utilisateurs
  generateUsersPDF: (users, title = 'Liste des Utilisateurs') => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF('portrait', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const date = new Date().toLocaleDateString('fr-FR');
        const time = new Date().toLocaleTimeString('fr-FR');
        
        // En-tête avec logo
        doc.setFillColor(74, 107, 255); // Bleu primaire
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text('MEGA-DATA ÉGLISE', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text(title, pageWidth / 2, 30, { align: 'center' });
        
        // Informations de génération
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Généré le ${date} à ${time}`, pageWidth / 2, 45, { align: 'center' });
        
        // Statistiques
        const adminCount = users.filter(u => u.role === 'admin').length;
        const memberCount = users.filter(u => u.role === 'member').length;
        
        // Table des utilisateurs
        const headers = [
          ['ID', 'Nom d\'utilisateur', 'Email', 'Nom & Prénom', 'Rôle', 'Date d\'inscription']
        ];
        
        const data = users.map(user => [
          user.id.toString(),
          user.username || 'N/A',
          user.email || 'N/A',
          `${user.nom || ''} ${user.prenom || ''}`.trim(),
          user.role === 'admin' ? 'Administrateur' : 'Membre',
          new Date(user.created_at).toLocaleDateString('fr-FR')
        ]);
        
        // Ajouter la table
        autoTable(doc, {
          head: headers,
          body: data,
          startY: 55,
          theme: 'striped',
          headStyles: {
            fillColor: [138, 43, 226], // Violet
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { top: 55 },
          styles: {
            fontSize: 9,
            cellPadding: 3,
            overflow: 'linebreak',
            halign: 'center'
          },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 30 },
            2: { cellWidth: 45 },
            3: { cellWidth: 40 },
            4: { cellWidth: 25 },
            5: { cellWidth: 30 }
          },
          didDrawPage: function(data) {
            // Pied de page
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
              `Page ${doc.getCurrentPageInfo().pageNumber} - Mega-data Église © ${new Date().getFullYear()}`,
              pageWidth / 2,
              doc.internal.pageSize.height - 10,
              { align: 'center' }
            );
          }
        });
        
        // Ajouter les statistiques
        const finalY = doc.lastAutoTable.finalY || 55;
        
        doc.setFontSize(12);
        doc.setTextColor(74, 107, 255);
        doc.text('Statistiques', 20, finalY + 15);
        
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`• Total utilisateurs: ${users.length}`, 20, finalY + 25);
        doc.text(`• Administrateurs: ${adminCount}`, 20, finalY + 35);
        doc.text(`• Membres: ${memberCount}`, 20, finalY + 45);
        
        // Sauvegarder le PDF
        const filename = `mega-data-utilisateurs-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        
        resolve({ success: true, filename });
      } catch (error) {
        console.error('Erreur lors de la génération du PDF utilisateurs:', error);
        reject({ success: false, error: error.message });
      }
    });
  },

  // Générer un PDF pour les membres
  generateMembersPDF: (members, title = 'Liste des Membres') => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const date = new Date().toLocaleDateString('fr-FR');
        
        // En-tête
        doc.setFillColor(108, 92, 231); // Bleu-violet
        doc.rect(0, 0, pageWidth, 30, 'F');
        
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.text(title, pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Généré le: ${date}`, pageWidth / 2, 35, { align: 'center' });
        
        // Table des membres
        const headers = [
          ['ID', 'Nom', 'Prénom', 'Numéro', 'Quartier', 'Enregistré par', 'Rôle', 'Date']
        ];
        
        const data = members.map(member => [
          member.id.toString(),
          member.nom || 'N/A',
          member.prenom || 'N/A',
          member.numero || 'N/A',
          member.quartier || 'N/A',
          member.username || member.email || 'N/A',
          member.role === 'admin' ? 'Admin' : 'Membre',
          new Date(member.created_at).toLocaleDateString('fr-FR')
        ]);
        
        // Ajouter la table
        autoTable(doc, {
          head: headers,
          body: data,
          startY: 45,
          theme: 'grid',
          headStyles: {
            fillColor: [74, 107, 255],
            textColor: 255,
            fontStyle: 'bold'
          },
          styles: {
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak'
          },
          margin: { top: 45 }
        });
        
        // Statistiques
        const usersMap = {};
        members.forEach(member => {
          const username = member.username || 'Inconnu';
          usersMap[username] = (usersMap[username] || 0) + 1;
        });
        
        const finalY = doc.lastAutoTable.finalY || 45;
        
        doc.setFontSize(12);
        doc.setTextColor(74, 107, 255);
        doc.text('Statistiques', 20, finalY + 15);
        
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`Total membres: ${members.length}`, 20, finalY + 25);
        doc.text(`Enregistrés par ${Object.keys(usersMap).length} utilisateur(s)`, 20, finalY + 35);
        
        // Pied de page
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${i} sur ${pageCount} - Mega-data Église © ${new Date().getFullYear()}`,
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
        
        // Sauvegarder le PDF
        const filename = `mega-data-membres-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        
        resolve({ success: true, filename });
      } catch (error) {
        console.error('Erreur lors de la génération du PDF membres:', error);
        reject({ success: false, error: error.message });
      }
    });
  }
};

export default pdfService;