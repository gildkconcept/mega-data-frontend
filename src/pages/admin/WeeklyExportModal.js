import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Calendar, Download } from 'lucide-react';
import presenceAdminService from '../../services/presenceAdminService';

const WeeklyExportModal = ({ show, onHide }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [service, setService] = useState('tous');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Liste des services
  const services = [
    'tous',
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
  ];
  
  const handleExport = async () => {
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner les dates de début et de fin');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      setError('La date de début doit être avant la date de fin');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const result = await presenceAdminService.exportWeeklyPresencesPDF(
        startDate, 
        endDate, 
        service !== 'tous' ? service : null
      );
      
      if (result.success) {
        setSuccess(`PDF hebdomadaire généré: ${result.filename}`);
        setTimeout(() => {
          setSuccess('');
          onHide();
        }, 3000);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculer la date par défaut (dernière semaine)
  const getDefaultDates = () => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    return {
      start: lastWeek.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };
  
  // Initialiser les dates par défaut
  React.useEffect(() => {
    if (show && !startDate) {
      const defaultDates = getDefaultDates();
      setStartDate(defaultDates.start);
      setEndDate(defaultDates.end);
    }
  }, [show]);
  
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton className="bg-gradient-primary text-white">
        <Modal.Title>
          <Calendar className="me-2" />
          Export PDF Hebdomadaire
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success">
            <i className="bi bi-check-circle me-2"></i>
            {success}
          </Alert>
        )}
        
        <Form>
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  <i className="bi bi-calendar-date me-1"></i>
                  Date de début *
                </Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || new Date().toISOString().split('T')[0]}
                  className="border-primary"
                />
                <Form.Text className="text-muted">
                  Premier jour de la période
                </Form.Text>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  <i className="bi bi-calendar-check me-1"></i>
                  Date de fin *
                </Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={new Date().toISOString().split('T')[0]}
                  className="border-primary"
                />
                <Form.Text className="text-muted">
                  Dernier jour de la période
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">
              <i className="bi bi-person-badge me-1"></i>
              Service (optionnel)
            </Form.Label>
            <Form.Select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="border-primary"
            >
              {services.map((serv, index) => (
                <option key={index} value={serv}>
                  {serv === 'tous' ? 'Tous les services' : serv}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Laissez "Tous les services" pour un rapport complet
            </Form.Text>
          </Form.Group>
          
          {/* Informations de la période */}
          {startDate && endDate && (
            <div className="alert alert-info">
              <div className="d-flex align-items-center">
                <i className="bi bi-info-circle fs-4 me-3"></i>
                <div>
                  <strong>Période sélectionnée:</strong>
                  <p className="mb-0">
                    Du {new Date(startDate).toLocaleDateString('fr-FR')} 
                    au {new Date(endDate).toLocaleDateString('fr-FR')}
                  </p>
                  <small className="text-muted">
                    {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1} jours
                  </small>
                </div>
              </div>
            </div>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Annuler
        </Button>
        <Button 
          variant="primary" 
          onClick={handleExport}
          disabled={loading || !startDate || !endDate}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Génération...
            </>
          ) : (
            <>
              <Download className="me-2" />
              Exporter PDF Hebdomadaire
            </>
          )}
        </Button>
      </Modal.Footer>
      
      <style>
        {`
          .bg-gradient-primary {
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%) !important;
          }
          
          .border-primary {
            border-color: #6a11cb !important;
          }
          
          .btn-primary {
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%) !important;
            border: none;
          }
          
          .btn-primary:hover {
            background: linear-gradient(135deg, #5a0db8 0%, #1c68e8 100%) !important;
          }
        `}
      </style>
    </Modal>
  );
};

export default WeeklyExportModal;