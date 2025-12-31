import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Alert, Spinner, Button, Badge, Modal, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import MemberForm from '../components/MemberForm';
import authService from '../services/authService';
import memberService from '../services/memberService';

const Dashboard = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // États pour les filtres PDF
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
    quartier: 'tous',
    service: 'tous'
  });
  const [quartiers, setQuartiers] = useState([]);
  const [services, setServices] = useState([]);

  // États pour la recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('nom');

  // Liste complète des services
  const allServices = [
    'Groupe de louange et d\'adoration (GLA)',
    'Voir et Entendre',
    'Suivi',
    '28:19',
    'Service d\'ordre',
    'La communication',
    'La gestion de culte',
    'Le protocole',
    'La logistique',
    'Le Service Book'
  ];

  // CORRIGÉ: Retirer isAdmin des dépendances pour éviter la boucle infinie
  useEffect(() => {
    if (!isAdmin) {
      fetchMembers();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dépendances vides = exécuter une seule fois

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const result = await memberService.getMyMembers();
      
      console.log('📊 Données reçues de l\'API:', result);
      console.log('📋 Membres reçus:', result?.membres);
      
      if (result.success) {
        const membres = result.membres || [];
        
        // S'assurer que tous les membres ont les propriétés nécessaires
        const membresValides = membres.map(membre => ({
          id: membre.id || 0,
          user_id: membre.user_id || 0,
          nom: membre.nom || 'Nom non spécifié',
          prenom: membre.prenom || 'Prénom non spécifié',
          numero: membre.numero || 'Numéro non spécifié',
          quartier: membre.quartier || 'Quartier non spécifié',
          service: membre.service || 'Service non spécifié',
          created_at: membre.created_at || new Date().toISOString(),
          username: membre.username || ''
        }));
        
        setMembers(membresValides);
        
        // Extraire les quartiers uniques pour les filtres
        const uniqueQuartiers = [...new Set(membresValides.map(m => m.quartier).filter(q => q && q !== 'Quartier non spécifié'))].sort();
        setQuartiers(uniqueQuartiers);
        
        // Extraire les services uniques pour les filtres
        const uniqueServices = [...new Set(membresValides.map(m => m.service).filter(s => s && s !== 'Service non spécifié'))].sort();
        setServices(uniqueServices);
        
        if (membresValides.length > 0) {
          console.log('🔍 Premier membre:', membresValides[0]);
          console.log('🔍 Tous les champs disponibles:', Object.keys(membresValides[0]));
        }
      } else {
        setError(result.message || 'Erreur lors du chargement des membres');
      }
    } catch (err) {
      console.error('❌ Erreur API:', err);
      setError(err.response?.data?.message || 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberAdded = (newMember) => {
    const membreValide = {
      id: newMember.id || Date.now(),
      user_id: newMember.user_id || user?.id || 0,
      nom: newMember.nom || 'Nom non spécifié',
      prenom: newMember.prenom || 'Prénom non spécifié',
      numero: newMember.numero || 'Numéro non spécifié',
      quartier: newMember.quartier || 'Quartier non spécifié',
      service: newMember.service || 'Service non spécifié',
      created_at: newMember.created_at || new Date().toISOString(),
      username: user?.username || ''
    };
    
    setMembers([membreValide, ...members]);
    setSuccess('Membre ajouté avec succès !');
    setTimeout(() => setSuccess(''), 3000);
    
    // Mettre à jour la liste des quartiers
    if (!quartiers.includes(membreValide.quartier) && membreValide.quartier !== 'Quartier non spécifié') {
      setQuartiers([...quartiers, membreValide.quartier].sort());
    }
    
    // Mettre à jour la liste des services
    if (membreValide.service && !services.includes(membreValide.service) && membreValide.service !== 'Service non spécifié') {
      setServices([...services, membreValide.service].sort());
    }
  };

  // Fonction utilitaire pour obtenir une valeur sécurisée
  const getSafeValue = (value, defaultValue = 'Non spécifié') => {
    return value && value !== defaultValue ? value : defaultValue;
  };

  // Fonction de recherche
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members;

    const term = searchTerm.toLowerCase().trim();
    
    return members.filter(member => {
      switch (searchType) {
        case 'nom':
          return (
            (member.nom && member.nom.toLowerCase().includes(term)) ||
            (member.prenom && member.prenom.toLowerCase().includes(term))
          );
        
        case 'date':
          try {
            const memberDate = new Date(member.created_at);
            const searchDate = new Date(term);
            
            return (
              memberDate.getFullYear() === searchDate.getFullYear() &&
              memberDate.getMonth() === searchDate.getMonth() &&
              memberDate.getDate() === searchDate.getDate()
            );
          } catch (error) {
            const dateString = new Date(member.created_at).toLocaleDateString('fr-FR');
            return dateString.includes(term);
          }
        
        case 'quartier':
          return member.quartier && member.quartier.toLowerCase().includes(term);
        
        case 'service':
          return member.service && member.service.toLowerCase().includes(term);
        
        default:
          return true;
      }
    });
  }, [members, searchTerm, searchType]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Heure inconnue';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Heure invalide';
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "Date inconnue";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffDays > 0) {
        return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      } else if (diffMinutes > 0) {
        return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
      } else {
        return "À l'instant";
      }
    } catch (error) {
      return "Date inconnue";
    }
  };

  // Fonction pour générer le PDF des membres
  const handleGeneratePDF = async () => {
    try {
      setGeneratingPDF(true);
      const result = await memberService.generateMembersPDF();
      
      if (result.success) {
        setSuccess(`PDF généré avec succès: ${result.filename}`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Erreur lors de la génération du PDF');
      }
    } catch (err) {
      setError('Erreur lors de la génération du PDF: ' + err.message);
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Ouvrir la modal de filtres PDF
  const openFilterModal = () => {
    setFilters({
      dateDebut: '',
      dateFin: '',
      quartier: 'tous',
      service: 'tous'
    });
    setShowFilterModal(true);
  };

  // Générer PDF avec filtres
  const handleFilteredPDF = async () => {
    try {
      setGeneratingPDF(true);
      setShowFilterModal(false);
      
      const result = await memberService.generateFilteredMembersPDF(filters);
      
      if (result.success) {
        setSuccess(`PDF filtré généré: ${result.filename} (${result.count} membres)`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Erreur lors de la génération du PDF filtré');
      }
    } catch (err) {
      setError('Erreur lors de la génération du PDF filtré: ' + err.message);
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Mettre à jour les filtres
  const updateFilter = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Réinitialiser la recherche
  const resetSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="theme-violet">
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <Card className="card-violet shadow-sm">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="fw-bold mb-1 text-violet-dark">
                      <i className="bi bi-speedometer2 me-2"></i>
                      Tableau de bord
                    </h2>
                    <p className="text-muted mb-0">
                      Bienvenue, <span className="fw-semibold text-violet">{user?.prenom || ''} {user?.nom || ''}</span>
                      {isAdmin && (
                        <span className="ms-2">
                          <span className="badge bg-gradient-violet">Administrateur</span>
                        </span>
                      )}
                    </p>
                  </div>
                  {!isAdmin && (
                    <div className="bg-violet-light rounded-pill px-3 py-2">
                      <span className="fw-bold text-violet">
                        <i className="bi bi-people me-1"></i>
                        {members.length} membre{members.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {isAdmin ? (
          <Row>
            <Col>
              <Card className="card-violet shadow-sm">
                <Card.Body className="text-center py-5">
                  <div className="mb-4">
                    <div className="bg-gradient-violet rounded-circle p-4 d-inline-block mb-3">
                      <i className="bi bi-shield-lock fs-1 text-white"></i>
                    </div>
                    <h4 className="fw-bold text-violet-dark">Panel Administrateur</h4>
                    <p className="text-muted">
                      En tant qu'administrateur, vous ne pouvez pas enregistrer de membres.
                    </p>
                  </div>
                  
                  <div className="row justify-content-center">
                    <div className="col-md-6">
                      <Card className="border-violet">
                        <Card.Body>
                          <h5 className="card-title text-violet-dark">
                            <i className="bi bi-gear me-2"></i>
                            Fonctionnalités Administrateur
                          </h5>
                          <ul className="list-unstyled">
                            <li className="mb-2">
                              <i className="bi bi-check-circle text-violet me-2"></i>
                              Gestion complète des utilisateurs
                            </li>
                            <li className="mb-2">
                              <i className="bi bi-check-circle text-violet me-2"></i>
                              Visualisation de tous les membres
                            </li>
                            <li className="mb-2">
                              <i className="bi bi-check-circle text-violet me-2"></i>
                              Modification des rôles
                            </li>
                            <li className="mb-2">
                              <i className="bi bi-check-circle text-violet me-2"></i>
                              Suppression des utilisateurs/membres
                            </li>
                          </ul>
                          <Button 
                            as={Link}
                            to="/admin"
                            className="btn-gradient w-100"
                          >
                            <i className="bi bi-shield-lock me-2"></i>
                            Accéder au panel d'administration
                          </Button>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-muted small">
                      <i className="bi bi-info-circle me-1"></i>
                      Les administrateurs gèrent le système mais n'enregistrent pas de membres.
                      Seuls les utilisateurs avec le rôle "membre" peuvent enregistrer de membres.
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : (
          <>
            <Row>
              <Col lg={5}>
                <Card className="card-violet shadow-sm mb-4">
                  <Card.Header className="bg-gradient-violet text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-person-plus me-2"></i>
                      Ajouter un membre
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <MemberForm onMemberAdded={handleMemberAdded} />
                  </Card.Body>
                </Card>

                {success && (
                  <Alert variant="success" className="text-center">
                    <i className="bi bi-check-circle me-2"></i>
                    {success}
                  </Alert>
                )}

                {error && (
                  <Alert variant="danger" className="text-center">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}
              </Col>

              <Col lg={7}>
                <Card className="card-violet shadow-sm">
                  <Card.Header className="bg-white border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-0 text-violet-dark">
                          <i className="bi bi-list-ul me-2"></i>
                          Mes membres enregistrés ({filteredMembers.length} sur {members.length})
                        </h5>
                        <p className="text-muted small mb-0">
                          {searchTerm && (
                            <span className="text-info">
                              <i className="bi bi-search me-1"></i>
                              Recherche: "{searchTerm}" ({filteredMembers.length} résultat{filteredMembers.length !== 1 ? 's' : ''})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </Card.Header>
                  
                  <Card.Body className="border-bottom bg-light">
                    <Row>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-semibold text-violet-dark">
                            <i className="bi bi-search me-1"></i>
                            Type de recherche
                          </Form.Label>
                          <Form.Select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            size="sm"
                            className="border-violet"
                          >
                            <option value="nom">
                              <i className="bi bi-person me-1"></i>
                              Nom/Prénom
                            </option>
                            <option value="date">
                              <i className="bi bi-calendar me-1"></i>
                              Date
                            </option>
                            <option value="quartier">
                              <i className="bi bi-geo-alt me-1"></i>
                              Quartier
                            </option>
                            <option value="service">
                              <i className="bi bi-person-badge me-1"></i>
                              Service
                            </option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-semibold text-violet-dark">
                            Terme de recherche
                          </Form.Label>
                          <InputGroup size="sm">
                            <Form.Control
                              type="text"
                              placeholder={
                                searchType === 'nom' 
                                  ? "Rechercher par nom ou prénom..." 
                                  : searchType === 'date'
                                  ? "Rechercher par date (JJ/MM/AAAA)..." 
                                  : searchType === 'quartier'
                                  ? "Rechercher par quartier..."
                                  : "Rechercher par service..."
                              }
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="border-violet"
                            />
                            {searchTerm && (
                              <Button
                                variant="outline-violet"
                                onClick={resetSearch}
                                title="Effacer la recherche"
                              >
                                <i className="bi bi-x-lg"></i>
                              </Button>
                            )}
                            <Button variant="gradient" disabled={!searchTerm.trim()}>
                              <i className="bi bi-search"></i>
                            </Button>
                          </InputGroup>
                          <Form.Text className="text-muted small">
                            {searchType === 'date' 
                              ? "Format: JJ/MM/AAAA ou AAAA-MM-JJ" 
                              : searchType === 'service'
                              ? "Ex: GLA, Communication, Logistique..."
                              : "Saisissez votre recherche ci-dessus"}
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={2} className="d-flex align-items-end">
                        <div className="w-100">
                          <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            className="w-100"
                            onClick={resetSearch}
                            disabled={!searchTerm}
                          >
                            <i className="bi bi-arrow-counterclockwise me-1"></i>
                            Réinitialiser
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>

                  <Card.Body className="p-0">
                    {loading ? (
                      <div className="text-center py-5">
                        <Spinner animation="border" className="spinner-violet" />
                        <p className="mt-2 text-muted">Chargement des membres...</p>
                      </div>
                    ) : error ? (
                      <Alert variant="warning" className="m-3">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                      </Alert>
                    ) : filteredMembers.length === 0 ? (
                      <div className="text-center py-5">
                        <div className="bg-violet-light rounded-circle p-4 d-inline-block mb-3">
                          <i className="bi bi-search fs-1 text-violet"></i>
                        </div>
                        {searchTerm ? (
                          <>
                            <p className="text-muted">Aucun membre trouvé pour "{searchTerm}"</p>
                            <p className="small text-muted">
                              Essayez avec un autre terme ou réinitialisez la recherche
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-muted">Aucun membre enregistré</p>
                            <p className="small text-muted">
                              Commencez par ajouter un membre en utilisant le formulaire
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table hover className="mb-0">
                          <thead className="table-violet">
                            <tr>
                              <th className="text-white">Nom & Prénom</th>
                              <th className="text-white">
                                <i className="bi bi-telephone me-1"></i>
                                Numéro
                              </th>
                              <th className="text-white">
                                <i className="bi bi-geo-alt me-1"></i>
                                Quartier
                              </th>
                              <th className="text-white">
                                <i className="bi bi-person-badge me-1"></i>
                                Service
                              </th>
                              <th className="text-white">
                                <i className="bi bi-calendar me-1"></i>
                                Date d'enregistrement
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredMembers.map((member) => (
                              <tr key={member.id || member.created_at || Math.random()}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="bg-violet-light rounded-circle p-2 me-2">
                                      <i className="bi bi-person text-violet"></i>
                                    </div>
                                    <div>
                                      <strong className="text-violet-dark">
                                        {getSafeValue(member.nom, 'Nom manquant')} {getSafeValue(member.prenom, 'Prénom manquant')}
                                      </strong>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <i className="bi bi-telephone me-2 text-muted"></i>
                                    <span>{getSafeValue(member.numero)}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className="badge bg-violet-light text-violet">
                                    <i className="bi bi-geo-alt me-1"></i>
                                    {getSafeValue(member.quartier)}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge bg-info bg-opacity-10 text-info">
                                    <i className="bi bi-person-badge me-1"></i>
                                    {getSafeValue(member.service)}
                                  </span>
                                </td>
                                <td className="text-muted small">
                                  <div className="d-flex flex-column">
                                    <div>
                                      <i className="bi bi-calendar me-1"></i>
                                      {formatDate(member.created_at)}
                                    </div>
                                    <div>
                                      <i className="bi bi-clock me-1"></i>
                                      {formatTime(member.created_at)}
                                    </div>
                                    <div className="mt-1">
                                      <span className="badge bg-info bg-opacity-10 text-info">
                                        {getTimeAgo(member.created_at)}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                  <Card.Footer className="bg-white border-top">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <small className="text-muted">
                          {searchTerm 
                            ? `${filteredMembers.length} résultat${filteredMembers.length !== 1 ? 's' : ''} trouvé${filteredMembers.length !== 1 ? 's' : ''}`
                            : `Affichage de ${Math.min(filteredMembers.length, 10)} membres • Total: ${members.length}`
                          }
                        </small>
                      </div>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-violet" 
                          size="sm"
                          onClick={fetchMembers}
                          disabled={loading}
                        >
                          <i className="bi bi-arrow-clockwise me-1"></i>
                          Actualiser
                        </Button>
                        <Button 
                          variant="info" 
                          size="sm"
                          onClick={openFilterModal}
                          disabled={members.length === 0 || generatingPDF}
                        >
                          <i className="bi bi-funnel me-1"></i>
                          PDF Filtre
                        </Button>
                      </div>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>

      <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)} size="lg">
        <Modal.Header closeButton className="bg-gradient-violet text-white">
          <Modal.Title>
            <i className="bi bi-funnel me-2"></i>
            Filtres pour l'export PDF
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Date de début</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.dateDebut}
                    onChange={(e) => updateFilter('dateDebut', e.target.value)}
                    className="border-violet"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Date de fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.dateFin}
                    onChange={(e) => updateFilter('dateFin', e.target.value)}
                    className="border-violet"
                    min={filters.dateDebut}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Quartier</Form.Label>
                  <Form.Select
                    value={filters.quartier}
                    onChange={(e) => updateFilter('quartier', e.target.value)}
                    className="border-violet"
                  >
                    <option value="tous">Tous les quartiers</option>
                    {quartiers.map((quartier, index) => (
                      <option key={index} value={quartier}>{quartier}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Service</Form.Label>
                  <Form.Select
                    value={filters.service}
                    onChange={(e) => updateFilter('service', e.target.value)}
                    className="border-violet"
                  >
                    <option value="tous">Tous les services</option>
                    {allServices.map((service, index) => (
                      <option key={index} value={service}>{service}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Card className="border-violet mb-3">
              <Card.Header className="bg-violet-light">
                <h6 className="mb-0 text-violet-dark">
                  <i className="bi bi-info-circle me-2"></i>
                  Résumé des filtres
                </h6>
              </Card.Header>
              <Card.Body>
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">
                    <i className="bi bi-calendar-check text-violet me-2"></i>
                    <strong>Période:</strong>{' '}
                    {filters.dateDebut && filters.dateFin 
                      ? `${new Date(filters.dateDebut).toLocaleDateString('fr-FR')} au ${new Date(filters.dateFin).toLocaleDateString('fr-FR')}`
                      : 'Toutes les dates'
                    }
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-geo-alt text-violet me-2"></i>
                    <strong>Quartier:</strong>{' '}
                    {filters.quartier === 'tous' ? 'Tous les quartiers' : filters.quartier}
                  </li>
                  <li>
                    <i className="bi bi-person-badge text-violet me-2"></i>
                    <strong>Service:</strong>{' '}
                    {filters.service === 'tous' ? 'Tous les services' : filters.service}
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-violet" onClick={() => setShowFilterModal(false)}>
            Annuler
          </Button>
          <Button 
            variant="gradient" 
            onClick={handleFilteredPDF}
            disabled={generatingPDF || (!filters.dateDebut && filters.dateFin) || (filters.dateDebut && !filters.dateFin)}
          >
            {generatingPDF ? (
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
                <i className="bi bi-file-earmark-pdf me-2"></i>
                Générer PDF Filtre
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .theme-violet {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }
        
        .text-gradient-violet {
          background: linear-gradient(90deg, #6a11cb, #2575fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .bg-gradient-violet {
          background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%) !important;
        }
        
        .text-violet { color: #6a11cb !important; }
        .text-violet-dark { color: #4a00b8 !important; }
        .bg-violet-light { background-color: #f3e5f5 !important; }
        
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
        
        .table-violet {
          background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
        }
        
        .table-violet th {
          border: none;
        }
        
        .spinner-violet {
          color: #6a11cb;
        }
        
        .badge.bg-violet-light {
          background-color: #f3e5f5 !important;
          color: #6a11cb !important;
        }
        
        .border-violet {
          border-color: #6a11cb !important;
        }
        
        .form-control.border-violet:focus {
          border-color: #6a11cb;
          box-shadow: 0 0 0 0.25rem rgba(106, 17, 203, 0.25);
        }
        
        @keyframes highlight {
          0% { background-color: rgba(106, 17, 203, 0.1); }
          100% { background-color: transparent; }
        }
        
        .search-highlight {
          animation: highlight 2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;