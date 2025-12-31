// frontend/src/components/DebugPanel.js
import React from 'react';
import { Card, Button } from 'react-bootstrap';
import authService from '../services/authService';

const DebugPanel = () => {
  const [debugInfo, setDebugInfo] = React.useState({});
  
  const refreshDebug = () => {
    const user = authService.getCurrentUser();
    const token = localStorage.getItem('token');
    
    setDebugInfo({
      user,
      token: token ? `${token.substring(0, 20)}...` : 'None',
      serviceAssigne: user?.service_assigne,
      role: user?.role,
      timestamp: new Date().toISOString()
    });
  };
  
  React.useEffect(() => {
    refreshDebug();
  }, []);
  
  return (
    <Card className="mt-3 border-warning">
      <Card.Header className="bg-warning text-dark">
        <strong>🔧 Panel Debug</strong>
      </Card.Header>
      <Card.Body>
        <pre className="bg-light p-2 rounded">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
        <Button variant="outline-warning" size="sm" onClick={refreshDebug}>
          Actualiser debug
        </Button>
      </Card.Body>
    </Card>
  );
};

export default DebugPanel;