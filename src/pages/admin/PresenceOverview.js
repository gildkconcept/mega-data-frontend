// pages/admin/PresenceOverview.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container, Row, Col, Card, Table, Alert,
  Button, Badge, Form, Spinner, InputGroup,
  Modal, Dropdown, ProgressBar
} from 'react-bootstrap';
import {
  Users, Calendar, CheckCircle, XCircle,
  Filter, Download, Eye, RefreshCw,
  TrendingUp, BarChart3, Search, ChevronDown,
  FileText, Printer, FileSpreadsheet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import presenceAdminService from '../../services/presenceAdminService';
import memberService from '../../services/memberService';


const PresenceOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingPresences, setLoadingPresences] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // États pour les données
  const [presences, setPresences] = useState([]);
  const [members, setMembers] = useState([]);
  const [presenceStats, setPresenceStats] = useState({
    total: 0,
    presents: 0,
    absents: 0,
    taux: 0
  });
  
  // États pour les filtres
  const [selectedSunday, setSelectedSunday] = useState(() => {
    // Par défaut, le dernier dimanche
    const today = new Date();
    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - today.getDay());
    return lastSunday.toISOString().split('T')[0];
  });
  
  const [filters, setFilters] = useState({
    service: 'tous',
    quartier: 'tous',
    search: '',
    statut: 'tous' // 'tous', 'present', 'absent'
  });
  
  // États pour les modales
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [advancedStats, setAdvancedStats] = useState(null);
  
  // Liste des services et quartiers
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
  
  // Récupérer les derniers dimanches
  const sundays = useMemo(() => presenceAdminService.getLastSundays(6), []);
  
  // Récupérer l'utilisateur
  const user = authService.getCurrentUser();
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Charger les données initiales
  useEffect(() => {
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      navigate('/');
      return;
    }
    
    loadInitialData();
  }, []);
  
  // Charger les présences quand la date change
  useEffect(() => {
    if (selectedSunday) {
      loadPresences(selectedSunday);
    }
  }, [selectedSunday]);
  
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Charger tous les membres
      const membersResult = await memberService.getAllMembers();
      if (membersResult.success) {
        setMembers(membersResult.membres || []);
      }
      
      // Charger les statistiques avancées
      const statsResult = await presenceAdminService.getAdvancedStats();
      if (statsResult.success) {
        setAdvancedStats(statsResult.stats);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Erreur chargement données initiales');
      setLoading(false);
    }
  };
  
  const loadPresences = async (date) => {
    try {
      setLoadingPresences(true);
      setError('');
      
      const result = await presenceAdminService.getAllPresencesByDate(date, filters.service !== 'tous' ? filters.service : null);
      
      if (result.success) {
        setPresences(result.data || []);
        setPresenceStats({
          total: result.total || 0,
          presents: result.presents || 0,
          absents: result.absents || 0,
          taux: result.taux || 0
        });
      } else {
        setError(result.message || 'Erreur chargement présences');
      }
    } catch (err) {
      setError('Erreur chargement présences: ' + err.message);
    } finally {
      setLoadingPresences(false);
    }
  };
  
  // Filtrer les présences
  const filteredPresences = useMemo(() => {
    let filtered = [...presences];
    
    // Filtre par quartier
    if (filters.quartier !== 'tous') {
      filtered = filtered.filter(p => p.quartier === filters.quartier);
    }
    
    // Filtre par statut
    if (filters.statut !== 'tous') {
      if (filters.statut === 'present') {
        filtered = filtered.filter(p => p.present);
      } else if (filters.statut === 'absent') {
        filtered = filtered.filter(p => !p.present);
      }
    }
    
    // Filtre par recherche
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.nom.toLowerCase().includes(searchTerm) ||
        p.prenom.toLowerCase().includes(searchTerm) ||
        p.service.toLowerCase().includes(searchTerm) ||
        p.quartier.toLowerCase().includes(searchTerm) ||
        p.berger_nom?.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  }, [presences, filters]);
  
  const updateFilter = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleExport = async (format) => {
    try {
      setExporting(true);
      
      if (format === 'pdf') {
        await presenceAdminService.exportPresencesPDF(selectedSunday, filters.service !== 'tous' ? filters.service : null);
        setSuccess('PDF exporté avec succès');
      } else if (format === 'csv') {
        // Logique pour CSV
        setSuccess('Export CSV bientôt disponible');
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur export: ' + err.message);
    } finally {
      setExporting(false);
    }
  };
  
  const viewMemberDetails = (member) => {
    setSelectedMember(member);
    setShowMemberDetails(true);
  };
  
  const getQuartiers = () => {
    return [...new Set(presences.map(p => p.quartier).filter(q => q))].sort();
  };
  
  const formatDate = (dateString) => {
    return presenceAdminService.formatDate(dateString);
  };
  
  const handleRefresh = () => {
    loadPresences(selectedSunday);
  };
  
  // Calculer les statistiques par service
  const serviceStats = useMemo(() => {
    const stats = {};
    presences.forEach(p => {
      const service = p.service;
      if (!stats[service]) {
        stats[service] = { total: 0, presents: 0 };
      }
      stats[service].total++;
      if (p.present) stats[service].presents++;
    });
    
    return Object.entries(stats).map(([service, data]) => ({
      service,
      ...data,
      taux: data.total > 0 ? Math.round((data.presents / data.total) * 100) : 0
    })).sort((a, b) => b.taux - a.taux);
  }, [presences]);
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Chargement de la vue super admin...</p>
      </Container>
    );
  }
  
  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm bg-gradient-primary text-white">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="fw-bold mb-2">
                    <i className="bi bi-shield-check me-2"></i>
                    Super Admin - Vue des Présences
                  </h1>
                  <p className="mb-0 opacity-75">
                    Surveillance complète des présences par dimanche
                  </p>
                </div>
                <div className="text-end">
                  <Badge bg="light" text="dark" className="fs-6">
                    <i className="bi bi-calendar-check me-2"></i>
                    {sundays.length} dimanches
                  </Badge>
                  <p className="mb-0 mt-2">
                    <small>Accès super admin aux données de présence</small>
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Messages */}
      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          </Col>
        </Row>
      )}
      
      {success && (
        <Row className="mb-3">
          <Col>
            <Alert variant="success" dismissible onClose={() => setSuccess('')}>
              <i className="bi bi-check-circle me-2"></i>
              {success}
            </Alert>
          </Col>
        </Row>
      )}
      
      {/* Contrôles supérieurs */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <Calendar className="me-3 text-primary" size={24} />
                <div className="flex-grow-1">
                  <h6 className="mb-1">Sélectionner un dimanche</h6>
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-primary" className="w-100 text-start">
                      <Calendar className="me-2" size={16} />
                      {formatDate(selectedSunday)}
                      <ChevronDown className="ms-2" size={16} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="w-100">
                      {sundays.map((sunday) => (
                        <Dropdown.Item 
                          key={sunday.date}
                          onClick={() => setSelectedSunday(sunday.date)}
                          active={selectedSunday === sunday.date}
                        >
                          <Calendar className="me-2" size={14} />
                          {sunday.fullLabel}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Actions rapides</h6>
                  <p className="text-muted small mb-0">Export et mise à jour</p>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loadingPresences}
                  >
                    <RefreshCw size={16} className="me-1" />
                    Actualiser
                  </Button>
                  
                  <Dropdown>
                    <Dropdown.Toggle variant="success" size="sm">
                      <Download size={16} className="me-1" />
                      Exporter
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handleExport('pdf')}>
                        <FileText size={14} className="me-2" />
                        PDF
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleExport('csv')}>
                        <FileSpreadsheet size={14} className="me-2" />
                        Excel
                      </Dropdown.Item>
                      <Dropdown.Item>
                        <Printer size={14} className="me-2" />
                        Imprimer
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Filtres */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">
                      <i className="bi bi-person-badge me-1"></i>
                      Service
                    </Form.Label>
                    <Form.Select
                      value={filters.service}
                      onChange={(e) => updateFilter('service', e.target.value)}
                      size="sm"
                    >
                      <option value="tous">Tous les services</option>
                      {services.map((service, index) => (
                        <option key={index} value={service}>{service}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">
                      <i className="bi bi-geo-alt me-1"></i>
                      Quartier
                    </Form.Label>
                    <Form.Select
                      value={filters.quartier}
                      onChange={(e) => updateFilter('quartier', e.target.value)}
                      size="sm"
                    >
                      <option value="tous">Tous les quartiers</option>
                      {getQuartiers().map((quartier, index) => (
                        <option key={index} value={quartier}>{quartier}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">
                      <i className="bi bi-filter-circle me-1"></i>
                      Statut
                    </Form.Label>
                    <Form.Select
                      value={filters.statut}
                      onChange={(e) => updateFilter('statut', e.target.value)}
                      size="sm"
                    >
                      <option value="tous">Tous les statuts</option>
                      <option value="present">Présents seulement</option>
                      <option value="absent">Absents seulement</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">
                      <Search size={14} className="me-1" />
                      Recherche
                    </Form.Label>
                    <InputGroup size="sm">
                      <Form.Control
                        type="text"
                        placeholder="Nom, prénom, service, quartier..."
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                      />
                      {filters.search && (
                        <Button
                          variant="outline-secondary"
                          onClick={() => updateFilter('search', '')}
                        >
                          <i className="bi bi-x"></i>
                        </Button>
                      )}
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
              
              {/* Indicateurs de filtres actifs */}
              {(filters.service !== 'tous' || filters.quartier !== 'tous' || filters.statut !== 'tous' || filters.search) && (
                <div className="mt-3">
                  <Badge bg="info" className="me-2">
                    Filtres actifs:
                  </Badge>
                  {filters.service !== 'tous' && (
                    <Badge bg="primary" className="me-2">
                      Service: {filters.service}
                    </Badge>
                  )}
                  {filters.quartier !== 'tous' && (
                    <Badge bg="secondary" className="me-2">
                      Quartier: {filters.quartier}
                    </Badge>
                  )}
                  {filters.statut !== 'tous' && (
                    <Badge bg={filters.statut === 'present' ? 'success' : 'danger'} className="me-2">
                      {filters.statut === 'present' ? 'Présents' : 'Absents'}
                    </Badge>
                  )}
                  {filters.search && (
                    <Badge bg="warning" className="me-2">
                      Recherche: "{filters.search}"
                    </Badge>
                  )}
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="ms-2"
                    onClick={() => setFilters({
                      service: 'tous',
                      quartier: 'tous',
                      search: '',
                      statut: 'tous'
                    })}
                  >
                    Effacer tous
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Statistiques */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm border-top border-primary">
            <Card.Body className="text-center">
              <div className="display-5 fw-bold text-primary mb-2">
                {presenceStats.total}
              </div>
              <Users size={24} className="text-primary mb-2" />
              <p className="text-muted mb-0">Total membres</p>
              <small className="text-muted">
                Filtré: {filteredPresences.length}
              </small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="border-0 shadow-sm border-top border-success">
            <Card.Body className="text-center">
              <div className="display-5 fw-bold text-success mb-2">
                {presenceStats.presents}
              </div>
              <CheckCircle size={24} className="text-success mb-2" />
              <p className="text-muted mb-0">Présents</p>
              <ProgressBar
                now={presenceStats.total > 0 ? (presenceStats.presents / presenceStats.total) * 100 : 0}
                variant="success"
                className="mt-2"
              />
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="border-0 shadow-sm border-top border-danger">
            <Card.Body className="text-center">
              <div className="display-5 fw-bold text-danger mb-2">
                {presenceStats.absents}
              </div>
              <XCircle size={24} className="text-danger mb-2" />
              <p className="text-muted mb-0">Absents</p>
              <ProgressBar
                now={presenceStats.total > 0 ? (presenceStats.absents / presenceStats.total) * 100 : 0}
                variant="danger"
                className="mt-2"
              />
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="border-0 shadow-sm border-top border-info">
            <Card.Body className="text-center">
              <div className="display-5 fw-bold text-info mb-2">
                {presenceStats.taux}%
              </div>
              <TrendingUp size={24} className="text-info mb-2" />
              <p className="text-muted mb-0">Taux de présence</p>
              <Badge bg="info" className="mt-2">
                {filteredPresences.length > 0 
                  ? Math.round((filteredPresences.filter(p => p.present).length / filteredPresences.length) * 100)
                  : 0}% filtré
              </Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Statistiques par service */}
      {serviceStats.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Header>
                <h6 className="mb-0">
                  <BarChart3 size={18} className="me-2" />
                  Présences par service
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="d-flex flex-wrap gap-3">
                  {serviceStats.map((stat, index) => (
                    <div key={index} className="flex-grow-1">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="small">{stat.service}</span>
                        <span className="small fw-bold">{stat.taux}%</span>
                      </div>
                      <ProgressBar
                        now={stat.taux}
                        variant={stat.taux >= 80 ? "success" : stat.taux >= 50 ? "warning" : "danger"}
                        style={{ height: '6px' }}
                      />
                      <div className="d-flex justify-content-between mt-1">
                        <small className="text-muted">{stat.presents}/{stat.total}</small>
                        <small className="text-muted">
                          {stat.taux >= 80 ? "Excellent" : stat.taux >= 50 ? "Moyen" : "Faible"}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      {/* Tableau des présences */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">
                    <i className="bi bi-list-check me-2"></i>
                    Liste des présences - {formatDate(selectedSunday)}
                  </h5>
                  <small className="text-muted">
                    {loadingPresences ? 'Chargement...' : `${filteredPresences.length} résultat${filteredPresences.length !== 1 ? 's' : ''}`}
                  </small>
                </div>
                <div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => setShowStatsModal(true)}
                  >
                    <BarChart3 size={14} className="me-1" />
                    Statistiques avancées
                  </Button>
                  <Badge bg={presenceStats.taux >= 80 ? "success" : "warning"}>
                    Taux global: {presenceStats.taux}%
                  </Badge>
                </div>
              </div>
            </Card.Header>
            
            <Card.Body className="p-0">
              {loadingPresences ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                  <p className="mt-2 text-muted">Chargement des présences...</p>
                </div>
              ) : filteredPresences.length === 0 ? (
                <div className="text-center py-5">
                  <Calendar size={48} className="text-muted mb-3" />
                  <p className="text-muted">Aucune présence trouvée avec les filtres actuels</p>
                  <Button
                    variant="outline-primary"
                    onClick={() => setFilters({
                      service: 'tous',
                      quartier: 'tous',
                      search: '',
                      statut: 'tous'
                    })}
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Nom & Prénom</th>
                        <th>Service</th>
                        <th>Quartier</th>
                        <th>Téléphone</th>
                        <th className="text-center">Statut</th>
                        <th>Commentaire</th>
                        <th>Berger</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPresences.map((presence, index) => (
                        <tr key={presence.id} className={!presence.present ? 'table-warning' : ''}>
                          <td className="text-muted">{index + 1}</td>
                          <td>
                            <strong>{presence.nom} {presence.prenom}</strong>
                          </td>
                          <td>
                            <Badge bg="info">{presence.service}</Badge>
                          </td>
                          <td>{presence.quartier}</td>
                          <td>
                            <code>{presence.numero}</code>
                          </td>
                          <td className="text-center">
                            {presence.present ? (
                              <Badge bg="success" className="px-3">
                                <CheckCircle size={14} className="me-1" />
                                Présent
                              </Badge>
                            ) : (
                              <Badge bg="danger" className="px-3">
                                <XCircle size={14} className="me-1" />
                                Absent
                              </Badge>
                            )}
                          </td>
                          <td>
                            <small className="text-muted">
                              {presence.commentaire || '-'}
                            </small>
                          </td>
                          <td>
                            <small className="text-muted">
                              {presence.berger_nom || '-'}
                            </small>
                          </td>
                          <td className="text-center">
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => viewMemberDetails(presence)}
                              title="Voir les détails"
                            >
                              <Eye size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
            
            <Card.Footer className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted">
                    Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loadingPresences}
                  >
                    <RefreshCw size={14} className="me-1" />
                    Actualiser
                  </Button>
                  <Dropdown>
                    <Dropdown.Toggle variant="success" size="sm">
                      <Download size={14} className="me-1" />
                      Exporter
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handleExport('pdf')} disabled={exporting}>
                        {exporting ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <FileText size={14} className="me-2" />
                            PDF
                          </>
                        )}
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      {/* Modale détails membre */}
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
                <p><strong>Service:</strong> {selectedMember.service}</p>
              </Col>
              <Col md={6}>
                <h6>Présence</h6>
                <p>
                  <strong>Statut:</strong>{' '}
                  {selectedMember.present ? (
                    <Badge bg="success">Présent</Badge>
                  ) : (
                    <Badge bg="danger">Absent</Badge>
                  )}
                </p>
                <p><strong>Commentaire:</strong> {selectedMember.commentaire || 'Aucun'}</p>
                <p><strong>Enregistré par:</strong> {selectedMember.berger_nom || 'Inconnu'}</p>
                <p><strong>Heure:</strong> {new Date(selectedMember.created_at).toLocaleTimeString('fr-FR')}</p>
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
      
      {/* Modale statistiques avancées */}
      <Modal show={showStatsModal} onHide={() => setShowStatsModal(false)} size="xl">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <BarChart3 className="me-2" />
            Statistiques avancées
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {advancedStats ? (
            <div>
              {/* Statistiques par service */}
              <h6>Membres par service</h6>
              <Table striped hover size="sm">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Total membres</th>
                    <th>Cette semaine</th>
                    <th>Tendance</th>
                  </tr>
                </thead>
                <tbody>
                  {advancedStats.par_service?.map((stat, index) => (
                    <tr key={index}>
                      <td>{stat.service}</td>
                      <td>{stat.total_membres}</td>
                      <td>{stat.cette_semaine}</td>
                      <td>
                        <ProgressBar
                          now={stat.total_membres > 0 ? (stat.cette_semaine / stat.total_membres) * 100 : 0}
                          variant="info"
                          style={{ height: '6px' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {/* Top quartiers */}
              <h6 className="mt-4">Top 5 quartiers</h6>
              <div className="d-flex flex-wrap gap-3">
                {advancedStats.top_quartiers?.map((quartier, index) => (
                  <Card key={index} className="flex-grow-1">
                    <Card.Body className="text-center">
                      <h4>{quartier.count}</h4>
                      <p className="text-muted small">{quartier.quartier}</p>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted py-4">
              Chargement des statistiques...
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => setShowStatsModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Styles */}
      <style>
        {`
          .bg-gradient-primary {
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%) !important;
          }
          
          .table th {
            border-top: none;
            font-weight: 600;
          }
          
          .table-warning {
            background-color: rgba(255, 193, 7, 0.1) !important;
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
          
          .progress-bar {
            border-radius: 4px;
          }
          
          .dropdown-item.active {
            background-color: #6a11cb;
          }
          
          /* Responsive table */
          @media (max-width: 768px) {
            .table-responsive {
              font-size: 0.9em;
            }
            
            .table td, .table th {
              padding: 0.5rem;
            }
          }
        `}
      </style>
    </Container>
  );
};

export default PresenceOverview;