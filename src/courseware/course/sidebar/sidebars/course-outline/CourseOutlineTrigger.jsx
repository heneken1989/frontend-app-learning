import classNames from 'classnames';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { IconButton } from '@openedx/paragon';
import { MenuOpen as MenuOpenIcon } from '@openedx/paragon/icons';

import { useCourseOutlineSidebar } from './hooks';
import { ID } from './constants';
import messages from './messages';

const CourseOutlineTrigger = ({ intl, isMobileView }) => {
  const {
    currentSidebar,
    shouldDisplayFullScreen,
    handleToggleCollapse,
    isActiveEntranceExam,
    isEnabledSidebar,
    courseOutlineStatus,
    courseId,
  } = useCourseOutlineSidebar();

  const isDisplayForDesktopView = !isMobileView && !shouldDisplayFullScreen && currentSidebar !== ID;
  const isDisplayForMobileView = isMobileView && shouldDisplayFullScreen;

  // Debug info for production
  const showDebugInfo = process.env.NODE_ENV === 'production';
  
  if ((!isDisplayForDesktopView && !isDisplayForMobileView) || !isEnabledSidebar || isActiveEntranceExam) {
    return (
      <>
        {showDebugInfo && (
          <div style={{ 
            padding: '10px', 
            background: '#f0f0f0', 
            border: '1px solid #ccc',
            fontSize: '12px',
            margin: '5px'
          }}>
            <strong>Debug Info:</strong><br/>
            isDisplayForDesktopView: {String(isDisplayForDesktopView)}<br/>
            isDisplayForMobileView: {String(isDisplayForMobileView)}<br/>
            isEnabledSidebar: {String(isEnabledSidebar)}<br/>
            isActiveEntranceExam: {String(isActiveEntranceExam)}<br/>
            courseOutlineStatus: {courseOutlineStatus}<br/>
            courseId: {courseId}<br/>
            LMS_BASE_URL: {window.location.origin}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className={classNames('outline-sidebar-heading-wrapper bg-light-200 collapsed align-self-start', {
        'flex-shrink-0 mr-4 p-2.5': isDisplayForDesktopView,
        'p-0': isDisplayForMobileView,
      })}
      >
        <IconButton
          alt={intl.formatMessage(messages.toggleCourseOutlineTrigger)}
          className="outline-sidebar-toggle-btn flex-shrink-0 text-dark bg-light-200 rounded-0"
          iconAs={MenuOpenIcon}
          onClick={handleToggleCollapse}
        />
      </div>
      
      {/* Debug info for production */}
      {showDebugInfo && (
        <div style={{ 
          padding: '10px', 
          background: '#e8f5e8', 
          border: '1px solid #4caf50',
          fontSize: '12px',
          margin: '5px',
          borderRadius: '4px'
        }}>
          <strong>✅ CourseOutlineTrigger Active:</strong><br/>
          Status: {courseOutlineStatus}<br/>
          Course ID: {courseId}<br/>
          Current Domain: {window.location.origin}<br/>
          Button Type: {isDisplayForDesktopView ? 'Desktop' : 'Mobile'}
        </div>
      )}
    </>
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
