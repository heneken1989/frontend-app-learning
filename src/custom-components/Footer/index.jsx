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
        <div className="company-info" style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
          {/* Company Name - Center Top */}
          <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '12px', fontSize: '14px' }}>
            Công Ty TNHH MANABI HUB
          </div>
          
          {/* Company Info - Two Columns */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <div>Trụ sở chính: Số 15 đường Võ Văn Kiệt, phường Phú Định, Thành phố Hồ Chí Minh.</div>
              <div>Điện thoại: 0919 695 739</div>
            </div>
            <div style={{ flex: 1 }}>
              <div>Mã số thuế: 0318916330, do Sở Tài Chính Thành phố Hồ Chí Minh cấp ngày 17 tháng 4 năm 2025</div>
              <div>Quyết định thành lập trung tâm ngoại ngữ Trạm Học Tập, số 828/ QĐ-SGDĐT do Sở Giáo dục và Đào tạo cấp ngày 24 tháng 7 năm 2025.</div>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
