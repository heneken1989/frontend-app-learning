import React, { useState, useEffect } from 'react';
import { getConfig } from '@edx/frontend-platform';
import './EnrollmentStatus.scss';

const EnrollmentStatusPage = () => {
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEnrollmentStatus();
  }, []);

  const fetchEnrollmentStatus = async () => {
    try {
      setLoading(true);
      const lmsBaseUrl = getConfig().LMS_BASE_URL;
      const response = await fetch(`${lmsBaseUrl}/api/payment/enrollment/status/`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch enrollment status');
      }

      const data = await response.json();
      setEnrollmentData(data);
    } catch (err) {
      console.error('Error fetching enrollment status:', err);
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="enrollment-status-page">
        <div className="loading">Đang kiểm tra trạng thái enrollment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enrollment-status-page">
        <div className="error">Lỗi: {error}</div>
      </div>
    );
  }

  if (!enrollmentData) {
    return (
      <div className="enrollment-status-page">
        <div className="error">Không thể tải dữ liệu enrollment</div>
      </div>
    );
  }

  const {
    user, subscription, enrollments, transactions, status,
  } = enrollmentData;

  return (
    <div className="enrollment-status-page">
      <div className="status-header">
        <h2>📚 Trạng thái Enrollment</h2>
      </div>

      <div className="status-content">
        {/* User Information */}
        <div className="user-info">
          <h3>👤 Thông tin User</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Username:</span>
              <span className="value">{user.username}</span>
            </div>
            <div className="info-item">
              <span className="label">Email:</span>
              <span className="value">{user.email}</span>
            </div>
            <div className="info-item">
              <span className="label">User ID:</span>
              <span className="value">{user.user_id}</span>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="subscription-status">
          <h3>🎓 Trạng thái Subscription</h3>
          <div className={`status-badge ${subscription.has_subscription ? 'success' : 'warning'}`}>
            <span className="badge-icon">
              {subscription.has_subscription ? '✅' : '⚠️'}
            </span>
            <span className="badge-text">
              {subscription.has_subscription ? 'Active Subscription' : 'No Active Subscription'}
            </span>
          </div>

          {subscription.subscription_info && (
            <div className="subscription-details">
              <div className="detail-item">
                <span className="label">Hết hạn:</span>
                <span className="value">{formatDate(subscription.subscription_info.expires_at)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Còn lại:</span>
                <span className="value">{subscription.subscription_info.days_remaining} ngày</span>
              </div>
              <div className="detail-item">
                <span className="label">Số tiền đã trả:</span>
                <span className="value">{formatPrice(subscription.subscription_info.amount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Enrollment Status */}
        <div className="enrollment-status-section">
          <h3>📚 Trạng thái Enrollment</h3>
          <div className="enrollment-summary">
            <div className="summary-item">
              <span className="label">Khóa học đã đăng ký:</span>
              <span className="value">{enrollments.total_enrolled}</span>
            </div>
            <div className="summary-item">
              <span className="label">Tổng khóa học có sẵn:</span>
              <span className="value">{enrollments.total_available}</span>
            </div>
            <div className="summary-item">
              <span className="label">Trạng thái:</span>
              <span className={`value ${status.enrollment_successful ? 'success' : 'error'}`}>
                {status.enrollment_successful ? '✅ Thành công' : '❌ Chưa đăng ký'}
              </span>
            </div>
          </div>

          {enrollments.enrollment_list.length > 0 && (
            <div className="enrollment-list">
              <h4>📖 Danh sách khóa học đã đăng ký:</h4>
              <div className="course-list">
                {enrollments.enrollment_list.map((enrollment, index) => (
                  <div key={index} className="course-item">
                    <div className="course-name">{enrollment.course_name}</div>
                    <div className="course-details">
                      <span className="mode">{enrollment.mode}</span>
                      <span className="date">{formatDate(enrollment.created)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        {transactions.transaction_list.length > 0 && (
          <div className="transactions-section">
            <h3>💰 Giao dịch gần đây</h3>
            <div className="transactions-list">
              {transactions.transaction_list.map((txn, index) => (
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
                  {txn.subscription_active && (
                    <div className="subscription-info">
                      <span className="expires">Hết hạn: {formatDate(txn.subscription_expires_at)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Status */}
        <div className="final-status">
          <h3>📊 Tóm tắt</h3>
          <div className="status-grid">
            <div className={`status-item ${status.has_subscription ? 'success' : 'warning'}`}>
              <span className="icon">{status.has_subscription ? '✅' : '⚠️'}</span>
              <span className="text">Subscription</span>
            </div>
            <div className={`status-item ${status.has_enrollments ? 'success' : 'warning'}`}>
              <span className="icon">{status.has_enrollments ? '✅' : '⚠️'}</span>
              <span className="text">Enrollments</span>
            </div>
            <div className={`status-item ${status.can_access_all_courses ? 'success' : 'warning'}`}>
              <span className="icon">{status.can_access_all_courses ? '✅' : '⚠️'}</span>
              <span className="text">All Access</span>
            </div>
            <div className={`status-item ${status.enrollment_successful ? 'success' : 'error'}`}>
              <span className="icon">{status.enrollment_successful ? '✅' : '❌'}</span>
              <span className="text">Overall</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentStatusPage;
