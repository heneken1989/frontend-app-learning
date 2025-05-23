import React from 'react';
import { getConfig } from '@edx/frontend-platform';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

const Footer = () => {
  const config = getConfig();
  
  return (
    <footer className="footer d-flex justify-content-center border-top py-3 px-4">
      <div className="container d-flex flex-row justify-content-between align-items-center">
        {/* Logo */}

        
        {/* Links */}
        <div className="links d-flex flex-row">
          <a 
            className="text-decoration-none mx-2" 
            href={`${config.LMS_BASE_URL}/about`}
          >
            <FormattedMessage
              id="footer.about.link"
              defaultMessage="About"
            />
          </a>
          <a 
            className="text-decoration-none mx-2" 
            href={`${config.LMS_BASE_URL}/contact`}
          >
            <FormattedMessage
              id="footer.contact.link"
              defaultMessage="Contact"
            />
          </a>
          <a 
            className="text-decoration-none mx-2" 
            href={`${config.LMS_BASE_URL}/terms-of-service`}
          >
            <FormattedMessage
              id="footer.terms.link"
              defaultMessage="Terms of Service"
            />
          </a>
          <a 
            className="text-decoration-none mx-2" 
            href={`${config.LMS_BASE_URL}/privacy-policy`}
          >
            <FormattedMessage
              id="footer.privacy.link"
              defaultMessage="Privacy Policy"
            />
          </a>
        </div>
        
        {/* Copyright */}

      </div>
    </footer>
  );
};

export default Footer; 