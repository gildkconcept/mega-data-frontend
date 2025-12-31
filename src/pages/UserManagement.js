import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Alert, Spinner, Button, Badge, Modal, Form } from 'react-bootstrap';
import memberService from '../services/memberService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  // États pour la modale de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // États pour la modale de changement de rôle
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState(null);
  const [newRole, setNewRole] = useState('member');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await memberService.getAllUsers();
      
      if (result.success) {
        setUsers(result.users || []);
      } else {
        setError(result.message || 'Erreur lors du chargement des utilisateurs');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleRoleClick = (user) => {
    setUserToUpdate(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const result = await memberService.deleteUser(userToDelete.id);
      
      if (result.success) {
        setUsers(users.filter(user => user.id !== userToDelete.id));
        setSuccess(`Utilisateur ${userToDelete.username} supprimé avec succès`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const updateUserRole = async () => {
    if (!userToUpdate) return;
    
    try {
      const result = await memberService.updateUserRole(userToUpdate.id, newRole);
      
      if (result.success) {
        setUsers(users.map(user => 
          user.id === userToUpdate.id ? { ...user, role: newRole } : user
        ));
        setSuccess(`Rôle de ${userToUpdate.username} mis à jour à "${newRole}"`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setShowRoleModal(false);
      setUserToUpdate(null);
    }
  };

  // Fonction pour générer le PDF des utilisateurs
  const handleGeneratePDF = async () => {
    try {
      setGeneratingPDF(true);
      const result = await memberService.generateUsersPDF();
      
      if (result.success) {
        setSuccess(`PDF généré avec succès: ${result.filename}`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Erreur lors de la génération du PDF');
      }
    } catch (err) {
      setError('Erreur lors de la génération du PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge bg="gradient-violet">Administrateur</Badge>;
      case 'member':
        return <Badge bg="success">Membre</Badge>;
      default:
        return <Badge bg="secondary">{role}</Badge>;
    }
  };

  const stats = {
    totalUsers: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    members: users.filter(u => u.role === 'member').length
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
                      <i className="bi bi-people-fill me-2"></i>
                      Gestion des Utilisateurs
                    </h2>
                    <p className="text-muted mb-0">
                      Gérez les utilisateurs et leurs rôles
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-violet" 
                      onClick={fetchUsers}
                      disabled={loading || generatingPDF}
                    >
                      <i className="bi bi-arrow-clockwise me-1"></i>
                      Actualiser
                    </Button>
                    <Button 
                      className="btn-gradient"
                      onClick={handleGeneratePDF}
                      disabled={generatingPDF || users.length === 0}
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
                          Génération PDF...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-file-earmark-pdf me-2"></i>
                          Générer PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Statistiques */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className="card-violet shadow-sm">
              <Card.Body className="text-center">
                <h1 className="fw-bold text-gradient-violet">{stats.totalUsers}</h1>
                <p className="text-muted mb-0">Utilisateurs</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="card-violet shadow-sm">
              <Card.Body className="text-center">
                <h1 className="fw-bold text-gradient-violet">{stats.admins}</h1>
                <p className="text-muted mb-0">Administrateurs</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="card-violet shadow-sm">
              <Card.Body className="text-center">
                <h1 className="fw-bold text-gradient-violet">{stats.members}</h1>
                <p className="text-muted mb-0">Membres</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {error && (
          <Row className="mb-3">
            <Col>
              <Alert variant="danger" onClose={() => setError('')} dismissible>
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </Alert>
            </Col>
          </Row>
        )}

        {success && (
          <Row className="mb-3">
            <Col>
              <Alert variant="success" onClose={() => setSuccess('')} dismissible>
                <i className="bi bi-check-circle me-2"></i>
                {success}
              </Alert>
            </Col>
          </Row>
        )}

        <Row>
          <Col>
            <Card className="card-violet shadow-sm">
              <Card.Header className="bg-white border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 text-violet-dark">
                    <i className="bi bi-person-badge me-2"></i>
                    Liste des utilisateurs ({users.length})
                  </h5>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-violet" 
                      size="sm"
                      onClick={handleGeneratePDF}
                      disabled={generatingPDF || users.length === 0}
                    >
                      <i className="bi bi-file-earmark-pdf me-1"></i>
                      PDF
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" className="spinner-violet" />
                    <p className="mt-2 text-muted">Chargement des utilisateurs...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="bg-violet-light rounded-circle p-4 d-inline-block mb-3">
                      <i className="bi bi-people fs-1 text-violet"></i>
                    </div>
                    <p className="text-muted">Aucun utilisateur</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="table-violet">
                        <tr>
                          <th className="text-white">ID</th>
                          <th className="text-white">Nom d'utilisateur</th>
                          <th className="text-white">Nom & Prénom</th>
                          <th className="text-white">Branche</th>
                          <th className="text-white">Rôle</th>
                          <th className="text-white">Date d'inscription</th>
                          <th className="text-white">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="text-muted">#{user.id}</td>
                            <td>
                              <strong className="text-violet-dark">{user.username}</strong>
                            </td>
                            <td>{user.prenom} {user.nom}</td>
                            <td>{user.branche}</td>
                            <td>{getRoleBadge(user.role)}</td>
                            <td className="text-muted small">
                              {formatDate(user.created_at)}
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => handleRoleClick(user)}
                                  title="Modifier le rôle"
                                >
                                  <i className="bi bi-person-gear"></i>
                                </Button>
                                {user.role !== 'admin' && (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteClick(user)}
                                    title="Supprimer"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </Button>
                                )}
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
                  <small className="text-muted">
                    {users.length} résultat{users.length !== 1 ? 's' : ''}
                  </small>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-violet" 
                      size="sm"
                      onClick={handleGeneratePDF}
                      disabled={generatingPDF || users.length === 0}
                    >
                      <i className="bi bi-printer me-1"></i>
                      Imprimer PDF
                    </Button>
                  </div>
                </div>
              </Card.Footer>
            </Card>
          </Col>
        </Row>

        {/* Modale de suppression */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title className="text-violet-dark">Confirmer la suppression</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete?.username}</strong> ?
            </p>
            <p className="text-danger">
              <i className="bi bi-exclamation-triangle me-1"></i>
              Cette action supprimera également tous les membres enregistrés par cet utilisateur.
              Cette action est irréversible.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-violet" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Supprimer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modale de changement de rôle */}
        <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title className="text-violet-dark">Modifier le rôle</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Modifier le rôle de <strong>{userToUpdate?.username}</strong>
            </p>
            <Form.Group>
              <Form.Label className="text-violet-dark">Nouveau rôle</Form.Label>
              <Form.Select 
                value={newRole} 
                onChange={(e) => setNewRole(e.target.value)}
                className="border-violet"
              >
                <option value="member">Membre</option>
                <option value="admin">Administrateur</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Note: Les administrateurs ne peuvent pas enregistrer de membres
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-violet" onClick={() => setShowRoleModal(false)}>
              Annuler
            </Button>
            <Button variant="gradient" onClick={updateUserRole}>
              Mettre à jour
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>

      {/* Styles CSS intégrés */}
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
        
        .table-violet {
          background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
        }
        
        .table-violet th {
          border: none;
        }
        
        .spinner-violet {
          color: #6a11cb;
        }
        
        .badge.bg-gradient-violet {
          background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%) !important;
          color: white !important;
        }
        
        .form-control.border-violet:focus {
          border-color: #6a11cb;
          box-shadow: 0 0 0 0.25rem rgba(106, 17, 203, 0.25);
        }
      `}</style>
    </div>
  );
};

export default UserManagement;