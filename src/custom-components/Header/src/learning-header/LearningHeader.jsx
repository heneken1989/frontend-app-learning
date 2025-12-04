import React, { useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getConfig } from '@edx/frontend-platform';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { AppContext } from '@edx/frontend-platform/react';
import { Button, Icon } from '@openedx/paragon';
import useEnrollmentAlert from '../../../../alerts/enrollment-alert';
import useLogistrationAlert from '../../../../alerts/logistration-alert';
import UnitTimer from '../../../../courseware/course/sequence/Unit/UnitTimer';
import TestTimer from '../../../TestSeriesPage/TestTimer';
import TestHeader from '../../../TestSeriesPage/components/TestHeader';
import TestNavigationBar from '../../../TestSeriesPage/components/TestNavigationBar';
import useTestDetection from '../../../TestSeriesPage/hooks/useTestDetection';
import { extractCourseInfoFromURL } from '../../../TestSeriesPage/utils/testSectionManager';
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
import './NavigationMenu.scss';
import { getCachedMenuData, setCachedMenuData, clearMenuCache, invalidateCache, getCacheInfo, shouldRefreshCache } from './menuCache';

// Add cache clear button for development (remove in production)
const clearCacheButton = typeof window !== 'undefined' && process.env.NODE_ENV === 'development';
// Show activate buttons only in development
const showActivateButtons = typeof window !== 'undefined' && process.env.NODE_ENV === 'development';

// Expose cache management to window for debugging (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.menuCacheDebug = {
    clear: clearMenuCache,
    invalidate: invalidateCache,
    info: getCacheInfo,
    shouldRefresh: shouldRefreshCache
  };
}

const LEVELS = ['N1', 'N2', 'N3', 'N4', 'N5'];

