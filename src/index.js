import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/custom.scss';  // Importez votre SCSS
import './styles/theme.css';    // Importez le thème CSS
import App from './App';
import './styles/fix.css';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);