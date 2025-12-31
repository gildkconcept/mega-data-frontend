import React, { useState, useEffect, useMemo } from 'react';
import { 
  Container, Row, Col, Card, Table, Alert, 
  Button, Badge, Form, Spinner, InputGroup,
  Modal, FormCheck
} from 'react-bootstrap';
import { 
  CheckCircle, XCircle, Calendar, Users, 
  Download, Printer, CheckSquare, Square,
  TrendingUp, BarChart3, Check, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import presenceService from '../services/presenceService';
import memberService from '../services/memberService';
import authService from '../services/authService';

const PresencePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // États pour la présence
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [members, setMembers] = useState([]);
  const [presences, setPresences] = useState({}); // { membreId: {present: true, commentaire: ''} }
  const [presenceStats, setPresenceStats] = useState({ total: 0, presents: 0, absents: 0 });
  
  // États pour les modales et filtres
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [statsData, setStatsData] = useState([]);
  
  const user = authService.getCurrentUser();
  const serviceAssigne = user?.service_assigne;

  useEffect(() => {
    if (!user || user.role !== 'berger') {
      navigate('/');
      return;
    }
    
    if (!serviceAssigne) {
      setError('Aucun service assigné à ce berger');
      setLoading(false);
      return;
    }
    
    loadData();
  }, [selectedDate, serviceAssigne]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Charger les membres du service
      const membersResult = await memberService.getMembers();
      
      if (!membersResult.success) {
        throw new Error(membersResult.message || 'Erreur chargement membres');
      }
      
      const serviceMembers = membersResult.membres || [];
      setMembers(serviceMembers);
      
      // Charger les présences existantes pour la date sélectionnée
      let presenceResult;
      try {
        presenceResult = await presenceService.getPresencesByDate(selectedDate);
      } catch (err) {
        // Si pas encore de présences pour cette date, c'est normal
        presenceResult = { success: true, membres: [] };
      }
      
      // Initialiser les présences - TOUS marqués comme PRÉSENTS par défaut
      const initialPresences = {};
      serviceMembers.forEach(member => {
        const existingPresence = presenceResult.membres?.find(
          p => p.membre_id === member.id
        );
        
        // Par défaut, tous sont marqués comme présents
        initialPresences[member.id] = {
          present: existingPresence?.presence?.present ?? true,
          commentaire: existingPresence?.presence?.commentaire || ''
        };
      });
      
      setPresences(initialPresences);
      updateStats(initialPresences, serviceMembers.length);
      
    } catch (err) {
      console.error('❌ Erreur chargement données:', err);
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (presencesData, totalMembers) => {
    const presents = Object.values(presencesData).filter(p => p.present).length;
    const absents = totalMembers - presents;
    
    setPresenceStats({
      total: totalMembers,
      presents,
      absents,
      taux: totalMembers > 0 ? Math.round((presents / totalMembers) * 100) : 0
    });
  };

  const handlePresenceToggle = (memberId) => {
    setPresences(prev => {
      const newPresence = !prev[memberId]?.present;
      const updated = {
        ...prev,
        [memberId]: {
          ...prev[memberId],
          present: newPresence,
          commentaire: newPresence ? '' : 'Absent'
        }
      };
      
      updateStats(updated, members.length);
      return updated;
    });
  };

  const handleCommentChange = (memberId, commentaire) => {
    setPresences(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        commentaire
      }
    }));
  };

  const savePresences = async () => {
    try {
      setSaving(true);
      setError('');
      
      const promises = Object.entries(presences).map(([membreId, presenceData]) => {
        return presenceService.recordPresence({
          membre_id: parseInt(membreId),
          date: selectedDate,
          present: presenceData.present,
          commentaire: presenceData.commentaire || ''
        });
      });
      
      await Promise.all(promises);
      
      setSuccess('Présences enregistrées avec succès !');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('❌ Erreur enregistrement présences:', err);
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = async () => {
    const confirm = window.confirm('Marquer tous les membres comme présents ?');
    if (!confirm) return;
    
    try {
      setSaving(true);
      const result = await presenceService.markAllPresent(selectedDate);
      
      if (result.success) {
        // Mettre à jour l'état local
        const updatedPresences = {};
        members.forEach(member => {
          updatedPresences[member.id] = {
            present: true,
            commentaire: 'Marqué présent automatiquement'
          };
        });
        
        setPresences(updatedPresences);
        updateStats(updatedPresences, members.length);
        
        setSuccess(result.message);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Erreur lors du marquage global');
    } finally {
      setSaving(false);
    }
  };

  const markAllAbsent = () => {
    const confirm = window.confirm('Marquer tous les membres comme absents ?');
    if (!confirm) return;
    
    const updatedPresences = {};
    members.forEach(member => {
      updatedPresences[member.id] = {
        present: false,
        commentaire: 'Absent'
      };
    });
    
    setPresences(updatedPresences);
    updateStats(updatedPresences, members.length);
    setSuccess('Tous les membres marqués comme absents');
    setTimeout(() => setSuccess(''), 3000);
  };

  const loadStats = async () => {
    try {
      const endDate = selectedDate;
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 30); // 30 derniers jours
      
      const result = await presenceService.getPresenceStats(
        startDate.toISOString().split('T')[0],
        endDate
      );
      
      if (result.success) {
        setStatsData(result.stats || []);
        setShowStatsModal(true);
      }
    } catch (err) {
      console.error('❌ Erreur chargement stats:', err);
    }
  };

  const exportPresenceReport = async () => {
    try {
      const result = await presenceService.generatePresenceReport(selectedDate);
      
      if (result.success) {
        // Ici, vous pourriez générer un PDF
        setSuccess('Rapport généré avec succès');
        setShowExportModal(false);
      }
    } catch (err) {
      setError('Erreur génération rapport');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Chargement des données de présence...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* En-tête */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-primary">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="fw-bold mb-2 text-primary">
                    <CheckCircle className="me-3" size={32} />
                    Gestion des Présences
                  </h1>
                  <div className="d-flex align-items-center">
                    <Badge bg="primary" className="me-3">
                      <Users size={16} className="me-1" />
                      {serviceAssigne}
                    </Badge>
                    <span className="text-dark">
                      <strong>Date:</strong> {formatDate(selectedDate)}
                    </span>
                  </div>
                </div>
                <div>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Changer de date</Form.Label>
                    <Form.Control
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border-primary"
                    />
                  </Form.Group>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Messages */}
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {success && (
        <Row className="mb-4">
          <Col>
            <Alert variant="success" dismissible onClose={() => setSuccess('')}>
              <CheckCircle className="me-2" />
              {success}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Statistiques rapides */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm border-primary border-top border-3">
            <Card.Body className="text-center">
              <div className="display-4 fw-bold text-primary">
                {presenceStats.total}
              </div>
              <Users size={24} className="text-primary mb-2" />
              <p className="text-muted mb-0">Total membres</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="shadow-sm border-success border-top border-3">
            <Card.Body className="text-center">
              <div className="display-4 fw-bold text-success">
                {presenceStats.presents}
              </div>
              <CheckCircle size={24} className="text-success mb-2" />
              <p className="text-muted mb-0">Présents</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="shadow-sm border-danger border-top border-3">
            <Card.Body className="text-center">
              <div className="display-4 fw-bold text-danger">
                {presenceStats.absents}
              </div>
              <XCircle size={24} className="text-danger mb-2" />
              <p className="text-muted mb-0">Absents</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="shadow-sm border-info border-top border-3">
            <Card.Body className="text-center">
              <div className="display-4 fw-bold text-info">
                {presenceStats.taux}%
              </div>
              <TrendingUp size={24} className="text-info mb-2" />
              <p className="text-muted mb-0">Taux de présence</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Boutons d'action */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div className="d-flex flex-wrap gap-2">
                  <Button 
                    variant="success" 
                    className="me-2"
                    onClick={savePresences}
                    disabled={saving || members.length === 0}
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} className="me-2" />
                        Enregistrer les présences
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline-primary" 
                    className="me-2"
                    onClick={markAllPresent}
                    disabled={saving || members.length === 0}
                  >
                    <CheckSquare size={18} className="me-2" />
                    Tous présents
                  </Button>
                  
                  <Button 
                    variant="outline-danger" 
                    className="me-2"
                    onClick={markAllAbsent}
                    disabled={saving || members.length === 0}
                  >
                    <XCircle size={18} className="me-2" />
                    Tous absents
                  </Button>
                </div>
                
                <div className="d-flex flex-wrap gap-2">
                  <Button 
                    variant="outline-info" 
                    className="me-2"
                    onClick={loadStats}
                  >
                    <BarChart3 size={18} className="me-2" />
                    Statistiques
                  </Button>
                  
                  <Button 
                    variant="outline-success"
                    onClick={() => setShowExportModal(true)}
                  >
                    <Download size={18} className="me-2" />
                    Exporter
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tableau des présences AVEC CASES À COCHER */}
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">
                  <Calendar className="me-2" />
                  Liste des membres - {formatDate(selectedDate)}
                </h5>
                <small className="text-muted">
                  {members.length} membre{members.length !== 1 ? 's' : ''} dans le service
                </small>
              </div>
              <Badge bg="primary">
                {presenceStats.presents}/{presenceStats.total} présents
              </Badge>
            </Card.Header>
            
            <Card.Body className="p-0">
              {members.length === 0 ? (
                <div className="text-center py-5">
                  <Users size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">Aucun membre dans ce service</h5>
                  <p className="text-muted">
                    Vous devez d'abord ajouter des membres dans votre service.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th width="50">#</th>
                        <th>Nom & Prénom</th>
                        <th>Quartier</th>
                        <th width="100" className="text-center">Présent</th>
                        <th width="300">Commentaire</th>
                        <th width="100" className="text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member, index) => (
                        <tr key={member.id} className={!presences[member.id]?.present ? 'table-warning' : ''}>
                          <td className="text-muted">{index + 1}</td>
                          <td>
                            <strong>{member.nom} {member.prenom}</strong>
                          </td>
                          <td>
                            <Badge bg="info">{member.quartier}</Badge>
                          </td>
                          <td className="text-center">
                            {/* Case à cocher individuelle */}
                            <Form.Check
                              type="checkbox"
                              id={`presence-${member.id}`}
                              checked={presences[member.id]?.present || false}
                              onChange={() => handlePresenceToggle(member.id)}
                              className="d-inline-block"
                              style={{ transform: 'scale(1.5)' }}
                            />
                          </td>
                          <td>
                            <InputGroup size="sm">
                              <Form.Control
                                type="text"
                                placeholder="Commentaire (optionnel)"
                                value={presences[member.id]?.commentaire || ''}
                                onChange={(e) => handleCommentChange(member.id, e.target.value)}
                                disabled={presences[member.id]?.present}
                              />
                              {!presences[member.id]?.present && (
                                <Button 
                                  variant="outline-secondary" 
                                  size="sm"
                                  onClick={() => handleCommentChange(member.id, 'Absent')}
                                >
                                  <X size={14} />
                                </Button>
                              )}
                            </InputGroup>
                          </td>
                          <td className="text-center">
                            {presences[member.id]?.present ? (
                              <Badge bg="success" className="px-3 py-2">
                                <Check size={14} className="me-1" />
                                Présent
                              </Badge>
                            ) : (
                              <Badge bg="danger" className="px-3 py-2">
                                <X size={14} className="me-1" />
                                Absent
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
            
            <Card.Footer className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Cochez/décochez la case pour marquer présent/absent
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={markAllPresent}
                    disabled={members.length === 0}
                  >
                    <CheckSquare size={14} className="me-1" />
                    Tous présents
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={markAllAbsent}
                    disabled={members.length === 0}
                  >
                    <XCircle size={14} className="me-1" />
                    Tous absents
                  </Button>
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={savePresences}
                    disabled={saving || members.length === 0}
                  >
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </div>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Légende */}
      <Row className="mt-3">
        <Col>
          <Card className="shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex flex-wrap align-items-center gap-4">
                <div className="d-flex align-items-center">
                  <div className="bg-success rounded-circle p-2 me-2"></div>
                  <small>Présent</small>
                </div>
                <div className="d-flex align-items-center">
                  <div className="bg-warning rounded-circle p-2 me-2"></div>
                  <small>Absent (sur fond jaune)</small>
                </div>
                <div className="d-flex align-items-center">
                  <Form.Check
                    type="checkbox"
                    checked={true}
                    readOnly
                    className="me-2"
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <small>Cochez/décochez pour changer le statut</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modale de statistiques */}
      <Modal show={showStatsModal} onHide={() => setShowStatsModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <BarChart3 className="me-2" />
            Statistiques de présence
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {statsData.length === 0 ? (
            <p className="text-center text-muted py-4">
              Aucune donnée de présence disponible pour cette période.
            </p>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="text-center">Total</th>
                    <th className="text-center">Présents</th>
                    <th className="text-center">Absents</th>
                    <th className="text-center">Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {statsData.map((stat, index) => (
                    <tr key={index}>
                      <td>{new Date(stat.date).toLocaleDateString('fr-FR')}</td>
                      <td className="text-center">{stat.total_membres}</td>
                      <td className="text-center text-success">
                        <strong>{stat.presents}</strong>
                      </td>
                      <td className="text-center text-danger">
                        {stat.absents}
                      </td>
                      <td className="text-center">
                        <Badge bg={stat.taux_presence >= 80 ? "success" : "warning"}>
                          {stat.taux_presence}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => setShowStatsModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modale d'export */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <Download className="me-2" />
            Exporter les présences
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Sélectionnez le format d'export :</p>
          <div className="d-grid gap-2">
            <Button variant="outline-primary" onClick={exportPresenceReport}>
              <i className="bi bi-file-earmark-text me-2"></i>
              Rapport détaillé (PDF)
            </Button>
            <Button variant="outline-success">
              <i className="bi bi-file-earmark-excel me-2"></i>
              Fichier Excel
            </Button>
            <Button variant="outline-info">
              <i className="bi bi-printer me-2"></i>
              Imprimer la liste
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowExportModal(false)}>
            Annuler
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Styles */}
      <style>
        {`
          .table td, .table th {
            vertical-align: middle;
          }
          
          .btn-outline-success:hover {
            background-color: #198754;
            color: white;
          }
          
          .btn-outline-danger:hover {
            background-color: #dc3545;
            color: white;
          }
          
          .form-control:disabled {
            background-color: #f8f9fa;
            cursor: not-allowed;
          }
          
          .table-warning {
            background-color: rgba(255, 193, 7, 0.1) !important;
          }
          
          .form-check-input:checked {
            background-color: #198754;
            border-color: #198754;
          }
          
          .form-check-input:focus {
            border-color: #198754;
            box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25);
          }
          
          /* Animation pour les changements de statut */
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          
          .form-check-input:checked {
            animation: pulse 0.3s ease;
          }
          
          /* Style pour les lignes des absents */
          tr.table-warning:hover {
            background-color: rgba(255, 193, 7, 0.2) !important;
          }
          
          /* Style pour les cases à cocher */
          .form-check {
            margin: 0;
            padding: 0;
          }
          
          .form-check-input {
            cursor: pointer;
            margin-top: 0;
          }
        `}
      </style>
    </Container>
  );
};

export default PresencePage;