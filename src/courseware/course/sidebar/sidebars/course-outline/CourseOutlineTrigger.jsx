import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { IconButton } from '@openedx/paragon';
import { MenuOpen as MenuOpenIcon, Menu as MenuIcon } from '@openedx/paragon/icons';

import { useCourseOutlineSidebar } from './hooks';
import { ID } from './constants';
import messages from './messages';
import { LOADING } from '@src/constants';

const CourseOutlineTrigger = ({ intl, isMobileView }) => {
  console.log('🔍 DEBUG - CourseOutlineTrigger component called');
  const [isOpen, setIsOpen] = useState(false);

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

  // Debug logging (can be removed later)
  // console.log('🔍 CourseOutlineTrigger render:', {
  //   isEnabledSidebar,
  //   isActiveEntranceExam,
  //   courseOutlineStatus,
  //   activeSequenceId,
  //   sequencesCount: Object.keys(sequences || {}).length,
  //   unitId
  // });

  const handleToggle = () => {
    console.log('🔍 DEBUG - CourseOutlineTrigger handleToggle called, current isOpen:', isOpen);
    setIsOpen(!isOpen);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen) {
        const trigger = document.querySelector('.course-outline-navbar-trigger');
        const tray = document.querySelector('.outline-tray');
        
        if (trigger && !trigger.contains(event.target) && 
            tray && !tray.contains(event.target)) {
          console.log('🔍 DEBUG - Click outside detected, closing popup');
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Debug DOM after render (can be removed later)
  // useEffect(() => {
  //   const trigger = document.querySelector('.course-outline-navbar-trigger');
  //   if (trigger) {
  //     console.log('🎯 DOM Element found and working');
  //   }
  // });

  if (!isEnabledSidebar || isActiveEntranceExam) {
    return null;
  }

  if (courseOutlineStatus === LOADING) {
    return (
      <div className="outline-sidebar-heading-wrapper bg-light-200 collapsed align-self-start flex-shrink-0 mr-4 p-2.5">
        <IconButton
          alt={intl.formatMessage(messages.toggleCourseOutlineTrigger)}
          className="outline-tray-toggle"
          iconAs={MenuOpenIcon}
          onClick={handleToggle}
        />
        <div style={{ padding: '8px', textAlign: 'center', color: '#666' }}>
          Loading...
        </div>
      </div>
    );
  }

  // Get current unit title
  const currentUnitTitle = sequences[activeSequenceId]?.blocks?.find(block => block.id === unitId)?.display_name || 'Unit';

  console.log('🔍 DEBUG - CourseOutlineTrigger render, isOpen:', isOpen);

  return (
    <div className="course-outline-navbar-trigger">
      <button
        className="outline-tray-toggle"
        onClick={handleToggle}
      >
        <span style={{ fontSize: '16px', marginRight: '8px' }}>☰</span>
        <span>{currentUnitTitle}</span>
      </button>
      {isOpen && (
        <div className="outline-tray-overlay">
          <div className="outline-tray">
            <div className="outline-tray-header">
              <span className="outline-tray-title">
                {intl.formatMessage(messages.courseOutlineTitle)}
              </span>
              <IconButton
                alt={intl.formatMessage(messages.toggleCourseOutlineTrigger)}
                className="outline-tray-close"
                iconAs={MenuOpenIcon}
                onClick={handleToggle}
              />
            </div>
            
            <div className="outline-tray-content">
              {sequences[activeSequenceId] ? (
                <div className="unit-list">
                  {sequences[activeSequenceId].blocks?.slice(0, 5).map((block, index) => {
                    const isQuiz = block.type === 'problem' || block.type === 'vertical';
                    const isCompleted = block.complete || false;
                    const isActive = block.id === unitId;
                    
                    return (
                      <div
                        key={block.id}
                        className={`unit-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isQuiz ? 'quiz' : ''}`}
                        onClick={() => {
                          // Navigate to unit
                          window.location.href = `/course/${courseId}/courseware/${block.id}/`;
                        }}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #eee',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ 
                            marginRight: '12px', 
                            fontWeight: 'bold', 
                            color: '#666',
                            minWidth: '20px'
                          }}>
                            {index + 1}
                          </span>
                          <span style={{ flex: 1 }}>
                            {block.displayName || block.title || `Unit ${index + 1}`}
                          </span>
                        </div>
                        {isQuiz && (
                          <span style={{ fontSize: '16px' }}>
                            {isCompleted ? '✅' : '⭕'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  <p>No active sequence found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

CourseOutlineTrigger.defaultProps = {
  isMobileView: false,
};

CourseOutlineTrigger.propTypes = {
  intl: intlShape.isRequired,
  isMobileView: PropTypes.bool,
};

export default injectIntl(CourseOutlineTrigger);
