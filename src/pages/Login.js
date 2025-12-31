import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Container, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import authService from '../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Rediriger si déjà connecté - CORRIGÉ
  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();
    if (isAuthenticated) {
      const user = authService.getCurrentUser();
      // Redirection selon le rôle - CORRECTION BERGER
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        navigate('/admin');
      } else if (user?.role === 'berger') {
        navigate('/berger');  // ← AJOUTÉ
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  const initialValues = {
    login: '',
    password: ''
  };

  const validationSchema = Yup.object({
    login: Yup.string()
      .required('Veuillez saisir votre nom d\'utilisateur')
      .min(3, 'Minimum 3 caractères'),
    password: Yup.string()
      .required('Veuillez saisir votre mot de passe')
      .min(6, 'Minimum 6 caractères')
  });

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);
    
    try {
      const result = await authService.login(values);
      
      if (result.success) {
        // Vérifier le rôle et rediriger en conséquence - CORRECTION BERGER
        if (result.user?.role === 'admin' || result.user?.role === 'super_admin') {
          navigate('/admin');
        } else if (result.user?.role === 'berger') {
          navigate('/berger');  // ← AJOUTÉ
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.message || 'Identifiants incorrects');
      }
    } catch (err) {
      // Gestion d'erreurs améliorée
      if (err.response?.status === 401) {
        setError('Identifiants incorrects. Vérifiez votre nom d\'utilisateur et mot de passe.');
      } else if (err.response?.status === 500) {
        setError('Erreur serveur. Veuillez réessayer plus tard.');
      } else if (!err.response) {
        setError('Problème de connexion. Vérifiez votre internet.');
      } else {
        setError(err.response?.data?.message || 'Erreur de connexion. Veuillez vérifier vos identifiants.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-violet">
      <Container className="py-5">
        <Row className="justify-content-center align-items-center min-vh-80">
          <Col md={8} lg={6} xl={5}>
            <div className="text-center mb-5">
              <div className="d-inline-block p-3 rounded-circle bg-gradient-violet shadow-lg mb-3">
                <i className="bi bi-church-fill text-white" style={{ fontSize: '3rem' }}></i>
              </div>
              <h1 className="display-5 fw-bold text-gradient-violet mb-2">MEGA-DATA</h1>
              <p className="text-muted fs-5">Système de gestion numérique des membres</p>
            </div>

            <Card className="card-violet shadow-lg animate-fade-in">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold mb-2 text-violet-dark">Connexion</h2>
                  <p className="text-muted">Accédez à votre espace personnel</p>
                </div>

                {error && (
                  <Alert variant="danger" className="border-0 shadow-sm text-center animate-slide-in">
                    <i className="bi bi-shield-exclamation me-2"></i>
                    {error}
                  </Alert>
                )}

                <Formik
                  initialValues={initialValues}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ errors, touched, isValid, dirty }) => (
                    <Form>
                      <div className="mb-4">
                        <label htmlFor="login" className="form-label fw-semibold">
                          <i className="bi bi-person-circle me-2 text-violet"></i>
                          Nom d'utilisateur
                        </label>
                        <Field
                          type="text"
                          name="login"
                          className={`form-control form-control-lg ${errors.login && touched.login ? 'is-invalid' : ''}`}
                          placeholder="Entrez votre nom d'utilisateur"
                          autoFocus
                        />
                        <ErrorMessage
                          name="login"
                          component="div"
                          className="invalid-feedback d-flex align-items-center"
                        >
                          {msg => <><i className="bi bi-exclamation-circle me-2"></i>{msg}</>}
                        </ErrorMessage>
                      </div>

                      <div className="mb-4">
                        <label htmlFor="password" className="form-label fw-semibold">
                          <i className="bi bi-lock-fill me-2 text-violet"></i>
                          Mot de passe
                        </label>
                        <div className="input-group">
                          <Field
                            type={showPassword ? "text" : "password"}
                            name="password"
                            className={`form-control form-control-lg ${errors.password && touched.password ? 'is-invalid' : ''}`}
                            placeholder="Votre mot de passe"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-violet"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          >
                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                          </button>
                        </div>
                        <ErrorMessage
                          name="password"
                          component="div"
                          className="invalid-feedback d-flex align-items-center"
                        >
                          {msg => <><i className="bi bi-exclamation-circle me-2"></i>{msg}</>}
                        </ErrorMessage>
                      </div>

                      <div className="d-grid mb-4">
                        <button
                          type="submit"
                          className="btn btn-gradient btn-lg fw-semibold"
                          disabled={loading || !(isValid && dirty)}
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
                              Connexion en cours...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-box-arrow-in-right me-2"></i>
                              Se connecter
                            </>
                          )}
                        </button>
                      </div>

                      <div className="text-center">
                        <p className="mb-0">
                          Pas encore de compte ?{' '}
                          <Link to="/register" className="text-decoration-none fw-semibold text-violet">
                            Créer un compte
                          </Link>
                        </p>
                      </div>
                    </Form>
                  )}
                </Formik>

                <div className="mt-4 pt-4 border-top text-center">
                  <p className="small text-muted mb-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Application sécurisée par authentification JWT
                  </p>
                  <p className="small text-muted mb-0">
                    <i className="bi bi-shield-check me-1"></i>
                    Vos données sont chiffrées et protégées
                  </p>
                </div>
              </Card.Body>
            </Card>

            <div className="mt-4 text-center">
              <div className="d-flex justify-content-center gap-4">
                <div className="text-center">
                  <div className="bg-violet-light rounded-circle p-3 d-inline-block mb-2">
                    <i className="bi bi-people-fill fs-4 text-violet"></i>
                  </div>
                  <p className="small mb-0">Gestion<br />des membres</p>
                </div>
                <div className="text-center">
                  <div className="bg-violet-light rounded-circle p-3 d-inline-block mb-2">
                    <i className="bi bi-shield-check fs-4 text-violet"></i>
                  </div>
                  <p className="small mb-0">Sécurité<br />maximale</p>
                </div>
                <div className="text-center">
                  <div className="bg-violet-light rounded-circle p-3 d-inline-block mb-2">
                    <i className="bi bi-file-earmark-pdf fs-4 text-violet"></i>
                  </div>
                  <p className="small mb-0">Rapports<br />PDF</p>
                </div>
              </div>
            </div>
          </Col>
        </Row>
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
        
        .form-control:focus {
          border-color: #6a11cb;
          box-shadow: 0 0 0 0.25rem rgba(106, 17, 203, 0.25);
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

export default Login;