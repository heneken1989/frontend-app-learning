import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getConfig } from '@edx/frontend-platform';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { AppContext } from '@edx/frontend-platform/react';
import { Button, Icon } from '@openedx/paragon';
import useEnrollmentAlert from '../../../../alerts/enrollment-alert';
import useLogistrationAlert from '../../../../alerts/logistration-alert';
import UnitTimer from '../../../../courseware/course/sequence/Unit/UnitTimer';
import {
  fetchUnitById, fetchAllCourses, fetchSectionsByCourseId, fetchSequencesBySectionId,
} from '../../../../courseware/course/sequence/Unit/urls';
import { useModel } from '../../../../generic/model-store';
import { modelKeys } from '../../../../courseware/course/sequence/Unit/constants';

import AnonymousUserMenu from './AnonymousUserMenu';
import AuthenticatedUserDropdown from './AuthenticatedUserDropdown';
import LogoSlot from '../plugin-slots/LogoSlot';
import CourseInfoSlot from '../plugin-slots/CourseInfoSlot';
import { courseInfoDataShape } from './LearningHeaderCourseInfo';
import messages from './messages';
import EnrollmentStatus from '../../../EnrollmentStatus/src/EnrollmentStatus';
import './NavigationMenu.scss';

const LEVELS = ['N1', 'N2', 'N3', 'N4', 'N5'];

