import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import { getConfig } from '@edx/frontend-platform';
import { useToggle } from '@openedx/paragon';

// import { CourseTabsNavigation } from '../course-tabs';
import { useModel } from '../generic/model-store';
import { AlertList } from '../generic/user-messages';
import StreakModal from '../shared/streak-celebration';
import InstructorToolbar from '../instructor-toolbar';
import useEnrollmentAlert from '../alerts/enrollment-alert';
import useLogistrationAlert from '../alerts/logistration-alert';

import ProductTours from '../product-tours/ProductTours';

const LoadedTabPage = ({
  activeTabSlug,
  children = null,
  courseId,
  metadataModel = 'courseHomeMeta',
  unitId = null,
}) => {
  const {
    celebrations,
    org,
    originalUserIsStaff,
    tabs,
    title,
    verifiedMode,
    hasCourseAuthorAccess,
  } = useModel('courseHomeMeta', courseId);

  // Logistration and enrollment alerts are only really used for the outline tab, but loaded here to put them above
  // breadcrumbs when they are visible.
  const logistrationAlert = useLogistrationAlert(courseId);
  const enrollmentAlert = useEnrollmentAlert(courseId);

  const activeTab = tabs?.filter(tab => tab.slug === activeTabSlug)[0];

  const streakLengthToCelebrate = celebrations && celebrations.streakLengthToCelebrate;
  const streakDiscountCouponEnabled = celebrations && celebrations.streakDiscountEnabled && verifiedMode;
  const [isStreakCelebrationOpen,, closeStreakCelebration] = useToggle(streakLengthToCelebrate);

  // Listen for quiz data from iframe
  useEffect(() => {
    
    // Listen for custom event from iframe
    const handleQuizData = (event) => {
      console.log('🔍 DEBUG - Custom event received:', event.detail);
      if (event.detail) {
        console.log('🎯 Quiz data from custom event:', event.detail);
        showExternalPopup(event.detail);
      }
    };
    
    window.addEventListener('quizGradeSubmitted', handleQuizData);
    
    // Also check for existing data in localStorage (fallback)
    const checkExistingData = () => {
      const existingData = localStorage.getItem('quizGradeSubmitted');
      const timestamp = localStorage.getItem('quizGradeSubmittedTimestamp');
      if (existingData && timestamp) {
        const timeDiff = Date.now() - parseInt(timestamp);
        if (timeDiff < 5000) { // Only if data is less than 5 seconds old
          console.log('🔍 DEBUG - Found existing data in localStorage:', existingData);
          try {
            const data = JSON.parse(existingData);
            showExternalPopup(data);
            // Clear the data after using it
            localStorage.removeItem('quizGradeSubmitted');
            localStorage.removeItem('quizGradeSubmittedTimestamp');
          } catch (error) {
            console.error('🔍 DEBUG - Error parsing existing localStorage data:', error);
          }
        }
      }
    };
    
    // Check for existing data every 500ms
    const intervalId = setInterval(checkExistingData, 500);
    

    return () => {
      window.removeEventListener('quizGradeSubmitted', handleQuizData);
      clearInterval(intervalId);
    };
  }, []);

  // Function to close external popup
  const closeExternalPopup = () => {
    const existingPopup = document.getElementById('external-quiz-popup');
    if (existingPopup) {
      existingPopup.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => existingPopup.remove(), 300);
    }
  };

  // Function to show external popup
  const showExternalPopup = (data) => {
    console.log('🔍 DEBUG - showExternalPopup called with data:', data);
    
    // Check if popup is already open
    const existingPopupCheck = document.getElementById('external-quiz-popup');
    if (existingPopupCheck) {
      console.log('🔍 DEBUG - Popup already exists, closing it');
      // Close existing popup instead of opening new one
      closeExternalPopup();
      return;
    }
    
    console.log('🔍 DEBUG - Creating new popup');
    
    // Create simple test popup first
    const testPopup = document.createElement('div');
    testPopup.id = 'external-quiz-popup';
    testPopup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #4CAF50;
      color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 99999;
      max-width: 400px;
      font-family: Arial, sans-serif;
      text-align: center;
    `;
    
    testPopup.innerHTML = `
      <h3 style="margin: 0 0 20px 0; font-size: 24px;">🎉 QUIZ SUBMITTED!</h3>
      <p style="margin: 0 0 15px 0; font-size: 16px;">Data received from iframe:</p>
      <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 6px; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>Selected:</strong> ${data.selectedOption || 'None'}</p>
        <p style="margin: 5px 0;"><strong>Correct:</strong> ${data.isCorrect ? '✅ Yes' : '❌ No'}</p>
        <p style="margin: 5px 0;"><strong>Score:</strong> ${data.score || 0}/1</p>
        <p style="margin: 5px 0;"><strong>Message:</strong> ${data.message || 'No message'}</p>
      </div>
      <button onclick="this.parentElement.remove()" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">Close</button>
    `;
    
    document.body.appendChild(testPopup);
    console.log('🔍 DEBUG - Simple test popup created');
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (testPopup.parentNode) {
        testPopup.remove();
      }
    }, 5000);
    
    return; // Exit early for now
    const popup = document.createElement('div');
    popup.id = 'external-quiz-popup';
    popup.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 99999;
      max-width: 500px;
      font-family: Arial, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;
    
    // Create correct answer section
    const correctAnswerHtml = data.options ? data.options.filter(option => option.isCorrect).map(option => `
      <div style="
        padding: 12px;
        margin: 8px 0;
        border-radius: 8px;
        border: 2px solid #4CAF50;
        background: rgba(76, 175, 80, 0.1);
        color: #4CAF50;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <span style="font-size: 16px;">✓</span>
        <span style="flex: 1;">${option.text}</span>
      </div>
    `).join('') : '';

    // Create user answer section
    const userAnswerHtml = data.options ? data.options.filter(option => option.isSelected).map(option => `
      <div style="
        padding: 12px;
        margin: 8px 0;
        border-radius: 8px;
        border: 2px solid ${option.isCorrect ? '#4CAF50' : '#f44336'};
        background: ${option.isCorrect ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'};
        color: ${option.isCorrect ? '#4CAF50' : '#f44336'};
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <span style="font-size: 16px;">${option.isCorrect ? '✅' : '❌'}</span>
        <span style="flex: 1;">${option.text}</span>
      </div>
    `).join('') : '';

    // Create all options display
    const allOptionsHtml = data.options ? data.options.map(option => `
      <div style="
        padding: 8px 12px;
        margin: 4px 0;
        border-radius: 6px;
        border: 1px solid #e0e0e0;
        background: rgba(255, 255, 255, 0.05);
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
      ">
        <span style="font-size: 14px;">${option.isSelected ? (option.isCorrect ? '✅' : '❌') : (option.isCorrect ? '✓' : '○')}</span>
        <span style="flex: 1;">${option.text}</span>
        ${option.isSelected ? '<span style="font-size: 12px; opacity: 0.8;">(Your choice)</span>' : ''}
      </div>
    `).join('') : '';

    popup.innerHTML = `
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: white; font-size: 18px;">🎯 Quiz Result</h3>
        <button onclick="this.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.2); color: white; border: none; font-size: 18px; cursor: pointer; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">&times;</button>
      </div>
      
      ${data.questionText ? `
        <div style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px; border-left: 4px solid #2196F3;">
          <strong style="color: #2196F3;">Question:</strong><br>
          <span style="font-style: italic;">${data.questionText}</span>
        </div>
      ` : ''}
      
      <div style="margin-bottom: 20px;">
        <h4 style="margin: 0 0 15px 0; font-size: 16px; color: #FFC107; text-align: center;">Answer Review</h4>
        
        <!-- Correct Answer Section -->
        <div style="margin-bottom: 20px;">
          <h5 style="margin: 0 0 10px 0; font-size: 14px; color: #4CAF50; font-weight: bold; display: flex; align-items: center; gap: 8px;">
            <span>✓</span>
            <span>Correct Answer</span>
          </h5>
          <div style="background: rgba(76, 175, 80, 0.1); border-radius: 8px; padding: 10px;">
            ${correctAnswerHtml}
          </div>
        </div>
        
        <!-- User Answer Section -->
        <div style="margin-bottom: 20px;">
          <h5 style="margin: 0 0 10px 0; font-size: 14px; color: ${data.isCorrect ? '#4CAF50' : '#f44336'}; font-weight: bold; display: flex; align-items: center; gap: 8px;">
            <span>${data.isCorrect ? '✅' : '❌'}</span>
            <span>Your Answer</span>
          </h5>
          <div style="background: ${data.isCorrect ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'}; border-radius: 8px; padding: 10px;">
            ${userAnswerHtml || '<div style="color: #ff9800; font-style: italic;">No answer selected</div>'}
          </div>
        </div>
        
        <!-- All Options Section -->
        <div style="margin-bottom: 20px;">
          <h5 style="margin: 0 0 10px 0; font-size: 14px; color: #2196F3; font-weight: bold; display: flex; align-items: center; gap: 8px;">
            <span>📋</span>
            <span>All Options</span>
          </h5>
          <div style="background: rgba(33, 150, 243, 0.1); border-radius: 8px; padding: 10px;">
            ${allOptionsHtml}
          </div>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
        <div style="padding: 10px; background: rgba(255,255,255,0.1); border-radius: 6px; text-align: center;">
          <div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">RESULT</div>
          <div style="font-weight: bold; color: ${data.isCorrect ? '#4CAF50' : '#f44336'};">
            ${data.isCorrect ? '✅ Correct' : '❌ Incorrect'}
          </div>
        </div>
        <div style="padding: 10px; background: rgba(255,255,255,0.1); border-radius: 6px; text-align: center;">
          <div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">SCORE</div>
          <div style="font-weight: bold; color: #FFC107;">
            ${data.score || 0}/1
          </div>
        </div>
      </div>
      
      ${data.message ? `
        <div style="text-align: center; margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 6px;">
          <div style="font-size: 14px; font-style: italic; color: #FFC107;">${data.message}</div>
        </div>
      ` : ''}
      
      <div style="text-align: center;">
        <button onclick="this.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.3s ease;">Close</button>
      </div>
    `;
    
    // Remove existing popup if any
    const existingPopupRemove = document.getElementById('external-quiz-popup');
    if (existingPopupRemove) {
      existingPopupRemove.remove();
    }
    
    document.body.appendChild(popup);
    console.log('🔍 DEBUG - Popup added to DOM with ID:', popup.id);
    console.log('🔍 DEBUG - Popup position:', popup.style.position);
    console.log('🔍 DEBUG - Popup z-index:', popup.style.zIndex);
    
    // Auto remove after 8 seconds
    setTimeout(() => {
      if (popup.parentNode) {
        console.log('🔍 DEBUG - Auto removing popup after 8 seconds');
        popup.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => popup.remove(), 300);
      }
    }, 8000);
  };

  // Expose functions to global scope for iframe access
  useEffect(() => {
    window.triggerQuizToggle = (data) => {
      showExternalPopup(data);
    };
    
    window.closeQuizPopup = () => {
      closeExternalPopup();
    };
  }, []);

  return (
    <>
      <ProductTours
        activeTab={activeTabSlug}
        courseId={courseId}
        isStreakCelebrationOpen={isStreakCelebrationOpen}
        org={org}
      />
      <Helmet>
        <title>{`${activeTab ? `${activeTab.title} | ` : ''}${title} | ${getConfig().SITE_NAME}`}</title>
      </Helmet>
      {originalUserIsStaff && (
        <InstructorToolbar
          courseId={courseId}
          unitId={unitId}
          tab={activeTabSlug}
          isStudioButtonVisible={hasCourseAuthorAccess}
        />
      )}
      <StreakModal
        courseId={courseId}
        metadataModel={metadataModel}
        streakLengthToCelebrate={streakLengthToCelebrate}
        isStreakCelebrationOpen={!!isStreakCelebrationOpen}
        closeStreakCelebration={closeStreakCelebration}
        streakDiscountCouponEnabled={streakDiscountCouponEnabled}
        verifiedMode={verifiedMode}
      />
      <main className="d-flex flex-column flex-grow-1">
        <AlertList
          topic="outline"
          className="mx-5 mt-3"
          customAlerts={{
            ...enrollmentAlert,
            ...logistrationAlert,
          }}
        />
        {/* <CourseTabsNavigation tabs={tabs} className="mb-3" activeTabSlug={activeTabSlug} /> */}
        <div id="main-content" className="container-xl" style={{ maxWidth: '100%' }}>
          {children}
        </div>
      </main>
    </>
  );
};

LoadedTabPage.propTypes = {
  activeTabSlug: PropTypes.string.isRequired,
  children: PropTypes.node,
  courseId: PropTypes.string,
  metadataModel: PropTypes.string,
  unitId: PropTypes.string,
};


export default LoadedTabPage;
