import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import PrivateRoute from './components/Layout/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import BergerDashboard from './pages/BergerDashboard';
import PresencePage from './pages/PresencePage'; // NOUVEAU
import authService from './services/authService';

// Composant pour gérer la redirection (AMÉLIORÉ)
const AuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  useEffect(() => {
    const publicPaths = ['/login', '/register', '/'];
    
    if (!isAuthenticated && !publicPaths.includes(location.pathname)) {
      navigate('/', { replace: true });
      return;
    }
    
    // Rediriger les utilisateurs authentifiés qui sont sur login/register
    if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
      // Redirection selon le rôle
      if (user?.role === 'super_admin' || user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user?.role === 'berger') {
        navigate('/berger', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
    
    // Rediriger les bergers qui tentent d'accéder au dashboard normal
    if (isAuthenticated && user?.role === 'berger' && location.pathname === '/dashboard') {
      navigate('/berger', { replace: true });
    }
    
    // Rediriger les membres normaux qui tentent d'accéder au dashboard berger
    if (isAuthenticated && user?.role === 'member' && location.pathname === '/berger') {
      navigate('/dashboard', { replace: true });
    }
    
    // Rediriger les membres normaux qui tentent d'accéder au dashboard admin
    if (isAuthenticated && user?.role === 'member' && location.pathname.startsWith('/admin')) {
      navigate('/dashboard', { replace: true });
    }
  }, [location, navigate, isAuthenticated, user]);

  return null;
};

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Header />
        <main className="flex-grow-1">
          <AuthRedirect />
          <Routes>
            {/* Page d'accueil publique */}
            <Route path="/" element={<Home />} />
            
            {/* Routes d'authentification */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Page d'accueil protégée */}
            <Route path="/home" element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } />
            
            {/* Tableau de bord membre normal */}
            <Route path="/dashboard" element={
              <PrivateRoute memberOnly={true}>
                <Dashboard />
              </PrivateRoute>
            } />
            
            {/* Tableau de bord berger */}
            <Route path="/berger" element={
              <PrivateRoute bergerOnly={true}>
                <BergerDashboard />
              </PrivateRoute>
            } />
            
            {/* Page des présences (berger seulement) - NOUVEAU */}
            <Route path="/presence" element={
              <PrivateRoute bergerOnly={true}>
                <PresencePage />
              </PrivateRoute>
            } />
            
            {/* Administration protégée (super_admin et admin) */}
            <Route path="/admin/*" element={
              <PrivateRoute adminOnly={true}>
                <AdminDashboard />
              </PrivateRoute>
            } />
            
            {/* Redirection pour routes inconnues */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;