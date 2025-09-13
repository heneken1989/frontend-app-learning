import { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { IconButton } from '@openedx/paragon';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { MenuOpen as MenuOpenIcon } from '@openedx/paragon/icons';

import { useModel } from '@src/generic/model-store';
import { LOADING } from '@src/constants';
import PageLoading from '@src/generic/PageLoading';
import SidebarSequence from './components/SidebarSequence';
import { ID } from './constants';
import { useCourseOutlineSidebar } from './hooks';
import messages from './messages';

const CourseOutlineTray = ({ intl }) => {
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

  const handleToggle = () => setIsOpen(!isOpen);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.outline-tray-wrapper')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);



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
        <PageLoading srMessage={intl.formatMessage(messages.loading)} />
      </div>
    );
  }

  return (
    <div className="outline-tray-wrapper">
      <IconButton
        alt={intl.formatMessage(messages.toggleCourseOutlineTrigger)}
        className="outline-tray-toggle"
        iconAs={MenuOpenIcon}
        onClick={handleToggle}
      />
      {isOpen && (
        <div className="outline-tray-overlay" onClick={handleToggle}>
          <div className="outline-tray" onClick={(e) => e.stopPropagation()}>
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
