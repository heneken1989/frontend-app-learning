import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getConfig } from '@edx/frontend-platform';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { AppContext } from '@edx/frontend-platform/react';
import { Button, Icon, Dropdown } from '@openedx/paragon';
import { NotificationsNone } from '@openedx/paragon/icons';
import { AlertList } from '../../../../generic/user-messages';
import useEnrollmentAlert from '../../../../alerts/enrollment-alert';
import useLogistrationAlert from '../../../../alerts/logistration-alert';
import UnitTimer from '../../../../courseware/course/sequence/Unit/UnitTimer';
import { fetchUnitById } from '../../../../courseware/course/sequence/Unit/urls';
import { useModel } from '../../../../generic/model-store';
import { modelKeys } from '../../../../courseware/course/sequence/Unit/constants';

import AnonymousUserMenu from './AnonymousUserMenu';
import AuthenticatedUserDropdown from './AuthenticatedUserDropdown';
import LogoSlot from '../plugin-slots/LogoSlot';
import CourseInfoSlot from '../plugin-slots/CourseInfoSlot';
import { courseInfoDataShape } from './LearningHeaderCourseInfo';
import messages from './messages';
import LearningHelpSlot from '../plugin-slots/LearningHelpSlot';
import './NavigationMenu.scss';

const NavigationMenu = () => {
  const menuItems = [
    { label: 'Speaking', href: '#speaking' },
    { label: 'Writing', href: '#writing' },
    { label: 'Reading', href: '#reading' },
    { label: 'Listening', href: '#listening' },
    { label: 'Test', href: '#test' },
  ];

  return (
    <nav className="nav-menu">
      <div className="pte-tools">Japanese <span>tools</span></div>
      <div className="nav-links">
        {menuItems.map((item) => (
          <a
            key={item.label}
            className="nav-item"
            href={item.href}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
};

const NotificationButton = ({ alerts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasAlerts = alerts && Object.keys(alerts).length > 0;

  return (
    <Dropdown className="mx-2">
      <Dropdown.Toggle
        id="notification-dropdown"
        variant="light"
        className="notification-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Icon src={Bell} className="notification-icon" />
        {hasAlerts && <span className="notification-badge" />}
      </Dropdown.Toggle>
      <Dropdown.Menu show={isOpen} onClose={() => setIsOpen(false)}>
        <AlertList
          topic="outline"
          className="p-2"
          customAlerts={alerts}
        />
      </Dropdown.Menu>
    </Dropdown>
  );
};

NotificationButton.propTypes = {
  alerts: PropTypes.object,
};

NotificationButton.defaultProps = {
  alerts: {},
};

const LearningHeader = ({
  courseOrg, courseNumber, courseTitle, intl, showUserDropdown, courseId, unitId,
}) => {
  console.log('[LearningHeader] Props:', {
    courseOrg,
    courseNumber,
    courseTitle,
    showUserDropdown,
    courseId,
    unitId,
  });

  const { authenticatedUser } = useContext(AppContext);
  const [timeLimit, setTimeLimit] = useState(null);
  const [hasQuiz, setHasQuiz] = useState(false);
  
  // Get unit data using the same method as index.jsx
  const unit = useModel(modelKeys.units, unitId);
  console.log('[LearningHeader] Unit from model:', unit);

  useEffect(() => {
    let didCancel = false;
    async function fetchTimeLimit() {
      if (unitId) {
        // Prefer time_limit from model if available
        if (unit && unit.time_limit) {
          setTimeLimit(unit.time_limit);
        } else {
          // Fallback: fetch directly
          try {
            const unitData = await fetchUnitById(unitId);
            if (!didCancel) {
              if (unitData.time_limit) {
                setTimeLimit(unitData.time_limit);
              }
              if (unitData.html && unitData.html.includes('paragraph_quiz.html')) {
                setHasQuiz(true);
              }
            }
          } catch (error) {
            if (!didCancel) {
              console.error('[LearningHeader] Error fetching unit for time limit:', error);
            }
          }
        }
      }
    }
    fetchTimeLimit();
    return () => { didCancel = true; };
  }, [unitId, unit]);

  const handleTimeExpired = () => {
    console.log('[LearningHeader] Time expired for unit:', unitId);
  };

  console.log('[LearningHeader] Current state:', {
    timeLimit,
    hasQuiz,
    isAuthenticated: !!authenticatedUser,
    unitData: unit,
  });

  const headerLogo = (
    <LogoSlot
      href={`${getConfig().LMS_BASE_URL}/dashboard`}
      src={getConfig().LOGO_URL}
      alt={getConfig().SITE_NAME}
    />
  );

  return (
    <header className="learning-header">
      <a className="sr-only sr-only-focusable" href="#main-content">{intl.formatMessage(messages.skipNavLink)}</a>
      <div className="container-xl py-2 d-flex align-items-center">
        {headerLogo}
        <NavigationMenu />
        <div className="flex-grow-1 course-title-lockup d-flex align-items-center" style={{ lineHeight: 1 }}>
          {console.log('[LearningHeader] Rendering timer section. unitId:', unitId, 'timeLimit:', timeLimit)}
          {unitId && timeLimit ? (
            <UnitTimer
              unitId={unitId}
              initialTimeByProblemType={timeLimit}
              onTimeExpired={handleTimeExpired}
            />
          ) : (
            console.log('[LearningHeader] Timer not rendered. unitId:', unitId, 'timeLimit:', timeLimit)
          )}
        </div>
        {showUserDropdown && authenticatedUser && (
        <>
          <LearningHelpSlot />
          <AuthenticatedUserDropdown
            username={authenticatedUser.username}
          />
        </>
        )}
        {showUserDropdown && !authenticatedUser && (
        <AnonymousUserMenu />
        )}
      </div>
      <style>
        {`
          .notification-btn {
            position: relative;
            padding: 0.5rem;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .notification-icon {
            width: 20px;
            height: 20px;
          }
          .notification-badge {
            position: absolute;
            top: 5px;
            right: 5px;
            width: 8px;
            height: 8px;
            background: #d23228;
            border-radius: 50%;
          }
          .course-title-lockup {
            justify-content: center;
          }
        `}
      </style>
    </header>
  );
};

LearningHeader.propTypes = {
  courseOrg: courseInfoDataShape.courseOrg,
  courseNumber: courseInfoDataShape.courseNumber,
  courseTitle: courseInfoDataShape.courseTitle,
  intl: intlShape.isRequired,
  showUserDropdown: PropTypes.bool,
  courseId: PropTypes.string,
  unitId: PropTypes.string,
};

LearningHeader.defaultProps = {
  courseOrg: null,
  courseNumber: null,
  courseTitle: null,
  showUserDropdown: true,
  courseId: null,
  unitId: null,
};

export default injectIntl(LearningHeader);
