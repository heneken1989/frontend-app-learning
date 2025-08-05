import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './PaymentCancel.scss';

const PaymentCancel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [transactionData, setTransactionData] = useState({
    txnRef: searchParams.get('txnRef') || 'DEMO123',
    simulator: searchParams.get('simulator') === 'true',
    error: searchParams.get('error') || null,
  });

  useEffect(() => {
    // Log transaction data
    console.log('Payment Cancel - Transaction Data:', transactionData);
  }, [transactionData]);

  const getErrorMessage = (error) => {
    switch (error) {
      case 'transaction_not_found':
        return 'Không tìm thấy thông tin giao dịch.';
      case 'payment_failed':
        return 'Thanh toán thất bại. Vui lòng thử lại.';
      default:
        return 'Có lỗi xảy ra trong quá trình thanh toán.';
    }
  };

  return (
    <div className="payment-cancel-page">
      <div className="cancel-container">
        <div className="cancel-icon">
          <div className="x-mark">✕</div>
        </div>
        <h1>Thanh toán bị hủy</h1>
        <p>
          Giao dịch thanh toán đã bị hủy. Bạn có thể thử lại bất cứ lúc nào.
        </p>

        {transactionData.error && (
          <div className="error-details">
            <h3>Chi tiết lỗi</h3>
            <div className="error-message">
              {getErrorMessage(transactionData.error)}
            </div>
          </div>
        )}

        {transactionData.simulator && (
          <div className="transaction-details">
            <h3>Chi tiết giao dịch (Test)</h3>
            <div className="detail-item">
              <strong>Mã giao dịch:</strong> {transactionData.txnRef}
            </div>
            <div className="detail-item">
              <strong>Trạng thái:</strong> <span className="status-cancelled">Đã hủy</span>
            </div>
          </div>
        )}

        <div className="cancel-actions">
          <button
            className="btn-primary"
            onClick={() => navigate('/')}
          >
            Về trang chủ
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate('/learning/payment')}
          >
            Thử lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
