import api from './api';
import authService from './authService';

const bergerService = {
  // Tableau de bord du berger
  getDashboard: async () => {
    try {
      console.log('🔍 [bergerService] Fetching dashboard...');
      const response = await api.get('/berger/dashboard');
      console.log('🔍 [bergerService] Dashboard response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [bergerService] Erreur récupération dashboard berger:', error);
      
      // Fallback si l'API échoue
      if (error.response?.status === 404) {
        console.log('⚠️ [bergerService] Dashboard endpoint not found, using fallback');
        return bergerService.getDashboardFallback();
      }
      
      throw error;
    }
  },

  // Fallback pour le dashboard
  getDashboardFallback: async () => {
    try {
      const members = await bergerService.getMembers();
      const service = authService.getServiceAssigne();
      
      const stats = {
        totalMembres: members.membres?.length || 0,
        cetteSemaine: 0,
        aujourdhui: 0
      };
      
      // Calculer les stats basiques
      if (members.membres) {
        const today = new Date().toDateString();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        members.membres.forEach(member => {
          const memberDate = new Date(member.created_at);
          if (memberDate.toDateString() === today) {
            stats.aujourdhui++;
          }
          if (memberDate >= oneWeekAgo) {
            stats.cetteSemaine++;
          }
        });
      }
      
      return {
        success: true,
        service: service,
        stats,
        derniersMembres: members.membres?.slice(0, 10) || []
      };
    } catch (error) {
      console.error('❌ [bergerService] Fallback dashboard failed:', error);
      throw error;
    }
  },

  // Liste des membres du service - CORRIGÉ avec fallback
  getMembers: async () => {
    try {
      console.log('🔍 [bergerService] Fetching members for berger...');
      
      // Vérifier le service assigné
      const user = authService.getCurrentUser();
      const service = user?.service_assigne;
      
      if (!service) {
        console.error('❌ [bergerService] No service assigned to berger');
        throw new Error('Aucun service assigné à ce berger');
      }
      
      console.log(`🔍 [bergerService] Service: "${service}"`);
      
      // Essayer d'abord la route spécifique berger
      try {
        const response = await api.get('/berger/members');
        console.log('🔍 [bergerService] Berger members response:', response.data);
        
        if (response.data.success) {
          return response.data;
        }
      } catch (bergerError) {
        console.log('⚠️ [bergerService] /berger/members failed, trying /members/my-members');
      }
      
      // Fallback: utiliser la route générale
      const response = await api.get('/members/my-members');
      console.log('🔍 [bergerService] Members response (fallback):', response.data);
      
      let result = response.data;
      
      // Si l'API retourne des données, les filtrer par service si nécessaire
      if (result.success && result.membres) {
        // Si le service n'est pas déjà filtré, filtrer côté client
        if (result.service !== service) {
          console.log(`🔍 [bergerService] Filtering client-side for service: "${service}"`);
          const filteredMembers = result.membres.filter(member => {
            if (!member.service) return false;
            
            // Comparaison flexible des services
            const memberService = member.service.toLowerCase().trim();
            const targetService = service.toLowerCase().trim();
            
            return memberService.includes(targetService) || 
                   targetService.includes(memberService) ||
                   memberService === targetService;
          });
          
          console.log(`🔍 [bergerService] Filtered: ${filteredMembers.length} members`);
          
          return {
            ...result,
            membres: filteredMembers,
            service: service,
            total: filteredMembers.length
          };
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ [bergerService] Erreur récupération membres berger:', error);
      
      // Fallback ultime: données mockées
      if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
        console.log('⚠️ [bergerService] Using mock data as last resort');
        return bergerService.getMockMembers();
      }
      
      throw error;
    }
  },

  // Données mockées en dernier recours
  getMockMembers: () => {
    const service = authService.getServiceAssigne() || 'Service inconnu';
    
    return {
      success: true,
      service: service,
      membres: [],
      total: 0,
      stats: {
        totalMembres: 0,
        cetteSemaine: 0,
        aujourdhui: 0
      },
      message: 'Données mockées - Serveur hors ligne'
    };
  },

  // Statistiques
  getStats: async () => {
    try {
      console.log('🔍 [bergerService] Fetching stats...');
      const response = await api.get('/berger/stats');
      console.log('🔍 [bergerService] Stats response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [bergerService] Erreur récupération stats berger:', error);
      
      // Fallback: calculer à partir des membres
      try {
        const members = await bergerService.getMembers();
        const stats = {
          total: members.membres?.length || 0,
          parQuartier: {},
          parMois: {},
          parUtilisateur: {}
        };
        
        if (members.membres) {
          members.membres.forEach(member => {
            // Quartier
            const quartier = member.quartier || 'Non spécifié';
            stats.parQuartier[quartier] = (stats.parQuartier[quartier] || 0) + 1;
            
            // Mois
            const date = new Date(member.created_at);
            const mois = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            stats.parMois[mois] = (stats.parMois[mois] || 0) + 1;
          });
        }
        
        return {
          success: true,
          service: members.service,
          ...stats
        };
      } catch (fallbackError) {
        console.error('❌ [bergerService] Stats fallback also failed:', fallbackError);
        throw error;
      }
    }
  },

  // Export PDF
  exportPDF: async () => {
    try {
      console.log('🔍 [bergerService] Exporting PDF...');
      const response = await api.get('/berger/export/pdf');
      console.log('🔍 [bergerService] PDF export response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [bergerService] Erreur export PDF berger:', error);
      throw error;
    }
  },

  // Nouvelle méthode : Tester la connexion
  testConnection: async () => {
    try {
      console.log('🔍 [bergerService] Testing connection...');
      const response = await api.get('/api/health');
      console.log('🔍 [bergerService] Health response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [bergerService] Erreur test connexion:', error);
      throw error;
    }
  },

  // Vérifier le service du berger
  checkBergerService: () => {
    const user = authService.getCurrentUser();
    const service = user?.service_assigne;
    
    if (!service) {
      console.error('❌ [bergerService] Berger has no assigned service');
      return {
        hasService: false,
        service: null,
        message: 'Aucun service assigné'
      };
    }
    
    console.log(`✅ [bergerService] Berger service: ${service}`);
    return {
      hasService: true,
      service: service,
      message: `Service: ${service}`
    };
  },

  // Synchroniser les données localement
  syncLocalData: (members) => {
    try {
      const service = authService.getServiceAssigne();
      const key = `berger_${service}_members`;
      localStorage.setItem(key, JSON.stringify({
        members: members,
        lastSync: new Date().toISOString(),
        count: members.length
      }));
      console.log(`✅ [bergerService] ${members.length} membres sauvegardés localement`);
      return true;
    } catch (error) {
      console.error('❌ [bergerService] Error syncing local data:', error);
      return false;
    }
  },

  // Récupérer les données locales
  getLocalData: () => {
    try {
      const service = authService.getServiceAssigne();
      const key = `berger_${service}_members`;
      const data = localStorage.getItem(key);
      
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      const lastSync = new Date(parsed.lastSync);
      const now = new Date();
      const hoursDiff = Math.abs(now - lastSync) / 36e5;
      
      // Ne retourner que si les données ont moins de 24h
      if (hoursDiff < 24) {
        console.log(`🔍 [bergerService] Local data found (${parsed.count} members, ${Math.round(hoursDiff)}h ago)`);
        return parsed;
      }
      
      console.log('🔍 [bergerService] Local data too old, ignoring');
      return null;
    } catch (error) {
      console.error('❌ [bergerService] Error getting local data:', error);
      return null;
    }
  }
};

export default bergerService;