import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Button } from '@openedx/paragon';
import { useModel } from '@src/generic/model-store';
import { GetCourseExitNavigation } from '../../course-exit';
import { useSequenceNavigationMetadata } from './hooks';
import messages from './messages';
import PreviousButton from './generic/PreviousButton';
import NextButton from './generic/NextButton';
import { NextUnitTopNavTriggerSlot } from '../../../../plugin-slots/NextUnitTopNavTriggerSlot';
import { CourseOutlineSidebarTriggerSlot } from '../../../../plugin-slots/CourseOutlineSidebarTriggerSlot';
import { CourseOutlineSidebarSlot } from '../../../../plugin-slots/CourseOutlineSidebarSlot';

/**
 * Persistent Navigation Bar that stays fixed and doesn't re-render during unit changes
 */
const PersistentNavigationBar = ({ courseId, sequenceId, unitId, onClickPrevious, onClickNext, isAtTop = false }) => {
  const intl = useIntl();
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitButton, setShowSubmitButton] = useState(true); // Always show Check button
  const [currentButtonState, setCurrentButtonState] = useState('確認'); // '確認' or 'やり直し'

  const [container, setContainer] = useState(null);
  const containerRef = useRef(null);

  const {
    isFirstUnitInSequence, isLastUnitInSequence, nextLink, previousLink,
  } = useSequenceNavigationMetadata(sequenceId, unitId);

  // Get unit data from model store
  const unit = useModel('units', unitId);

  // Get unit title for display
  const getUnitTitle = () => {
    // Try to get title from unit data first
    if (unit && unit.title) {
      // Extract number from title (e.g., "Unit 109" -> "109")
      const numberMatch = unit.title.match(/(\d+)/);
      if (numberMatch) {
        return numberMatch[1]; // Return just the number like 109, 110, 111
      }
      // If no number found, return the full title
      return unit.title;
    }
    
    // Fallback: extract from unitId
    if (unitId) {
      const match = unitId.match(/block@([a-f0-9]+)/);
      if (match) {
        const blockId = match[1];
        const numberMatch = blockId.match(/(\d{3})/);
        if (numberMatch) {
          return numberMatch[1];
        }
        return blockId.substring(0, 3);
      }
    }
    return 'Unit';
  };

  const courseExitNav = GetCourseExitNavigation(courseId, intl);

  // Create persistent container
  useEffect(() => {
    if (!containerRef.current) {
      // Create a container that stays in DOM
      containerRef.current = document.createElement('div');
      containerRef.current.id = 'persistent-navigation-container';
      containerRef.current.style.cssText = `
        position: relative;
        width: 100%;
        background: white;
        border-bottom: 1px solid #eee;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
      `;
      
      // Insert before the main content area instead of at body start
      const mainContent = document.querySelector('.courseware-sequence') || document.querySelector('.unit') || document.querySelector('main');
      if (mainContent) {
        mainContent.parentNode.insertBefore(containerRef.current, mainContent);
      } else {
        document.body.insertBefore(containerRef.current, document.body.firstChild);
      }
      setContainer(containerRef.current);
    }

    return () => {
      // Cleanup on component unmount
      if (containerRef.current && containerRef.current.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current);
        containerRef.current = null;
      }
    };
  }, []);

  // Message handling for iframe communication - only handle loading states
  useEffect(() => {
    const handleMessage = (event) => {
      const iframe = document.getElementById('unit-iframe');
      if (!iframe || event.source !== iframe.contentWindow) {
        return;
      }

      // BLOCK problem.complete to prevent reload
      if (event.data.type === 'problem.complete') {
        console.log('problem.complete message BLOCKED in PersistentNavigationBar - preventing reload');
        return;
      }

      switch (event.data.type) {
        case 'problem.ready':
          // Just reset loading state, don't change button text
          setIsSubmitting(false);
          break;
        case 'problem.submit.start':
          setIsSubmitting(true);
          break;
        case 'problem.submit.done':
          setIsSubmitting(false);
          // DON'T change button state here - only manual clicks should change it
          break;
        case 'quiz.data.ready':
          // Handle quiz data directly from quiz iframe
          console.log('🔍 DEBUG - Received quiz data from quiz iframe:', event.data.quizData);
          console.log('🔍 DEBUG - Template config:', event.data.templateConfig);
          console.log('🔍 DEBUG - Full event data:', event.data);
          
          // Check if template wants to show popup
          if (event.data.templateConfig && event.data.templateConfig.showPopup === false) {
            console.log('🔍 DEBUG - Template disabled popup, skipping showTestPopup');
            return;
          }
          
          // If no templateConfig or showPopup is true/undefined, show popup
          if (event.data.quizData) {
            console.log('🔍 DEBUG - Showing popup for quiz data');
            showTestPopup(event.data.quizData);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Reset button state when unit changes - always back to "確認"
  useEffect(() => {
    if (unitId) {
      setCurrentButtonState('確認');
    }
  }, [unitId]);

  // Reset when unit changes but keep the navigation bar persistent
  useEffect(() => {
    setIsSubmitEnabled(true);
    setIsSubmitting(false);
    // Keep showSubmitButton as true - always show Check button

    // Don't send any automatic messages - only when user clicks submit
    console.log('🔄 Unit changed, ready for user interaction:', unitId);
  }, [unitId]);

  const handleSubmit = () => {
    const iframe = document.getElementById('unit-iframe');

    if (!iframe || isSubmitting) {
      return;
    }

    try {
      // Toggle button state manually - ONLY on user click
      if (currentButtonState === '確認') {
        // First click: Send check message
        console.log('🔄 User clicked 確認 - sending check message to iframe');
        iframe.contentWindow.postMessage({ type: 'problem.submit', action: 'check' }, '*');
        setCurrentButtonState('やり直し');
      } else {
        // Second click: Send reset message and close popup
        console.log('🔄 User clicked やり直し - sending reset message to iframe');
        iframe.contentWindow.postMessage({ type: 'problem.submit', action: 'reset' }, '*');
        setCurrentButtonState('確認');
        
        // Close popup if it's open
        const existingPopup = document.getElementById('test-popup');
        if (existingPopup) {
          existingPopup.remove();
          // Clean up any existing styles
          const existingStyle = document.querySelector('style[data-popup-style]');
          if (existingStyle) {
            existingStyle.remove();
          }
        }
      }
      
      console.log('🔍 DEBUG - handleSubmit completed, waiting for quiz.data.ready message');
    } catch (e) {
      console.error('Error sending message to iframe:', e);
    }
  };

  // Function to show test popup with data from localStorage
  const showTestPopup = (quizData = null) => {
    // Remove existing popup if any
    const existingPopup = document.getElementById('test-popup');
    if (existingPopup) {
      existingPopup.remove();
    }

    // If no data provided, try to get from localStorage
    if (!quizData) {
      try {
        const storedData = localStorage.getItem('quizGradeSubmitted');
        const timestamp = localStorage.getItem('quizGradeSubmittedTimestamp');
        
        if (storedData && timestamp) {
          const timeDiff = Date.now() - parseInt(timestamp);
          if (timeDiff < 10000) { // Only if data is less than 10 seconds old
            quizData = JSON.parse(storedData);
            console.log('🔍 DEBUG - Found quiz data in localStorage:', quizData);
          }
        }
      } catch (error) {
        console.error('🔍 DEBUG - Error parsing localStorage data:', error);
      }
    }

    // Create answer paragraph container (like in quiz iframe)
    const popup = document.createElement('div');
    popup.id = 'test-popup';
    popup.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 0;
      right: 0;
      padding: 20px 0;
      background-color: rgba(99, 97, 97, 0.95);
      z-index: 9999;
      transition: transform 0.3s ease;
      max-height: 460px;
      overflow-y: auto;
    `;

    // Create inner content wrapper
    const innerWrapper = document.createElement('div');
    innerWrapper.style.cssText = `
      max-width: 70%;
      margin: 0 auto;
      background: #fff;
      border-radius: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.15);
      border: 1px solid #ddd;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      max-height: 400px;
      overflow-y: auto;
      padding: 1.5rem;
    `;
    
    // Generate popup content based on template type
    let popupContent = '';
    
    if (quizData && quizData.templateId === 22) {
      // Template 22: Grammar Sentence Rearrangement
      console.log('🔍 DEBUG - Rendering Template 22 popup:', quizData);
      
      const correctWords = quizData.correctWords || [];
      const userWords = quizData.userWords || [];
      const wordPositions = quizData.wordPositions || {};
      
      popupContent = `
        <div class="grammar-rearrangement-popup">
          <div class="answer-comparison" style="display: flex; gap: 30px; margin-bottom: 20px;">
            <!-- Correct Order Column -->
            <div class="answer-column" style="flex: 1;">
              <div class="answer-column-title" style="margin: 0 0 15px 0; color: #666; font-size: 14px; font-weight: bold;">正しい順序 (Correct Order)</div>
              <div class="correct-words" style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                ${correctWords.map(word => `
                  <span class="quiz-word correct" style="display: inline-block; padding: 6px 12px; background: #2e7d32; color: #fff; border-radius: 4px; font-size: 14px; font-weight: bold;">
                    ${word}
                  </span>
                `).join('')}
              </div>
            </div>
            
            <!-- Your Answer Column -->
            <div class="answer-column" style="flex: 1;">
              <div class="answer-column-title" style="margin: 0 0 15px 0; color: #666; font-size: 14px; font-weight: bold;">あなたの答え (Your Answer)</div>
              <div class="user-words" style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                ${userWords.map((userWord, index) => {
                  // Check if the word is in the correct absolute position
                  const isCorrectPosition = userWord && wordPositions[userWord] !== undefined ? 
                    (wordPositions[userWord] === index) : false;
                  
                  if (userWord) {
                    return `
                      <span class="quiz-word ${isCorrectPosition ? 'correct' : 'incorrect'}" style="display: inline-block; padding: 6px 12px; background: ${isCorrectPosition ? '#2e7d32' : '#b40000'}; color: #fff; border-radius: 4px; font-size: 14px; font-weight: bold;">
                        ${userWord}
                      </span>
                    `;
                  } else {
                    return `
                      <span class="quiz-word empty" style="display: inline-block; padding: 6px 12px; background: #f0f0f0; color: #666; border: 2px dashed #999; border-radius: 4px; font-size: 14px; font-weight: bold;">
                        ＿＿＿
                      </span>
                    `;
                  }
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (quizData && quizData.options && quizData.options.length > 0) {
      // Original template (multiple choice)
      popupContent = `
        <div class="answer-comparison" style="display: flex; gap: 30px; margin-bottom: 20px;">
          <!-- Correct Answer Column -->
          <div class="answer-column" style="flex: 1;">
            <div class="answer-column-title" style="margin: 0 0 15px 0; color: #666; font-size: 14px; font-weight: normal;">Correct answer</div>
            <div id="correct-answers" style="display: flex; flex-direction: column; gap: 8px;">
              ${quizData.options.map(option => `
                <div class="answer-option" style="display: flex; align-items: center; gap: 8px; padding: 8px 0;">
                  <div style="width: 16px; height: 16px; border: 1px solid #ccc; border-radius: 2px; display: flex; align-items: center; justify-content: center; background: ${option.isCorrect ? '#666' : 'white'};">
                    ${option.isCorrect ? '✓' : ''}
                  </div>
                  <span style="font-size: 14px; color: #333;">${option.text}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Your Answer Column -->
          <div class="answer-column" style="flex: 1;">
            <div class="answer-column-title" id="your-answer-title" style="margin: 0 0 15px 0; color: #666; font-size: 14px; font-weight: normal;">Your answer: ${quizData.score || 0}/1</div>
            <div id="your-answers" style="display: flex; flex-direction: column; gap: 8px;">
              ${quizData.options.map(option => `
                <div class="answer-option" style="display: flex; align-items: center; gap: 8px; padding: 8px 0;">
                  <div style="width: 16px; height: 16px; border: 1px solid #ccc; border-radius: 2px; display: flex; align-items: center; justify-content: center; background: ${option.isSelected ? '#666' : 'white'};">
                    ${option.isSelected ? '✓' : ''}
                  </div>
                  <span style="font-size: 14px; color: #333;">${option.text}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } else {
      // Show fallback content
      popupContent = `
        <div style="text-align: center; color: #666;">
          <p>No quiz data available</p>
        </div>
      `;
    }
    
    innerWrapper.innerHTML = popupContent;
    
    // Add inner wrapper to popup
    popup.appendChild(innerWrapper);
    
    // Add responsive styles
    const style = document.createElement('style');
    style.setAttribute('data-popup-style', 'true');
    style.textContent = `
      @media (max-width: 768px) {
        #test-popup .inner-wrapper {
          max-width: 85% !important;
        }
      }
      @media (max-width: 480px) {
        #test-popup .inner-wrapper {
          max-width: 95% !important;
          padding: 1rem !important;
        }
        #test-popup .answer-comparison {
          flex-direction: column !important;
          gap: 15px !important;
        }
        #test-popup .grammar-rearrangement-popup .answer-comparison {
          flex-direction: column !important;
          gap: 15px !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Add class to inner wrapper for responsive targeting
    innerWrapper.className = 'inner-wrapper';
    
    // Add popup to body
    document.body.appendChild(popup);
    console.log('🔍 DEBUG - Test popup created from PersistentNavigationBar with data:', quizData);
    
    // Auto remove after 15 seconds
    setTimeout(() => {
      if (popup.parentNode) {
        popup.remove();
        // Clean up style
        if (style.parentNode) {
          style.remove();
        }
        setCurrentButtonState('確認');
      }
    }, 15000);
  };

  const renderSubmitButton = () => {
    // Simple button state - only changes on manual clicks
    const buttonText = isSubmitting ? '確認中...' : currentButtonState;
    

    return (
      <Button
        variant="brand"
        className="submit-answer-button mx-2"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        <span className="submit-label">{buttonText}</span>
      </Button>
    );
  };

  const renderPreviousButton = () => {
    const buttonStyle = `previous-button ${isAtTop ? 'text-dark mr-3' : 'justify-content-center'}`;
    return (
      <PreviousButton
        className="go-back-button"
        isFirstUnit={isFirstUnitInSequence}
        variant="outline-secondary"
        buttonLabel={intl.formatMessage(messages.previousButton)}
        buttonStyle={buttonStyle}
        onClick={onClickPrevious}
        previousLink={previousLink}
        isAtTop={isAtTop}
        disabled={isFirstUnitInSequence}
      />
    );
  };

  const renderNextButton = () => {
    const { exitActive, exitText } = courseExitNav;
    const buttonText = (isLastUnitInSequence && exitText) ? exitText : intl.formatMessage(messages.nextButton);
    const disabled = isLastUnitInSequence;
    const variant = 'outline-primary';
    const buttonStyle = `next-button ${isAtTop ? 'text-dark' : 'justify-content-center'}`;

    const handleNextClick = () => {
      // No need to save answers when navigating - only when user clicks Check button
      if (onClickNext) {
        onClickNext();
      }
    };

    if (isAtTop) {
      return (
        <NextUnitTopNavTriggerSlot
          {...{
            variant,
            buttonStyle,
            buttonText: buttonText,
            disabled,
            sequenceId,
            nextLink,
            onClickHandler: handleNextClick,
            isAtTop,
          }}
        />
      );
    }

    return (
      <NextButton
        className="go-next-button"
        variant={variant}
        buttonStyle={buttonStyle}
        onClickHandler={handleNextClick}
        disabled={disabled}
        buttonText={buttonText}
        nextLink={nextLink}
        hasEffortEstimate
      />
    );
  };

  // Don't render anything if container not ready
  if (!container) {
    return null;
  }

  // Render into the persistent container
  return createPortal(
    <>
      <div className="unit-navigation-bar d-flex align-items-center justify-content-center" style={{ 
        padding: '1rem',
        position: 'fixed',
        bottom: '0', // Move to bottom to cover bottom bar
        left: '0',
        right: '0',
        zIndex: 10000, // Higher than bottom bar
        background: '#F5EEEE', // Light pink color
        borderTop: '1px solid #eee', // Change to top border
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)', // Shadow above
        width: '100%',
        height: '80px' // Fixed height to cover bottom bar
      }}>
        {renderPreviousButton()}
        {renderSubmitButton()}
        {renderNextButton()}
                  {/* Unit title display */}
                  <div style={{ 
                    marginLeft: '16px',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    {getUnitTitle()}
                  </div>
                  <CourseOutlineSidebarSlot />
      </div>
      

    </>,
    container
  );
};

PersistentNavigationBar.propTypes = {
  courseId: PropTypes.string.isRequired,
  sequenceId: PropTypes.string.isRequired,
  unitId: PropTypes.string,
  onClickPrevious: PropTypes.func.isRequired,
  onClickNext: PropTypes.func.isRequired,
  isAtTop: PropTypes.bool,
};

export default PersistentNavigationBar;
