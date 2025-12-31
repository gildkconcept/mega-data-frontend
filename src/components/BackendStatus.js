// src/components/BackendStatus.js
import React, { useState, useEffect } from 'react';
import { testBackendConnection } from '../api';

const BackendStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      setLoading(true);
      const result = await testBackendConnection();
      setStatus(result);
      setLoading(false);
    };

    checkConnection();
  }, []);

  if (loading) {
    return <div className="backend-status loading">Vérification de la connexion...</div>;
  }

  return (
    <div className={`backend-status ${status.success ? 'success' : 'error'}`}>
      {status.success ? (
        <>
          <span>✅ Backend connecté</span>
          <small>URL: {process.env.REACT_APP_API_URL}</small>
        </>
      ) : (
        <>
          <span>❌ Backend hors ligne</span>
          <small>Erreur: {status.error}</small>
        </>
      )}
    </div>
  );
};

export default BackendStatus;