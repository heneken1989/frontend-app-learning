import React, { useState, useEffect } from 'react';
import { getConfig } from '@edx/frontend-platform';
import './SubscriptionStatus.scss';

const SubscriptionStatus = () => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubscriptionDetails();
  }, []);

  const fetchSubscriptionDetails = async () => {
    try {
      setLoading(true);
      const lmsBaseUrl = getConfig().LMS_BASE_URL;
      const response = await fetch(`${lmsBaseUrl}/api/payment/subscription/details/`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription details');
      }

      const data = await response.json();
      setSubscriptionData(data);
    } catch (err) {
      console.error('Error fetching subscription details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);

  const formatDate = (dateString) => {
    if (!dateString) { return 'N/A'; }
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="subscription-status">
        <div className="loading">Đang tải thông tin subscription...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subscription-status">
        <div className="error">Lỗi: {error}</div>
      </div>
    );
  }

  if (!subscriptionData) {
    return null;
  }

  const {
    has_subscription, subscription_info, courses, total_courses, recent_transactions,
  } = subscriptionData;

  return (
    <div className="subscription-status">
      <div className="status-header">
        <h2>🎓 Trạng thái Subscription</h2>
      </div>

      <div className="status-content">
        {has_subscription ? (
          <div className="active-subscription">
            <div className="status-badge success">
              <span className="badge-icon">✅</span>
              <span className="badge-text">Active Subscription</span>
            </div>

            {subscription_info && (
              <div className="subscription-details">
                <h3>📊 Thông tin Subscription</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Trạng thái:</span>
                    <span className="value success">✅ Đang hoạt động</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Hết hạn:</span>
                    <span className="value">{formatDate(subscription_info.expires_at)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Còn lại:</span>
                    <span className="value">{subscription_info.days_remaining} ngày</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Số tiền đã trả:</span>
                    <span className="value">{formatPrice(subscription_info.amount)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="course-access">
              <h3>📚 Quyền truy cập khóa học</h3>
              <div className="access-info">
                <div className="access-badge">
                  <span className="badge-icon">🌟</span>
                  <span className="badge-text">All Access</span>
                </div>
                <p>Bạn có quyền truy cập tất cả {total_courses} khóa học trên nền tảng</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-subscription">
            <div className="status-badge warning">
              <span className="badge-icon">⚠️</span>
              <span className="badge-text">No Active Subscription</span>
            </div>

            <div className="subscription-prompt">
              <h3>💡 Nâng cấp lên All Access</h3>
              <p>Đăng ký gói All Access để truy cập tất cả khóa học với chỉ một lần thanh toán!</p>
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
              <button
                className="btn-upgrade"
                onClick={() => window.location.href = '/learning/payment'}
              >
                🚀 Nâng cấp ngay
              </button>
            </div>
          </div>
        )}

        {recent_transactions && recent_transactions.length > 0 && (
          <div className="recent-transactions">
            <h3>📋 Giao dịch gần đây</h3>
            <div className="transactions-list">
              {recent_transactions.map((txn, index) => (
                <div key={index} className="transaction-item">
                  <div className="transaction-header">
                    <span className="txn-ref">{txn.txn_ref}</span>
                    <span className={`status ${txn.payment_status}`}>
                      {txn.payment_status === 'success' ? '✅' : '❌'} {txn.payment_status}
                    </span>
                  </div>
                  <div className="transaction-details">
                    <span className="amount">{formatPrice(txn.amount)}</span>
                    <span className="date">{formatDate(txn.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatus;
