import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import authService from '../services/authService';

const Home = () => {
  const navigate = useNavigate();

  // Rediriger vers le dashboard si déjà connecté
  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="home-page theme-violet">
      {/* Hero Section avec dégradé violet */}
      <div className="hero-section position-relative overflow-hidden">
        <div className="hero-gradient"></div>
        
        <Container className="py-5 position-relative">
          <Row className="align-items-center min-vh-80 py-5">
            <Col lg={6} className="mb-5 mb-lg-0">
              <div className="hero-content animate-fade-in">
                <div className="mb-4">
                  <span className="badge bg-gradient-violet px-3 py-2 rounded-pill fw-semibold">
                    <i className="bi bi-stars me-2"></i>
                    Système de Gestion Moderne
                  </span>
                </div>
                
                <h1 className="display-3 fw-bold mb-4">
                  <span >MEGA-DATA</span> 
                </h1>
                
                <p >
                  Générez, organisez et analysez les données de votre communauté religieuse 
                  avec notre plateforme numérique intuitive et sécurisée.
                </p>
                
                <div className="d-flex flex-wrap gap-3">
                  <Button 
                    size="lg" 
                    className="btn-gradient px-4 py-3 fw-semibold shadow-lg"
                    onClick={() => navigate('/login')}
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Se connecter
                  </Button>
                  
                  <Button 
                    variant="outline-light" 
                    size="lg"
                    className="px-4 py-3 fw-semibold"
                    onClick={() => navigate('/register')}
                  >
                    <i className="bi bi-person-plus me-2"></i>
                    Créer un compte
                  </Button>
                </div>
              </div>
            </Col>
            
            <Col lg={6}>
              <div className="hero-illustration animate-slide-in">
                <div className="position-relative">
                  <div className="floating-card card-1 shadow-lg">
                    <Card className="card-violet h-100">
                      <Card.Body className="p-4">
                        <div className="d-flex align-items-center mb-3">
                          <div className="icon-wrapper bg-violet-light p-3 rounded-circle me-3">
                            <i className="bi bi-people-fill fs-2 text-violet"></i>
                          </div>
                          <div>
                            <h5 className="fw-bold mb-0">Gestion des Membres</h5>
                            <small className="text-muted">Enregistrement numérique</small>
                          </div>
                        </div>
                        <p className="mb-0">
                          Enregistrez et gérez facilement tous les membres de votre communauté.
                        </p>
                      </Card.Body>
                    </Card>
                  </div>
                  
                  <div className="floating-card card-2 shadow-lg">
                    <Card className="card-violet h-100">
                      <Card.Body className="p-4">
                        <div className="d-flex align-items-center mb-3">
                          <div className="icon-wrapper bg-violet-light p-3 rounded-circle me-3">
                            <i className="bi bi-shield-check fs-2 text-violet"></i>
                          </div>
                          <div>
                            <h5 className="fw-bold mb-0">Sécurité Maximale</h5>
                            <small className="text-muted">Données protégées</small>
                          </div>
                        </div>
                        <p className="mb-0">
                          Vos données sont chiffrées et sécurisées avec les dernières technologies.
                        </p>
                      </Card.Body>
                    </Card>
                  </div>
                  
                  <div className="floating-card card-3 shadow-lg">
                    <Card className="card-violet h-100">
                      <Card.Body className="p-4">
                        <div className="d-flex align-items-center mb-3">
                          <div className="icon-wrapper bg-violet-light p-3 rounded-circle me-3">
                            <i className="bi bi-file-earmark-pdf fs-2 text-violet"></i>
                          </div>
                          <div>
                            <h5 className="fw-bold mb-0">Export PDF</h5>
                            <small className="text-muted">Rapports professionnels</small>
                          </div>
                        </div>
                        <p className="mb-0">
                          Générez des rapports PDF professionnels pour vos réunions et archives.
                        </p>
                      </Card.Body>
                    </Card>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5 my-5">
        <Row className="mb-5">
          <Col className="text-center">
            <h2 className="display-5 fw-bold mb-3 text-violet-dark">Fonctionnalités Principales</h2>
            <p className="text-muted lead">
              Tout ce dont vous avez besoin pour gérer efficacement votre communauté
            </p>
          </Col>
        </Row>
        
        <Row className="g-4">
          <Col md={4}>
            <Card className="card-violet shadow-sm h-100 feature-card">
              <Card.Body className="p-4">
                <div className="feature-icon mb-4">
                  <div className="bg-gradient-violet p-3 rounded-circle d-inline-block">
                    <i className="bi bi-person-plus fs-1 text-white"></i>
                  </div>
                </div>
                <h4 className="fw-bold mb-3 text-violet-dark">Enregistrement Simple</h4>
                <p className="text-muted">
                  Ajoutez rapidement de nouveaux membres avec un formulaire intuitif.
                  Toutes les informations essentielles en un seul endroit.
                </p>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-violet me-2"></i>
                    Interface utilisateur intuitive
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-violet me-2"></i>
                    Validation automatique des données
                  </li>
                  <li>
                    <i className="bi bi-check-circle text-violet me-2"></i>
                    Recherche et filtrage avancés
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="card-violet shadow-sm h-100 feature-card">
              <Card.Body className="p-4">
                <div className="feature-icon mb-4">
                  <div className="bg-gradient-violet p-3 rounded-circle d-inline-block">
                    <i className="bi bi-shield-lock fs-1 text-white"></i>
                  </div>
                </div>
                <h4 className="fw-bold mb-3 text-violet-dark">Sécurité Renforcée</h4>
                <p className="text-muted">
                  Protégez vos données sensibles avec notre système d'authentification avancé
                  et le chiffrement des informations.
                </p>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-violet me-2"></i>
                    Authentification JWT sécurisée
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-violet me-2"></i>
                    Rôles et permissions granulaire
                  </li>
                  <li>
                    <i className="bi bi-check-circle text-violet me-2"></i>
                    Données chiffrées en base
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="card-violet shadow-sm h-100 feature-card">
              <Card.Body className="p-4">
                <div className="feature-icon mb-4">
                  <div className="bg-gradient-violet p-3 rounded-circle d-inline-block">
                    <i className="bi bi-graph-up fs-1 text-white"></i>
                  </div>
                </div>
                <h4 className="fw-bold mb-3 text-violet-dark">Analyses Avancées</h4>
                <p className="text-muted">
                  Visualisez vos données avec des tableaux de bord interactifs
                  et des statistiques détaillées en temps réel.
                </p>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-violet me-2"></i>
                    Tableaux de bord personnalisables
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-violet me-2"></i>
                    Statistiques en temps réel
                  </li>
                  <li>
                    <i className="bi bi-check-circle text-violet me-2"></i>
                    Graphiques interactifs
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* CTA Section */}
      <div className="cta-section py-5 bg-violet-light">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <div className="cta-card p-5 rounded-4 shadow-lg bg-white">
                <h2 className="display-5 fw-bold mb-4 text-violet-dark">
                  Prêt à moderniser la gestion de votre communauté ?
                </h2>
                <p className="lead text-muted mb-4">
                  Rejoignez le service du suivie qui utilise déjà 
                  MEGA-DATA pour une gestion simplifiée et efficace.
                </p>
                <div className="d-flex justify-content-center gap-3">
                  <Button 
                    size="lg" 
                    className="btn-gradient px-5 py-3 fw-semibold"
                    onClick={() => navigate('/register')}
                  >
                    <i className="bi bi-rocket-takeoff me-2"></i>
                    Commencer maintenant
                  </Button>
                  
                  <Button 
                    size="lg" 
                    variant="outline-violet"
                    className="px-5 py-3 fw-semibold"
                    onClick={() => navigate('/login')}
                  >
                    <i className="bi bi-person-check me-2"></i>
                    Connexion existante
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Footer */}
      <footer className="footer py-4 bg-violet-dark text-white">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <p className="mb-0">
                <i className="bi bi-c-circle me-1"></i>
                {new Date().getFullYear()} MEGA-DATA. Tous droits réservés.
              </p>
            </Col>
            <Col md={6} className="text-md-end">
              <div className="d-flex justify-content-md-end gap-3">
                <a href="#!" className="text-white text-decoration-none">
                  <i className="bi bi-shield-check me-1"></i>
                  Sécurité
                </a>
                <a href="#!" className="text-white text-decoration-none">
                  <i className="bi bi-question-circle me-1"></i>
                  Aide
                </a>
                <a href="#!" className="text-white text-decoration-none">
                  <i className="bi bi-envelope me-1"></i>
                  Contact
                </a>
              </div>
            </Col>
          </Row>
        </Container>
      </footer>

      {/* Styles CSS intégrés */}
      <style>{`
        .home-page {
          min-height: 100vh;
        }
        
        .hero-section {
          background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
          color: white;
          position: relative;
          overflow: hidden;
        }
        
        .hero-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 50%);
        }
        
        .hero-illustration {
          position: relative;
          height: 400px;
        }
        
        .floating-card {
          position: absolute;
          background: white;
          border-radius: 16px;
          transition: all 0.3s ease;
        }
        
        .floating-card:hover {
          transform: translateY(-5px);
        }
        
        .card-1 {
          top: 0;
          left: 0;
          width: 300px;
          z-index: 3;
          animation: float-1 6s ease-in-out infinite;
        }
        
        .card-2 {
          top: 100px;
          right: 0;
          width: 280px;
          z-index: 2;
          animation: float-2 7s ease-in-out infinite;
        }
        
        .card-3 {
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 320px;
          z-index: 1;
          animation: float-3 8s ease-in-out infinite;
        }
        
        .feature-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 10px 30px rgba(106, 17, 203, 0.1) !important;
        }
        
        .cta-section {
          background: linear-gradient(135deg, #f3e5f5 0%, #e8eaf6 100%);
        }
        
        .text-gradient-violet {
          background: linear-gradient(90deg, #6a11cb, #2575fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* Classes violet personnalisées */
        .bg-violet { background-color: #6a11cb !important; }
        .bg-violet-light { background-color: #f3e5f5 !important; }
        .bg-violet-dark { background-color: #4a00b8 !important; }
        .bg-gradient-violet { background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%) !important; }
        .text-violet { color: #6a11cb !important; }
        .text-violet-dark { color: #4a00b8 !important; }
        .border-violet { border-color: #6a11cb !important; }
        
        .btn-gradient {
          background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
          border: none;
          color: white;
          transition: all 0.3s ease;
        }
        
        .btn-gradient:hover {
          background: linear-gradient(135deg, #5a0db8 0%, #1c68e8 100%);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(106, 17, 203, 0.3);
          color: white;
        }
        
        .btn-outline-violet {
          color: #6a11cb;
          border-color: #6a11cb;
        }
        
        .btn-outline-violet:hover {
          background: #6a11cb;
          color: white;
        }
        
        .card-violet {
          border-top: 4px solid #6a11cb;
          transition: all 0.3s ease;
        }
        
        .card-violet:hover {
          border-color: #8a4bff;
          box-shadow: 0 10px 30px rgba(106, 17, 203, 0.1);
        }
        
        @keyframes float-1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float-2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes float-3 {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-10px); }
        }
        
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
        
        .animate-slide-in {
          animation: slideInRight 1s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default Home;