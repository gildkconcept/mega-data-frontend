import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Container, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import authService from '../services/authService';

const Register = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const initialValues = {
    username: '',
    password: '',
    confirmPassword: '',
    nom: '',
    prenom: '',
    branche: ''
  };

  const validationSchema = Yup.object({
    username: Yup.string()
      .required('Nom d\'utilisateur requis')
      .min(3, 'Minimum 3 caractères')
      .max(20, 'Maximum 20 caractères')
      .matches(/^[a-zA-Z0-9_]+$/, 'Seulement lettres, chiffres et underscore'),
    password: Yup.string()
      .required('Mot de passe requis')
      .min(6, 'Minimum 6 caractères'),
    confirmPassword: Yup.string()
      .required('Confirmation du mot de passe requise')
      .oneOf([Yup.ref('password'), null], 'Les mots de passe ne correspondent pas'),
    nom: Yup.string()
      .required('Nom requis')
      .min(2, 'Minimum 2 caractères'),
    prenom: Yup.string()
      .required('Prénom requis')
      .min(2, 'Minimum 2 caractères'),
    branche: Yup.string()
      .required('Branche requise')
      .min(2, 'Minimum 2 caractères')
  });

  const handleSubmit = async (values) => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Retirer confirmPassword avant l'envoi
    const { confirmPassword, ...submitValues } = values;
    
    try {
      const result = await authService.register(submitValues);
      
      if (result.success) {
        setSuccess('Compte créé avec succès ! Redirection...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(result.message || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-violet">
      <Container className="py-5" style={{ maxWidth: '600px' }}>
        <Row className="justify-content-center">
          <Col>
            <Card className="card-violet shadow-lg">
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <div className="bg-gradient-violet rounded-circle p-3 d-inline-block mb-3">
                    <i className="bi bi-person-plus fs-1 text-white"></i>
                  </div>
                  <h2 className="fw-bold text-violet-dark">Créer un compte</h2>
                  <p className="text-muted">
                    Rejoignez MEGA-DATA pour gérer les membres de l'église
                  </p>
                </div>

                {error && (
                  <Alert variant="danger" className="text-center">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert variant="success" className="text-center">
                    <i className="bi bi-check-circle me-2"></i>
                    {success}
                  </Alert>
                )}

                <Formik
                  initialValues={initialValues}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ errors, touched }) => (
                    <Form>
                      <div className="mb-3">
                        <label htmlFor="username" className="form-label fw-semibold text-violet-dark">
                          Nom d'utilisateur *
                        </label>
                        <Field
                          type="text"
                          name="username"
                          className={`form-control ${errors.username && touched.username ? 'is-invalid' : ''}`}
                          placeholder="Abel Aké"
                        />
                        <small className="form-text text-muted">
                          Lettres, chiffres et underscore uniquement
                        </small>
                        <ErrorMessage
                          name="username"
                          component="div"
                          className="invalid-feedback"
                        />
                      </div>

                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <label htmlFor="prenom" className="form-label fw-semibold text-violet-dark">
                              Prénom *
                            </label>
                            <Field
                              type="text"
                              name="prenom"
                              className={`form-control ${errors.prenom && touched.prenom ? 'is-invalid' : ''}`}
                              placeholder="Votre prénom"
                            />
                            <ErrorMessage
                              name="prenom"
                              component="div"
                              className="invalid-feedback"
                            />
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <label htmlFor="nom" className="form-label fw-semibold text-violet-dark">
                              Nom *
                            </label>
                            <Field
                              type="text"
                              name="nom"
                              className={`form-control ${errors.nom && touched.nom ? 'is-invalid' : ''}`}
                              placeholder="Votre nom"
                            />
                            <ErrorMessage
                              name="nom"
                              component="div"
                              className="invalid-feedback"
                            />
                          </div>
                        </Col>
                      </Row>

                      <div className="mb-3">
                        <label htmlFor="branche" className="form-label fw-semibold text-violet-dark">
                          Branche *
                        </label>
                        <Field
                          type="text"
                          name="branche"
                          className={`form-control ${errors.branche && touched.branche ? 'is-invalid' : ''}`}
                          placeholder="Ex: Branche de bassam"
                        />
                        <ErrorMessage
                          name="branche"
                          component="div"
                          className="invalid-feedback"
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="password" className="form-label fw-semibold text-violet-dark">
                          Mot de passe *
                        </label>
                        <Field
                          type="password"
                          name="password"
                          className={`form-control ${errors.password && touched.password ? 'is-invalid' : ''}`}
                          placeholder="Minimum 6 caractères"
                        />
                        <ErrorMessage
                          name="password"
                          component="div"
                          className="invalid-feedback"
                        />
                      </div>

                      <div className="mb-4">
                        <label htmlFor="confirmPassword" className="form-label fw-semibold text-violet-dark">
                          Confirmer le mot de passe *
                        </label>
                        <Field
                          type="password"
                          name="confirmPassword"
                          className={`form-control ${errors.confirmPassword && touched.confirmPassword ? 'is-invalid' : ''}`}
                          placeholder="Répétez votre mot de passe"
                        />
                        <ErrorMessage
                          name="confirmPassword"
                          component="div"
                          className="invalid-feedback"
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-gradient w-100 py-2 fw-semibold"
                        disabled={loading}
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
                            Création en cours...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-person-plus me-2"></i>
                            Créer mon compte
                          </>
                        )}
                      </button>
                    </Form>
                  )}
                </Formik>

                <div className="text-center mt-4">
                  <p className="mb-0">
                    Vous avez déjà un compte ?{' '}
                    <Link to="/login" className="text-decoration-none fw-semibold text-violet">
                      Se connecter
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Styles CSS intégrés */}
      <style>{`
        .theme-violet {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }
        
        .bg-gradient-violet {
          background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%) !important;
        }
        
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
        
        .card-violet {
          border-top: 4px solid #6a11cb;
          transition: all 0.3s ease;
        }
        
        .card-violet:hover {
          border-color: #8a4bff;
          box-shadow: 0 10px 30px rgba(106, 17, 203, 0.1);
        }
        
        .form-control:focus {
          border-color: #6a11cb;
          box-shadow: 0 0 0 0.25rem rgba(106, 17, 203, 0.25);
        }
      `}</style>
    </div>
  );
};

export default Register;