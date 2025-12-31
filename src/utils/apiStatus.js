// Utilitaire pour gérer l'état de l'API
class ApiStatus {
  constructor() {
    this.offline = false;
    this.lastCheck = null;
    this.listeners = [];
  }

  checkStatus = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
        cache: 'no-cache'
      });
      
      this.offline = !response.ok;
      this.lastCheck = new Date();
      
      this.notifyListeners();
      return !this.offline;
    } catch (error) {
      this.offline = true;
      this.lastCheck = new Date();
      this.notifyListeners();
      return false;
    }
  };

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.offline));
  }

  getStatus() {
    return {
      offline: this.offline,
      lastCheck: this.lastCheck,
      apiUrl: process.env.REACT_APP_API_URL || 'https://web-production-b92a.up.railway.app'
    };
  }
}

// Instance singleton
export const apiStatus = new ApiStatus();

// Vérifier périodiquement l'état de l'API
if (typeof window !== 'undefined') {
  // Vérifier toutes les minutes
  setInterval(() => {
    apiStatus.checkStatus();
  }, 60000);
  
  // Vérifier au chargement
  window.addEventListener('online', () => {
    apiStatus.checkStatus();
  });
  
  window.addEventListener('offline', () => {
    apiStatus.offline = true;
    apiStatus.notifyListeners();
  });
  
  // Vérifier initialement
  setTimeout(() => {
    apiStatus.checkStatus();
  }, 3000);
}