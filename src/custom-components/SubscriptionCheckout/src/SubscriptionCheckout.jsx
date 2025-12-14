import React, { useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getConfig } from '@edx/frontend-platform';
import { AppContext } from '@edx/frontend-platform/react';
import LearningHeader from '../../Header/src/learning-header/LearningHeader';
import Footer from '../../Footer';
// Use static paths for webp images
const package1 = '/assets/hero/package1.webp';
const package2 = '/assets/hero/package2.webp';
const package3 = '/assets/hero/package3.webp';
import './SubscriptionCheckout.scss';

const SubscriptionCheckout = () => {
  const { authenticatedUser } = useContext(AppContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(searchParams.get('duration') || '1');

  // Get package info from URL params
  const packageType = searchParams.get('package') || 'section_access';

  // Package configurations (same as PaymentPage)
  const packages = {
    section_access: {
      name: 'Gói 読解 Section',
      description: 'Truy cập đầy đủ Section 読解',
      price: 2000,
      emoji: '📚',
      courseName: 'Gói 読解 Section - Truy cập đầy đủ Section 読解',
      sectionName: '読解',
      allowedSections: ['読解'],
      excludedSections: [],
      benefits: [
        'Truy cập đầy đủ tất cả units trong Section 読解',
        'Không giới hạn số lượng units'
      ]
    },
    all_except_conversation: {
      name: 'Gói All Sections (Trừ 会話練習)',
      description: 'Truy cập tất cả sections trừ 会話練習',
      price: 2000,
      emoji: '🎯',
      courseName: 'Gói All Sections - Trừ 会話練習',
      sectionName: null,
      allowedSections: ['*'],
      excludedSections: ['会話練習'],
      benefits: [
        'Truy cập tất cả sections trừ 会話練習',
        'Không giới hạn số lượng units'
      ]
    },
    mock_test: {
      name: 'Gói 模試テスト',
      description: 'Truy cập đầy đủ Section 模試テスト',
      price: 2000,
      emoji: '📝',
      courseName: 'Gói 模試テスト - Truy cập đầy đủ Section 模試テスト',
      sectionName: '模試テスト',
      allowedSections: ['模試テスト'],
      excludedSections: [],
      benefits: [
        'Truy cập đầy đủ tất cả units trong Section 模試テスト',
        'Không giới hạn số lượng units'
      ]
    },
    comprehensive_sections: {
      name: 'Gói 聴解 + 言葉。漢字 + 文法 + 読解',
      description: 'Truy cập đầy đủ các sections: 聴解, 言葉。漢字, 文法, 読解',
      price: 2000,
      emoji: '🌟',
      courseName: 'Gói Comprehensive - 聴解 + 言葉。漢字 + 文法 + 読解',
      sectionName: null,
      allowedSections: ['聴解', '言葉。漢字', '文法', '読解'],
      excludedSections: [],
      benefits: [
        'Truy cập đầy đủ Section 聴解',
        'Truy cập đầy đủ Section 言葉。漢字',
        'Truy cập đầy đủ Section 文法',
        'Truy cập đầy đủ Section 読解',
        'Không giới hạn số lượng units'
      ]
    }
  };

  // Duration options with prices
  const durationOptions = {
    '1': { label: '1 tháng', days: 30, priceMultiplier: 1 },
    '3': { label: '3 tháng', days: 90, priceMultiplier: 2.5 },
    '6': { label: '6 tháng', days: 180, priceMultiplier: 4 }
  };

  const currentPackage = packages[packageType] || packages.section_access;
  const durationOption = durationOptions[selectedDuration] || durationOptions['1'];
  const totalPrice = currentPackage.price * durationOption.priceMultiplier;

  // Map package type to image
  const getPackageImage = (type) => {
    const mapping = {
      'section_access': package1,
      'all_except_conversation': package2,
      'mock_test': package3,
      // Use package1 for comprehensive (same as package 1)
      'comprehensive_sections': package1
    };
    return mapping[type] || package1;
  };

  // Calculate expiration date
  const calculateExpiresAt = (days) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt.toISOString();
  };

  // Handle PayOS payment
  const handlePayOSPayment = async () => {
    if (!authenticatedUser) {
      alert('Vui lòng đăng nhập để tiếp tục');
      return;
    }

    setIsProcessing(true);

    try {
      const lmsBaseUrl = getConfig().LMS_BASE_URL;
      const expiresAt = calculateExpiresAt(durationOption.days);

      // Prepare payment data (same format as PaymentPage)
      const paymentData = {
        amount: totalPrice,
        courseId: null,
        courseName: currentPackage.courseName,
        currency: 'VND',
        paymentMethod: 'payos', // Use PayOS
        paymentType: 'section_access',
        sectionName: currentPackage.sectionName,
        allowedSections: currentPackage.allowedSections,
        excludedSections: currentPackage.excludedSections,
        expiresAt: expiresAt,
        durationMonths: selectedDuration,
        returnUrl: `${lmsBaseUrl}/api/payment/callback/`,
        cancelUrl: `${window.location.origin}/learning/payment/cancel`,
        useSimulator: false,
      };

      const response = await fetch(`${lmsBaseUrl}/api/payment/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment API Error:', errorText);
        throw new Error('Payment request failed');
      }

      const data = await response.json();
      
      if (data.checkoutUrl) {
        // Redirect to PayOS checkout
        window.location.href = data.checkoutUrl;
      } else if (data.paymentUrl) {
        // Fallback for other payment methods
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <LearningHeader />
      
      <main className="flex-grow-1 py-3">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Back Button */}
              <button 
                className="btn btn-link text-muted p-0 mb-3"
                onClick={() => navigate('/learning')}
                style={{ textDecoration: 'none' }}
              >
                ← Quay lại
              </button>

              {/* Subscription Layout */}
              <div className="row subscription align-items-center justify-content-center">
                <div className="subscription-info col-lg-10">
                  
                  {/* Left Side: Benefits */}
                  <div className="benefits-section">
                    <h2>What does this premium plan get me?</h2>
                    <ul className="list-unstyled list-check text-left">
                      {currentPackage.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                    
                    {/* Duration Selection */}
                    <div className="duration-selection mt-4 mb-4">
                      <h3 className="duration-title mb-3">Choose Duration</h3>
                      <div className="duration-options">
                        {Object.entries(durationOptions).map(([key, option]) => {
                          const optionPrice = currentPackage.price * option.priceMultiplier;
                          const isSelected = selectedDuration === key;
                          return (
                            <div
                              key={key}
                              className={`duration-option ${isSelected ? 'selected' : ''}`}
                              onClick={() => setSelectedDuration(key)}
                            >
                              <div className="duration-option-content">
                                <div className="duration-label">{option.label}</div>
                                <div className="duration-price">
                                  ₫{optionPrice.toLocaleString()}
                                </div>
                                {key === '3' && (
                                  <span className="badge bg-success ms-2" style={{ fontSize: '0.65rem' }}>-17%</span>
                                )}
                                {key === '6' && (
                                  <span className="badge bg-success ms-2" style={{ fontSize: '0.65rem' }}>-33%</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handlePayOSPayment}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                        </>
                      ) : (
                      'Pay now'
                      )}
                    </button>
                  </div>

                  {/* Right Side: Price Card with Image */}
                  <div className="subscription-price-card">
                    <div className="price-card-inner">
                      {/* Image positioned on the left */}
                      <img 
                        src={getPackageImage(packageType)}
                        alt={currentPackage.name}
                        className="plan-image"
                      />
                      
                      {/* Price content */}
                      <div className="price-content">
                        <h3 className="plan-name">{currentPackage.name.toUpperCase()}</h3>
                        <div className="price-display">
                          <sup>₫</sup>
                          <span className="price">{totalPrice.toLocaleString()}</span>
                          <span className="duration"> / {durationOption.label}</span>
                        </div>
                      </div>
                      
                      {/* Total section at bottom */}
                      <div className="total-section">
                        <span className="total-label">Total</span>
                        <span className="total-price">₫ {totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SubscriptionCheckout;

