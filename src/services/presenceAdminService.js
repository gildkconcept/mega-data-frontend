// src/services/presenceAdminService.js
import api from './api';

const presenceAdminService = {
  // Récupérer toutes les présences pour une date (super admin)
  getAllPresencesByDate: async (date, service = null) => {
    try {
      console.log(`🔍 [Admin Presence] Fetching presences for ${date}, service: ${service || 'all'}`);
      
      let url = `/admin/presence/date/${date}`;
      if (service && service !== 'tous') {
        url += `?service=${encodeURIComponent(service)}`;
      }
      
      const response = await api.get(url);
      console.log(`✅ [Admin Presence] Received ${response.data?.total || 0} presences`);
      
      return response.data;
    } catch (error) {
      console.error('❌ [Admin Presence] Error fetching presences:', error);
      throw error;
    }
  },

  // Récupérer l'historique des présences d'un membre
  getMemberPresenceHistory: async (memberId) => {
    try {
      console.log(`🔍 [Admin Presence] Fetching history for member ${memberId}`);
      
      const response = await api.get(`/admin/presence/member/${memberId}`);
      console.log(`✅ [Admin Presence] Received ${response.data?.data?.length || 0} history records`);
      
      return response.data;
    } catch (error) {
      console.error('❌ [Admin Presence] Error fetching member history:', error);
      throw error;
    }
  },

  // Statistiques de présence par service
  getPresenceStatsByService: async (startDate, endDate) => {
    try {
      console.log(`🔍 [Admin Presence] Fetching stats from ${startDate} to ${endDate}`);
      
      const response = await api.get('/admin/presence/stats/service', {
        params: { startDate, endDate }
      });
      console.log(`✅ [Admin Presence] Received stats for ${response.data?.total_services || 0} services`);
      
      return response.data;
    } catch (error) {
      console.error('❌ [Admin Presence] Error fetching stats by service:', error);
      throw error;
    }
  },

  // Exporter les présences en PDF (super admin)
  exportPresencesPDF: async (date, service = null) => {
    try {
      console.log(`🔍 [Admin Presence] Exporting PDF for ${date}, service: ${service || 'all'}`);
      
      let url = `/admin/presence/export/pdf/${date}`;
      if (service && service !== 'tous') {
        url += `?service=${encodeURIComponent(service)}`;
      }
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api${url}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      
      // Nom du fichier
      let filename = `presences_${date}`;
      if (service && service !== 'tous') {
        filename += `_${service.replace(/[^a-z0-9]/gi, '_')}`;
      }
      filename += '.pdf';
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);
      
      console.log(`✅ [Admin Presence] PDF exported successfully: ${filename}`);
      
      return { 
        success: true, 
        filename,
        message: 'PDF exporté avec succès' 
      };
    } catch (error) {
      console.error('❌ [Admin Presence] Error exporting PDF:', error);
      
      // Fallback: créer un PDF simple côté client si le serveur échoue
      if (error.message.includes('Failed to fetch')) {
        console.log('⚠️ [Admin Presence] Server unavailable, using client-side fallback');
        return presenceAdminService.generateClientSidePDF(date, service);
      }
      
      throw error;
    }
  },

  // Fallback: générer un PDF côté client
  generateClientSidePDF: async (date, service = null) => {
    try {
      console.log(`🔍 [Admin Presence] Generating client-side PDF for ${date}`);
      
      // Importer jsPDF dynamiquement
      const { jsPDF } = await import('jspdf');
      const autoTable = await import('jspdf-autotable').then(mod => mod.default);
      
      // Récupérer les données
      const data = await presenceAdminService.getAllPresencesByDate(date, service);
      
      if (!data.success || !data.data) {
        throw new Error('No data available');
      }
      
      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // En-tête
      doc.setFillColor(106, 17, 203); // Violet
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text('MEGA-DATA ÉGLISE - RAPPORT DES PRÉSENCES', pageWidth / 2, 20, { align: 'center' });
      
      // Informations
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Date: ${new Date(date).toLocaleDateString('fr-FR')}`, 20, 40);
      doc.text(`Service: ${service || 'Tous les services'}`, 20, 50);
      doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 60);
      doc.text(`Total: ${data.total} membres • Présents: ${data.presents} • Absents: ${data.absents} • Taux: ${data.taux}%`, 20, 70);
      
      // Tableau
      const tableData = data.data.map((row, index) => [
        index + 1,
        `${row.nom} ${row.prenom}`,
        row.service,
        row.quartier,
        row.present ? '✅ Présent' : '❌ Absent',
        row.berger_nom || '-',
        row.commentaire || '-'
      ]);
      
      autoTable(doc, {
        head: [['#', 'Nom & Prénom', 'Service', 'Quartier', 'Statut', 'Berger', 'Commentaire']],
        body: tableData,
        startY: 80,
        theme: 'striped',
        headStyles: {
          fillColor: [74, 107, 255],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak'
        },
        margin: { top: 80 }
      });
      
      // Pied de page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} sur ${pageCount} • Rapport super admin • Mega-data Église`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
      
      // Télécharger
      let filename = `presences_${date}`;
      if (service && service !== 'tous') {
        filename += `_${service.replace(/[^a-z0-9]/gi, '_')}`;
      }
      filename += '_client_generated.pdf';
      
      doc.save(filename);
      
      return {
        success: true,
        filename,
        message: 'PDF généré côté client',
        clientGenerated: true
      };
    } catch (error) {
      console.error('❌ [Admin Presence] Client-side PDF generation failed:', error);
      throw new Error('Échec de génération du PDF');
    }
  },

  // Récupérer les statistiques avancées
  getAdvancedStats: async () => {
    try {
      console.log('🔍 [Admin Presence] Fetching advanced stats');
      
      const response = await api.get('/admin/advanced-stats');
      console.log('✅ [Admin Presence] Received advanced stats');
      
      return response.data;
    } catch (error) {
      console.error('❌ [Admin Presence] Error fetching advanced stats:', error);
      throw error;
    }
  },

  // Tester la connexion au serveur
  testConnection: async () => {
    try {
      const response = await api.get('/api/health');
      return {
        success: true,
        server: 'online',
        version: response.data.version,
        services: response.data.services
      };
    } catch (error) {
      return {
        success: false,
        server: 'offline',
        error: error.message
      };
    }
  },

  // Récupérer les derniers dimanches
  getLastSundays: (count = 4) => {
    const sundays = [];
    const today = new Date();
    
    for (let i = 0; i < count; i++) {
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - (today.getDay() + 7 * i) + 7);
      sundays.push({
        date: sunday.toISOString().split('T')[0],
        label: sunday.toLocaleDateString('fr-FR', { 
          weekday: 'long',
          day: 'numeric',
          month: 'short'
        }),
        fullLabel: sunday.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      });
    }
    
    return sundays;
  },

  // Formatteur de date
  formatDate: (dateString, options = {}) => {
    const date = new Date(dateString);
    const defaults = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    
    return date.toLocaleDateString('fr-FR', { ...defaults, ...options });
  },

  // Calculer les statistiques d'un jeu de données
  calculateStats: (data) => {
    if (!data || !Array.isArray(data)) {
      return { total: 0, presents: 0, absents: 0, taux: 0 };
    }
    
    const total = data.length;
    const presents = data.filter(item => item.present).length;
    const absents = total - presents;
    const taux = total > 0 ? Math.round((presents / total) * 100) : 0;
    
    return { total, presents, absents, taux };
  }
};

export default presenceAdminService;