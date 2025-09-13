import classNames from 'classnames';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Button } from '@openedx/paragon';
import { useEffect, useState, useCallback } from 'react';

import { GetCourseExitNavigation } from '../../course-exit';
import Sidebar from '../../sidebar/Sidebar';

import { useSequenceNavigationMetadata } from './hooks';
import messages from './messages';
import PreviousButton from './generic/PreviousButton';
import NextButton from './generic/NextButton';
import { NextUnitTopNavTriggerSlot } from '../../../../plugin-slots/NextUnitTopNavTriggerSlot';
import { CourseOutlineSidebarTriggerSlot } from '../../../../plugin-slots/CourseOutlineSidebarTriggerSlot';
import { CourseOutlineSidebarSlot } from '../../../../plugin-slots/CourseOutlineSidebarSlot';

const UnitNavigation = ({
  sequenceId,
  unitId = null,
  onClickPrevious,
  onClickNext,
  isAtTop = false,
  courseId,
}) => {
  const intl = useIntl();
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const [answerShown, setAnswerShown] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const {
    isFirstUnitInSequence, isLastUnitInSequence, nextLink, previousLink,
  } = useSequenceNavigationMetadata(sequenceId, unitId);

  // Check for iframe and send initial message
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

    // Reset states
    setIsSubmitEnabled(true);
    setIsSubmitting(false);
    setShowSubmitButton(false);
    setAnswerShown(false);

    // Send initial check and set up a retry if needed
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
    } catch (e) {
    }
  };

  const handleMessage = useCallback((event) => {
    // Only handle messages from our iframe
    const iframe = document.getElementById('unit-iframe');
    if (!iframe || event.source !== iframe.contentWindow) {
      return;
    }

    // BLOCK problem.complete to prevent reload
    if (event.data.type === 'problem.complete') {
      console.log('problem.complete message BLOCKED in Learning MFE - preventing reload');
      return;
    }

    switch (event.data.type) {
      case 'problem.ready':
        setShowSubmitButton(true);
        setIsSubmitting(false);
        setAnswerShown(false);
        break;
      case 'problem.submit.start':
        setIsSubmitting(true);
        break;
      case 'problem.submit.done':
        setIsSubmitting(false);
        setAnswerShown(!answerShown);
        break;
      default:
        break;
    }
  }, [answerShown]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const renderSubmitButton = () => {
    if (!showSubmitButton) {
      return null;
    }


    const buttonText = isSubmitting ? '確認中...' : (answerShown ? 'やり直し' : '確認');

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
    const { exitActive, exitText } = GetCourseExitNavigation(courseId, intl);
    const buttonText = (isLastUnitInSequence && exitText) ? exitText : intl.formatMessage(messages.nextButton);
    const disabled = isLastUnitInSequence || isNavigating;
    const variant = 'outline-primary';
    const buttonStyle = `next-button ${isAtTop ? 'text-dark' : 'justify-content-center'}`;

    const handleNextClick = async () => {
      if (isNavigating) return;
      
      setIsNavigating(true);
      
      // No need to save answers when navigating - only when user clicks Check button
      
      // Add a longer delay to show loading effect clearly
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the original onClickNext
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
            buttonText: isNavigating ? 'Loading...' : buttonText,
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
        buttonText={isNavigating ? 'Loading...' : buttonText}
        nextLink={nextLink}
        hasEffortEstimate
      />
    );
  };

  return (
    <>
      {/* Bottom navigation bar completely removed */}
      
      {/* Loading Overlay */}
      {isNavigating && (
        <div 
          className="loading-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.3s ease-in-out',
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          <div 
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div 
              style={{
                width: '3rem',
                height: '3rem',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #0097a9',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <div className="mt-3" style={{ fontSize: '1.1rem', fontWeight: '500', marginTop: '1rem' }}>
              Loading next question...
            </div>
          </div>
          
          <style>
            {`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}
    </>
  );
};

UnitNavigation.propTypes = {
  courseId: PropTypes.string.isRequired,
  sequenceId: PropTypes.string.isRequired,
  unitId: PropTypes.string,
  onClickPrevious: PropTypes.func.isRequired,
  onClickNext: PropTypes.func.isRequired,
  isAtTop: PropTypes.bool,
};


export default UnitNavigation;