// Extract the multi-level dropdown as a reusable component
const MultiLevelDropdown = ({
  label, courses, hoveredSkill, setHoveredSkill, LEVELS, fetchSectionsByCourseId, fetchSequencesBySectionId,
}) => {
  const { authenticatedUser } = useContext(AppContext);
  const [vocabOpen, setVocabOpen] = useState(false);
  const [openLevel, setOpenLevel] = useState(null);
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [hoveredSequence, setHoveredSequence] = useState(null);
  const [sections, setSections] = useState([]);
  const [sequences, setSequences] = useState([]);

  const handleAuthClick = (e) => {
    if (!authenticatedUser) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = `${getConfig().LMS_BASE_URL}/login?next=${encodeURIComponent(window.location.href)}`;
    }
  };

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
      style={{
        position: 'relative', padding: '8px 16px', borderRadius: 4, cursor: 'pointer',
      }}
    >
      {label}
      {vocabOpen && (
        <div
          className="dropdown-menu-custom"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            minWidth: 140,
            background: 'rgba(238, 230, 230, 0.95)',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            zIndex: 1000,
            border: '2px solid #bdbdbd',
            marginTop: 0,
          }}
        >
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
                  onClick={handleAuthClick}
                >
                  {level}
                  <span style={{ marginLeft: 8 }}></span>
                </div>
                {isLevelActive && (
                  <div style={{
                    position: 'absolute',
                    left: '100%',
                    top: 0,
                    background: 'rgba(238, 230, 230, 0.95)',
                    border: '2px solid #bdbdbd',
                    minWidth: 180,
                    zIndex: 1000,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                    borderRadius: 6,
                  }}
                  >
                    {filteredCourses.map(course => {
                      const isCourseActive = hoveredCourse && hoveredCourse.id === course.id;
                      return (
                        <div
                          key={course.id}
                          onMouseEnter={() => handleCourseHover(course, label)}
                          style={{ position: 'relative', borderRadius: 4 }}
                          className={isCourseActive ? 'dropdown-active-item' : ''}
                        >
                          <div
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
                              cursor: 'default',
                            }}
                            className="dropdown-hover-item"
                          >
                            {course.display_name.replace(/N[1-5]/gi, '').trim()}
                          </div>
                          {isCourseActive && sequences.length > 0 && (
                            <div style={{
                              position: 'absolute',
                              left: '100%',
                              top: 0,
                              background: 'rgba(238, 230, 230, 0.95)',
                              border: '2px solid #bdbdbd',
                              minWidth: 180,
                              zIndex: 2000,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                              borderRadius: 6,
                            }}
                            >
                              {sequences.map(seq => {
                                const isSeqActive = hoveredSequence === seq.id;
                                return (
                                  <div
                                    key={seq.id}
                                    style={{
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
                                        onClick={handleAuthClick}
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
  const { authenticatedUser } = useContext(AppContext);
  const [hoveredSkill, setHoveredSkill] = useState(null);

  // Auto Enroll All handler
  const handleAutoEnrollAllCourses = async () => {
    if (!authenticatedUser) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này!');
      return;
    }

    try {
      
      // Get the correct base URL based on current environment
      let baseUrl;
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('local.openedx.io')) {
        // Development - LMS runs on port 8000
        baseUrl = 'http://local.openedx.io:8000';
      } else {
        // Production - LMS runs on subdomain lms.nihongodrill.com
        baseUrl = 'https://lms.nihongodrill.com';
      }
      

      // Step 1: Test if payment API exists on production
      
      // Try different URL patterns on production LMS
      let testResponse;
      let workingUrl = null;
      
      if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('local.openedx.io')) {
        // Production - try multiple LMS API patterns on lms.nihongodrill.com
        const urlPatterns = [
          `${baseUrl}/api/payment/test/`,           // Standard LMS API
          `${baseUrl}/api/v1/payment/test/`,        // Versioned API
          `${baseUrl}/payment/test/`,               // Direct payment path
        ];
        
        // Track which pattern worked for proper URL construction
        let workingPattern = null;
        
        
        for (const url of urlPatterns) {
          try {
            testResponse = await fetch(url, {
              method: 'GET',
              credentials: 'include',
            });
            
            if (testResponse.ok) {
              // Track which pattern worked
              workingPattern = url;
              workingUrl = baseUrl;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!workingUrl) {
          alert('⚠️ Tính năng Auto Enroll chưa có sẵn trên production server.\n\nVui lòng liên hệ admin để deploy payment app hoặc sử dụng tính năng này trên development server.');
          return;
        }
        
        // Update baseUrl to working URL
        baseUrl = workingUrl;
        
        // Store the working pattern for URL construction
        window.workingPaymentPattern = workingPattern;
      } else {
        // Development - use original URL
        testResponse = await fetch(`${baseUrl}/api/payment/test/`, {
          method: 'GET',
          credentials: 'include',
        });
      }
      
      
      if (!testResponse.ok) {
        alert('⚠️ Tính năng Auto Enroll chưa có sẵn.\n\nVui lòng liên hệ admin để deploy payment app.');
        return;
      }
      
      // Step 2: Get CSRF token from Django backend
      
      // Use the working pattern to construct the correct URL
      let csrfUrl;
      if (window.workingPaymentPattern) {
        // Production - use the working pattern
        csrfUrl = window.workingPaymentPattern.replace('/test/', '/csrf-token/');
      } else {
        // Development - use standard pattern
        csrfUrl = `${baseUrl}/api/payment/csrf-token/`;
      }
      
      
      const csrfResponse = await fetch(csrfUrl, {
        method: 'GET',
        credentials: 'include',
      });


      if (!csrfResponse.ok) {
        const errorText = await csrfResponse.text();
        throw new Error(`Failed to get CSRF token: ${csrfResponse.status} - ${errorText}`);
      }

      const responseText = await csrfResponse.text();
      
      let csrfData;
      try {
        csrfData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      const csrfToken = csrfData.csrf_token;


      if (!csrfToken) {
        throw new Error('CSRF token not received from backend');
      }

      // Step 2: Call the auto enrollment API
      
      // Use the working pattern to construct the correct URL
      let autoEnrollUrl;
      if (window.workingPaymentPattern) {
        // Production - use the working pattern
        autoEnrollUrl = window.workingPaymentPattern.replace('/test/', '/auto-enroll-all/');
      } else {
        // Development - use standard pattern
        autoEnrollUrl = `${baseUrl}/api/payment/auto-enroll-all/`;
      }
      
      
      const response = await fetch(autoEnrollUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });


      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const autoEnrollResponseText = await response.text();
      
      let result;
      try {
        result = JSON.parse(autoEnrollResponseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${autoEnrollResponseText}`);
      }
      

      if (result.success) {
        alert(`🎉 Thành công!\n\n✅ Đã đăng ký ${result.enrolled_count} khóa học mới\n📚 Tổng cộng có ${result.total_available_courses} khóa học khả dụng\n👤 User: ${result.user}\n\n${result.message}`);
        
        // DISABLED: No auto-reload after enrollment
        console.log('ℹ️ [LearningHeader] Auto-reload disabled - enrollment success logged only');
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }

    } catch (error) {
      
      // Show user-friendly error message
      let errorMessage = 'Có lỗi xảy ra khi đăng ký khóa học!';
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!';
      } else if (error.message.includes('CSRF')) {
        errorMessage = 'Lỗi bảo mật. Vui lòng làm mới trang và thử lại!';
      } else {
        errorMessage = `Lỗi: ${error.message}`;
      }
      
      alert(`❌ ${errorMessage}\n\nVui lòng thử lại sau hoặc liên hệ hỗ trợ.`);
    }
  };

  return (
    <nav className="nav-menu">
      <div className="pte-tools">Manabi <span>Hub</span></div>
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
        {/* Hidden Auto Enroll All button */}
        {/* 
        <div
          className="nav-item auto-enroll-link"
          style={{
            position: 'relative',
            padding: '8px 16px',
            borderRadius: 4,
            cursor: 'pointer',
            background: '#28a745',
            color: '#fff',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
          onClick={handleAutoEnrollAllCourses}
          onMouseEnter={(e) => {
            e.target.style.background = '#218838';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#28a745';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          🚀 Auto Enroll All
        </div>
        */}
        {/* Hidden EnrollmentStatus */}
        {/* <EnrollmentStatus /> */}
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
        .payment-link {
          background: #0097a9 !important;
          color: #fff !important;
          font-weight: 600 !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        .payment-link:hover {
          background: #007a8a !important;
          color: #fff !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
        }
        .auto-enroll-link {
          background: #28a745 !important;
          color: #fff !important;
          font-weight: 600 !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        .auto-enroll-link:hover {
          background: #218838 !important;
          color: #fff !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
        }
      `}
      </style>
    </nav>
  );
};

const LearningHeader = ({
  courseOrg = null, 
  courseNumber = null, 
  courseTitle = null, 
  intl, 
  showUserDropdown = true, 
  courseId = null, 
  unitId = null,
}) => {

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
  const [timerKey, setTimerKey] = useState(0);

  // Get unit data using the same method as index.jsx
  const unit = useModel(modelKeys.units, unitId);

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
              } else {
                setTimeLimit(0);
              }
              if (unitData.html && unitData.html.includes('paragraph_quiz.html')) {
                setHasQuiz(true);
              }
            }
          } catch (error) {
            if (!didCancel) {
            }
          }
        }
      } else {
      }
    }
    fetchTimeLimit();
    return () => { didCancel = true; };
  }, [unitId, unit]);

  // Listen for timer reset events from PersistentNavigationBar
  useEffect(() => {
    const handleTimerReset = (event) => {
      console.log('🔄 Timer reset event received:', event.detail);
      if (event.detail && event.detail.unitId === unitId) {
        console.log('🔄 Resetting timer for unit:', unitId);
        // Force re-render of UnitTimer by updating timerKey
        setTimerKey(prev => prev + 1);
      }
    };

    window.addEventListener('resetTimer', handleTimerReset);
    return () => {
      window.removeEventListener('resetTimer', handleTimerReset);
    };
  }, [unitId]);

  useEffect(() => {
    fetchAllCourses()
      .then(data => {
        setCourses(data);
      })
      .catch(err => {
      });
  }, []);

  const handleTimeExpired = () => {
    // Handle time expiration logic here
  };

  return (
    <header className="learning-header">
      <a className="sr-only sr-only-focusable" href="#main-content">{intl.formatMessage(messages.skipNavLink)}</a>
      <div className="container-xl py-2 d-flex align-items-center">
        {/* Logo removed */}
        <NavigationMenu courses={courses} />
        <div className="flex-grow-1 course-title-lockup d-flex align-items-center justify-content-end" style={{ lineHeight: 1, gap: '8px' }}>
          {unitId && (timeLimit !== null && timeLimit !== undefined) ? (
            <UnitTimer
              key={`${unitId}-${timerKey}`}
              unitId={unitId}
              initialTimeByProblemType={timeLimit}
              onTimeExpired={handleTimeExpired}
            />
          ) : null}
          <div
            className="nav-item payment-link"
            style={{
              position: 'relative',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              background: '#0097a9',
              color: '#fff',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            onClick={() => window.location.href = '/learning/payment'}
            onMouseEnter={(e) => {
              e.target.style.background = '#007a8a';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#0097a9';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            💳 Buy Courses
          </div>
        </div>
        {showUserDropdown && authenticatedUser && (
          <AuthenticatedUserDropdown
            username={authenticatedUser.username}
          />
        )}
        {showUserDropdown && !authenticatedUser && (
        <AnonymousUserMenu />
        )}
      </div>
      <style>
        {`
          .learning-header {
            background: white !important;
            border-bottom: 1px solid #e0e0e0;
          }
          .learning-header .container-xl {
            background: white !important;
          }
          .learning-header .nav-menu {
            background: white !important;
          }
          .learning-header .nav-links {
            background: white !important;
          }
          .course-title-lockup {
            justify-content: center;
            background: white !important;
          }
          /* Make user dropdown circular */
          .learning-header .dropdown-toggle,
          .learning-header .dropdown-toggle:focus,
          .learning-header .dropdown-toggle:active,
          .learning-header .dropdown-toggle:visited,
          .learning-header .dropdown-toggle:hover {
            border-radius: 50% !important;
            width: 40px !important;
            height: 40px !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border: none !important;
            background: #00838f !important; /* Teal background */
            background-color: #00838f !important; /* Teal background - explicit */
            color: white !important; /* White text for the 'h' */
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            transition: all 0.2s ease !important;
            text-decoration: none !important;
            outline: none !important;
          }
          .learning-header .dropdown-toggle::after {
            display: none !important; /* Hide dropdown arrow */
          }
          .learning-header .dropdown-toggle:hover {
            background: #006064 !important; /* Darker teal on hover */
            background-color: #006064 !important; /* Darker teal on hover - explicit */
            transform: translateY(-1px) !important;
          }
          /* Hide logo */
          .learning-header .logo {
            display: none !important;
          }
          /* Force teal background for all user dropdown states */
          .learning-header .btn.dropdown-toggle,
          .learning-header .btn.dropdown-toggle:focus,
          .learning-header .btn.dropdown-toggle:active,
          .learning-header .btn.dropdown-toggle:visited,
          .learning-header .btn.dropdown-toggle:hover,
          .learning-header .btn.dropdown-toggle:not(:disabled):not(.disabled):active,
          .learning-header .btn.dropdown-toggle:not(:disabled):not(.disabled):active:focus,
          .learning-header .btn.dropdown-toggle.show,
          .learning-header .btn.dropdown-toggle.show:focus,
          .learning-header .btn.dropdown-toggle.show:active {
            background: #00838f !important;
            background-color: #00838f !important;
            border-color: #00838f !important;
            color: white !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          }
          .learning-header .btn.dropdown-toggle:hover {
            background: #006064 !important;
            background-color: #006064 !important;
            border-color: #006064 !important;
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


export default injectIntl(LearningHeader);
