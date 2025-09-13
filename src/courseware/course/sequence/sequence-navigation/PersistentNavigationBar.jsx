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
    const sendCheck = () => {
      const iframe = document.getElementById('unit-iframe');
      if (iframe) {
        try {
          iframe.contentWindow.postMessage({ type: 'problem.check' }, '*');
        } catch (e) {
        }
      }
    };

    setIsSubmitEnabled(true);
    setIsSubmitting(false);
    // Keep showSubmitButton as true - always show Check button

    sendCheck();
    const retryTimeout = setTimeout(sendCheck, 1000);

    return () => {
      clearTimeout(retryTimeout);
    };
  }, [unitId]);

  const handleSubmit = () => {
    const iframe = document.getElementById('unit-iframe');

    if (!iframe || isSubmitting) {
      return;
    }

    try {
      iframe.contentWindow.postMessage({ type: 'problem.submit', action: 'check' }, '*');
      
      // Toggle button state manually - ONLY on user click
      if (currentButtonState === '確認') {
        setCurrentButtonState('やり直し');
      } else {
        setCurrentButtonState('確認');
      }
    } catch (e) {
    }
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
