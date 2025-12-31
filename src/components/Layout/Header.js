import React from 'react';
import { Navbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const Header = () => {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();
  
  // Déterminer le dashboard selon le rôle
  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    if (user.role === 'berger') return '/berger';
    if (user.role === 'admin' || user.role === 'super_admin') return '/admin';
    return '/dashboard';
  };
  
  const getDashboardLabel = () => {
    if (!user) return 'Tableau de bord';
    if (user.role === 'berger') return 'Dashboard Berger';
    if (user.role === 'admin' || user.role === 'super_admin') return 'Administration';
    return 'Tableau de bord';
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-violet-dark">
          <i className="bi bi-church-fill me-2 text-violet"></i>
          MEGA-DATA
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Accueil</Nav.Link>
            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to={getDashboardLink()}>
                  {getDashboardLabel()}
                </Nav.Link>
                
                {/* Menu berger avec dropdown - AMÉLIORÉ */}
                {user?.role === 'berger' && (
                  <Dropdown as={Nav.Item}>
                    <Dropdown.Toggle as={Nav.Link} className="text-dark">
                      <i className="bi bi-person-badge me-1"></i>
                      Berger
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item as={Link} to="/berger">
                        <i className="bi bi-speedometer2 me-2"></i>
                        Tableau de bord
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/presence">
                        <i className="bi bi-clipboard-check me-2"></i>
                        {/* NOUVEAU : Icône avec badge si des présences sont à prendre */}
                        Gestion des présences
                        {user?.service_assigne && (
                          <span className="badge bg-primary ms-2">Nouveau</span>
                        )}
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item as={Link} to="/berger">
                        <i className="bi bi-people me-2"></i>
                        Mes membres
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/berger">
                        <i className="bi bi-file-earmark-pdf me-2"></i>
                        Exporter PDF
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                )}
                
                {/* Admin voit aussi les membres et les services */}
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <Dropdown as={Nav.Item}>
                    <Dropdown.Toggle as={Nav.Link} className="text-dark">
                      <i className="bi bi-shield-lock me-1"></i>
                      Administration
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item as={Link} to="/admin/members">
                        <i className="bi bi-people me-2"></i>
                        Tous les membres
                        <span className="badge bg-info ms-2">Services</span>
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/admin/users">
                        <i className="bi bi-person-badge me-2"></i>
                        Utilisateurs
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item as={Link} to="/admin">
                        <i className="bi bi-bar-chart me-2"></i>
                        Tableau de bord admin
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/admin/members">
                        <i className="bi bi-funnel me-2"></i>
                        Recherche par service
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                )}
              </>
            )}
          </Nav>
          
          <Nav>
            {isAuthenticated ? (
              <>
                <Navbar.Text className="me-3 d-none d-lg-block">
                  <i className="bi bi-person-circle me-1"></i>
                  {user?.prenom || ''} {user?.nom || ''}
                  
                  {/* Badge selon rôle - AMÉLIORÉ */}
                  {user?.role === 'admin' || user?.role === 'super_admin' ? (
                    <span className="badge bg-gradient-violet ms-2">
                      <i className="bi bi-shield-check me-1"></i>
                      Admin
                    </span>
                  ) : user?.role === 'berger' ? (
                    <span className="badge bg-info ms-2">
                      <i className="bi bi-person-badge me-1"></i>
                      Berger
                    </span>
                  ) : (
                    <span className="badge bg-secondary ms-2">
                      <i className="bi bi-person me-1"></i>
                      Membre
                    </span>
                  )}
                  
                  {/* Afficher le service pour les bergers - AMÉLIORÉ */}
                  {user?.role === 'berger' && user?.service_assigne && (
                    <span className="badge bg-light text-dark border ms-2" title="Service assigné">
                      <i className="bi bi-briefcase me-1"></i>
                      {user.service_assigne.length > 15 
                        ? user.service_assigne.substring(0, 12) + '...' 
                        : user.service_assigne}
                    </span>
                  )}
                  
                  {/* Indicateur pour les présences (berger seulement) */}
                  {user?.role === 'berger' && (
                    <span 
                      className="badge bg-success ms-2 cursor-pointer"
                      onClick={() => navigate('/presence')}
                      title="Prendre les présences"
                    >
                      <i className="bi bi-calendar-check me-1"></i>
                      Présences
                    </span>
                  )}
                </Navbar.Text>
                
                {/* Menu utilisateur avec dropdown - AMÉLIORÉ */}
                <Dropdown align="end">
                  <Dropdown.Toggle as={Button} variant="outline-violet" size="sm">
                    <i className="bi bi-person-circle me-1"></i>
                    {user?.prenom?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Header>
                      <div className="d-flex align-items-center">
                        <div className="bg-gradient-violet rounded-circle p-2 me-2">
                          <i className="bi bi-person-fill text-white"></i>
                        </div>
                        <div>
                          <strong>{user?.username}</strong>
                          <div className="small text-muted">{user?.role}</div>
                          {user?.service_assigne && (
                            <div className="small text-primary">
                              <i className="bi bi-briefcase me-1"></i>
                              {user.service_assigne}
                            </div>
                          )}
                        </div>
                      </div>
                    </Dropdown.Header>
                    <Dropdown.Divider />
                    <Dropdown.Item as={Link} to={getDashboardLink()}>
                      <i className="bi bi-house-door me-2"></i>
                      Tableau de bord
                    </Dropdown.Item>
                    
                    {/* Option présences pour les bergers - NOUVEAU */}
                    {user?.role === 'berger' && (
                      <Dropdown.Item as={Link} to="/presence">
                        <i className="bi bi-clipboard-check me-2 text-success"></i>
                        <span>Présences</span>
                        <span className="badge bg-success ms-auto">Nouveau</span>
                      </Dropdown.Item>
                    )}
                    
                    {/* Option pour voir les services (admin) */}
                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                      <Dropdown.Item as={Link} to="/admin/members">
                        <i className="bi bi-eye me-2 text-info"></i>
                        Voir les services
                      </Dropdown.Item>
                    )}
                    
                    <Dropdown.Item as={Link} to="/dashboard">
                      <i className="bi bi-person me-2"></i>
                      Mon profil
                    </Dropdown.Item>
                    
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout} className="text-danger">
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Déconnexion
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <Button 
                  variant="outline-violet" 
                  size="sm" 
                  className="me-2"
                  onClick={() => navigate('/login')}
                >
                  Connexion
                </Button>
                <Button 
                  variant="gradient" 
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  Inscription
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
      
      {/* Styles CSS intégrés */}
      <style>
        {`
          .bg-gradient-violet {
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%) !important;
          }
          
          .text-violet-dark {
            color: #4a00b8 !important;
          }
          
          .btn-outline-violet {
            color: #6a11cb;
            border-color: #6a11cb;
          }
          
          .btn-outline-violet:hover {
            background-color: #6a11cb;
            color: white;
          }
          
          .cursor-pointer {
            cursor: pointer;
          }
          
          .dropdown-item.active, .dropdown-item:active {
            background-color: #6a11cb !important;
          }
          
          /* Badge avec animation pour les nouvelles fonctionnalités */
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          .badge.bg-success {
            animation: pulse 2s infinite;
          }
          
          /* Style pour le menu berger */
          .dropdown-menu {
            border: 1px solid rgba(106, 17, 203, 0.1);
            box-shadow: 0 5px 15px rgba(106, 17, 203, 0.1);
          }
          
          .dropdown-item {
            transition: all 0.2s ease;
          }
          
          .dropdown-item:hover {
            background-color: rgba(106, 17, 203, 0.05);
            padding-left: 1.5rem;
          }
        `}
      </style>
    </Navbar>
  );
};

export default Header;