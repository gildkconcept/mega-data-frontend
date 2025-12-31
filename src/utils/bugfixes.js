// frontend/src/utils/bugfixes.js

export const applyBugFixes = () => {
  console.log('🔧 Application des correctifs de bugs...');
  
  // Correctif 1: Normaliser service_assigne dans localStorage
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && (user.serviceAssigne && !user.service_assigne)) {
        user.service_assigne = user.serviceAssigne;
        delete user.serviceAssigne;
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ Correctif 1: service_assigne normalisé');
      }
    }
  } catch (e) {
    console.error('❌ Erreur correctif 1:', e);
  }
  
  // Correctif 2: Vérifier la connexion API
  const testAPI = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health');
      if (response.ok) {
        console.log('✅ Correctif 2: API connectée');
      } else {
        console.warn('⚠️ Correctif 2: API non disponible');
      }
    } catch (error) {
      console.error('❌ Correctif 2: Erreur connexion API:', error);
    }
  };
  
  testAPI();
  
  console.log('🔧 Correctifs appliqués');
};

// Ajouter dans index.js
import { applyBugFixes } from './utils/bugfixes';
applyBugFixes();