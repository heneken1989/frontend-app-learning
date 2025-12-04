import React, { useState, useEffect, useContext } from 'react';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { getConfig } from '@edx/frontend-platform';
import { AppContext } from '@edx/frontend-platform/react';
import PropTypes from 'prop-types';
import LearningHeader from '../../Header/src/learning-header/LearningHeader';
import './PaymentPage.scss';

const PaymentPage = ({ intl }) => {
  const { authenticatedUser } = useContext(AppContext);
  const [selectedPackage, setSelectedPackage] = useState('section_access'); // 'section_access', 'all_except_conversation', 'mock_test', or 'comprehensive_sections'
  const [paymentMethod, setPaymentMethod] = useState('payos'); // Default to PayOS
  const [isProcessing, setIsProcessing] = useState(false);
  const [useSimulator, setUseSimulator] = useState(false); // Default to VNPay sandbox
  const [selectedDuration, setSelectedDuration] = useState('1'); // '1', '3', or '6' months
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [activeTab, setActiveTab] = useState('packages'); // 'packages' or 'subscription'

  // Package configurations
  const packages = {
    section_access: {
      name: 'Gói 読解 Section',
      description: 'Truy cập đầy đủ Section 読解',
      price: 2000,
      courseName: 'Gói 読解 Section - Truy cập đầy đủ Section 読解',
      sectionName: '読解',
      allowedSections: ['読解'],
      benefits: [
        '✅ Truy cập đầy đủ tất cả units trong Section 読解',
        '✅ Không giới hạn số lượng units'
      ]
    },
    all_except_conversation: {
      name: 'Gói All Sections (Trừ 会話練習)',
      description: 'Truy cập tất cả sections trừ 会話練習',
      price: 2000,
      courseName: 'Gói All Sections - Trừ 会話練習',
      allowedSections: ['*'], // All sections
      excludedSections: ['会話練習'], // Exclude this section
      benefits: [
        '✅ Truy cập tất cả sections trừ 会話練習',
        '✅ Không giới hạn số lượng units'
      ]
    },
    mock_test: {
      name: 'Gói 模試テスト',
      description: 'Truy cập đầy đủ Section 模試テスト',
      price: 2000,
      courseName: 'Gói 模試テスト - Truy cập đầy đủ Section 模試テスト',
      sectionName: '模試テスト',
      allowedSections: ['模試テスト'],
      benefits: [
        '✅ Truy cập đầy đủ tất cả units trong Section 模試テスト',
        '✅ Không giới hạn số lượng units'
      ]
    },
    comprehensive_sections: {
      name: 'Gói 聴解 + 言葉。漢字 + 文法 + 読解',
      description: 'Truy cập đầy đủ các sections: 聴解, 言葉。漢字, 文法, 読解',
      price: 2000,
      courseName: 'Gói Comprehensive - 聴解 + 言葉。漢字 + 文法 + 読解',
      allowedSections: ['聴解', '言葉。漢字', '文法', '読解'],
      benefits: [
        '✅ Truy cập đầy đủ Section 聴解',
        '✅ Truy cập đầy đủ Section 言葉。漢字',
        '✅ Truy cập đầy đủ Section 文法',
        '✅ Truy cập đầy đủ Section 読解',
        '✅ Không giới hạn số lượng units'
      ]
    }
  };

  const currentPackage = packages[selectedPackage];

  // Duration options (in months)
  const durationOptions = [
    { value: '1', label: '1 tháng', days: 30, priceMultiplier: 1 },
    { value: '3', label: '3 tháng', days: 90, priceMultiplier: 2.5 },
    { value: '6', label: '6 tháng', days: 180, priceMultiplier: 4 }
  ];

  // Calculate price based on package and duration
  const calculatePrice = (packagePrice, durationMonths) => {
    const multiplier = durationOptions.find(opt => opt.value === durationMonths)?.priceMultiplier || 1;
    return packagePrice * multiplier;
  };

  // Calculate expiration date based on selected duration
  const calculateExpiresAt = (durationMonths) => {
    const days = durationOptions.find(opt => opt.value === durationMonths)?.days || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt.toISOString();
  };

  // Get current price based on selected package and duration
  const currentPrice = calculatePrice(currentPackage.price, selectedDuration);

  // Fetch subscription info
  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      if (!authenticatedUser) {
        setLoadingSubscription(false);
        return;
      }

      try {
        const lmsBaseUrl = getConfig().LMS_BASE_URL;
        const response = await fetch(`${lmsBaseUrl}/api/payment/subscription/status/`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setSubscriptionInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch subscription info:', error);
      } finally {
        setLoadingSubscription(false);
      }
    };

    fetchSubscriptionInfo();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Function to get CSRF token from LMS backend
  const getCSRFToken = async () => {
    try {
      const lmsBaseUrl = getConfig().LMS_BASE_URL;
      const response = await fetch(`${lmsBaseUrl}/csrf/api/v1/token`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return data.csrfToken;
      }
    } catch (error) {
    }
    return null;
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Calculate expiration date
      const expiresAt = calculateExpiresAt(selectedDuration);

      // Tạo dữ liệu thanh toán
      const paymentData = {
        amount: currentPrice,
        courseId: null,
        courseName: currentPackage.courseName,
        currency: 'VND',
        paymentMethod,
        paymentType: 'section_access', // All packages are section_access now
        sectionName: currentPackage.sectionName || null, // For backward compatibility
        allowedSections: currentPackage.allowedSections || null, // List of allowed sections, or ['*'] for all
        excludedSections: currentPackage.excludedSections || null, // List of excluded sections
        expiresAt: expiresAt, // ISO string of expiration date
        durationMonths: selectedDuration, // Duration in months for reference
        returnUrl: `${getConfig().LMS_BASE_URL}/api/payment/callback/`,
        cancelUrl: `${window.location.origin}/learning/payment/cancel`,
        useSimulator,
      };


      // Lấy CSRF token từ LMS backend
      const csrfToken = await getCSRFToken();

      // Gọi API backend để tạo VNPay payment URL
      const lmsBaseUrl = getConfig().LMS_BASE_URL;
      const response = await fetch(`${lmsBaseUrl}/api/payment/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        body: JSON.stringify(paymentData),
        credentials: 'include',
      });


      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Payment creation failed: ${response.status}`;
        
        // Try to parse error message from response
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorText;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        console.error('Payment API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          url: `${lmsBaseUrl}/api/payment/create/`,
          paymentMethod,
        });
        
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        // Redirect đến payment gateway (VNPay/PayOS)
        window.location.href = data.paymentUrl;
      } else {
        const errorMsg = data.error || 'No payment URL received';
        console.error('Payment API Response Error:', data);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Payment Error:', error);
      const errorMessage = error.message || 'Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại.';
      alert(`Lỗi thanh toán: ${errorMessage}\n\nVui lòng kiểm tra console để xem chi tiết.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);

  // Render subscription info content
  const renderSubscriptionContent = () => (
            <div style={{ padding: '12px', background: '#ffffff' }}>
              {loadingSubscription ? (
                <p>Đang tải thông tin...</p>
              ) : subscriptionInfo?.has_subscription && subscriptionInfo?.subscription_info ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f0f9fa', borderRadius: '4px' }}>
                    <strong>Loại gói:</strong>
                    <span style={{ fontWeight: 'bold' }}>
                      {subscriptionInfo.subscription_info.payment_type === 'all_access' 
                        ? '🌟 All Access' 
                        : subscriptionInfo.subscription_info.payment_type === 'section_access'
                        ? '📚 Section Access'
                        : '📦 Subscription'}
                    </span>
                  </div>
                  
                  {/* Show number of packages if multiple */}
                  {subscriptionInfo.subscription_info.total_packages > 1 && (
                    <div style={{ padding: '10px', background: '#e3f2fd', borderRadius: '4px', border: '1px solid #2196f3' }}>
                      <strong style={{ color: '#1976d2' }}>📦 Bạn đang có {subscriptionInfo.subscription_info.total_packages} gói đang hoạt động</strong>
                      <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#555' }}>
                        Các sections được cộng dồn từ tất cả các gói bạn đã mua.
                      </p>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f0f9fa', borderRadius: '4px' }}>
                    <strong>Trạng thái:</strong>
                    <span style={{ color: subscriptionInfo.subscription_info.subscription_active ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                      {subscriptionInfo.subscription_info.subscription_active ? '✅ Đang hoạt động' : '❌ Đã hết hạn'}
                    </span>
                  </div>
                  
                  {/* Show allowed sections for section_access */}
                  {subscriptionInfo.subscription_info.payment_type === 'section_access' && subscriptionInfo.subscription_info.allowed_sections && subscriptionInfo.subscription_info.allowed_sections.length > 0 && (
                    <div style={{ padding: '8px', background: '#e8f5e9', borderRadius: '4px' }}>
                      <strong>✅ Sections được truy cập:</strong>
                      <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {subscriptionInfo.subscription_info.allowed_sections.includes('*') ? (
                          <span style={{ padding: '4px 8px', background: '#4caf50', color: 'white', borderRadius: '4px', fontSize: '12px' }}>
                            Tất cả sections
                          </span>
                        ) : (
                          subscriptionInfo.subscription_info.allowed_sections.map((section, idx) => (
                            <span key={idx} style={{ padding: '4px 8px', background: '#4caf50', color: 'white', borderRadius: '4px', fontSize: '12px' }}>
                              {section}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Show excluded sections if any */}
                  {subscriptionInfo.subscription_info.excluded_sections && subscriptionInfo.subscription_info.excluded_sections.length > 0 && (
                    <div style={{ padding: '8px', background: '#fff3e0', borderRadius: '4px' }}>
                      <strong>🚫 Sections bị loại trừ:</strong>
                      <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {subscriptionInfo.subscription_info.excluded_sections.map((section, idx) => (
                          <span key={idx} style={{ padding: '4px 8px', background: '#ff9800', color: 'white', borderRadius: '4px', fontSize: '12px' }}>
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {subscriptionInfo.subscription_info.total_amount_paid ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f0f9fa', borderRadius: '4px' }}>
                      <strong>Tổng số tiền đã thanh toán ({subscriptionInfo.subscription_info.total_packages || 1} gói):</strong>
                      <span style={{ fontWeight: 'bold', color: '#0097a9' }}>
                        {formatPrice(subscriptionInfo.subscription_info.total_amount_paid)}
                      </span>
                    </div>
                  ) : subscriptionInfo.subscription_info.amount_paid && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f0f9fa', borderRadius: '4px' }}>
                      <strong>Số tiền đã thanh toán:</strong>
                      <span>{formatPrice(parseFloat(subscriptionInfo.subscription_info.amount_paid))}</span>
                    </div>
                  )}
                  
                  {/* Show list of all packages if multiple */}
                  {subscriptionInfo.subscription_info.packages && 
                   subscriptionInfo.subscription_info.packages.length > 1 && 
                   subscriptionInfo.subscription_info.total_packages > 1 && (
                    <div style={{ padding: '12px', background: '#fff9e6', borderRadius: '4px', border: '1px solid #ffc107' }}>
                      <strong style={{ color: '#f57c00', marginBottom: '8px', display: 'block' }}>
                        📋 Chi tiết các gói đã mua:
                      </strong>
                      {subscriptionInfo.subscription_info.packages.map((pkg, idx) => (
                        <div key={idx} style={{ 
                          marginTop: idx > 0 ? '10px' : '0',
                          padding: '10px', 
                          background: 'white', 
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <strong>Gói {idx + 1}:</strong>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#666' }}>
                              {pkg.transaction_ref}
                            </span>
                          </div>
                          {pkg.allowed_sections && pkg.allowed_sections.length > 0 && (
                            <div style={{ marginTop: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#666' }}>Sections: </span>
                              {pkg.allowed_sections.includes('*') ? (
                                <span style={{ padding: '2px 6px', background: '#4caf50', color: 'white', borderRadius: '3px', fontSize: '11px' }}>
                                  Tất cả
                                </span>
                              ) : (
                                pkg.allowed_sections.map((section, sIdx) => (
                                  <span key={sIdx} style={{ 
                                    padding: '2px 6px', 
                                    background: '#4caf50', 
                                    color: 'white', 
                                    borderRadius: '3px', 
                                    fontSize: '11px',
                                    marginLeft: sIdx > 0 ? '4px' : '0'
                                  }}>
                                    {section}
                                  </span>
                                ))
                              )}
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: '#666' }}>
                            <span>Giá: {formatPrice(pkg.amount)}</span>
                            {pkg.expires_at && (
                              <span>Hết hạn: {formatDate(pkg.expires_at)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {subscriptionInfo.subscription_info.created_at && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f0f9fa', borderRadius: '4px' }}>
                      <strong>Ngày đăng ký:</strong>
                      <span>{formatDate(subscriptionInfo.subscription_info.created_at)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Bạn chưa có subscription nào.</p>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem' }}>Hãy chọn một gói phía dưới để đăng ký!</p>
                </div>
              )}
    </div>
  );

  // Render packages/payment content
  const renderPackagesContent = () => (
    <div className="payment-content">
          <div className="package-selection" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Chọn gói học</h2>
            <div className="package-options" style={{ display: 'flex', gap: '15px', marginBottom: '1rem', flexWrap: 'wrap', width: '100%', maxWidth: '100%' }}>
              <div
                className={`package-card ${selectedPackage === 'section_access' ? 'selected' : ''}`}
                onClick={() => setSelectedPackage('section_access')}
                style={{
                  flex: '1 1 180px',
                  minWidth: '180px',
                  padding: '12px',
                  border: selectedPackage === 'section_access' ? '2px solid #0097a9' : '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: selectedPackage === 'section_access' ? '#e0f7fa' : '#f0f9fa',
                  transition: 'all 0.2s'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', margin: '0 0 6px 0' }}>📚 {packages.section_access.name}</h3>
                <p style={{ color: '#666', marginBottom: '0', fontSize: '0.85rem' }}>{packages.section_access.description}</p>
              </div>
              <div
                className={`package-card ${selectedPackage === 'all_except_conversation' ? 'selected' : ''}`}
                onClick={() => setSelectedPackage('all_except_conversation')}
                style={{
                  flex: '1 1 180px',
                  minWidth: '180px',
                  padding: '12px',
                  border: selectedPackage === 'all_except_conversation' ? '2px solid #0097a9' : '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: selectedPackage === 'all_except_conversation' ? '#e0f7fa' : '#f0f9fa',
                  transition: 'all 0.2s'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', margin: '0 0 6px 0' }}>🎯 {packages.all_except_conversation.name}</h3>
                <p style={{ color: '#666', marginBottom: '0', fontSize: '0.85rem' }}>{packages.all_except_conversation.description}</p>
              </div>
              <div
                className={`package-card ${selectedPackage === 'mock_test' ? 'selected' : ''}`}
                onClick={() => setSelectedPackage('mock_test')}
                style={{
                  flex: '1 1 180px',
                  minWidth: '180px',
                  padding: '12px',
                  border: selectedPackage === 'mock_test' ? '2px solid #0097a9' : '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: selectedPackage === 'mock_test' ? '#e0f7fa' : '#f0f9fa',
                  transition: 'all 0.2s'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', margin: '0 0 6px 0' }}>📝 {packages.mock_test.name}</h3>
                <p style={{ color: '#666', marginBottom: '0', fontSize: '0.85rem' }}>{packages.mock_test.description}</p>
              </div>
              <div
                className={`package-card ${selectedPackage === 'comprehensive_sections' ? 'selected' : ''}`}
                onClick={() => setSelectedPackage('comprehensive_sections')}
                style={{
                  flex: '1 1 180px',
                  minWidth: '180px',
                  padding: '12px',
                  border: selectedPackage === 'comprehensive_sections' ? '2px solid #0097a9' : '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: selectedPackage === 'comprehensive_sections' ? '#e0f7fa' : '#f0f9fa',
                  transition: 'all 0.2s'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', margin: '0 0 6px 0' }}>📚 {packages.comprehensive_sections.name}</h3>
                <p style={{ color: '#666', marginBottom: '0', fontSize: '0.85rem' }}>{packages.comprehensive_sections.description}</p>
              </div>
            </div>
          </div>

          <div className="course-summary">
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Thông tin gói học</h2>
            <div className="course-card">
              <div className="course-info">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{currentPackage.name}</h3>
                <div className="course-details">
                  <p><strong>Quyền truy cập:</strong> {currentPackage.description}</p>
                  
                  {/* Duration Selection */}
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ marginBottom: '6px', fontSize: '0.9rem' }}><strong>Thời hạn:</strong></p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {durationOptions.map((option) => (
                        <label
                          key={option.value}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '6px 10px',
                            border: selectedDuration === option.value ? '2px solid #0097a9' : '1px solid #ddd',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: selectedDuration === option.value ? '#f0f9fa' : '#ffffff',
                            transition: 'all 0.2s',
                            flex: '1 1 100px',
                            minWidth: '100px',
                            justifyContent: 'center',
                            fontSize: '0.85rem'
                          }}
                        >
                          <input
                            type="radio"
                            name="duration"
                            value={option.value}
                            checked={selectedDuration === option.value}
                            onChange={(e) => setSelectedDuration(e.target.value)}
                            style={{ marginRight: '6px' }}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="benefits">
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>🎯 Lợi ích:</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem' }}>
                    {currentPackage.benefits.map((benefit, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="course-price">
                <span className="price" style={{ fontSize: '1.4rem' }}>{formatPrice(currentPrice)}</span>
                <span className="price-note" style={{ fontSize: '0.8rem' }}>Thanh toán một lần ({durationOptions.find(opt => opt.value === selectedDuration)?.label})</span>
              </div>
            </div>
          </div>
    </div>
  );

  return (
    <div className="payment-page" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <LearningHeader intl={intl} />
      <div className="payment-container" style={{ width: '100%', maxWidth: '100%', padding: '0 10px' }}>
        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px',
          borderBottom: '2px solid #ddd'
        }}>
          <button
            onClick={() => setActiveTab('packages')}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderBottom: activeTab === 'packages' ? '3px solid #0097a9' : '3px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'packages' ? 'bold' : 'normal',
              color: activeTab === 'packages' ? '#0097a9' : '#666',
              transition: 'all 0.2s'
            }}
          >
            📦 Gói học & Thanh toán
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderBottom: activeTab === 'subscription' ? '3px solid #0097a9' : '3px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'subscription' ? 'bold' : 'normal',
              color: activeTab === 'subscription' ? '#0097a9' : '#666',
              transition: 'all 0.2s'
            }}
          >
            📋 Thông tin Subscription
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'packages' && renderPackagesContent()}
        {activeTab === 'subscription' && renderSubscriptionContent()}
      </div>

      {/* Fixed Payment Actions - Only show on packages tab */}
      {activeTab === 'packages' && (
        <div className="payment-actions-fixed">
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
      )}
    </div>
  );
};

PaymentPage.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(PaymentPage);
