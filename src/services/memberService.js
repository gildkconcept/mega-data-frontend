import api from './api';
import authService from './authService';

const memberService = {
  // Créer un nouveau membre (avec service)
  createMember: async (memberData) => {
    try {
      console.log('🔍 [memberService] Creating member:', memberData);
      const response = await api.post('/members', memberData);
      console.log('🔍 [memberService] Create response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [memberService] Erreur création membre:', error);
      throw error;
    }
  },

  // Récupérer les membres de l'utilisateur connecté
  getMyMembers: async () => {
    try {
      console.log('🔍 [memberService] Fetching my members...');
      const response = await api.get('/members/my-members');
      console.log('🔍 [memberService] My members response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [memberService] Erreur récupération membres:', error);
      
      // Fallback: données locales pour les bergers
      const user = authService.getCurrentUser();
      if (user?.role === 'berger') {
        const localData = memberService.getLocalMembers();
        if (localData) {
          console.log('⚠️ [memberService] Using local data as fallback');
          return localData;
        }
      }
      
      throw error;
    }
  },

  // NOUVELLE FONCTION : Récupérer les membres (alias pour compatibilité)
  getMembers: async () => {
    try {
      console.log('🔍 [memberService] Fetching members...');
      const response = await api.get('/members/my-members');
      console.log('🔍 [memberService] Members response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [memberService] Erreur récupération membres (getMembers):', error);
      throw error;
    }
  },

  // Récupérer tous les membres (admin)
  getAllMembers: async () => {
    try {
      console.log('🔍 [memberService] Fetching all members...');
      const response = await api.get('/members/all');
      console.log('🔍 [memberService] All members response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [memberService] Erreur récupération tous membres:', error);
      throw error;
    }
  },

  // Récupérer tous les utilisateurs (admin)
  getAllUsers: async () => {
    try {
      console.log('🔍 [memberService] Fetching all users...');
      const response = await api.get('/members/users');
      console.log('🔍 [memberService] All users response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [memberService] Erreur récupération utilisateurs:', error);
      throw error;
    }
  },

  // Supprimer un membre (admin)
  deleteMember: async (memberId) => {
    try {
      console.log(`🔍 [memberService] Deleting member ${memberId}...`);
      const response = await api.delete(`/members/${memberId}`);
      console.log('🔍 [memberService] Delete member response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [memberService] Erreur suppression membre:', error);
      throw error;
    }
  },

  // Supprimer un utilisateur (admin)
  deleteUser: async (userId) => {
    try {
      console.log(`🔍 [memberService] Deleting user ${userId}...`);
      const response = await api.delete(`/members/users/${userId}`);
      console.log('🔍 [memberService] Delete user response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [memberService] Erreur suppression utilisateur:', error);
      throw error;
    }
  },

  // Mettre à jour le rôle d'un utilisateur (admin)
  updateUserRole: async (userId, role) => {
    try {
      console.log(`🔍 [memberService] Updating user ${userId} role to ${role}...`);
      const response = await api.put(`/members/users/${userId}/role`, { role });
      console.log('🔍 [memberService] Update role response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [memberService] Erreur mise à jour rôle:', error);
      throw error;
    }
  },

  // Récupérer les membres pour un berger spécifique
  getMembersForBerger: async () => {
    try {
      console.log('🔍 [memberService] Fetching members for berger...');
      
      // Essayer d'abord la route spécifique
      try {
        const response = await api.get('/berger/members');
        console.log('🔍 [memberService] Berger members response:', response.data);
        return response.data;
      } catch (error) {
        console.log('⚠️ [memberService] Berger route failed, using fallback');
      }
      
      // Fallback: utiliser la route générale
      const response = await api.get('/members/my-members');
      console.log('🔍 [memberService] Berger fallback response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [memberService] Erreur récupération membres berger:', error);
      throw error;
    }
  },

  // Rechercher des membres
  searchMembers: async (query, service) => {
    try {
      console.log(`🔍 [memberService] Searching members: query="${query}", service="${service}"`);
      const params = {};
      if (query) params.query = query;
      if (service) params.service = service;
      
      const response = await api.get('/members/search', { params });
      console.log('🔍 [memberService] Search response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [memberService] Erreur recherche membres:', error);
      throw error;
    }
  },

  // Générer PDF des membres (CORRIGÉ : pas de récursion)
  generateMembersPDF: async () => {
    try {
      console.log('🔍 [memberService] Generating members PDF...');
      
      // Vérifier que l'utilisateur est authentifié
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('Non authentifié');
      }

      let response;
      let result;
      
      // Récupérer les données selon le rôle
      if (user.role === 'admin' || user.role === 'super_admin') {
        response = await api.get('/members/all');
      } else {
        response = await api.get('/members/my-members');
      }
      
      result = response.data;
      
      if (!result.success || !result.membres) {
        return {
          success: false,
          message: result.message || 'Erreur récupération des données'
        };
      }
      
      // Vérifier si jsPDF est disponible
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return {
          success: false,
          message: 'Navigateur non détecté'
        };
      }
      
      // Importer jsPDF dynamiquement
      const { jsPDF } = await import('jspdf');
      const autoTable = await import('jspdf-autotable').then(mod => mod.default);
      
      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // En-tête
      doc.setFontSize(24);
      doc.setTextColor(106, 17, 203);
      doc.text('MEGA-DATA ÉGLISE', pageWidth / 2, 20, { align: 'center' });
      
      // Titre selon le rôle
      const titre = user.role === 'admin' || user.role === 'super_admin'
        ? 'LISTE COMPLÈTE DES MEMBRES'
        : 'MES MEMBRES';
      
      doc.setFontSize(18);
      doc.text(titre, pageWidth / 2, 30, { align: 'center' });
      
      // Informations
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 45);
      doc.text(`Total: ${result.membres.length} membres`, 20, 52);
      doc.text(`Généré par: ${user.username} (${user.role})`, 20, 59);
      
      // Tableau avec autotable
      const headers = [['ID', 'Nom', 'Prénom', 'Téléphone', 'Quartier', 'Service', 'Date inscription']];
      
      const data = result.membres.map(member => [
        member.id.toString(),
        member.nom || '-',
        member.prenom || '-',
        member.numero || '-',
        member.quartier || '-',
        member.service || '-',
        new Date(member.created_at).toLocaleDateString('fr-FR')
      ]);
      
      autoTable(doc, {
        head: headers,
        body: data,
        startY: 65,
        theme: 'striped',
        headStyles: {
          fillColor: [106, 17, 203],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        margin: { top: 65 }
      });
      
      // Pied de page
      const finalY = doc.lastAutoTable.finalY || 65;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Document généré le ${new Date().toLocaleDateString('fr-FR')} • Mega-data Église • Page 1/1`,
        pageWidth / 2,
        finalY + 20,
        { align: 'center' }
      );
      
      const filename = user.role === 'admin' || user.role === 'super_admin'
        ? `mega-data-tous-membres-${new Date().toISOString().split('T')[0]}.pdf`
        : `mega-data-mes-membres-${new Date().toISOString().split('T')[0]}.pdf`;
      
      doc.save(filename);
      
      console.log(`✅ [memberService] PDF generated: ${filename}`);
      
      return {
        success: true,
        message: 'PDF généré avec succès',
        filename: filename
      };
    } catch (error) {
      console.error('❌ [memberService] Erreur génération PDF membres:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la génération du PDF'
      };
    }
  },

  // Générer PDF avec filtres - CORRIGÉ
  generateFilteredMembersPDF: async (filters = {}) => {
    try {
      console.log('🔍 [memberService] Generating filtered PDF with filters:', filters);
      
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('Non authentifié');
      }

      let response;
      let result;
      
      if (user.role === 'admin' || user.role === 'super_admin') {
        response = await api.get('/members/all');
      } else {
        response = await api.get('/members/my-members');
      }
      
      result = response.data;
      
      if (!result.success || !result.membres) {
        return {
          success: false,
          message: result.message || 'Erreur récupération des données'
        };
      }

      // Appliquer les filtres
      let filteredMembers = [...result.membres];

      // Filtre par date
      if (filters.dateDebut && filters.dateFin) {
        const debut = new Date(filters.dateDebut);
        const fin = new Date(filters.dateFin);
        fin.setHours(23, 59, 59, 999);

        filteredMembers = filteredMembers.filter(member => {
          const memberDate = new Date(member.created_at);
          return memberDate >= debut && memberDate <= fin;
        });
      }

      // Filtre par quartier
      if (filters.quartier && filters.quartier !== 'tous') {
        filteredMembers = filteredMembers.filter(member =>
          member.quartier && member.quartier.toLowerCase().includes(filters.quartier.toLowerCase())
        );
      }

      // Filtre par service
      if (filters.service && filters.service !== 'tous') {
        filteredMembers = filteredMembers.filter(member =>
          member.service && member.service.toLowerCase().includes(filters.service.toLowerCase())
        );
      }

      if (filteredMembers.length === 0) {
        return {
          success: false,
          message: 'Aucun membre trouvé avec les critères sélectionnés'
        };
      }

      // Vérifier si jsPDF est disponible
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return {
          success: false,
          message: 'Navigateur non détecté'
        };
      }

      // Importer jsPDF dynamiquement
      const { jsPDF } = await import('jspdf');
      const autoTable = await import('jspdf-autotable').then(mod => mod.default);
      
      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // En-tête avec filtres
      doc.setFontSize(24);
      doc.setTextColor(106, 17, 203);
      doc.text('MEGA-DATA ÉGLISE', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text('RAPPORT FILTRÉ DES MEMBRES', pageWidth / 2, 30, { align: 'center' });
      
      // Informations sur les filtres
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      
      let y = 45;
      doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, y);
      y += 7;
      doc.text(`Total filtré: ${filteredMembers.length} membres`, 20, y);
      y += 7;
      doc.text(`Généré par: ${user.username} (${user.role})`, 20, y);
      y += 10;

      // Afficher les filtres appliqués
      if (filters.dateDebut && filters.dateFin) {
        doc.text(`Période: ${new Date(filters.dateDebut).toLocaleDateString('fr-FR')} au ${new Date(filters.dateFin).toLocaleDateString('fr-FR')}`, 20, y);
        y += 7;
      }

      if (filters.quartier && filters.quartier !== 'tous') {
        doc.text(`Quartier: ${filters.quartier}`, 20, y);
        y += 7;
      }

      if (filters.service && filters.service !== 'tous') {
        doc.text(`Service: ${filters.service}`, 20, y);
        y += 7;
      }

      // Tableau
      const headers = [['ID', 'Nom', 'Prénom', 'Téléphone', 'Quartier', 'Service', 'Date inscription']];
      
      const data = filteredMembers.map(member => [
        member.id.toString(),
        member.nom || '-',
        member.prenom || '-',
        member.numero || '-',
        member.quartier || '-',
        member.service || '-',
        new Date(member.created_at).toLocaleDateString('fr-FR')
      ]);
      
      autoTable(doc, {
        head: headers,
        body: data,
        startY: y + 10,
        theme: 'striped',
        headStyles: {
          fillColor: [37, 117, 252],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        margin: { top: y + 10 }
      });
      
      // Pied de page
      const finalY = doc.lastAutoTable.finalY || y + 10;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Document filtré • Mega-data Église • Page 1/1`,
        pageWidth / 2,
        finalY + 20,
        { align: 'center' }
      );
      
      // Nom du fichier avec filtres
      let filename = 'mega-data-membres-filtres';
      if (filters.dateDebut && filters.dateFin) {
        filename += `_${filters.dateDebut}_${filters.dateFin}`;
      }
      if (filters.quartier && filters.quartier !== 'tous') {
        filename += `_${filters.quartier.replace(/[^a-z0-9]/gi, '_')}`;
      }
      if (filters.service && filters.service !== 'tous') {
        filename += `_${filters.service.replace(/[^a-z0-9]/gi, '_')}`;
      }
      filename += `_${new Date().toISOString().split('T')[0]}.pdf`;
      
      doc.save(filename);
      
      console.log(`✅ [memberService] Filtered PDF generated: ${filename}`);
      
      return {
        success: true,
        message: 'PDF filtré généré avec succès',
        filename: filename,
        count: filteredMembers.length
      };
    } catch (error) {
      console.error('❌ [memberService] Erreur génération PDF filtré:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la génération du PDF filtré'
      };
    }
  },

  // Récupérer la liste des quartiers et services uniques
  getUniqueFilters: async () => {
    try {
      console.log('🔍 [memberService] Getting unique filters...');
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Non authentifié');

      let response;
      
      if (user.role === 'admin' || user.role === 'super_admin') {
        response = await api.get('/members/all');
      } else {
        response = await api.get('/members/my-members');
      }
      
      const result = response.data;
      
      if (!result.success || !result.membres) {
        return { success: false, message: result.message };
      }

      // Extraire les quartiers uniques
      const quartiers = [...new Set(result.membres
        .map(m => m.quartier)
        .filter(q => q && q.trim() !== '')
        .sort())];

      // Extraire les services uniques
      const services = [...new Set(result.membres
        .map(m => m.service)
        .filter(s => s && s.trim() !== '')
        .sort())];

      console.log(`🔍 [memberService] Unique filters: ${quartiers.length} quartiers, ${services.length} services`);
      
      return {
        success: true,
        quartiers,
        services
      };
    } catch (error) {
      console.error('❌ [memberService] Erreur récupération filtres:', error);
      return {
        success: false,
        message: error.message || 'Erreur récupération filtres'
      };
    }
  },

  // Générer PDF des utilisateurs
  generateUsersPDF: async () => {
    try {
      console.log('🔍 [memberService] Generating users PDF...');
      
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('Non authentifié');
      }

      const response = await api.get('/members/users');
      const result = response.data;
      
      if (!result.success || !result.users) {
        return {
          success: false,
          message: result.message || 'Erreur récupération des utilisateurs'
        };
      }
      
      // Vérifier si jsPDF est disponible
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return {
          success: false,
          message: 'Navigateur non détecté'
        };
      }
      
      // Importer jsPDF dynamiquement
      const { jsPDF } = await import('jspdf');
      const autoTable = await import('jspdf-autotable').then(mod => mod.default);
      
      const doc = new jsPDF('portrait');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // En-tête
      doc.setFontSize(24);
      doc.setTextColor(106, 17, 203);
      doc.text('MEGA-DATA ÉGLISE', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(18);
      doc.text('LISTE DES UTILISATEURS', pageWidth / 2, 30, { align: 'center' });
      
      // Informations
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 45);
      doc.text(`Total: ${result.users.length} utilisateurs`, 20, 52);
      doc.text(`Généré par: ${user.username} (${user.role})`, 20, 59);
      
      // Tableau
      const headers = [['ID', 'Nom d\'utilisateur', 'Nom & Prénom', 'Branche', 'Rôle', 'Service', 'Date inscription']];
      
      const data = result.users.map(user => [
        user.id.toString(),
        user.username || '-',
        `${user.prenom || ''} ${user.nom || ''}`.trim() || '-',
        user.branche || '-',
        user.role === 'admin' ? 'Administrateur' : user.role === 'berger' ? 'Berger' : 'Membre',
        user.service_assigne || '-',
        new Date(user.created_at).toLocaleDateString('fr-FR')
      ]);
      
      autoTable(doc, {
        head: headers,
        body: data,
        startY: 65,
        theme: 'striped',
        headStyles: {
          fillColor: [106, 17, 203],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        margin: { top: 65 }
      });
      
      // Statistiques
      const finalY = doc.lastAutoTable.finalY || 65;
      const adminCount = result.users.filter(u => u.role === 'admin').length;
      const bergerCount = result.users.filter(u => u.role === 'berger').length;
      const memberCount = result.users.filter(u => u.role === 'member').length;
      
      doc.setFontSize(10);
      doc.setTextColor(106, 17, 203);
      doc.text('Statistiques:', 20, finalY + 15);
      
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`• Administrateurs: ${adminCount}`, 25, finalY + 25);
      doc.text(`• Bergers: ${bergerCount}`, 25, finalY + 33);
      doc.text(`• Membres: ${memberCount}`, 25, finalY + 41);
      
      // Pied de page
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Document généré le ${new Date().toLocaleDateString('fr-FR')} • Mega-data Église • Page 1/1`,
        pageWidth / 2,
        doc.internal.pageSize.height - 20,
        { align: 'center' }
      );
      
      const filename = `mega-data-utilisateurs-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      console.log(`✅ [memberService] Users PDF generated: ${filename}`);
      
      return {
        success: true,
        message: 'PDF généré avec succès',
        filename: filename
      };
    } catch (error) {
      console.error('❌ [memberService] Erreur génération PDF utilisateurs:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la génération du PDF'
      };
    }
  },

  // Gestion des données locales (fallback)
  getLocalMembers: () => {
    try {
      const user = authService.getCurrentUser();
      if (!user) return null;
      
      const key = `local_members_${user.id}`;
      const data = localStorage.getItem(key);
      
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      if (new Date(parsed.timestamp) > oneDayAgo) {
        console.log('🔍 [memberService] Using local members data');
        return parsed.data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [memberService] Error getting local members:', error);
      return null;
    }
  },

  saveLocalMembers: (members) => {
    try {
      const user = authService.getCurrentUser();
      if (!user) return false;
      
      const key = `local_members_${user.id}`;
      const data = {
        data: members,
        timestamp: new Date().toISOString(),
        count: members.length
      };
      
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`✅ [memberService] ${members.length} members saved locally`);
      return true;
    } catch (error) {
      console.error('❌ [memberService] Error saving local members:', error);
      return false;
    }
  },

  // Synchroniser avec le serveur
  syncWithServer: async () => {
    try {
      console.log('🔍 [memberService] Syncing with server...');
      
      const localMembers = memberService.getLocalMembers();
      if (!localMembers || !localMembers.success) {
        console.log('ℹ️ [memberService] No local data to sync');
        return { success: true, message: 'Aucune donnée locale à synchroniser' };
      }
      
      // Ici, tu pourrais implémenter la logique de synchronisation
      // Pour l'instant, on retourne juste un succès
      console.log(`🔍 [memberService] Would sync ${localMembers.membres?.length || 0} members`);
      
      return {
        success: true,
        message: 'Synchronisation simulée',
        localCount: localMembers.membres?.length || 0
      };
    } catch (error) {
      console.error('❌ [memberService] Sync error:', error);
      return {
        success: false,
        message: 'Erreur de synchronisation'
      };
    }
  }
};

export default memberService;