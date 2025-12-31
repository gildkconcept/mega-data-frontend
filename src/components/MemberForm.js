import React, { useState } from 'react'; // useEffect retiré
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Alert, Spinner } from 'react-bootstrap';
import memberService from '../services/memberService';
import authService from '../services/authService';

const MemberForm = ({ onMemberAdded }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [customQuartier, setCustomQuartier] = useState(false);
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isBerger = user?.role === 'berger';
  
  // Pour les bergers, on pré-remplit le service
  const bergerService = user?.service_assigne || '';

  // Liste des quartiers suggérés
  const quartiers = [
    'Yopougon niangon à gauche',
    'Yopougon niangon à droite',
    'Yopougon azito',
    'Yopougon carreffour jatark',
    'Abobo pk18',
    'paris',
    'yopougon selmer',
    'Yopougon maroc',
    'odiénée',
    'dabou',
    'treichville',
    'abobo dokui',
    'cocody angré'
  ];

  // Liste des services disponibles
  const services = [
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

  // Valeurs initiales selon le rôle
  const getInitialValues = () => {
    const baseValues = {
      nom: '',
      prenom: '',
      numero: '',
      quartier: '',
      service: ''
    };
    
    // Si c'est un berger, pré-remplir le service
    if (isBerger && bergerService) {
      return {
        ...baseValues,
        service: bergerService
      };
    }
    
    return baseValues;
  };

  const validationSchema = Yup.object({
    nom: Yup.string()
      .required('Le nom est requis')
      .min(2, 'Minimum 2 caractères'),
    prenom: Yup.string()
      .required('Le prénom est requis')
      .min(2, 'Minimum 2 caractères'),
    numero: Yup.string()
      .required('Le numéro est requis')
      .matches(/^[0-9+\s-]+$/, 'Numéro invalide'),
    quartier: Yup.string()
      .required('Le quartier est requis')
      .min(2, 'Minimum 2 caractères'),
    service: Yup.string()
      .required('Le service est requis')
  });

  const handleSubmit = async (values, { resetForm }) => {
    setError('');
    setLoading(true);
    
    // Vérification côté frontend
    if (isAdmin) {
      setError('Les administrateurs ne peuvent pas enregistrer de membres.');
      setLoading(false);
      return;
    }
    
    // Pour les bergers, s'assurer qu'ils n'essaient pas de changer de service
    if (isBerger && bergerService && values.service !== bergerService) {
      setError(`Vous ne pouvez enregistrer que des membres du service: ${bergerService}`);
      setLoading(false);
      return;
    }
    
    try {
      const result = await memberService.createMember(values);
      
      if (result.success) {
        onMemberAdded(result.member);
        resetForm();
        setCustomQuartier(false);
        
        // Si c'est un berger, réinitialiser avec le service pré-rempli
        if (isBerger && bergerService) {
          resetForm({
            values: {
              nom: '',
              prenom: '',
              numero: '',
              quartier: '',
              service: bergerService
            }
          });
        }
      } else {
        setError(result.message || 'Erreur lors de l\'ajout');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout du membre');
    } finally {
      setLoading(false);
    }
  };

  // Si l'utilisateur est admin, on affiche un message
  if (isAdmin) {
    return (
      <Alert variant="info" className="text-center">
        <i className="bi bi-info-circle me-2"></i>
        <strong>Fonctionnalité réservée aux membres et bergers</strong>
        <p className="mb-0 mt-2">
          En tant qu'administrateur, vous ne pouvez pas enregistrer de membres.
          Cette fonctionnalité est réservée aux utilisateurs avec les rôles "membre" ou "berger".
        </p>
      </Alert>
    );
  }

  return (
    <div>
      {error && (
        <Alert variant="danger" className="mb-3">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Message pour les bergers */}
      {isBerger && bergerService && (
        <Alert variant="info" className="mb-3">
          <i className="bi bi-person-badge me-2"></i>
          <strong>Enregistrement pour votre service</strong>
          <p className="mb-0 mt-1">
            Vous enregistrez un membre pour le service: <strong>{bergerService}</strong>
          </p>
        </Alert>
      )}

      <Formik
        initialValues={getInitialValues()}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, setFieldValue }) => (
          <Form>
            <div className="mb-3">
              <label htmlFor="prenom" className="form-label">
                Prénom *
              </label>
              <Field
                type="text"
                name="prenom"
                className={`form-control ${errors.prenom && touched.prenom ? 'is-invalid' : ''}`}
                placeholder="Prénom du membre"
              />
              <ErrorMessage
                name="prenom"
                component="div"
                className="invalid-feedback"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="nom" className="form-label">
                Nom *
              </label>
              <Field
                type="text"
                name="nom"
                className={`form-control ${errors.nom && touched.nom ? 'is-invalid' : ''}`}
                placeholder="Nom du membre"
              />
              <ErrorMessage
                name="nom"
                component="div"
                className="invalid-feedback"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="numero" className="form-label">
                Numéro de téléphone *
              </label>
              <Field
                type="text"
                name="numero"
                className={`form-control ${errors.numero && touched.numero ? 'is-invalid' : ''}`}
                placeholder="Ex: +225 6XX XXX XXX"
              />
              <ErrorMessage
                name="numero"
                component="div"
                className="invalid-feedback"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="quartier" className="form-label">
                Quartier *
              </label>
              
              {!customQuartier ? (
                <>
                  <Field
                    as="select"
                    name="quartier"
                    className={`form-select ${errors.quartier && touched.quartier ? 'is-invalid' : ''}`}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFieldValue('quartier', value);
                      if (value === 'autre') {
                        setCustomQuartier(true);
                        setFieldValue('quartier', '');
                      }
                    }}
                  >
                    <option value="">Sélectionnez un quartier</option>
                    {quartiers.map((quartier, index) => (
                      <option key={index} value={quartier}>
                        {quartier}
                      </option>
                    ))}
                    <option value="autre">Autre (saisir manuellement)</option>
                  </Field>
                  <ErrorMessage
                    name="quartier"
                    component="div"
                    className="invalid-feedback"
                  />
                </>
              ) : (
                <>
                  <div className="input-group">
                    <Field
                      type="text"
                      name="quartier"
                      className={`form-control ${errors.quartier && touched.quartier ? 'is-invalid' : ''}`}
                      placeholder="Saisissez le nom du quartier"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setCustomQuartier(false);
                        setFieldValue('quartier', '');
                      }}
                    >
                      <i className="bi bi-arrow-left"></i>
                    </button>
                  </div>
                  <ErrorMessage
                    name="quartier"
                    component="div"
                    className="invalid-feedback"
                  />
                  <small className="form-text text-muted">
                    Saisissez le nom du quartier manuellement
                  </small>
                </>
              )}
            </div>

            {/* CHAMP SERVICE - Désactivé pour les bergers */}
            <div className="mb-4">
              <label htmlFor="service" className="form-label">
                Service *
              </label>
              
              {isBerger && bergerService ? (
                // Pour les bergers: affichage en lecture seule
                <div className="input-group">
                  <input
                    type="text"
                    value={bergerService}
                    className="form-control"
                    readOnly
                    disabled
                  />
                  <span className="input-group-text bg-info text-white">
                    <i className="bi bi-lock"></i>
                  </span>
                </div>
              ) : (
                // Pour les membres normaux: sélecteur
                <Field
                  as="select"
                  name="service"
                  className={`form-select ${errors.service && touched.service ? 'is-invalid' : ''}`}
                >
                  <option value="">Sélectionnez un service</option>
                  {services.map((service, index) => (
                    <option key={index} value={service}>
                      {service}
                    </option>
                  ))}
                </Field>
              )}
              
              <ErrorMessage
                name="service"
                component="div"
                className="invalid-feedback"
              />
              
              {isBerger && (
                <small className="form-text text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Le service est verrouillé sur votre service assigné
                </small>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2"
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
                  Enregistrement...
                </>
              ) : (
                <>
                  <i className="bi bi-save me-2"></i>
                  {isBerger ? 'Enregistrer le membre (Service Berger)' : 'Enregistrer le membre'}
                </>
              )}
            </button>
          </Form>
        )}
      </Formik>

      <p className="small text-muted mt-3 mb-0">
        <i className="bi bi-info-circle me-1"></i>
        Tous les champs marqués d'un * sont obligatoires
      </p>
    </div>
  );
};

export default MemberForm;