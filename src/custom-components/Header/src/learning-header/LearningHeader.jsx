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
import LearningHelpSlot from '../plugin-slots/LearningHelpSlot';
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
      console.log('[AutoEnroll] Starting auto enrollment process...');
      
      // Get the correct base URL based on current environment
      let baseUrl;
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('local.openedx.io')) {
        // Development - LMS runs on port 8000
        baseUrl = 'http://local.openedx.io:8000';
        console.log('[AutoEnroll] Development environment detected');
      } else {
        // Production - LMS runs on subdomain lms.nihongodrill.com
        baseUrl = 'https://lms.nihongodrill.com';
        console.log('[AutoEnroll] Production environment detected');
      }
      
      console.log('[AutoEnroll] Current hostname:', window.location.hostname);
      console.log('[AutoEnroll] Current port:', window.location.port);
      console.log('[AutoEnroll] Using LMS baseUrl:', baseUrl);

      // Step 1: Test if payment API exists on production
      console.log('[AutoEnroll] Testing payment API availability...');
      
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
        
        console.log('[AutoEnroll] Testing URL patterns:', urlPatterns);
        
        for (const url of urlPatterns) {
          try {
            console.log('[AutoEnroll] Testing URL:', url);
            testResponse = await fetch(url, {
              method: 'GET',
              credentials: 'include',
            });
            
            if (testResponse.ok) {
              workingUrl = url.replace('/test/', '');
              console.log('[AutoEnroll] Found working URL:', workingUrl);
              break;
            }
          } catch (e) {
            console.log('[AutoEnroll] URL failed:', url, e.message);
            continue;
          }
        }
        
        if (!workingUrl) {
          console.warn('[AutoEnroll] No working payment API found on production');
          alert('⚠️ Tính năng Auto Enroll chưa có sẵn trên production server.\n\nVui lòng liên hệ admin để deploy payment app hoặc sử dụng tính năng này trên development server.');
          return;
        }
        
        // Update baseUrl to working URL
        baseUrl = workingUrl;
        console.log('[AutoEnroll] Updated baseUrl to:', baseUrl);
      } else {
        // Development - use original URL
        testResponse = await fetch(`${baseUrl}/api/payment/test/`, {
          method: 'GET',
          credentials: 'include',
        });
      }
      
      console.log('[AutoEnroll] Test API status:', testResponse.status);
      console.log('[AutoEnroll] Test API headers:', Object.fromEntries(testResponse.headers.entries()));
      
      if (!testResponse.ok) {
        console.warn('[AutoEnroll] Payment app not available');
        alert('⚠️ Tính năng Auto Enroll chưa có sẵn.\n\nVui lòng liên hệ admin để deploy payment app.');
        return;
      }
      
      // Step 2: Get CSRF token from Django backend
      console.log('[AutoEnroll] Getting CSRF token...');
      console.log('[AutoEnroll] CSRF URL:', `${baseUrl}/api/payment/csrf-token/`);
      
      const csrfResponse = await fetch(`${baseUrl}/api/payment/csrf-token/`, {
        method: 'GET',
        credentials: 'include',
      });

      console.log('[AutoEnroll] CSRF Response status:', csrfResponse.status);
      console.log('[AutoEnroll] CSRF Response headers:', Object.fromEntries(csrfResponse.headers.entries()));

      if (!csrfResponse.ok) {
        const errorText = await csrfResponse.text();
        console.error('[AutoEnroll] CSRF Error response:', errorText);
        throw new Error(`Failed to get CSRF token: ${csrfResponse.status} - ${errorText}`);
      }

      const responseText = await csrfResponse.text();
      console.log('[AutoEnroll] CSRF Response text:', responseText);
      
      let csrfData;
      try {
        csrfData = JSON.parse(responseText);
      } catch (e) {
        console.error('[AutoEnroll] CSRF JSON parse error:', e);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      const csrfToken = csrfData.csrf_token;

      console.log('[AutoEnroll] CSRF Token received:', csrfToken ? 'Yes' : 'No');

      if (!csrfToken) {
        throw new Error('CSRF token not received from backend');
      }

      // Step 2: Call the auto enrollment API
      console.log('[AutoEnroll] Calling auto-enroll API...');
      console.log('[AutoEnroll] Auto-enroll URL:', `${baseUrl}/api/payment/auto-enroll-all/`);
      
      const response = await fetch(`${baseUrl}/api/payment/auto-enroll-all/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });

      console.log('[AutoEnroll] Response status:', response.status);
      console.log('[AutoEnroll] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AutoEnroll] Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const autoEnrollResponseText = await response.text();
      console.log('[AutoEnroll] Response text:', autoEnrollResponseText);
      
      let result;
      try {
        result = JSON.parse(autoEnrollResponseText);
      } catch (e) {
        console.error('[AutoEnroll] JSON parse error:', e);
        throw new Error(`Invalid JSON response: ${autoEnrollResponseText}`);
      }
      
      console.log('[AutoEnroll] Success result:', result);

      if (result.success) {
        alert(`🎉 Thành công!\n\n✅ Đã đăng ký ${result.enrolled_count} khóa học mới\n📚 Tổng cộng có ${result.total_available_courses} khóa học khả dụng\n👤 User: ${result.user}\n\n${result.message}`);
        
        // Reload page to refresh enrollment status
        window.location.reload();
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }

    } catch (error) {
      console.error('[AutoEnroll] Error:', error);
      
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
          💳 Thanh toán
        </div>
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
        <EnrollmentStatus />
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
        console.log('[LearningHeader] Fetching time limit for unitId:', unitId);
        // Prefer time_limit from model if available
        if (unit && unit.time_limit) {
          console.log('[LearningHeader] Found time_limit in model:', unit.time_limit);
          setTimeLimit(unit.time_limit);
        } else {
          console.log('[LearningHeader] No time_limit in model, fetching from API...');
          // Fallback: fetch directly
          try {
            const unitData = await fetchUnitById(unitId);
            console.log('[LearningHeader] API response:', unitData);
            if (!didCancel) {
              if (unitData.time_limit) {
                console.log('[LearningHeader] Found time_limit in API:', unitData.time_limit);
                setTimeLimit(unitData.time_limit);
              } else {
                console.log('[LearningHeader] No time_limit in API response, setting to 0');
                setTimeLimit(0);
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
      } else {
        console.log('[LearningHeader] No unitId provided');
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

  return (
    <header className="learning-header">
      <a className="sr-only sr-only-focusable" href="#main-content">{intl.formatMessage(messages.skipNavLink)}</a>
      <div className="container-xl py-2 d-flex align-items-center">
        {/* Logo removed */}
        <NavigationMenu courses={courses} />
        <div className="flex-grow-1 course-title-lockup d-flex align-items-center" style={{ lineHeight: 1 }}>
          {console.log('[LearningHeader] Rendering timer section. unitId:', unitId, 'timeLimit:', timeLimit)}
          {unitId && (timeLimit !== null && timeLimit !== undefined) ? (
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
            background: rgba(238, 230, 230, 0.95);
          }
          .course-title-lockup {
            justify-content: center;
          }
          /* Hide logo */
          .learning-header .logo {
            display: none !important;
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
