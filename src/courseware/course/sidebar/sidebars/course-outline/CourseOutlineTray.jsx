import { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { IconButton } from '@openedx/paragon';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { MenuOpen as MenuOpenIcon } from '@openedx/paragon/icons';

import { useModel } from '@src/generic/model-store';
import { LOADING } from '@src/constants';
import SidebarSequence from './components/SidebarSequence';
import { ID } from './constants';
import { useCourseOutlineSidebar } from './hooks';
import messages from './messages';

const CourseOutlineTray = ({ intl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const trayRef = useRef(null);

  const {
    courseId,
    unitId,
    isEnabledSidebar,
    currentSidebar,
    isActiveEntranceExam,
    courseOutlineStatus,
    activeSequenceId,
    sequences,
  } = useCourseOutlineSidebar();

  const handleToggle = () => setIsOpen(!isOpen);

  // Close popup when clicking anywhere
  useEffect(() => {
    const handleClickAnywhere = (event) => {
      if (isOpen) {
        // Only check if click is inside the tray content (not the overlay)
        const isClickInsideTrayContent = trayRef.current && 
          trayRef.current.contains(event.target) && 
          !event.target.classList.contains('outline-tray-overlay');
        
        if (!isClickInsideTrayContent) {
          setIsOpen(false);
        }
      }
    };

    // Handle iframe clicks by listening to focus events
    const handleIframeFocus = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    // Handle window blur (when clicking into iframe)
    const handleWindowBlur = () => {
      if (isOpen) {
        // Small delay to allow iframe to load
        setTimeout(() => {
          setIsOpen(false);
        }, 100);
      }
    };

    // Handle postMessage from iframes
    const handlePostMessage = (event) => {
      if (event.data === 'close-popup' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickAnywhere);
      window.addEventListener('mousedown', handleClickAnywhere);
      document.addEventListener('click', handleClickAnywhere);
      window.addEventListener('click', handleClickAnywhere);
      
      // Add iframe focus listener to handle iframe clicks
      window.addEventListener('focus', handleIframeFocus);
      window.addEventListener('blur', handleWindowBlur);
      
      // Add postMessage listener for iframe communication
      window.addEventListener('message', handlePostMessage);
      
      // Find all iframes and add click listeners to them
      const iframes = document.querySelectorAll('iframe');
      
      iframes.forEach((iframe) => {
        try {
          // Try to access iframe content
          if (iframe.contentDocument) {
            iframe.contentDocument.addEventListener('click', handleClickAnywhere);
            iframe.contentDocument.addEventListener('mousedown', handleClickAnywhere);
          }
        } catch (e) {
          // For cross-origin iframes, we can't access their content
          // So we'll use focus events instead
        }
      });

      // Add interval checking for iframe clicks
      const iframeClickInterval = setInterval(() => {
        if (isOpen) {
          // Check if any iframe is focused
          const activeElement = document.activeElement;
          if (activeElement && activeElement.tagName === 'IFRAME') {
            setIsOpen(false);
          }
        }
      }, 100);
      
      // Store interval ID for cleanup
      window.iframeClickInterval = iframeClickInterval;
    }

    return () => {
      document.removeEventListener('mousedown', handleClickAnywhere);
      window.removeEventListener('mousedown', handleClickAnywhere);
      document.removeEventListener('click', handleClickAnywhere);
      window.removeEventListener('click', handleClickAnywhere);
      window.removeEventListener('focus', handleIframeFocus);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('message', handlePostMessage);
      
      // Clear iframe click interval
      if (window.iframeClickInterval) {
        clearInterval(window.iframeClickInterval);
        window.iframeClickInterval = null;
      }
      
      // Remove iframe listeners
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((iframe) => {
        try {
          if (iframe.contentDocument) {
            iframe.contentDocument.removeEventListener('click', handleClickAnywhere);
            iframe.contentDocument.removeEventListener('mousedown', handleClickAnywhere);
          }
        } catch (e) {
          // Cross-origin iframe, can't remove listeners
        }
      });
    };
  }, [isOpen]);

  // Scroll to active unit when popup opens
  useEffect(() => {
    if (isOpen && unitId) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        const activeUnit = document.querySelector(`[data-unit-id="${unitId}"]`);
        if (activeUnit) {
          // Get the scrollable container
          const scrollContainer = document.querySelector('.outline-tray-content');
          if (scrollContainer) {
            // Calculate scroll position to center the active unit
            const containerRect = scrollContainer.getBoundingClientRect();
            const unitRect = activeUnit.getBoundingClientRect();
            const scrollPosition = unitRect.top - containerRect.top + scrollContainer.scrollTop - (containerRect.height / 2);
            
            scrollContainer.scrollTo({
              top: scrollPosition,
              behavior: 'smooth'
            });
          } else {
            // Fallback to default behavior
            activeUnit.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 200);
    }
  }, [isOpen, unitId]);

  if (!isEnabledSidebar || isActiveEntranceExam || currentSidebar !== ID) {
    return null;
  }

  if (courseOutlineStatus === LOADING) {
    return (
      <div className="outline-tray-wrapper">
        <IconButton
          alt={intl.formatMessage(messages.toggleCourseOutlineTrigger)}
          className="outline-tray-toggle"
          iconAs={MenuOpenIcon}
          onClick={handleToggle}
        />
      </div>
    );
  }

  return (
    <div className="outline-tray-wrapper" ref={trayRef}>
      <IconButton
        alt={intl.formatMessage(messages.toggleCourseOutlineTrigger)}
        className="outline-tray-toggle"
        iconAs={MenuOpenIcon}
        onClick={handleToggle}
      />
      {isOpen && (
        <div 
          className="outline-tray-overlay" 
          onClick={handleToggle}
        >
          <div 
            className="outline-tray" 
            onClick={(e) => e.stopPropagation()}
          >
            <ol className="outline-tray-content">
              {sequences[activeSequenceId] ? (
                <SidebarSequence
                  courseId={courseId}
                  sequence={sequences[activeSequenceId]}
                  defaultOpen
                  activeUnitId={unitId}
                />
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  <p>No active sequence found</p>
                  <p style={{ fontSize: '12px' }}>
                    Active Sequence ID: {activeSequenceId || 'null'}<br/>
                    Available Sequences: {Object.keys(sequences || {}).length}<br/>
                    Sequence IDs: {Object.keys(sequences || {}).join(', ')}
                  </p>
                </div>
              )}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

CourseOutlineTray.propTypes = {
  intl: intlShape.isRequired,
};

CourseOutlineTray.ID = ID;

export default injectIntl(CourseOutlineTray);
