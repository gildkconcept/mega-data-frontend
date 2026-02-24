// frontend/src/services/api.js
import axios from 'axios';

// =============================================
// CONFIGURATION DE L'API
// =============================================

// NOUVELLE URL RENDER (sans slash à la fin)
const RENDER_BACKEND_URL = 'https://mega-data-pw3w.onrender.com';

// URLs prioritaires selon l'environnement
const getApiUrl = () => {
  // 1. Variable d'environnement (Vercel) - PRIORITAIRE
  if (process.env.REACT_APP_API_URL) {
    let url = process.env.REACT_APP_API_URL;
    // Enlever le slash à la fin si présent
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    console.log('🔧 Using REACT_APP_API_URL:', url);
    return url;
  }

  // 2. En production, utiliser la nouvelle URL Render
  if (process.env.NODE_ENV === 'production') {
    console.log('🔧 Production mode, using Render URL:', RENDER_BACKEND_URL);
    return RENDER_BACKEND_URL;
  }
  
  // 3. Développement local
  console.log('🔧 Development mode, using localhost');
  return 'http://localhost:5000';
};

const API_URL = getApiUrl();

// Debug configuration
console.log('🔧 Configuration API Finale:', {
  environment: process.env.NODE_ENV,
  apiUrl: API_URL,
  isProduction: process.env.NODE_ENV === 'production',
  hasEnvVar: !!process.env.REACT_APP_API_URL
});

// Vérifions qu'une requête complète sera bien formée
console.log('✅ Exemple inscription:', `${API_URL}/api/auth/register`);
console.log('✅ Exemple santé:', `${API_URL}/api/health`);

// =============================================
// INSTANCE AXIOS
// =============================================

const api = axios.create({
  baseURL: API_URL,  // URL de base SANS /api à la fin
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 secondes timeout
  timeoutErrorMessage: 'La requête a pris trop de temps. Vérifiez votre connexion.',
  withCredentials: false,
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
      console.log('Full URL:', `${API_URL}${config.url}`);
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
      baseURL: error.config?.baseURL,
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'N/A',
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data,
      code: error.code
    });
    
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
      
      // Redirection vers login
      if (window.location.pathname !== '/login') {
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
      console.warn('🔍 Ressource non trouvée - Vérifiez que l\'URL est correcte:', `${API_URL}${error.config?.url}`);
      return Promise.reject(new Error(`La ressource demandée n'existe pas. URL testée: ${API_URL}${error.config?.url}`));
    }
    
    // Erreur 408 - Timeout
    if (error.response?.status === 408 || error.code === 'ECONNABORTED') {
      console.warn('⏰ Timeout de la requête');
      return Promise.reject(new Error(
        'La requête a pris trop de temps. Le serveur pourrait être surchargé.'
      ));
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
    
    // Erreur réseau (CORS, DNS, etc.)
    if (!error.response) {
      console.error('🌐 Erreur réseau - Vérification de la connexion...');
      
      // Message d'erreur spécifique pour CORS
      if (error.message.includes('CORS')) {
        console.error('🚫 Erreur CORS détectée');
        return Promise.reject(new Error(
          'Erreur de configuration CORS. Vérifiez que le backend autorise votre domaine.'
        ));
      }
      
      return Promise.reject(new Error(
        `Impossible de contacter le serveur (${API_URL}). Vérifiez votre connexion internet.`
      ));
    }
    
    // Autres erreurs
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.response?.data?.error?.message ||
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
    console.log('🔍 Vérification santé du backend:', API_URL);
    const response = await axios.get(`${API_URL}/api/health`, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Backend en ligne:', response.data);
    return {
      healthy: true,
      data: response.data,
      timestamp: new Date().toISOString(),
      url: API_URL
    };
  } catch (error) {
    console.error('❌ Backend hors ligne:', {
      url: API_URL,
      error: error.message,
      code: error.code
    });
    return {
      healthy: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
      url: API_URL,
      suggestion: 'Vérifiez que le backend Render est en ligne et que l\'URL est correcte'
    };
  }
};

/**
 * Test de connexion complet au backend
 */
export const testBackendConnection = async () => {
  const startTime = Date.now();
  const testUrl = `${API_URL}/api/health`;
  
  console.log('🔍 Test de connexion au backend:', testUrl);
  
  try {
    const healthResponse = await axios.get(testUrl, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    const result = {
      success: true,
      data: {
        ...healthResponse.data,
        responseTime: `${responseTime}ms`,
        apiUrl: API_URL,
        environment: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Test de connexion réussi:', result);
    return result;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    const errorResult = {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: API_URL,
        responseTime: `${responseTime}ms`
      },
      timestamp: new Date().toISOString(),
      suggestions: [
        'Vérifiez que le backend Render est en ligne',
        `URL actuelle: ${API_URL}`,
        'Vérifiez les logs sur Render',
        'Assurez-vous que les variables d\'environnement sont configurées'
      ]
    };
    
    console.error('❌ Test de connexion échoué:', errorResult);
    return errorResult;
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
    'Accept': 'application/octet-stream, application/pdf, text/csv',
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

    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'download';
    
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+?)"?$/);
      if (match) {
        filename = match[1];
      }
    }

    const blob = await response.blob();
    
    console.log(`✅ Téléchargement réussi: ${filename} (${blob.size} octets)`);
    
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
  
  console.log(`📤 Upload: ${file.name} (${file.size} octets) vers ${url}`);
  
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
  
  if (options.cache && options.cache === true) {
    const cached = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}_time`);
    
    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      const maxAge = options.maxAge || 5 * 60 * 1000;
      
      if (age < maxAge) {
        console.log('💾 Utilisation du cache pour:', url);
        return JSON.parse(cached);
      } else {
        console.log('♻️ Cache expiré pour:', url);
      }
    }
  }
  
  const response = await api.get(url, options);
  
  if (options.cache && options.cache === true && response.data) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(response.data));
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      console.log('💾 Données mises en cache pour:', url);
    } catch (e) {
      console.warn('⚠️ Impossible de mettre en cache');
    }
  }
  
  return response.data;
};

/**
 * Clear API cache
 */
api.clearCache = () => {
  const keys = Object.keys(localStorage);
  let count = 0;
  
  keys.forEach(key => {
    if (key.startsWith('cache_')) {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_time`);
      count++;
    }
  });
  
  console.log(`🧹 Cache API nettoyé: ${count} entrées supprimées`);
};

/**
 * Obtenir l'URL de base de l'API
 */
api.getBaseUrl = () => API_URL;

/**
 * Vérifier la configuration actuelle
 */
api.getConfig = () => ({
  baseURL: API_URL,
  environment: process.env.NODE_ENV,
  hasToken: !!localStorage.getItem('token'),
  timestamp: new Date().toISOString()
});

// =============================================
// EXPORT
// =============================================

export { API_URL };
export default api;