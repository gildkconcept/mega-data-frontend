// src/components/EnvDebug.js
import React from 'react';

const EnvDebug = () => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: '#333',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999,
      borderRadius: '5px'
    }}>
      <strong>Env Debug:</strong><br />
      REACT_APP_API_URL: {process.env.REACT_APP_API_URL || 'NON DÉFINI'}<br />
      NODE_ENV: {process.env.NODE_ENV}<br />
      Backend: https://web-production-b92a.up.railway.app
    </div>
  );
};

export default EnvDebug;