// Extract the multi-level dropdown as a reusable component
const MultiLevelDropdown = ({
  label, courses, hoveredSkill, setHoveredSkill, LEVELS, preloadedData, setPreloadedData,
}) => {
  const { authenticatedUser } = useContext(AppContext);
  const [vocabOpen, setVocabOpen] = useState(false);
  const [openLevel, setOpenLevel] = useState(null);
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [hoveredSequence, setHoveredSequence] = useState(null);
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
    
    // Use preloaded data instead of fetching
    const courseData = preloadedData[course.id];
    if (courseData) {
      const section = courseData.sections.find(sec => 
        sec.display_name.toLowerCase().includes(skill ? skill.toLowerCase() : '')
      );
      if (section) {
        // Use preloaded sequences
        setSequences(courseData.sequences[section.id] || []);
      } else {
        setSequences([]);
      }
    }
  };

  const handleLevelHover = (level) => {
    setOpenLevel(level);
    setHoveredCourse(null);
    setHoveredSequence(null);
    // Data is already preloaded, no need to fetch
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
                onMouseEnter={() => handleLevelHover(level)}
                onMouseLeave={() => setOpenLevel(null)}
                className={isLevelActive ? 'dropdown-active-item' : ''}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'default',
                    padding: '8px 16px',
                    borderRadius: 4,
                    background: isLevelActive ? '#0097a9' : 'none',
                    color: isLevelActive ? '#fff' : '#333',
                    transition: 'background 0.2s',
                  }}
                  className="dropdown-hover-item"
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
                          {isCourseActive && sequences && sequences.length > 0 && (
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

const NavigationMenu = ({ courses, preloadedData, setPreloadedData }) => {
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
      <div 
        className="pte-tools" 
        style={{ cursor: 'pointer' }}
        onClick={() => window.location.href = 'https://nihongodrill.com/'}
        onMouseEnter={(e) => {
          e.target.style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          e.target.style.opacity = '1';
        }}
      >
        <img 
          src="https://i.postimg.cc/KvRf6sbv/z7090263423955-f64ff175e1732d58db753af299c30b15.jpg" 
          alt="Manabi Hub Logo" 
          style={{ 
            height: '45px', 
            width: 'auto',
            objectFit: 'contain'
          }}
        />
      </div>
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {['聴解', '言葉。漢字', '文法', '読解'].map((label) => (
          <MultiLevelDropdown
            key={label}
            label={label}
            courses={courses}
            hoveredSkill={hoveredSkill}
            setHoveredSkill={setHoveredSkill}
            LEVELS={LEVELS}
            preloadedData={preloadedData}
            setPreloadedData={setPreloadedData}
          />
        ))}
        <div
          className="nav-item test-series-link"
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
          onClick={() => window.location.href = '/learning/test-series'}
          onMouseEnter={(e) => {
            e.target.style.background = '#007a8a';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#0097a9';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          📝 模試テスト
        </div>
        {/* Cache refresh button - available in all environments */}
        <div
          className="nav-item cache-refresh-link"
          style={{
            position: 'relative',
            padding: '8px 16px',
            borderRadius: 4,
            cursor: 'pointer',
            background: '#ff9800',
            color: '#fff',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            fontSize: '0.85rem',
          }}
          onClick={() => {
            invalidateCache();
            window.location.reload();
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#f57c00';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#ff9800';
            e.target.style.transform = 'translateY(0)';
          }}
          title={`Cache Info: ${JSON.stringify(getCacheInfo())}`}
        >
          🔄 Refresh Menu
        </div>
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
  // Test Timer props (for manual override)
  isTestMode = false,
  testId = null,
  testTimeInMinutes = null,
  onTestTimeExpired = null,
  onTestTimeUpdate = null,
  // Preloaded data for test detection
  preloadedData = {},
}) => {

  const { authenticatedUser } = useContext(AppContext);
  const [timeLimit, setTimeLimit] = useState(null);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [courses, setCourses] = useState([]);
  const [internalPreloadedData, setInternalPreloadedData] = useState({});
  const [openLevel, setOpenLevel] = useState(null);
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [timerKey, setTimerKey] = useState(0);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [accessInfo, setAccessInfo] = useState(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isActivatingSection, setIsActivatingSection] = useState(false);
  const [currentSectionInfo, setCurrentSectionInfo] = useState(null);

  // Get unit data using the same method as index.jsx
  const unit = useModel(modelKeys.units, unitId);
  
  // Extract courseId and sequenceId from URL if not provided
  const [extractedCourseId, setExtractedCourseId] = useState(courseId);
  const [extractedSequenceId, setExtractedSequenceId] = useState(null);
  
  useEffect(() => {
    if (unitId) {
      try {
        const path = window.location ? window.location.pathname : '';
        const parsed = extractCourseInfoFromURL(path);
        if (parsed) {
          if (parsed.courseId && !courseId) {
            setExtractedCourseId(parsed.courseId);
          }
          if (parsed.sequenceId) {
            setExtractedSequenceId(parsed.sequenceId);
          }
        }
      } catch (e) {
        // no-op
      }
    }
  }, [courseId, unitId]);
  
  // Get sequence and section data for debug
  // Try multiple sources: unit.sequenceId, extractedSequenceId from URL, or from course outline
  const sequenceId = unit?.sequenceId || extractedSequenceId;
  const sequence = useModel('sequences', sequenceId);
  const section = useModel('sections', sequence?.sectionId);
  
  // Fallback: Try to get section from course outline if sequence doesn't have sectionId
  const course = useModel('coursewareMeta', courseId || extractedCourseId);
  const [fetchedSection, setFetchedSection] = useState(null);
  
  // Fetch section from API if not available in model store
  useEffect(() => {
    const fetchSectionInfo = async () => {
      if (!section && (courseId || extractedCourseId) && sequenceId) {
        try {
          const lmsBaseUrl = getConfig().LMS_BASE_URL;
          // Try to get section info from course outline API
          const courseIdToUse = courseId || extractedCourseId;
          if (courseIdToUse) {
            const sectionsResponse = await fetch(`${lmsBaseUrl}/api/all_courses/${courseIdToUse}/sections/`, {
              method: 'GET',
              credentials: 'include',
            });
            
            if (sectionsResponse.ok) {
              const sectionsData = await sectionsResponse.json();
              // Find section that contains this sequence
              for (const sec of sectionsData) {
                const sequencesResponse = await fetch(`${lmsBaseUrl}/api/sections/${sec.id}/sequences/`, {
                  method: 'GET',
                  credentials: 'include',
                });
                if (sequencesResponse.ok) {
                  const sequencesData = await sequencesResponse.json();
                  const hasSequence = sequencesData.some(seq => seq.id === sequenceId);
                  if (hasSequence) {
                    setFetchedSection({
                      id: sec.id,
                      title: sec.display_name || sec.title || 'Unknown Section',
                    });
                    break;
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn('🔍 [LearningHeader] Failed to fetch section info:', error);
        }
      }
    };
    
    fetchSectionInfo();
  }, [section, courseId, extractedCourseId, sequenceId]);
  
  // Use fetched section as fallback
  const currentSection = section || fetchedSection;

  // Use test detection hook
  const { testConfig, getTestTimerProps } = useTestDetection(
    unitId, 
    extractedCourseId, 
    null, // sectionId not available in header context
    internalPreloadedData
  );

  // Debug: log detection and localStorage snapshots in header
  useEffect(() => {
    try {
      const path = window.location ? window.location.pathname : '';
      const parsed = extractCourseInfoFromURL(path);
      if (typeof window !== 'undefined' && window.testStorage && typeof window.testStorage.snapshot === 'function') {
        window.testStorage.snapshot();
      }
    } catch (e) {
      // no-op
    }
  }, [unitId, courseId, extractedCourseId, testConfig]);

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
              // Handle error silently
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
      if (event.detail && event.detail.unitId === unitId) {
        // Force re-render of UnitTimer by updating timerKey
        setTimerKey(prev => prev + 1);
      }
    };

    window.addEventListener('resetTimer', handleTimerReset);
    return () => {
      window.removeEventListener('resetTimer', handleTimerReset);
    };
  }, [unitId]);

  // Use useCallback to memoize loadMenuData function
  const loadMenuData = useCallback(async (forceRefresh = false) => {
    try {
      // 1. Try to get cached menu data first (unless force refresh)
      const cachedData = getCachedMenuData(forceRefresh);
      if (cachedData && !forceRefresh) {
        // Silently use cached data (no log to avoid spam)
        setCourses(cachedData.courses || []);
        setInternalPreloadedData(cachedData.preloadedData || {});
        
        // In background, check if cache needs refresh and update if needed
        // This ensures menu stays fresh without blocking UI
        setTimeout(async () => {
          if (shouldRefreshCache()) {
            // Silently refresh cache in background (no log to avoid spam)
            // Use the latest loadMenuData function
            const freshData = await fetchAllCourses();
            const preloadedDataMap = {};
            
            for (const course of freshData) {
              try {
                const sectionsData = await fetchSectionsByCourseId(course.id);
                const courseData = {
                  sections: sectionsData,
                  sequences: {}
                };
                
                for (const section of sectionsData) {
                  try {
                    const sequencesData = await fetchSequencesBySectionId(section.id);
                    courseData.sequences[section.id] = sequencesData;
                  } catch (err) {
                    courseData.sequences[section.id] = [];
                  }
                }
                
                preloadedDataMap[course.id] = courseData;
              } catch (err) {
                preloadedDataMap[course.id] = { sections: [], sequences: {} };
              }
            }
            
            setCourses(freshData);
            setInternalPreloadedData(preloadedDataMap);
            setCachedMenuData({
              courses: freshData,
              preloadedData: preloadedDataMap
            });
          }
        }, 1000);
        
        return;
      }

      console.log('📡 Fetching menu data from API...');
      
      // 2. Fetch fresh data
      const coursesData = await fetchAllCourses();
      setCourses(coursesData);
      
      // Only preload if no external preloadedData provided
      if (Object.keys(preloadedData).length === 0) {
        // TỐI ƯU HÓA: Fetch sections and sequences sequentially to reduce load
        const preloadedDataMap = {};
        
        // Process courses sequentially to avoid overloading
        for (const course of coursesData) {
          try {
            // Fetch sections for this course
            const sectionsData = await fetchSectionsByCourseId(course.id);
            const courseData = {
              sections: sectionsData,
              sequences: {}
            };
            
            // Fetch sequences for each section
            for (const section of sectionsData) {
              try {
                const sequencesData = await fetchSequencesBySectionId(section.id);
                courseData.sequences[section.id] = sequencesData;
              } catch (err) {
                console.warn(`Failed to fetch sequences for section ${section.id}:`, err);
                courseData.sequences[section.id] = [];
              }
            }
            
            preloadedDataMap[course.id] = courseData;
          } catch (err) {
            console.warn(`Failed to fetch sections for course ${course.id}:`, err);
            preloadedDataMap[course.id] = { sections: [], sequences: {} };
          }
        }
        
        setInternalPreloadedData(preloadedDataMap);
        
        // 3. Cache the data for next time
        setCachedMenuData({
          courses: coursesData,
          preloadedData: preloadedDataMap
        });
        
        console.log('✅ Menu data loaded and cached successfully!');
      } else {
        setInternalPreloadedData(preloadedData);
      }
    } catch (err) {
      console.error('Failed to load menu data:', err);
      // On error, clear potentially corrupted cache
      clearMenuCache();
    }
  }, []); // Empty dependency array - only load once on mount

  useEffect(() => {
    // Check for cache refresh trigger from localStorage (allows other tabs/windows to trigger refresh)
    const handleStorageChange = (e) => {
      if (e.key === 'menu_cache_refresh') {
        console.log('🔄 Cache refresh triggered by another tab/window');
        loadMenuData(true);
        // Clear the trigger
        localStorage.removeItem('menu_cache_refresh');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Initial load only once on mount
    loadMenuData();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency - only mount once

  // Fetch subscription and access info for debugging
  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      if (!authenticatedUser) {
        console.log('🔍 [LearningHeader] User not authenticated - no subscription info');
        return;
      }

      try {
        const lmsBaseUrl = getConfig().LMS_BASE_URL;
        
        // Fetch subscription status
        const subscriptionResponse = await fetch(`${lmsBaseUrl}/api/payment/subscription/status/`, {
          method: 'GET',
          credentials: 'include',
        });

        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          setSubscriptionInfo(subscriptionData);
          
          console.log('🔍 [LearningHeader] ===== SUBSCRIPTION INFO =====');
          console.log('🔍 User:', authenticatedUser.username, '(ID:', authenticatedUser.id, ')');
          console.log('🔍 Has Subscription:', subscriptionData.has_subscription);
          console.log('🔍 Subscription Details:', JSON.stringify(subscriptionData.subscription_info, null, 2));
          console.log('🔍 ============================================');
        } else {
          console.warn('🔍 [LearningHeader] Failed to fetch subscription status:', subscriptionResponse.status);
        }

        // Fetch access info
        const accessResponse = await fetch(`${lmsBaseUrl}/api/payment/user/access-info/`, {
          method: 'GET',
          credentials: 'include',
        });

        if (accessResponse.ok) {
          const accessData = await accessResponse.json();
          setAccessInfo(accessData.access_info);
          
          console.log('🔍 [LearningHeader] ===== ACCESS INFO =====');
          console.log('🔍 Access Type:', accessData.access_info?.access_type);
          console.log('🔍 Unit Limit:', accessData.access_info?.unit_limit);
          console.log('🔍 Allowed Sections:', accessData.access_info?.allowed_sections || []);
          console.log('🔍 Updated At:', accessData.access_info?.updated_at);
          console.log('🔍 Full Access Info:', JSON.stringify(accessData.access_info, null, 2));
          console.log('🔍 ============================================');
        } else {
          console.warn('🔍 [LearningHeader] Failed to fetch access info:', accessResponse.status);
        }

        // Fetch enrollment status for more details
        const enrollmentResponse = await fetch(`${lmsBaseUrl}/api/payment/enrollment/status/`, {
          method: 'GET',
          credentials: 'include',
        });

        if (enrollmentResponse.ok) {
          const enrollmentData = await enrollmentResponse.json();
          
          console.log('🔍 [LearningHeader] ===== ENROLLMENT STATUS =====');
          console.log('🔍 Total Enrolled:', enrollmentData.enrollments?.total_enrolled);
          console.log('🔍 Total Available:', enrollmentData.enrollments?.total_available);
          console.log('🔍 Status:', JSON.stringify(enrollmentData.status, null, 2));
          console.log('🔍 Recent Transactions:', enrollmentData.transactions?.transaction_list?.length || 0);
          if (enrollmentData.transactions?.transaction_list?.length > 0) {
            console.log('🔍 Latest Transaction:', JSON.stringify(enrollmentData.transactions.transaction_list[0], null, 2));
          }
          console.log('🔍 ============================================');
        } else {
          console.warn('🔍 [LearningHeader] Failed to fetch enrollment status:', enrollmentResponse.status);
        }

      } catch (error) {
        console.error('🔍 [LearningHeader] Error fetching subscription/access info:', error);
      }
    };

    fetchSubscriptionInfo();
  }, [authenticatedUser]);

  // Debug: Log current section and access info
  useEffect(() => {
    if (currentSection && accessInfo) {
      const sectionTitle = currentSection.title || 'Unknown Section';
      const hasSectionAccess = accessInfo.access_type === 'section_access' && 
                               accessInfo.allowed_sections?.includes(sectionTitle);
      
      console.log('🔍 [LearningHeader] ===== CURRENT SECTION DEBUG =====');
      console.log('🔍 Current Section ID:', currentSection.id);
      console.log('🔍 Current Section Title:', sectionTitle);
      console.log('🔍 Sequence ID:', sequenceId);
      console.log('🔍 Unit ID:', unitId);
      console.log('🔍 Course ID:', courseId || extractedCourseId);
      console.log('🔍 Section Source:', section ? 'model-store' : (fetchedSection ? 'api-fetch' : 'none'));
      console.log('🔍 ---');
      console.log('🔍 Access Type:', accessInfo.access_type);
      console.log('🔍 Has Section Access:', hasSectionAccess);
      console.log('🔍 Allowed Sections:', accessInfo.allowed_sections || []);
      console.log('🔍 Unit Limit:', accessInfo.unit_limit || 'Unlimited');
      console.log('🔍 Can Access All Units in This Section:', 
        accessInfo.access_type === 'subscribed' || hasSectionAccess);
      console.log('🔍 ============================================');
      
      setCurrentSectionInfo({
        id: currentSection.id,
        title: sectionTitle,
        hasAccess: hasSectionAccess,
      });
    } else if (accessInfo && unitId) {
      // Log even if section is not available yet
      console.log('🔍 [LearningHeader] ===== CURRENT SECTION DEBUG (Partial) =====');
      console.log('🔍 Current Section: Not available yet');
      console.log('🔍 Sequence ID:', sequenceId || 'Not available');
      console.log('🔍 Unit ID:', unitId);
      console.log('🔍 Course ID:', courseId || extractedCourseId);
      console.log('🔍 ---');
      console.log('🔍 Access Type:', accessInfo.access_type);
      console.log('🔍 Allowed Sections:', accessInfo.allowed_sections || []);
      console.log('🔍 Unit Limit:', accessInfo.unit_limit || 'Unlimited');
      console.log('🔍 ============================================');
    }
  }, [currentSection, accessInfo, sequenceId, unitId, courseId, extractedCourseId, section, fetchedSection]);

  // Toggle subscription status (for testing)
  const handleToggleSubscription = async () => {
    if (!authenticatedUser) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này!');
      return;
    }

    if (isToggling) return;

    try {
      setIsToggling(true);
      const lmsBaseUrl = getConfig().LMS_BASE_URL;
      const currentStatus = subscriptionInfo?.has_subscription ? 'deactivate' : 'reactivate';
      
      // Step 1: Get CSRF token
      const csrfResponse = await fetch(`${lmsBaseUrl}/api/payment/csrf-token/`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrf_token;

      if (!csrfToken) {
        throw new Error('CSRF token not received');
      }

      // Step 2: Toggle subscription
      const response = await fetch(`${lmsBaseUrl}/api/payment/toggle-subscription/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          action: currentStatus,
          username: authenticatedUser.username
        })
      });

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error(`Server returned ${response.status}: ${response.statusText}. Check console for details.`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(errorData.error || `Failed to toggle subscription: ${response.status}`);
      }

      const result = await response.json();
      
      // Refresh subscription info
      const subscriptionResponse = await fetch(`${lmsBaseUrl}/api/payment/subscription/status/`, {
        method: 'GET',
        credentials: 'include',
      });
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setSubscriptionInfo(subscriptionData);
      }

      // Refresh access info
      const accessResponse = await fetch(`${lmsBaseUrl}/api/payment/user/access-info/`, {
        method: 'GET',
        credentials: 'include',
      });
      if (accessResponse.ok) {
        const accessData = await accessResponse.json();
        setAccessInfo(accessData.access_info);
      }

      alert(`✅ ${result.message}\n\nAccess Type: ${result.access_info.access_type}\nUnit Limit: ${result.access_info.unit_limit || 'Unlimited'}\n\nVui lòng reload trang để thấy thay đổi!`);
      
      // Auto reload after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error toggling subscription:', error);
      alert(`❌ Lỗi: ${error.message}`);
    } finally {
      setIsToggling(false);
    }
  };

  // Activate section "読解" access (for testing)
  const handleActivateSection = async () => {
    if (!authenticatedUser) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này!');
      return;
    }

    if (isActivatingSection) return;

    const sectionName = '読解';
    const confirmMessage = `Bạn có chắc chắn muốn ACTIVATE section "${sectionName}" cho tài khoản này không?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setIsActivatingSection(true);
      const lmsBaseUrl = getConfig().LMS_BASE_URL;
      
      // Step 1: Get CSRF token
      const csrfResponse = await fetch(`${lmsBaseUrl}/api/payment/csrf-token/`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrf_token;

      if (!csrfToken) {
        throw new Error('CSRF token not received');
      }

      // Step 2: Activate section access
      const response = await fetch(`${lmsBaseUrl}/api/payment/activate-section-access/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          section_name: sectionName
        })
      });

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error(`Server returned ${response.status}: ${response.statusText}. Check console for details.`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(errorData.error || `Failed to activate section access: ${response.status}`);
      }

      const result = await response.json();
      
      // Refresh access info
      const accessResponse = await fetch(`${lmsBaseUrl}/api/payment/user/access-info/`, {
        method: 'GET',
        credentials: 'include',
      });
      if (accessResponse.ok) {
        const accessData = await accessResponse.json();
        setAccessInfo(accessData.access_info);
        
        // Dispatch event to notify other components (e.g., SidebarSequence) to refresh
        window.dispatchEvent(new CustomEvent('accessInfoUpdated'));
        // Also update localStorage to trigger storage event for cross-tab updates
        localStorage.setItem('access_info_updated', Date.now().toString());
      }

      alert(`✅ ${result.message}\n\nSection: ${result.section_name}\nEnrolled Courses: ${result.enrolled_courses}\n\nVui lòng reload trang để thấy thay đổi!`);
      
      // Auto reload after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error activating section access:', error);
      alert(`❌ Lỗi: ${error.message}`);
    } finally {
      setIsActivatingSection(false);
    }
  };

  const handleTimeExpired = () => {
    // Handle time expiration logic here
  };


  // If in test mode, render TestHeader and TestNavigationBar instead of regular header
  // But exclude test-series listing page (not an actual test page)
  const isTestSeriesListingPage = typeof window !== 'undefined' && (
    window.location.pathname === '/learning/test-series' || 
    window.location.pathname === '/test-series' || 
    window.location.pathname.match(/^\/learning\/test-series\/?$/)
  );
  
  if ((testConfig.isTestMode || isTestMode) && !isTestSeriesListingPage && unitId) {
      return (
        <>
          <TestHeader
            intl={intl}
            testName={testConfig.testName || 'Test'}
            testTimeInMinutes={testConfig.testTimeInMinutes || testTimeInMinutes || 60}
            onTestTimeExpired={onTestTimeExpired || (() => {
              console.log('Test time expired for:', testConfig.testName || 'Unknown Test');
            })}
            onTestTimeUpdate={onTestTimeUpdate || ((timeLeft) => {
              // Debug log removed
            })}
            unitId={unitId}
            sequenceId={testConfig.sequenceId}
            courseId={courseId || extractedCourseId}
          />
          <TestNavigationBar
            courseId={courseId || extractedCourseId}
            sequenceId={testConfig.sequenceId}
            unitId={unitId}
            onClickNext={() => {
              // TestNavigationBar handles its own navigation
              // This is just a placeholder - actual navigation is handled by TestNavigationBar
              console.log('🔍 [LearningHeader] onClickNext called - TestNavigationBar will handle navigation');
              console.log('🔍 [LearningHeader] Current URL:', window.location.href);
              console.log('🔍 [LearningHeader] TestNavigationBar should handle this');
            }}
            isAtTop={false}
          />
        </>
      );
  }


  return (
    <header className="learning-header">
      <a className="sr-only sr-only-focusable" href="#main-content">{intl.formatMessage(messages.skipNavLink)}</a>
      <div className="container-xl py-2 d-flex align-items-center">
        {/* Logo removed */}
        <NavigationMenu courses={courses} preloadedData={internalPreloadedData} setPreloadedData={setInternalPreloadedData} />
        <div className="flex-grow-1 course-title-lockup d-flex align-items-center justify-content-end" style={{ lineHeight: 1, gap: '8px' }}>
          {/* Unit Timer for individual quizzes */}
          {unitId && (timeLimit !== null && timeLimit !== undefined) ? (
            <UnitTimer
              key={`${unitId}-${timerKey}`}
              unitId={unitId}
              initialTimeByProblemType={timeLimit}
              onTimeExpired={handleTimeExpired}
            />
          ) : null}
          {/* Toggle Subscription Button (for testing - development only) */}
          {showActivateButtons && authenticatedUser && subscriptionInfo && (
            <div
              className="nav-item toggle-subscription-link"
              style={{
                position: 'relative',
                padding: '8px 16px',
                borderRadius: 4,
                cursor: isToggling ? 'not-allowed' : 'pointer',
                background: subscriptionInfo.has_subscription ? '#f44336' : '#4caf50',
                color: '#fff',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                opacity: isToggling ? 0.6 : 1,
                fontSize: '0.85rem',
              }}
              onClick={handleToggleSubscription}
              onMouseEnter={(e) => {
                if (!isToggling) {
                  e.target.style.opacity = '0.8';
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isToggling) {
                  e.target.style.opacity = '1';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
              title={`Current: ${subscriptionInfo.has_subscription ? 'Subscribed' : 'Free'} - Click to ${subscriptionInfo.has_subscription ? 'Deactivate' : 'Activate'}`}
            >
              {isToggling ? '⏳...' : (subscriptionInfo.has_subscription ? '🔴 Deactivate Sub' : '🟢 Activate Sub')}
            </div>
          )}
          {/* Activate Section "読解" Button (for testing - development only) */}
          {showActivateButtons && authenticatedUser && (
            <div
              className="nav-item activate-section-link"
              style={{
                position: 'relative',
                padding: '8px 16px',
                borderRadius: 4,
                cursor: isActivatingSection ? 'not-allowed' : 'pointer',
                background: '#ff9800',
                color: '#fff',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                opacity: isActivatingSection ? 0.6 : 1,
                fontSize: '0.85rem',
                minWidth: '140px',
                textAlign: 'center',
              }}
              onClick={handleActivateSection}
              onMouseEnter={(e) => {
                if (!isActivatingSection) {
                  e.target.style.opacity = '0.8';
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActivatingSection) {
                  e.target.style.opacity = '1';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
              title="Activate Section 読解 Access (for testing)"
            >
              {isActivatingSection ? '⏳ Activating...' : '📚 Activate 読解'}
            </div>
          )}
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
          /* Force teal background for all user dropdown states - Higher specificity to override _header.scss */
          #root .learning-header .user-dropdown button,
          #root .learning-header .user-dropdown button:focus,
          #root .learning-header .user-dropdown button:active,
          #root .learning-header .user-dropdown button:visited,
          #root .learning-header .user-dropdown button:hover,
          #root .learning-header .user-dropdown button:not(:disabled):not(.disabled):active,
          #root .learning-header .user-dropdown button:not(:disabled):not(.disabled):active:focus,
          #root .learning-header .user-dropdown button.show,
          #root .learning-header .user-dropdown button.show:focus,
          #root .learning-header .user-dropdown button.show:active,
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
            border-radius: 50% !important;
            width: 40px !important;
            height: 40px !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border: none !important;
            text-decoration: none !important;
            outline: none !important;
            transition: all 0.2s ease !important;
          }
          #root .learning-header .user-dropdown button:hover,
          .learning-header .btn.dropdown-toggle:hover {
            background: #006064 !important;
            background-color: #006064 !important;
            border-color: #006064 !important;
            transform: translateY(-1px) !important;
          }
          /* Hide dropdown arrow */
          #root .learning-header .user-dropdown button::after,
          .learning-header .btn.dropdown-toggle::after {
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
  // Test Timer props (for manual override)
  isTestMode: PropTypes.bool,
  testId: PropTypes.string,
  testTimeInMinutes: PropTypes.number,
  onTestTimeExpired: PropTypes.func,
  onTestTimeUpdate: PropTypes.func,
  // Preloaded data for test detection
  preloadedData: PropTypes.object,
};


export default injectIntl(LearningHeader);
