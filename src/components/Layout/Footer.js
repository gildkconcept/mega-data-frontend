import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <Container className="text-center">
        <p className="mb-2">
          <i className="bi bi-church me-1"></i>
          MEGA-DATA - Système de gestion des membres
        </p>
        <p className="mb-0 small">
          © {new Date().getFullYear()} Tous droits réservés. 
          Application développée pour la gestion des membres de l'église.
        </p>
      </Container>
    </footer>
  );
};

export default Footer;