import axios from 'axios';

// =============================================
// CONFIGURATION DE L'API
// =============================================

// URLs prioritaires selon l'environnement
const getApiUrl = () => {
  // 1. Variable d'environnement (Vercel)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 2. Backend Railway (production)
  return 'https://web-production-b92a.up.railway.app';
};

const API_URL = getApiUrl();

// Debug configuration
console.log('🔧 Configuration API:', {
  environment: process.env.NODE_ENV,
  apiUrl: API_URL,
  isProduction: process.env.NODE_ENV === 'production',
  appEnv: process.env.REACT_APP_ENV
});

// =============================================
// INSTANCE AXIOS
// =============================================

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 secondes timeout
  timeoutErrorMessage: 'La requête a pris trop de temps. Vérifiez votre connexion.',
  withCredentials: false, // Désactivé car on utilise Bearer token
});

// =============================================
// INTERCEPTEURS REQUEST
// =============================================

api.interceptors.request.use(
  (config) => {
    // Ajout du token JWT
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log détaillé en développement
    if (process.env.NODE_ENV === 'development') {
      console.group(`📤 ${config.method?.toUpperCase()} ${config.url}`);
      console.log('Base URL:', API_URL);
      console.log('Headers:', config.headers);
      if (config.data) {
        console.log('Data:', config.data);
      }
      if (config.params) {
        console.log('Params:', config.params);
      }
      console.groupEnd();
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Erreur configuration requête:', error);
    return Promise.reject(error);
  }
);

// =============================================
// INTERCEPTEURS RESPONSE
// =============================================

api.interceptors.response.use(
  (response) => {
    // Log de succès en développement
    if (process.env.NODE_ENV === 'development') {
      console.group(`📥 ${response.status} ${response.config.url}`);
      console.log('Response:', response.data);
      console.log('Headers:', response.headers);
      console.groupEnd();
    }
    
    return response;
  },
  async (error) => {
    // Log d'erreur détaillé
    console.error('❌ Erreur API:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });
    
    const originalRequest = error.config;
    
    // Erreur 401 - Non autorisé
    if (error.response?.status === 401) {
      console.warn('⚠️ Session expirée ou invalide');
      
      // Nettoyage du localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('service_assigne');
      
      // Notification globale
      window.dispatchEvent(new CustomEvent('auth-expired', {
        detail: { message: 'Votre session a expiré' }
      }));
      
      // Redirection vers login (SPA friendly)
      if (window.location.pathname !== '/login') {
        // Stocker l'URL actuelle pour redirection après login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = '/login?expired=true';
      }
      
      return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'));
    }
    
    // Erreur 403 - Interdit
    if (error.response?.status === 403) {
      console.warn('⛔ Accès interdit');
      window.dispatchEvent(new CustomEvent('access-denied', {
        detail: { message: 'Vous n\'avez pas les permissions nécessaires' }
      }));
      
      return Promise.reject(new Error('Accès interdit. Permissions insuffisantes.'));
    }
    
    // Erreur 404 - Non trouvé
    if (error.response?.status === 404) {
      console.warn('🔍 Ressource non trouvée');
      return Promise.reject(new Error('La ressource demandée n\'existe pas.'));
    }
    
    // Erreur 500 - Serveur
    if (error.response?.status >= 500) {
      console.error('🚨 Erreur serveur');
      window.dispatchEvent(new CustomEvent('server-error', {
        detail: { 
          message: 'Erreur serveur. Veuillez réessayer plus tard.',
          status: error.response?.status 
        }
      }));
      
      return Promise.reject(new Error('Erreur serveur. Notre équipe a été notifiée.'));
    }
    
    // Erreur réseau
    if (!error.response) {
      console.error('🌐 Erreur réseau');
      
      // Vérifier si le backend est accessible
      checkBackendHealth().then(health => {
        if (!health.healthy) {
          window.dispatchEvent(new CustomEvent('backend-offline', {
            detail: { 
              message: 'Serveur temporairement indisponible',
              url: API_URL 
            }
          }));
        }
      });
      
      return Promise.reject(new Error(
        'Impossible de contacter le serveur. Vérifiez votre connexion internet.'
      ));
    }
    
    // Erreur de timeout
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout de la requête');
      return Promise.reject(new Error(
        'La requête a pris trop de temps. Le serveur pourrait être surchargé.'
      ));
    }
    
    // Autres erreurs
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Une erreur est survenue';
    
    return Promise.reject(new Error(errorMessage));
  }
);

// =============================================
// FONCTIONS UTILITAIRES
// =============================================

/**
 * Vérifie la santé du backend
 */
export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/health`, {
      timeout: 5000
    });
    
    return {
      healthy: true,
      data: response.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Backend hors ligne:', error.message);
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Test de connexion complet au backend
 */
export const testBackendConnection = async () => {
  const startTime = Date.now();
  
  try {
    // Test 1: Endpoint health
    const healthResponse = await axios.get(`${API_URL}/api/health`, {
      timeout: 10000
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      data: {
        ...healthResponse.data,
        responseTime: `${responseTime}ms`,
        apiUrl: API_URL,
        environment: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        url: API_URL
      },
      timestamp: new Date().toISOString(),
      suggestion: 'Vérifiez que le backend Railway est en ligne et accessible.'
    };
  }
};

/**
 * Téléchargement de fichiers avec gestion du token
 */
api.downloadFile = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const fullUrl = `${API_URL}${url}`;
  
  console.log('📥 Téléchargement:', fullUrl);
  
  const headers = {
    Authorization: `Bearer ${token}`,
    'Accept': 'application/octet-stream',
    ...options.headers
  };

  try {
    const response = await fetch(fullUrl, {
      headers,
      ...options
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    // Récupérer le nom du fichier depuis les headers
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'download';
    
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+?)"?$/);
      if (match) {
        filename = match[1];
      }
    }

    const blob = await response.blob();
    
    return {
      blob,
      filename,
      size: blob.size,
      type: blob.type
    };
    
  } catch (error) {
    console.error('❌ Erreur téléchargement:', error);
    throw error;
  }
};

/**
 * Upload de fichiers avec progression
 */
api.uploadFile = async (url, file, onProgress = null) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    }
  });
};

/**
 * Fonction helper pour les requêtes GET avec cache optionnel
 */
api.getWithCache = async (url, options = {}) => {
  const cacheKey = `cache_${url}_${JSON.stringify(options.params || {})}`;
  
  // Vérifier le cache si demandé
  if (options.cache && options.cache === true) {
    const cached = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}_time`);
    
    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      const maxAge = options.maxAge || 5 * 60 * 1000; // 5 minutes par défaut
      
      if (age < maxAge) {
        console.log('💾 Utilisation du cache pour:', url);
        return JSON.parse(cached);
      }
    }
  }
  
  // Faire la requête
  const response = await api.get(url, options);
  
  // Mettre en cache si demandé
  if (options.cache && options.cache === true) {
    localStorage.setItem(cacheKey, JSON.stringify(response.data));
    localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
  }
  
  return response.data;
};

/**
 * Clear API cache
 */
api.clearCache = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('cache_')) {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_time`);
    }
  });
  console.log('🧹 Cache API nettoyé');
};

// =============================================
// EXPORT
// =============================================

// Exporter l'URL de l'API pour usage externe
export { API_URL };

// Exporter par défaut l'instance axios
export default api;