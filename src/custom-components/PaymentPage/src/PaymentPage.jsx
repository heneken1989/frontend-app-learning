import React, { useState } from 'react';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { getConfig } from '@edx/frontend-platform';
import PropTypes from 'prop-types';
import './PaymentPage.scss';

const PaymentPage = ({ intl }) => {
  const [paymentData, setPaymentData] = useState({
    courseId: 'ALL_COURSES',
    courseName: 'Tất cả khóa học',
    price: 1000000, // 1,000,000 VND for all courses
    instructor: 'Nhiều giảng viên',
    duration: 'Không giới hạn',
    level: 'Tất cả trình độ'
  });

  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useSimulator, setUseSimulator] = useState(false); // Default to VNPay sandbox

  // Function to get CSRF token from LMS backend
  const getCSRFToken = async () => {
    try {
      const lmsBaseUrl = getConfig().LMS_BASE_URL;
      const response = await fetch(`${lmsBaseUrl}/csrf/api/v1/token`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.csrfToken;
      }
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
    }
    return null;
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Tạo dữ liệu thanh toán cho tất cả khóa học
      const paymentData = {
        amount: 1000000, // 1,000,000 VND for all courses access
        courseId: 'ALL_COURSES',
        courseName: 'Gói All Access - Truy cập tất cả khóa học',
        currency: 'VND',
        paymentMethod: paymentMethod,
        paymentType: 'all_access', // Chỉ có một loại thanh toán
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
        useSimulator: useSimulator
      };

      console.log('Sending payment data:', paymentData);

      // Lấy CSRF token từ LMS backend
      const csrfToken = await getCSRFToken();

      // Gọi API backend để tạo VNPay payment URL
      const lmsBaseUrl = getConfig().LMS_BASE_URL;
      const response = await fetch(`${lmsBaseUrl}/api/payment/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken })
        },
        body: JSON.stringify(paymentData),
        credentials: 'include'
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Payment creation failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Payment response:', data);
      
      if (data.success && data.paymentUrl) {
        console.log('Redirecting to:', data.paymentUrl);
        // Redirect đến VNPay hoặc simulator
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(data.error || 'No payment URL received');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <h1>🎓 Đăng ký Gói All Access</h1>
          <p>Thanh toán một lần, truy cập tất cả khóa học</p>
        </div>

        <div className="payment-content">
          <div className="course-summary">
            <h2>Thông tin gói học</h2>
            <div className="course-card">
              <div className="course-info">
                <h3>🌟 Gói All Access</h3>
                <div className="course-details">
                  <p><strong>Quyền truy cập:</strong> Tất cả khóa học</p>
                  <p><strong>Thời hạn:</strong> Vĩnh viễn</p>
                  <p><strong>Giảng viên:</strong> Nhiều chuyên gia</p>
                  <p><strong>Trình độ:</strong> Tất cả cấp độ</p>
                </div>
                <div className="benefits">
                  <h4>🎯 Lợi ích:</h4>
                  <ul>
                    <li>✅ Truy cập không giới hạn tất cả khóa học</li>
                    <li>✅ Học bất cứ lúc nào, bất cứ đâu</li>
                    <li>✅ Cập nhật khóa học mới miễn phí</li>
                    <li>✅ Chứng chỉ hoàn thành</li>
                    <li>✅ Hỗ trợ học tập 24/7</li>
                  </ul>
                </div>
              </div>
              <div className="course-price">
                <span className="price">{formatPrice(paymentData.price)}</span>
                <span className="price-note">Thanh toán một lần</span>
              </div>
            </div>
          </div>

          <div className="payment-method">
            <h2>Phương thức thanh toán</h2>
            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="vnpay"
                  checked={paymentMethod === 'vnpay'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="option-content">
                  <img src="https://vnpay.vn/wp-content/uploads/2020/07/logo-vnpay.png" alt="VNPay" />
                  <span>VNPay</span>
                </div>
              </label>
              
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="momo"
                  checked={paymentMethod === 'momo'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="option-content">
                  <img src="https://developers.momo.vn/assets/images/logo-momo.png" alt="MoMo" />
                  <span>MoMo</span>
                </div>
              </label>
            </div>
            
            {/* Testing Toggle */}
            <div className="testing-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={useSimulator}
                  onChange={(e) => setUseSimulator(e.target.checked)}
                />
                <span className="toggle-text">
                  {useSimulator ? '🧪 Simulator Mode (Testing)' : '💳 VNPay Sandbox Mode'}
                </span>
              </label>
              <p className="toggle-description">
                {useSimulator 
                  ? 'Sử dụng simulator để test thanh toán không cần tiền thật'
                  : 'Sử dụng VNPay sandbox - test với thẻ ảo của VNPay'
                }
              </p>
            </div>
          </div>

          <div className="payment-summary">
            <h2>Tổng thanh toán</h2>
            <div className="summary-item">
              <span>Gói All Access:</span>
              <span>{formatPrice(paymentData.price)}</span>
            </div>
            <div className="summary-item">
              <span>Phí giao dịch:</span>
              <span>{formatPrice(0)}</span>
            </div>
            <div className="summary-item total">
              <span>Tổng cộng:</span>
              <span>{formatPrice(paymentData.price)}</span>
            </div>
          </div>

          <div className="payment-actions">
            <button
              className="btn-pay"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? 'Đang xử lý...' : 'Thanh toán ngay'}
            </button>
            
            <button className="btn-cancel" onClick={() => window.history.back()}>
              Hủy bỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

PaymentPage.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(PaymentPage); 