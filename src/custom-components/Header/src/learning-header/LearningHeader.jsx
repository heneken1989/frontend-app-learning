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
import { fetchUnitById, fetchAllCourses, fetchSectionsByCourseId, fetchSequencesBySectionId } from '../../../../courseware/course/sequence/Unit/urls';
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

const LEVELS = ['N1', 'N2', 'N3', 'N4', 'N5'];

// Extract the multi-level dropdown as a reusable component
const MultiLevelDropdown = ({ label, courses, hoveredSkill, setHoveredSkill, LEVELS, fetchSectionsByCourseId, fetchSequencesBySectionId }) => {
  const [vocabOpen, setVocabOpen] = useState(false);
  const [openLevel, setOpenLevel] = useState(null);
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [hoveredSequence, setHoveredSequence] = useState(null);
  const [sections, setSections] = useState([]);
  const [sequences, setSequences] = useState([]);

  // Derive the active path for highlighting
  const activePath = [
    openLevel,
    hoveredCourse ? hoveredCourse.id : null,
    hoveredSequence,
  ];

  const handleCourseHover = (course, skill) => {
    setHoveredCourse(course);
    setHoveredSequence(null);
    fetchSectionsByCourseId(course.id)
      .then(sectionsData => {
        setSections(sectionsData);
        const section = sectionsData.find(sec => sec.display_name.toLowerCase().includes(skill ? skill.toLowerCase() : ''));
        if (section) {
          fetchSequencesBySectionId(section.id)
            .then(sequencesData => setSequences(sequencesData));
        } else {
          setSequences([]);
        }
      });
  };

  return (
    <div
      className="nav-item vocab-dropdown"
      onMouseEnter={() => { setVocabOpen(true); setHoveredSkill(label); }}
      onMouseLeave={() => { setVocabOpen(false); setOpenLevel(null); setHoveredCourse(null); setHoveredSequence(null); }}
      style={{ position: 'relative', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}
    >
      {label}
      {vocabOpen && (
        <div className="dropdown-menu-custom" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          minWidth: 140,
          background: 'linear-gradient(180deg, #f5eded 0%, #f7f3f3 100%)',
          borderRadius: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          zIndex: 1000,
          border: '2px solid #bdbdbd',
          marginTop: 0,
        }}>
          {LEVELS.map((level) => {
            const isLevelActive = openLevel === level;
            const filteredCourses = courses.filter(course => (course.display_name || '').toLowerCase().includes(level.toLowerCase()));
            return (
              <div
                key={level}
                style={{ position: 'relative', borderRadius: 4 }}
                onMouseEnter={() => { setOpenLevel(level); setHoveredCourse(null); setHoveredSequence(null); }}
                onMouseLeave={() => setOpenLevel(null)}
                className={isLevelActive ? 'dropdown-active-item' : ''}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '8px 16px',
                    borderRadius: 4,
                    background: isLevelActive ? '#0097a9' : 'none',
                    color: isLevelActive ? '#fff' : '#333',
                    transition: 'background 0.2s',
                  }}
                  className="dropdown-hover-item"
                >
                  {level}
                  <span style={{ marginLeft: 8 }}>&#9654;</span>
                </div>
                {isLevelActive && (
                  <div style={{
                    position: 'absolute',
                    left: '100%',
                    top: 0,
                    background: 'linear-gradient(180deg, #f5eded 0%, #f7f3f3 100%)',
                    border: '2px solid #bdbdbd',
                    minWidth: 180,
                    zIndex: 1000,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                    borderRadius: 6,
                  }}>
                    {filteredCourses.map(course => {
                      const isCourseActive = hoveredCourse && hoveredCourse.id === course.id;
                      return (
                        <div
                          key={course.id}
                          onMouseEnter={() => handleCourseHover(course, label)}
                          style={{ position: 'relative', borderRadius: 4 }}
                          className={isCourseActive ? 'dropdown-active-item' : ''}
                        >
                          <a
                            href={`#/course/${course.id}`}
                            style={{
                              display: 'block',
                              padding: '8px 16px',
                              color: '#333',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                              borderRadius: 4,
                              background: isCourseActive ? '#0097a9' : 'none',
                              color: isCourseActive ? '#fff' : '#333',
                              transition: 'background 0.2s',
                            }}
                            className="dropdown-hover-item"
                          >
                            {course.display_name}
                          </a>
                          {isCourseActive && sequences.length > 0 && (
                            <div style={{
                              position: 'absolute',
                              left: '100%',
                              top: 0,
                              background: 'linear-gradient(180deg, #f5eded 0%, #f7f3f3 100%)',
                              border: '2px solid #bdbdbd',
                              minWidth: 180,
                              zIndex: 2000,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                              borderRadius: 6,
                            }}>
                              {sequences.map(seq => {
                                const isSeqActive = hoveredSequence === seq.id;
                                return (
                                  <div key={seq.id} style={{
                                    padding: '8px 16px',
                                    color: isSeqActive ? '#fff' : '#333',
                                    borderRadius: 4,
                                    transition: 'background 0.2s',
                                    background: isSeqActive ? '#0097a9' : 'none',
                                  }}
                                  className="dropdown-hover-item"
                                  onMouseEnter={() => setHoveredSequence(seq.id)}
                                  onMouseLeave={() => setHoveredSequence(null)}
                                  >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      <a
                                        href={`/learning/course/${encodeURIComponent(course.id)}/subsequence/${encodeURIComponent(seq.id)}/progress`}
                                        style={{
                                          color: isSeqActive ? '#fff' : '#333',
                                          textDecoration: 'none',
                                          display: 'block',
                                          fontSize: '1em',
                                          borderRadius: 4,
                                          transition: 'background 0.2s',
                                          padding: 0,
                                          background: 'none',
                                        }}
                                        className="dropdown-hover-item"
                                      >
                                        {seq.display_name}
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const NavigationMenu = ({ courses }) => {
  const [hoveredSkill, setHoveredSkill] = useState(null);
  return (
    <nav className="nav-menu">
      <div className="pte-tools">Japanese <span>tools</span></div>
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {['聴解', '言葉。漢字', '文法', '読解', '模試テスト'].map((label) => (
          <MultiLevelDropdown
            key={label}
            label={label}
            courses={courses}
            hoveredSkill={hoveredSkill}
            setHoveredSkill={setHoveredSkill}
            LEVELS={LEVELS}
            fetchSectionsByCourseId={fetchSectionsByCourseId}
            fetchSequencesBySectionId={fetchSequencesBySectionId}
          />
        ))}
      </div>
      <style>{`
        .dropdown-hover-item {
          color: #333 !important;
        }
        .dropdown-hover-item:hover {
          background: #0097a9 !important;
          color: #fff !important;
        }
        .dropdown-active-item, .nav-item-active {
          background: #0097a9 !important;
          color: #fff !important;
        }
        .nav-item:hover, .nav-item:focus, .nav-item-active {
          background: #0097a9 !important;
          color: #fff !important;
        }
        .nav-item {
          color: #333 !important;
        }
        .dropdown-menu, .dropdown-menu[style], .dropdown-menu-custom {
          border: 1px solid #d0d7de !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.10) !important;
        }
        .nav-item, .nav-item:active, .nav-item:visited, .nav-item:focus {
          text-decoration: none !important;
        }
      `}</style>
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
  const [courses, setCourses] = useState([]);
  const [openLevel, setOpenLevel] = useState(null);
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [sequences, setSequences] = useState([]);
  
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

  useEffect(() => {
    fetchAllCourses()
      .then(data => {
        console.log('[LearningHeader] Fetched courses:', data);
        setCourses(data);
      })
      .catch(err => {
        console.error('[LearningHeader] Error fetching courses:', err);
      });
  }, []);

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
        <NavigationMenu courses={courses} />
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
          .learning-header {
            background: linear-gradient(180deg, #f5eded 0%, #f7f3f3 100%);
          }
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
