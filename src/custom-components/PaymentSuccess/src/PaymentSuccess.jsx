import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './PaymentSuccess.scss';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [transactionData, setTransactionData] = useState({
    txnRef: searchParams.get('txnRef') || 'DEMO123',
    amount: searchParams.get('amount') || '500000',
    simulator: searchParams.get('simulator') === 'true',
    subscription: searchParams.get('subscription') === 'true',
    paymentType: searchParams.get('paymentType') || 'single_course',
    enrolledCount: parseInt(searchParams.get('enrolledCount') || '0'),
    totalCourses: parseInt(searchParams.get('totalCourses') || '0'),
  });

  useEffect(() => {
    // Log transaction data
    console.log('Payment Success - Transaction Data:', transactionData);
  }, [transactionData]);

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
