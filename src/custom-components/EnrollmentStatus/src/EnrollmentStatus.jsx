import React, { useState, useEffect } from 'react';
import { getConfig } from '@edx/frontend-platform';
import './EnrollmentStatus.scss';

const EnrollmentStatus = () => {
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    // Navigate to enrollment status page
    window.location.href = '/learning/enrollment-status';
  };

  if (loading) {
    return (
      <div className="enrollment-status-header">
        <div className="status-loading">⏳</div>
      </div>
    );
  }

  if (error || !enrollmentData) {
    return (
      <div className="enrollment-status-header">
        <div className="status-error" title="Không thể kiểm tra trạng thái">❌</div>
      </div>
    );
  }

  const { subscription, enrollments, status } = enrollmentData;

  // Determine status icon and class
  let statusIcon = '❌';
  let statusClass = 'no-subscription';
  let statusTitle = 'Chưa có subscription';

  if (subscription.has_subscription) {
    statusIcon = '✅';
    statusClass = 'has-subscription';
    statusTitle = `Có subscription - ${enrollments.total_enrolled} khóa học`;
  } else if (enrollments.total_enrolled > 0) {
    statusIcon = '⚠️';
    statusClass = 'partial-enrollment';
    statusTitle = `${enrollments.total_enrolled} khóa học đã đăng ký`;
  }

  return (
    <div className="enrollment-status-header">
      <div
        className={`status-indicator ${statusClass}`}
        title={statusTitle}
        onClick={handleClick}
      >
        {statusIcon}
      </div>
    </div>
  );
};

export default EnrollmentStatus;
