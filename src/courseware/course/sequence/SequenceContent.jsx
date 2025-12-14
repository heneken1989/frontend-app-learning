import React, { Suspense, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import PageLoading from '../../../generic/PageLoading';
import { useModel } from '../../../generic/model-store';

import messages from './messages';
import Unit from './Unit';
import TransitionOverlay from './TransitionOverlay';

const ContentLock = React.lazy(() => import('./content-lock'));

// CSS for fading footer and navigation bar during transition with smooth animation
const footerFadeStyle = `
  /* Base transition for smooth fade in/out */
  .custom-footer,
  footer,
  [class*="footer"],
  .unit-navigation-bar,
  [class*="navigation-bar"],
  [class*="nav-bar"],
  .sequence-navigation-container,
  .sequence-navigation,
  [class*="persistent-navigation"],
  [class*="sequence-navigation"] {
    transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  
  /* Fade out when transitioning */
  body.quiz-transitioning .custom-footer,
  body.quiz-transitioning footer,
  body.quiz-transitioning [class*="footer"] {
    opacity: 0.1 !important;
    pointer-events: none !important;
  }
  
  body.quiz-transitioning .unit-navigation-bar,
  body.quiz-transitioning .unit-navigation-bar *,
  body.quiz-transitioning [class*="navigation-bar"],
  body.quiz-transitioning [class*="navigation-bar"] *,
  body.quiz-transitioning [class*="nav-bar"],
  body.quiz-transitioning [class*="nav-bar"] *,
  body.quiz-transitioning .sequence-navigation-container,
  body.quiz-transitioning .sequence-navigation-container *,
  body.quiz-transitioning .sequence-navigation,
  body.quiz-transitioning .sequence-navigation *,
  body.quiz-transitioning [class*="persistent-navigation"],
  body.quiz-transitioning [class*="persistent-navigation"] *,
  body.quiz-transitioning [class*="sequence-navigation"],
  body.quiz-transitioning [class*="sequence-navigation"] * {
    opacity: 0.1 !important;
    pointer-events: none !important;
  }
`;

const SequenceContent = ({
  gated,
  courseId,
  sequenceId,
  unitId = null,
  unitLoadedHandler,
  isOriginalUserStaff,
  isEnabledOutlineSidebar,
}) => {
  const intl = useIntl();
  const sequence = useModel('sequences', sequenceId);
  const [showTransition, setShowTransition] = useState(false);
  const [isUnitLoaded, setIsUnitLoaded] = useState(false);
  const previousUnitIdRef = useRef(unitId);
  const isInitialMountRef = useRef(true);

  // Disabled: Go back to the top of the page whenever the unit or sequence changes.
  // useEffect(() => {
  //   global.scrollTo(0, 0);
  // }, [sequenceId, unitId]);

  // Show transition overlay when unitId changes or on initial load/reload
  useEffect(() => {
    // On initial mount or when unitId changes, show transition
    if (isInitialMountRef.current || (previousUnitIdRef.current !== null && previousUnitIdRef.current !== unitId)) {
      // Unit is loading/reloading, show transition and fade footer/nav
      setShowTransition(true);
      setIsUnitLoaded(false);
      document.body.classList.add('quiz-transitioning');
      
      // Fallback: Auto-hide transition after 1 second if unit doesn't call onLoaded
      const fallbackTimer = setTimeout(() => {
        if (!isUnitLoaded) {
          setShowTransition(false);
          document.body.classList.remove('quiz-transitioning');
        }
      }, 1000);
      
      isInitialMountRef.current = false;
      previousUnitIdRef.current = unitId;
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [unitId, isUnitLoaded]);

  // Also handle initial page load/reload
  useEffect(() => {
    if (unitId && isInitialMountRef.current) {
      // Page is loading/reloading, fade footer and nav
      document.body.classList.add('quiz-transitioning');
    }
  }, [unitId]);

  // Handle unit loaded callback
  const handleUnitLoaded = () => {
    setIsUnitLoaded(true);
    // Hide transition after a short delay to allow content to render
    setTimeout(() => {
      setShowTransition(false);
      document.body.classList.remove('quiz-transitioning');
    }, 100);
    if (unitLoadedHandler) {
      unitLoadedHandler();
    }
  };

  // Cleanup: Remove class when component unmounts
  useEffect(() => {
    return () => {
      document.body.classList.remove('quiz-transitioning');
    };
  }, []);

  if (gated) {
    return (
      <Suspense
        fallback={(
          <PageLoading
            srMessage={intl.formatMessage(messages.loadingLockedContent)}
          />
        )}
      >
        <ContentLock
          courseId={courseId}
          sequenceTitle={sequence.title}
          prereqSectionName={sequence.gatedContent.prereqSectionName}
          prereqId={sequence.gatedContent.prereqId}
        />
      </Suspense>
    );
  }

  const unit = useModel('units', unitId);
  if (!unitId || !unit) {
    return (
      <div>
        {intl.formatMessage(messages.noContent)}
      </div>
    );
  }

  return (
    <>
      <style>{footerFadeStyle}</style>
      <TransitionOverlay isVisible={showTransition} />
      <Unit
        courseId={courseId}
        format={sequence.format}
        key={unitId}
        id={unitId}
        onLoaded={handleUnitLoaded}
        isOriginalUserStaff={isOriginalUserStaff}
        isEnabledOutlineSidebar={isEnabledOutlineSidebar}
      />
    </>
  );
};

SequenceContent.propTypes = {
  gated: PropTypes.bool.isRequired,
  courseId: PropTypes.string.isRequired,
  sequenceId: PropTypes.string.isRequired,
  unitId: PropTypes.string,
  unitLoadedHandler: PropTypes.func.isRequired,
  isOriginalUserStaff: PropTypes.bool.isRequired,
  isEnabledOutlineSidebar: PropTypes.bool.isRequired,
};


export default SequenceContent;
