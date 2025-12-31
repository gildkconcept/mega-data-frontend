import api from './api';

const presenceService = {
  // Enregistrer une présence
  recordPresence: async (presenceData) => {
    try {
      const response = await api.post('/presence/record', presenceData);
      return response.data;
    } catch (error) {
      console.error('Erreur enregistrement présence:', error);
      throw error;
    }
  },

  // Récupérer les présences pour une date
  getPresencesByDate: async (date) => {
    try {
      const response = await api.get(`/presence/date/${date}`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération présences:', error);
      throw error;
    }
  },

  // Marquer tous comme présents
  markAllPresent: async (date) => {
    try {
      const response = await api.post('/presence/mark-all', { date });
      return response.data;
    } catch (error) {
      console.error('Erreur marquer tous présents:', error);
      throw error;
    }
  },

  // Générer un rapport PDF
  generatePresenceReport: async (date) => {
    try {
      const response = await api.get(`/presence/report/${date}`);
      return response.data;
    } catch (error) {
      console.error('Erreur génération rapport:', error);
      throw error;
    }
  },

  // Récupérer les statistiques
  getPresenceStats: async (startDate, endDate) => {
    try {
      const response = await api.get('/presence/stats', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      throw error;
    }
  }
};

export default presenceService;