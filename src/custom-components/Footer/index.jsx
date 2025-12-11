import React from 'react';
import { getConfig } from '@edx/frontend-platform';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import './Footer.scss';

const Footer = () => {
  const config = getConfig();

  return (
    <footer className="custom-footer">
      <div
        className="footer-content"
        style={{
          width: '100%',
          maxWidth: '100%',
          paddingLeft: '16px',
          paddingRight: '16px',
          boxSizing: 'border-box',
        }}
      >
        {/* Three Column Layout */}
        <div className="footer-columns">
          {/* SITE MAP Column */}
          <div className="footer-column">
            <h3 className="footer-title">SITE MAP</h3>
            <ul className="footer-links">
              <li><a href={`${config.LMS_BASE_URL}/about`}>Introduction</a></li>
              <li><a href={`${config.LMS_BASE_URL}/testimonials`}>People Said</a></li>
              <li><a href={`${config.LMS_BASE_URL}/courses`}>What We Offer You</a></li>
              <li><a href={`${config.LMS_BASE_URL}/pricing`}>Subscription Plans</a></li>
              <li><a href={`${config.LMS_BASE_URL}/privacy-policy`}>Privacy Policy</a></li>
              <li><a href={`${config.LMS_BASE_URL}/terms-of-service`}>Terms And Conditions</a></li>
            </ul>
          </div>

          {/* COMPANY INFO Column */}
          <div className="footer-column">
            <h3 className="footer-title">COMPANY INFO</h3>
            <div className="footer-address">
              <p><strong>MANABI HUB Limited Liability Company</strong></p>
              <p>Head Office: 15 Vo Van Kiet Street, Phu Dinh Ward, Ho Chi Minh City.</p>
              <p>Phone: 0919 695 739</p>
              <p>Tax ID: 0318916330, issued by Ho Chi Minh City Department of Finance on April 17, 2025</p>
              <p>Decision to establish Tram Hoc Tap Foreign Language Center, No. 828/QD-SGDĐT, issued by the Department of Education and Training on July 24, 2025.</p>
            </div>
          </div>

          {/* CONTACT US Column */}
          <div className="footer-column">
            <h3 className="footer-title">CONTACT US</h3>
            <div className="footer-contact">
              <p>Email: info@manabihub.com</p>
              <div className="social-icons">
                <a href="#" className="social-icon facebook">f</a>
                <a href="#" className="social-icon messenger">💬</a>
                <a href="#" className="social-icon telegram">✈</a>
              </div>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="footer-separator"></div>

        {/* Copyright */}
        <div className="footer-copyright">
          <p>Copyright © 2024 by MANABI HUB</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
