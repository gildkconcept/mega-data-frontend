import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../../services/authService';

const PrivateRoute = ({ children, adminOnly = false, bergerOnly = false, memberOnly = false }) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();
  
  // Si non authentifié, rediriger vers login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Si pas d'utilisateur dans le token (ne devrait pas arriver)
  if (!user) {
    authService.logout();
    return <Navigate to="/login" />;
  }
  
  // Vérification des rôles spécifiques
  
  // Route uniquement pour les administrateurs (admin ou super_admin)
  if (adminOnly) {
    if (!['admin', 'super_admin'].includes(user.role)) {
      // Si c'est un berger, rediriger vers son dashboard
      if (user.role === 'berger') {
        return <Navigate to="/berger" />;
      }
      // Si c'est un membre normal, rediriger vers son dashboard
      return <Navigate to="/dashboard" />;
    }
  }
  
  // Route uniquement pour les bergers
  if (bergerOnly) {
    if (user.role !== 'berger') {
      // Si c'est un admin, rediriger vers admin
      if (['admin', 'super_admin'].includes(user.role)) {
        return <Navigate to="/admin" />;
      }
      // Si c'est un membre normal, rediriger vers son dashboard
      return <Navigate to="/dashboard" />;
    }
  }
  
  // Route uniquement pour les membres normaux (pas admin, pas berger)
  if (memberOnly) {
    if (user.role !== 'member') {
      // Si c'est un berger, rediriger vers son dashboard
      if (user.role === 'berger') {
        return <Navigate to="/berger" />;
      }
      // Si c'est un admin, rediriger vers admin
      if (['admin', 'super_admin'].includes(user.role)) {
        return <Navigate to="/admin" />;
      }
    }
  }
  
  // Si toutes les vérifications passent, afficher les enfants
  return children;
};

export default PrivateRoute;