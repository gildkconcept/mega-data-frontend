import api from './api';
import { jwtDecode } from 'jwt-decode';

const authService = {
  // DEBUG: Vérifier la configuration
  debug: () => {
    console.log('🔍 Auth Service Debug:');
    console.log(`  Token: ${localStorage.getItem('token')}`);
    console.log(`  User: ${localStorage.getItem('user')}`);
    
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('🔍 Token décodé:', decoded);
        console.log(`🔍 Service assigné dans token: ${decoded.service_assigne}`);
        console.log(`🔍 Rôle dans token: ${decoded.role}`);
      } catch (e) {
        console.error('❌ Erreur décodage token:', e);
      }
    }
  },

  // Normaliser le champ service_assigne
  normalizeUserData: (userData) => {
    if (!userData) return null;
    
    // S'assurer que service_assigne existe (avec underscore)
    const normalizedUser = { ...userData };
    
    // Si serviceAssigne existe mais pas service_assigne, les harmoniser
    if (normalizedUser.serviceAssigne && !normalizedUser.service_assigne) {
      normalizedUser.service_assigne = normalizedUser.serviceAssigne;
      delete normalizedUser.serviceAssigne;
    }
    
    return normalizedUser;
  },

  // Inscription
  register: async (userData) => {
    try {
      console.log('🔍 Register attempt:', userData);
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        const normalizedUser = authService.normalizeUserData(response.data.user);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        window.dispatchEvent(new Event('auth-change'));
        
        authService.debug();
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de l\'inscription:', error);
      throw error;
    }
  },

  // Connexion
  login: async (credentials) => {
    try {
      console.log('🔍 Login attempt:', { 
        login: credentials.login, 
        passwordLength: credentials.password?.length 
      });
      
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.success) {
        const normalizedUser = authService.normalizeUserData(response.data.user);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        window.dispatchEvent(new Event('auth-change'));
        
        console.log('✅ Login successful:', normalizedUser);
        authService.debug();
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error.response?.data || error);
      throw error;
    }
  },

  // Déconnexion
  logout: () => {
    try {
      console.log('🔍 Logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-change'));
      
      if (window.location.pathname !== '/login') {
        window.history.replaceState({}, '', '/login');
        window.dispatchEvent(new Event('popstate'));
      }
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
    }
  },

  // Récupérer le profil
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération profil:', error);
      throw error;
    }
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔍 No token found');
        return false;
      }
      
      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;
        
        if (decoded.exp < now) {
          console.log('🔍 Token expired');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return false;
        }
        
        return true;
      } catch (e) {
        console.error('❌ Token decode error:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur vérification auth:', error);
      return false;
    }
  },

  // Récupérer l'utilisateur courant (CORRIGÉ : normalisation)
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.log('🔍 No user in localStorage');
        return null;
      }
      
      const user = JSON.parse(userStr);
      
      if (!user || !user.id || !user.username) {
        console.log('🔍 Invalid user object:', user);
        return null;
      }
      
      // Normaliser l'utilisateur
      const normalizedUser = authService.normalizeUserData(user);
      
      console.log('🔍 Current user (normalized):', {
        username: normalizedUser.username,
        role: normalizedUser.role,
        service_assigne: normalizedUser.service_assigne
      });
      
      return normalizedUser;
    } catch (error) {
      console.error('❌ Erreur récupération utilisateur:', error);
      return null;
    }
  },

  // Vérifier si l'utilisateur est admin
  isAdmin: () => {
    try {
      const user = authService.getCurrentUser();
      const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');
      console.log(`🔍 Is admin? ${isAdmin} (role: ${user?.role})`);
      return isAdmin;
    } catch (error) {
      console.error('❌ Erreur vérification admin:', error);
      return false;
    }
  },

  // Vérifier si l'utilisateur est berger
  isBerger: () => {
    const user = authService.getCurrentUser();
    return user && user.role === 'berger';
  },

  // Obtenir le service assigné (CORRIGÉ : priorité à service_assigne)
  getServiceAssigne: () => {
    const user = authService.getCurrentUser();
    // Essayer les deux noms possibles
    const service = user?.service_assigne || user?.serviceAssigne;
    console.log(`🔍 Service assigné récupéré: ${service}`);
    return service;
  },

  // Vérifier et rediriger
  checkAuthAndRedirect: (navigate = null) => {
    const isAuthenticated = authService.isAuthenticated();
    const path = window.location.pathname;
    
    console.log(`🔍 Auth check: authenticated=${isAuthenticated}, path=${path}`);
    
    const publicPages = ['/login', '/register', '/'];
    
    if (!isAuthenticated && !publicPages.includes(path)) {
      console.log('🔍 Redirecting to login');
      if (navigate) {
        navigate('/login', { replace: true });
      } else {
        window.history.replaceState({}, '', '/login');
        window.dispatchEvent(new Event('popstate'));
      }
      return false;
    }
    
    if (isAuthenticated && (path === '/login' || path === '/register')) {
      const user = authService.getCurrentUser();
      let redirectTo = '/dashboard';
      
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        redirectTo = '/admin';
      } else if (user?.role === 'berger') {
        redirectTo = '/berger';
      }
      
      console.log(`🔍 Redirecting authenticated user to: ${redirectTo}`);
      
      if (navigate) {
        navigate(redirectTo, { replace: true });
      } else {
        window.history.replaceState({}, '', redirectTo);
        window.dispatchEvent(new Event('popstate'));
      }
      return false;
    }
    
    return isAuthenticated;
  },

  // Obtenir les informations de session
  getSessionInfo: () => {
    try {
      const user = authService.getCurrentUser();
      const token = localStorage.getItem('token');
      
      if (!user || !token) {
        return null;
      }
      
      return {
        user,
        token,
        isAuthenticated: true,
        isAdmin: user.role === 'admin' || user.role === 'super_admin',
        isBerger: user.role === 'berger',
        serviceAssigne: user.service_assigne,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erreur récupération session:', error);
      return null;
    }
  },

  // Forcer la mise à jour du localStorage (pour les corrections)
  forceUpdateUser: (updates) => {
    try {
      const user = authService.getCurrentUser();
      if (!user) return false;
      
      const updatedUser = { ...user, ...updates };
      const normalizedUser = authService.normalizeUserData(updatedUser);
      
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      window.dispatchEvent(new Event('auth-change'));
      
      console.log('✅ User updated in localStorage:', normalizedUser);
      return true;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      return false;
    }
  }
};

// Initialiser au chargement
if (typeof window !== 'undefined') {
  console.log('🔍 Initializing auth service...');
  
  // Appliquer les correctifs automatiquement
  const applyAuthFixes = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        let needsUpdate = false;
        
        // Corriger serviceAssigne → service_assigne
        if (user.serviceAssigne && !user.service_assigne) {
          user.service_assigne = user.serviceAssigne;
          delete user.serviceAssigne;
          needsUpdate = true;
          console.log('🔧 Fix: serviceAssigne normalized to service_assigne');
        }
        
        // Mettre à jour si nécessaire
        if (needsUpdate) {
          localStorage.setItem('user', JSON.stringify(user));
          console.log('✅ Auth fixes applied');
        }
      }
    } catch (e) {
      console.error('❌ Error applying auth fixes:', e);
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        applyAuthFixes();
        authService.debug();
        authService.checkAuthAndRedirect();
      }, 100);
    });
  } else {
    setTimeout(() => {
      applyAuthFixes();
      authService.debug();
      authService.checkAuthAndRedirect();
    }, 100);
  }
}

export default authService;