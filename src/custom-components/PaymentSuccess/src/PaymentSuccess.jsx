import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getConfig } from '@edx/frontend-platform';
import './PaymentSuccess.scss';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionData, setTransactionData] = useState({
    txnRef: searchParams.get('txnRef') || searchParams.get('orderCode') || 'DEMO123',
    amount: searchParams.get('amount') || '500000',
    simulator: searchParams.get('simulator') === 'true',
    subscription: searchParams.get('subscription') === 'true',
    paymentType: searchParams.get('paymentType') || 'single_course',
    enrolledCount: parseInt(searchParams.get('enrolledCount') || '0'),
    totalCourses: parseInt(searchParams.get('totalCourses') || '0'),
  });

  useEffect(() => {
    // Check if this is a PayOS callback (has orderCode, code, status)
    const orderCode = searchParams.get('orderCode');
    const code = searchParams.get('code');
    const status = searchParams.get('status');
    
    if (orderCode && (code || status)) {
      // This is PayOS callback, need to process it
      handlePayOSCallback(orderCode, code, status);
    }
  }, [searchParams]);

  const handlePayOSCallback = async (orderCode, code, status) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const lmsBaseUrl = getConfig().LMS_BASE_URL;
      // Call backend to process PayOS callback
      const response = await fetch(`${lmsBaseUrl}/api/payment/callback/?orderCode=${orderCode}&code=${code}&status=${status}&cancel=false`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        // Backend will redirect, but if it returns JSON, update state
        try {
          const data = await response.json();
          if (data.success) {
            setTransactionData(prev => ({
              ...prev,
              txnRef: `PAYOS_${orderCode}`,
              subscription: true,
              paymentType: 'all_access',
              enrolledCount: data.enrolledCount || 0,
              totalCourses: data.totalCourses || 0,
            }));
          }
        } catch {
          // Response was redirect, that's fine
        }
      }
    } catch (error) {
      console.error('Error processing PayOS callback:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(parseInt(price));

  return (
    <div className="payment-success-page">
      <div className="success-container">
        <div className="success-icon">
          <div className="checkmark">✓</div>
        </div>
        <h1>🎉 Thanh toán thành công!</h1>

        {transactionData.subscription && transactionData.paymentType === 'all_access' ? (
          <div className="all-access-success">
            <h2>🌟 Gói All Access đã được kích hoạt!</h2>
            <p>
              Chúc mừng! Bạn đã được kích hoạt gói All Access và có thể truy cập tất cả khóa học trên nền tảng.
            </p>

            <div className="subscription-details">
              <h3>📊 Thông tin đăng ký:</h3>
              <div className="detail-item">
                <strong>Mã giao dịch:</strong> {transactionData.txnRef}
              </div>
              <div className="detail-item">
                <strong>Số tiền:</strong> {formatPrice(transactionData.amount)}
              </div>
              <div className="detail-item">
                <strong>Khóa học đã đăng ký:</strong> {transactionData.enrolledCount} / {transactionData.totalCourses}
              </div>
              <div className="detail-item">
                <strong>Trạng thái:</strong> <span className="status-success">✅ Kích hoạt thành công</span>
              </div>
            </div>

            <div className="benefits">
              <h3>🎯 Quyền lợi của bạn:</h3>
              <ul>
                <li>✅ Truy cập không giới hạn tất cả khóa học</li>
                <li>✅ Học bất cứ lúc nào, bất cứ đâu</li>
                <li>✅ Cập nhật khóa học mới miễn phí</li>
                <li>✅ Chứng chỉ hoàn thành</li>
                <li>✅ Hỗ trợ học tập 24/7</li>
              </ul>
            </div>

            {transactionData.simulator && (
              <div className="simulator-notice">
                <p>🧪 <strong>Chế độ Test:</strong> Đây là giao dịch test, không có tiền thật được trừ.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="single-course-success">
            <h2>📚 Đăng ký khóa học thành công!</h2>
            <p>
              Cảm ơn bạn đã mua khóa học. Bạn sẽ nhận được email xác nhận trong thời gian sớm nhất.
            </p>

            {transactionData.simulator && (
              <div className="transaction-details">
                <h3>Chi tiết giao dịch (Test)</h3>
                <div className="detail-item">
                  <strong>Mã giao dịch:</strong> {transactionData.txnRef}
                </div>
                <div className="detail-item">
                  <strong>Số tiền:</strong> {formatPrice(transactionData.amount)}
                </div>
                <div className="detail-item">
                  <strong>Trạng thái:</strong> <span className="status-success">Thành công</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="success-actions">
          {transactionData.subscription && transactionData.paymentType === 'all_access' ? (
            <>
              <button
                className="btn-primary"
                onClick={() => navigate('/learning/dashboard')}
              >
                🎓 Vào Dashboard
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate('/learning/courses')}
              >
                📚 Xem tất cả khóa học
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-primary"
                onClick={() => navigate('/learning')}
              >
                Vào học ngay
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate('/learning/payment')}
              >
                Mua khóa học khác
              </button>
            </>
          )}

          <button
            className="btn-home"
            onClick={() => navigate('/')}
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
