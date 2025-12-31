import React, { useState, useEffect, useMemo } from 'react';
import { 
  Container, Row, Col, Card, Table, Alert, 
  Button, Badge, Form, Spinner, InputGroup,
  Modal, Tabs, Tab, ProgressBar, Dropdown
} from 'react-bootstrap';
import { 
  Users, Calendar, CheckCircle, XCircle, 
  Filter, Download, Eye, RefreshCw,
  TrendingUp, BarChart3, Search, Calendar as CalendarIcon,
  ChevronDown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import memberService from '../services/memberService';
import presenceAdminService from '../services/presenceAdminService';
import MemberManagement from './MemberManagement';
import UserManagement from './UserManagement';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingPresences, setLoadingPresences] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('members'); // 'members', 'users', 'presences'
  
  // États pour la liste des membres
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    service: 'tous',
    quartier: 'tous',
    search: '',
    dateDebut: '',
    dateFin: ''
  });
  
  // États pour les présences
  const [presences, setPresences] = useState({});
  const [selectedSunday, setSelectedSunday] = useState(getLastSunday());
  const [presenceStats, setPresenceStats] = useState({});
  
  // États pour les modales
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showPresenceStats, setShowPresenceStats] = useState(false);
  
  // Liste des services
  const services = useMemo(() => [
    'Groupe de louange et d\'adoration (GLA)',
    'Voir et Entendre',
    'Communication',
    '28:19',
    'Suivi',
    'Service d\'ordre',
    'Protocole',
    'Logistique',
    'Service Book',
    'Gestion de culte'
  ], []);
  
  // Récupérer les 4 derniers dimanches
  const sundays = useMemo(() => {
    const sundaysArray = [];
    const today = new Date();
    
    for (let i = 0; i < 4; i++) {
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - (today.getDay() + 7 * i) + 7);
      sundaysArray.push({
        date: sunday.toISOString().split('T')[0],
        label: sunday.toLocaleDateString('fr-FR', { 
          weekday: 'long',
          day: 'numeric',
          month: 'short'
        })
      });
    }
    
    return sundaysArray;
  }, []);
  
  // Fonction pour obtenir le dernier dimanche
  function getLastSunday() {
    const today = new Date();
    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - today.getDay());
    return lastSunday.toISOString().split('T')[0];
  }
  
  useEffect(() => {
    fetchAllMembers();
    loadPresences(selectedSunday);
    
    // Déterminer l'onglet actif en fonction de l'URL
    const path = window.location.pathname;
    if (path.includes('/admin/users')) {
      setActiveTab('users');
    } else if (path.includes('/admin/presences')) {
      setActiveTab('presences');
    } else {
      setActiveTab('members');
    }
  }, []);
  
  const fetchAllMembers = async () => {
    try {
      setLoading(true);
      const result = await memberService.getAllMembers();
      
      if (result.success) {
        setMembers(result.membres || []);
        setFilteredMembers(result.membres || []);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erreur chargement membres');
    } finally {
      setLoading(false);
    }
  };
  
  const loadPresences = async (date) => {
    try {
      setLoadingPresences(true);
      const result = await presenceAdminService.getAllPresencesByDate(date);
      
      if (result.success) {
        // Organiser les présences par membre
        const presenceMap = {};
        result.data?.forEach(presence => {
          presenceMap[presence.membre_id] = {
            present: presence.present,
            commentaire: presence.commentaire,
            berger: presence.berger_nom
          };
        });
        
        setPresences(presenceMap);
        
        // Calculer les stats
        const stats = {
          total: result.total || 0,
          presents: result.presents || 0,
          absents: result.absents || 0,
          taux: result.total > 0 ? Math.round((result.presents / result.total) * 100) : 0
        };
        setPresenceStats(stats);
      }
    } catch (err) {
      console.error('Erreur chargement présences:', err);
    } finally {
      setLoadingPresences(false);
    }
  };
  
  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...members];
    
    if (filters.service !== 'tous') {
      filtered = filtered.filter(m => m.service === filters.service);
    }
    
    if (filters.quartier !== 'tous') {
      filtered = filtered.filter(m => m.quartier === filters.quartier);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(m => 
        m.nom.toLowerCase().includes(searchTerm) ||
        m.prenom.toLowerCase().includes(searchTerm) ||
        m.numero.includes(searchTerm) ||
        m.service.toLowerCase().includes(searchTerm)
      );
    }
    
    setFilteredMembers(filtered);
  }, [filters, members]);
  
  const updateFilter = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSundayChange = (date) => {
    setSelectedSunday(date);
    loadPresences(date);
  };
  
  const viewMemberDetails = (member) => {
    setSelectedMember(member);
    setShowMemberDetails(true);
  };
  
  const getQuartiers = () => {
    return [...new Set(members.map(m => m.quartier).filter(q => q))].sort();
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const exportMembersCSV = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/members/export/csv/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `membres_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      setSuccess('Export CSV réussi');
    } catch (err) {
      setError('Erreur export CSV');
    }
  };
  
  // Gestion du changement d'onglet
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'members') {
      navigate('/admin/members');
    } else if (tab === 'users') {
      navigate('/admin/users');
    } else if (tab === 'presences') {
      navigate('/admin/presences');
    }
  };
  
  // Rendu conditionnel du contenu
  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'presences':
        return (
          <>
            {/* Sélecteur de dimanche */}
            <Row className="mb-4">
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-1">
                          <CalendarIcon className="me-2" size={20} />
                          Présences par dimanche
                        </h5>
                        <p className="text-muted mb-0">
                          Sélectionnez un dimanche pour voir les présences
                        </p>
                      </div>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-primary">
                          <Calendar className="me-2" size={16} />
                          {sundays.find(s => s.date === selectedSunday)?.label || 'Sélectionner'}
                          <ChevronDown className="ms-2" size={16} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          {sundays.map((sunday) => (
                            <Dropdown.Item 
                              key={sunday.date}
                              onClick={() => handleSundayChange(sunday.date)}
                              active={selectedSunday === sunday.date}
                            >
                              {sunday.label}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            {/* Statistiques des présences */}
            <Row className="mb-4">
              <Col md={3}>
                <Card className="border-0 shadow-sm border-top border-primary">
                  <Card.Body className="text-center">
                    <div className="display-5 fw-bold text-primary mb-2">
                      {presenceStats.total || 0}
                    </div>
                    <Users size={24} className="text-primary mb-2" />
                    <p className="text-muted mb-0">Membres attendus</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm border-top border-success">
                  <Card.Body className="text-center">
                    <div className="display-5 fw-bold text-success mb-2">
                      {presenceStats.presents || 0}
                    </div>
                    <CheckCircle size={24} className="text-success mb-2" />
                    <p className="text-muted mb-0">Présents</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm border-top border-danger">
                  <Card.Body className="text-center">
                    <div className="display-5 fw-bold text-danger mb-2">
                      {presenceStats.absents || 0}
                    </div>
                    <XCircle size={24} className="text-danger mb-2" />
                    <p className="text-muted mb-0">Absents</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm border-top border-info">
                  <Card.Body className="text-center">
                    <div className="display-5 fw-bold text-info mb-2">
                      {presenceStats.taux || 0}%
                    </div>
                    <TrendingUp size={24} className="text-info mb-2" />
                    <p className="text-muted mb-0">Taux de présence</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            {/* Liste des membres avec présences */}
            <Row>
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-0">
                          <i className="bi bi-list-check me-2"></i>
                          Présences du {formatDate(selectedSunday)}
                        </h5>
                        <small className="text-muted">
                          {loadingPresences ? 'Chargement...' : `${filteredMembers.length} membres`}
                        </small>
                      </div>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => loadPresences(selectedSunday)}
                        disabled={loadingPresences}
                      >
                        <RefreshCw size={14} className="me-1" />
                        Actualiser
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-0">
                    {loadingPresences ? (
                      <div className="text-center py-5">
                        <Spinner animation="border" />
                        <p className="mt-2 text-muted">Chargement des présences...</p>
                      </div>
                    ) : filteredMembers.length === 0 ? (
                      <div className="text-center py-5">
                        <Calendar size={48} className="text-muted mb-3" />
                        <p className="text-muted">Aucun membre pour cette date</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table hover className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Nom & Prénom</th>
                              <th>Service</th>
                              <th>Quartier</th>
                              <th>Téléphone</th>
                              <th className="text-center">Présence</th>
                              <th className="text-center">Statut</th>
                              <th className="text-center">Commentaire</th>
                              <th className="text-center">Enregistré par</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredMembers.map((member) => {
                              const presence = presences[member.id];
                              return (
                                <tr key={member.id}>
                                  <td>
                                    <strong>{member.nom} {member.prenom}</strong>
                                  </td>
                                  <td>
                                    <Badge bg="info">{member.service}</Badge>
                                  </td>
                                  <td>{member.quartier}</td>
                                  <td>
                                    <code>{member.numero}</code>
                                  </td>
                                  <td className="text-center">
                                    {presence ? (
                                      presence.present ? (
                                        <CheckCircle size={20} className="text-success" />
                                      ) : (
                                        <XCircle size={20} className="text-danger" />
                                      )
                                    ) : (
                                      <span className="text-muted">-</span>
                                    )}
                                  </td>
                                  <td className="text-center">
                                    {presence ? (
                                      <Badge bg={presence.present ? "success" : "danger"}>
                                        {presence.present ? "Présent" : "Absent"}
                                      </Badge>
                                    ) : (
                                      <Badge bg="secondary">Non marqué</Badge>
                                    )}
                                  </td>
                                  <td className="text-center">
                                    <small className="text-muted">
                                      {presence?.commentaire || '-'}
                                    </small>
                                  </td>
                                  <td className="text-center">
                                    <small className="text-muted">
                                      {presence?.berger || '-'}
                                    </small>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        );
      default:
        return <MemberManagement />;
    }
  };
  
  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm bg-gradient-violet text-white">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="fw-bold mb-2">
                    <i className="bi bi-shield-lock me-2"></i>
                    Super Administration
                  </h1>
                  <p className="mb-0 opacity-75">
                    Vue complète des membres et présences
                  </p>
                </div>
                <div className="text-end">
                  <Badge bg="light" text="dark" className="fs-6">
                    <i className="bi bi-people-fill me-2"></i>
                    {members.length} membres
                  </Badge>
                  <p className="mb-0 mt-2">
                    <small>Accès complet aux données</small>
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Navigation */}
      <Row className="mb-3">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-2">
              <Tabs activeKey={activeTab} onSelect={handleTabChange} className="border-0">
                <Tab eventKey="members" title={
                  <span className="text-decoration-none text-dark">
                    <i className="bi bi-people me-2"></i>
                    Tous les membres
                  </span>
                } />
                <Tab eventKey="users" title={
                  <span className="text-decoration-none text-dark">
                    <i className="bi bi-person-badge me-2"></i>
                    Utilisateurs
                  </span>
                } />
                <Tab eventKey="presences" title={
                  <span className="text-decoration-none text-dark">
                    <i className="bi bi-calendar-check me-2"></i>
                    Présences
                  </span>
                } />
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Contenu principal */}
      <Row>
        <Col>
          {renderContent()}
        </Col>
      </Row>
      
      {/* Modale détail membre */}
      <Modal show={showMemberDetails} onHide={() => setShowMemberDetails(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="bi bi-person-circle me-2"></i>
            Détails du membre
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMember && (
            <Row>
              <Col md={6}>
                <h6>Informations personnelles</h6>
                <p><strong>Nom:</strong> {selectedMember.nom}</p>
                <p><strong>Prénom:</strong> {selectedMember.prenom}</p>
                <p><strong>Téléphone:</strong> {selectedMember.numero}</p>
                <p><strong>Quartier:</strong> {selectedMember.quartier}</p>
              </Col>
              <Col md={6}>
                <h6>Informations service</h6>
                <p><strong>Service:</strong> {selectedMember.service}</p>
                <p><strong>Enregistré par:</strong> {selectedMember.username}</p>
                <p><strong>Date d'inscription:</strong> {formatDate(selectedMember.created_at)}</p>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => setShowMemberDetails(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Styles */}
      <style>
        {`
          .bg-gradient-violet {
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%) !important;
          }
          
          .table th {
            border-top: none;
            font-weight: 600;
          }
          
          .badge {
            font-size: 0.8em;
            font-weight: 500;
          }
          
          code {
            background-color: #f8f9fa;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.9em;
          }
          
          .nav-tabs .nav-link {
            border: none;
            color: #6c757d;
            font-weight: 500;
          }
          
          .nav-tabs .nav-link.active {
            color: #6a11cb;
            border-bottom: 3px solid #6a11cb;
          }
          
          .dropdown-item.active {
            background-color: #6a11cb;
          }
        `}
      </style>
    </Container>
  );
};

export default AdminDashboard;