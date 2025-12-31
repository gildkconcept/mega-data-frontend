import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Container, Row, Col, Card, Table, Alert, 
  Button, Badge, ButtonGroup, ProgressBar 
} from 'react-bootstrap';
import { 
  BarChart3, Users, Calendar, UserPlus, 
  Download, RefreshCw, Printer,
  FileText, CheckCircle, TrendingUp
} from 'lucide-react';
import bergerService from '../services/bergerService';
import authService from '../services/authService';
import MemberForm from '../components/MemberForm';

const BergerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({});
  
  // Récupérer l'utilisateur avec service_assigne normalisé
  const user = useMemo(() => {
    const currentUser = authService.getCurrentUser();
    console.log('🔍 [Memo] Current user loaded:', {
      username: currentUser?.username,
      service_assigne: currentUser?.service_assigne, // CORRIGÉ: underscore
      role: currentUser?.role
    });
    return currentUser;
  }, []);
  
  // Référence pour suivre si les données ont déjà été chargées
  const hasFetchedRef = useRef(false);
  const lastServiceRef = useRef(null);

  useEffect(() => {
    console.log('🔍 [Effect] BergerDashboard mounted/updated');
    console.log('🔍 [Effect] Current user:', user?.username);
    console.log('🔍 [Effect] Service assigné:', user?.service_assigne);
    
    // Vérifier si nous avons un service assigné - CORRIGÉ
    if (!user?.service_assigne) {
      console.error('❌ [Effect] No service_assigne for user:', user);
      setError('Aucun service assigné à ce berger. Contactez l\'administrateur.');
      setLoading(false);
      return;
    }
    
    // Vérifier si le service a changé
    const serviceChanged = user.service_assigne !== lastServiceRef.current;
    
    // Ne charger les données que si c'est la première fois OU si le service a changé
    if (!hasFetchedRef.current || serviceChanged) {
      console.log(`🔍 [Effect] ${serviceChanged ? 'Service changed' : 'First load'}, fetching data...`);
      fetchDashboardData();
      fetchMembers();
      hasFetchedRef.current = true;
      lastServiceRef.current = user.service_assigne;
    } else {
      console.log('🔍 [Effect] Data already fetched for this service, skipping...');
      setLoading(false);
    }
    
    // Configurer l'écouteur d'événement d'authentification
    let isMounted = true;
    
    const handleAuthChange = () => {
      if (!isMounted) return;
      console.log('🔍 [Event] Auth change detected, checking for service changes...');
      
      // Vérifier si l'utilisateur ou le service a changé
      const newUser = authService.getCurrentUser();
      const serviceChanged = newUser?.service_assigne !== lastServiceRef.current;
      
      if (serviceChanged) {
        console.log('🔍 [Event] Service changed, refreshing data...');
        lastServiceRef.current = newUser?.service_assigne;
        hasFetchedRef.current = false;
        fetchDashboardData();
        fetchMembers();
      }
    };
    
    window.addEventListener('auth-change', handleAuthChange);
    
    // Nettoyage
    return () => {
      isMounted = false;
      window.removeEventListener('auth-change', handleAuthChange);
    };
    
  }, [user?.service_assigne, user?.id]);

  const fetchDashboardData = async () => {
    try {
      console.log('🔍 [Fetch] Fetching dashboard data...');
      setLoading(true);
      setError('');
      
      const result = await bergerService.getDashboard();
      console.log('🔍 [Fetch] Dashboard response:', result);
      
      if (result.success) {
        setDashboardData(result);
        setStats(result.stats || {});
      } else {
        setError(result.message || 'Erreur inconnue');
      }
    } catch (err) {
      console.error('❌ [Fetch] Dashboard fetch error:', {
        message: err.message,
        response: err.response?.data
      });
      setError('Erreur de connexion au serveur. Vérifiez que le serveur backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      console.log('🔍 [Fetch] Fetching members...');
      const result = await bergerService.getMembers();
      console.log('🔍 [Fetch] Members response:', result);
      
      if (result.success) {
        setMembers(result.membres || []);
        
        // Mettre à jour les stats si nécessaire
        if (result.stats) {
          setStats(result.stats);
        }
      } else {
        console.warn('⚠️ [Fetch] Members fetch warning:', result.message);
      }
    } catch (err) {
      console.error('❌ [Fetch] Members fetch error:', err);
      setError('Erreur lors du chargement des membres: ' + err.message);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }
      
      console.log('🔍 [Export] Exporting PDF...');
      
      // Vérifier que le berger a un service
      if (!user?.service_assigne) {
        throw new Error('Service non défini pour ce berger');
      }
      
      // Appel API pour générer le PDF
      const response = await fetch('http://localhost:5000/api/berger/export/pdf', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      // Récupérer le PDF comme blob
      const blob = await response.blob();
      
      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(blob);
      
      // Créer un lien pour le téléchargement
      const link = document.createElement('a');
      link.href = url;
      
      // Nom du fichier avec date et service
      const serviceName = user?.service_assigne || 'service';
      const dateStr = new Date().toISOString().split('T')[0];
      const safeServiceName = serviceName.replace(/[^a-z0-9]/gi, '_');
      link.download = `membres_${safeServiceName}_${dateStr}.pdf`;
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Libérer l'URL
      window.URL.revokeObjectURL(url);
      
      // Message de succès
      setSuccess(`PDF généré avec succès ! ${members.length} membres exportés.`);
      console.log('✅ [Export] PDF exporté avec succès');
      
      // Effacer le message après 5 secondes
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      console.error('❌ [Export] Export PDF error:', err);
      setError('Erreur lors de la génération du PDF: ' + err.message);
      
      // Fallback: générer un PDF côté client
      if (err.message.includes('Failed to fetch') || err.message.includes('HTTP error')) {
        try {
          await generateClientSidePDF();
        } catch (fallbackError) {
          console.error('❌ [Export] Fallback PDF also failed:', fallbackError);
        }
      }
    } finally {
      setExporting(false);
    }
  };

  const generateClientSidePDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // En-tête
      doc.setFontSize(20);
      doc.setTextColor(106, 17, 203);
      doc.text('MEGA-DATA ÉGLISE', 105, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text(`Service: ${user?.service_assigne || 'Non spécifié'}`, 105, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Liste des membres - ${new Date().toLocaleDateString('fr-FR')}`, 105, 40, { align: 'center' });
      
      // Tableau
      let y = 50;
      doc.setFontSize(10);
      
      // En-tête tableau
      doc.setFillColor(106, 17, 203);
      doc.rect(20, y - 5, 170, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('Nom & Prénom', 25, y);
      doc.text('Téléphone', 100, y);
      doc.text('Quartier', 140, y);
      
      y += 10;
      doc.setTextColor(0, 0, 0);
      
      // Données
      members.forEach((member, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        doc.text(`${member.nom} ${member.prenom}`, 25, y);
        doc.text(member.numero || 'N/A', 100, y);
        doc.text(member.quartier || 'N/A', 140, y);
        y += 7;
      });
      
      // Pied de page
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Généré le ${new Date().toLocaleDateString('fr-FR')} • Total: ${members.length} membres`,
        105,
        285,
        { align: 'center' }
      );
      
      const filename = `membres_${user?.service_assigne?.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}_fallback.pdf`;
      doc.save(filename);
      
      setSuccess(`PDF généré côté client: ${filename}`);
    } catch (error) {
      console.error('❌ Client-side PDF generation failed:', error);
      throw error;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    console.log('🔍 [Action] Manual refresh requested');
    setError('');
    setSuccess('');
    fetchDashboardData();
    fetchMembers();
  };

  const handleAddMember = () => {
    console.log('🔍 [Action] Add member clicked');
    const addMemberForm = document.getElementById('add-member-form');
    if (addMemberForm) {
      addMemberForm.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      addMemberForm.style.boxShadow = '0 0 0 3px rgba(106, 17, 203, 0.3)';
      setTimeout(() => {
        addMemberForm.style.boxShadow = '0 10px 30px rgba(106, 17, 203, 0.1)';
      }, 1000);
    }
  };

  const calculateGrowth = () => {
    if (!stats.totalMembres || !stats.cetteSemaine) return 0;
    return Math.round((stats.cetteSemaine / stats.totalMembres) * 100);
  };

  const handleMemberAdded = (newMember) => {
    console.log('🔍 [Action] New member added:', newMember);
    
    const memberWithDetails = {
      ...newMember,
      id: newMember.id || Date.now(),
      username: user?.username || '',
      created_at: new Date().toISOString()
    };
    
    setMembers(prev => [memberWithDetails, ...prev]);
    
    const updatedStats = {
      ...stats,
      totalMembres: (stats.totalMembres || 0) + 1,
      cetteSemaine: (stats.cetteSemaine || 0) + 1,
      aujourdhui: (stats.aujourdhui || 0) + 1
    };
    setStats(updatedStats);
    
    setSuccess(`Membre ${newMember.nom} ${newMember.prenom} ajouté avec succès !`);
    setTimeout(() => setSuccess(''), 3000);
    
    setTimeout(() => {
      const membersTable = document.getElementById('members-table');
      if (membersTable) {
        membersTable.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center" style={{ minHeight: '400px' }}>
        <Card className="shadow-sm border-primary">
          <Card.Body className="py-5">
            <div className="mb-4">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <h4 className="text-primary mb-2">Chargement du tableau de bord...</h4>
              <p className="text-muted mb-0">
                Service: <strong>{user?.service_assigne || 'Chargement...'}</strong>
              </p>
              <p className="text-muted small">
                Utilisateur: {user?.username}
              </p>
            </div>
            <ProgressBar 
              animated 
              now={100} 
              className="w-50 mx-auto"
              style={{ height: '6px' }}
            />
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (!user?.service_assigne) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <h4 className="alert-heading">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Problème d'affectation
          </h4>
          <p>
            Aucun service n'est assigné à votre compte berger.
          </p>
          <p className="mb-0">
            Veuillez contacter l'administrateur pour vous attribuer un service.
          </p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 berger-dashboard">
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-primary">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="fw-bold mb-2 text-primary">
                    <BarChart3 className="me-3" size={32} />
                    Tableau de bord Berger
                  </h1>
                  <div className="d-flex align-items-center">
                    <Badge bg="primary" className="me-3">
                      <Users size={16} className="me-1" />
                      {user?.role || 'Non défini'}
                    </Badge>
                    <span className="text-dark">
                      <strong>Service:</strong> {dashboardData?.service || user?.service_assigne}
                    </span>
                  </div>
                </div>
                <div className="text-end">
                  <p className="mb-1">
                    <strong>{user?.username}</strong>
                  </p>
                  <small className="text-muted">
                    {user?.nom} {user?.prenom}
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>Erreur:</strong> {error}
            </Alert>
          </Col>
        </Row>
      )}

      {success && (
        <Row className="mb-4">
          <Col>
            <Alert variant="success" dismissible onClose={() => setSuccess('')}>
              <CheckCircle className="me-2" />
              <strong>Succès!</strong> {success}
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center">
                <ButtonGroup>
                  <Button variant="primary" onClick={handleAddMember}>
                    <UserPlus size={20} className="me-2" />
                    Nouveau membre
                  </Button>
                  <Button variant="outline-primary" onClick={handleRefresh} disabled={loading}>
                    <RefreshCw size={20} className="me-2" />
                    Actualiser
                  </Button>
                </ButtonGroup>
                
                <ButtonGroup>
                  <Button 
                    variant="success" 
                    onClick={handleExportPDF}
                    disabled={exporting || members.length === 0}
                  >
                    {exporting ? (
                      <span className="me-2">⏳</span>
                    ) : (
                      <Download size={20} className="me-2" />
                    )}
                    {exporting ? 'Génération...' : 'Exporter PDF'}
                  </Button>
                  <Button 
                    variant="outline-success" 
                    onClick={handlePrint}
                    disabled={members.length === 0}
                  >
                    <Printer size={20} className="me-2" />
                    Imprimer
                  </Button>
                </ButtonGroup>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm border-primary border-top border-3 h-100">
            <Card.Body className="text-center p-4">
              <div className="display-4 fw-bold text-primary mb-2">
                {stats.totalMembres || members.length || 0}
              </div>
              <Users size={32} className="text-primary mb-3" />
              <p className="text-muted mb-0">Total membres</p>
              <small className="text-muted d-block mt-2">
                Service: {dashboardData?.service || user?.service_assigne}
              </small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="shadow-sm border-success border-top border-3 h-100">
            <Card.Body className="text-center p-4">
              <div className="display-4 fw-bold text-success mb-2">
                {stats.cetteSemaine || 0}
              </div>
              <TrendingUp size={32} className="text-success mb-3" />
              <p className="text-muted mb-0">Cette semaine</p>
              {stats.totalMembres > 0 && (
                <ProgressBar 
                  now={calculateGrowth()} 
                  variant="success" 
                  className="mt-2"
                  label={`${calculateGrowth()}%`}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="shadow-sm border-warning border-top border-3 h-100">
            <Card.Body className="text-center p-4">
              <div className="display-4 fw-bold text-warning mb-2">
                {stats.aujourdhui || 0}
              </div>
              <Calendar size={32} className="text-warning mb-3" />
              <p className="text-muted mb-0">Aujourd'hui</p>
              <small className="text-muted d-block mt-2">
                {new Date().toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="shadow-sm border-info border-top border-3 h-100">
            <Card.Body className="text-center p-4">
              <div className="display-4 fw-bold text-info mb-2">
                {members.length}
              </div>
              <FileText size={32} className="text-info mb-3" />
              <p className="text-muted mb-0">Disponible pour export</p>
              <Button 
                variant="outline-info" 
                size="sm" 
                className="mt-2"
                onClick={handleExportPDF}
                disabled={members.length === 0}
              >
                <Download size={14} className="me-1" />
                Exporter maintenant
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4" id="add-member-form">
        <Col>
          <Card className="card-violet shadow-sm">
            <Card.Header className="bg-gradient-violet text-white">
              <h5 className="mb-0">
                <i className="bi bi-person-plus me-2"></i>
                Ajouter un nouveau membre
                <Badge bg="light" text="dark" className="ms-2">
                  Service: {user?.service_assigne}
                </Badge>
              </h5>
            </Card.Header>
            <Card.Body>
              <MemberForm onMemberAdded={handleMemberAdded} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4" id="members-table">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">
                  <Users className="me-2" />
                  Membres du service ({members.length})
                </h5>
                <small className="text-muted">
                  {dashboardData?.service || user?.service_assigne}
                </small>
              </div>
              <div>
                <Badge bg="primary" className="me-2">
                  {members.length} membres
                </Badge>
                <Button size="sm" variant="outline-secondary" onClick={fetchMembers}>
                  <RefreshCw size={14} />
                </Button>
              </div>
            </Card.Header>
            
            <Card.Body className="p-0">
              {members.length === 0 ? (
                <div className="text-center py-5">
                  <Users size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">Aucun membre dans ce service</h5>
                  <p className="text-muted mb-4">
                    Le service "{user?.service_assigne}" ne contient pas encore de membres.
                  </p>
                  <Button variant="primary" onClick={handleAddMember}>
                    <UserPlus className="me-2" />
                    Ajouter un premier membre
                  </Button>
                </div>
              ) : (
                <>
                  <div className="table-responsive d-none d-print-block">
                    <h5 className="p-3">Liste des membres - {dashboardData?.service}</h5>
                    <Table bordered className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Nom & Prénom</th>
                          <th>Téléphone</th>
                          <th>Quartier</th>
                          <th>Date d'inscription</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member, index) => (
                          <tr key={member.id}>
                            <td>{index + 1}</td>
                            <td>
                              <strong>{member.nom} {member.prenom}</strong>
                            </td>
                            <td>{member.numero}</td>
                            <td>{member.quartier}</td>
                            <td>
                              {new Date(member.created_at).toLocaleDateString('fr-FR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  
                  <div className="table-responsive d-print-none">
                    <Table hover className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Nom & Prénom</th>
                          <th>Téléphone</th>
                          <th>Quartier</th>
                          <th>Date d'inscription</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member, index) => (
                          <tr key={member.id}>
                            <td className="text-muted">{index + 1}</td>
                            <td>
                              <div>
                                <strong>{member.nom} {member.prenom}</strong>
                                {member.username && (
                                  <div>
                                    <small className="text-muted">
                                      Par: {member.username}
                                    </small>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <code>{member.numero}</code>
                            </td>
                            <td>
                              <Badge bg="info">{member.quartier}</Badge>
                            </td>
                            <td>
                              {new Date(member.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                              <div>
                                <small className="text-muted">
                                  {new Date(member.created_at).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </small>
                              </div>
                            </td>
                            <td className="text-end">
                              <Button size="sm" variant="outline-primary">
                                Voir
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
            </Card.Body>
            
            <Card.Footer className="bg-light d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted">
                  Dernière actualisation: {new Date().toLocaleTimeString('fr-FR')}
                </small>
              </div>
              <div>
                <Button 
                  size="sm" 
                  variant="success" 
                  onClick={handleExportPDF}
                  disabled={exporting || members.length === 0}
                >
                  {exporting ? (
                    <>
                      <span className="me-1">⏳</span>
                      Génération PDF...
                    </>
                  ) : (
                    <>
                      <Download size={14} className="me-1" />
                      Exporter PDF
                    </>
                  )}
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      <style>
        {`
          @media print {
            .berger-dashboard .btn,
            .berger-dashboard .badge,
            .berger-dashboard .card-header,
            .berger-dashboard .d-print-none {
              display: none !important;
            }
            
            .berger-dashboard .d-print-block {
              display: block !important;
            }
            
            body {
              font-size: 12pt;
            }
            
            table {
              font-size: 10pt;
            }
          }
          
          .berger-dashboard .spinner-border,
          .berger-dashboard .progress-bar {
            animation: none !important;
          }
          
          .card-violet {
            border-top: 4px solid #6a11cb;
          }
          
          .bg-gradient-violet {
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%) !important;
          }
          
          .berger-dashboard .table {
            border-collapse: collapse;
            border-spacing: 0;
          }
          
          .berger-dashboard .table td, 
          .berger-dashboard .table th {
            vertical-align: middle;
            border: 1px solid #dee2e6;
            padding: 0.75rem;
          }
          
          .berger-dashboard * {
            transition: all 0.2s ease !important;
          }
        `}
      </style>
    </Container>
  );
};

export default BergerDashboard;