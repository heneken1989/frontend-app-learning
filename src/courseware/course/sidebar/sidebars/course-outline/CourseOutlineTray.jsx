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
  const [debugInfo, setDebugInfo] = useState({
    loadAttempts: 0,
    lastLoadTime: null,
    errors: [],
    sequenceCount: 0,
    loadingDuration: 0,
    userRole: null,
    courseId: null,
    apiResponse: null,
    permissions: null,
    cacheStatus: null
  });
  const [showDebug, setShowDebug] = useState(process.env.NODE_ENV === 'development');
  const userInfoFetched = useRef(false);
  const lastLogTime = useRef(0);

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

  // Debug monitoring - Only run once on mount
  useEffect(() => {
    const startTime = Date.now();
    
    // Console log for production debugging - Debounced
    const now = Date.now();
    if (now - lastLogTime.current > 2000) { // Only log every 2 seconds
      lastLogTime.current = now;
      console.log('🔍 [CourseOutlineTray] Debug Info:', {
        courseOutlineStatus,
        courseId,
        sequencesCount: Object.keys(sequences || {}).length,
        activeSequenceId,
        unitId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Get user role and permissions - Only once
    const getUserInfo = async () => {
      try {
        // Use fallback first to avoid API calls
        const fallbackRole = window.user || window.global || window.edx;
        if (fallbackRole) {
          console.log('👤 [CourseOutlineTray] Using fallback user role:', fallbackRole);
          setDebugInfo(prev => ({
            ...prev,
            userRole: 'detected',
            courseId: courseId
          }));
          return;
        }
        
        // Only try API if fallback fails and we haven't tried before
        if (!debugInfo.userRole) {
          const response = await fetch('/api/user/v1/me');
          if (response.ok) {
            try {
              const data = await response.json();
              if (data && (data.is_staff !== undefined || data.username)) {
                console.log('👤 [CourseOutlineTray] User Info:', {
                  is_staff: data.is_staff,
                  username: data.username,
                  role: data.is_staff ? 'staff' : 'student'
                });
                setDebugInfo(prev => ({
                  ...prev,
                  userRole: data.is_staff ? 'staff' : 'student',
                  courseId: courseId
                }));
              }
            } catch (jsonError) {
              console.warn('⚠️ [CourseOutlineTray] JSON parsing failed, using fallback user role');
              setDebugInfo(prev => ({
                ...prev,
                userRole: 'student', // Default fallback
                courseId: courseId
              }));
            }
          }
        }
      } catch (error) {
        console.error('❌ [CourseOutlineTray] User info error:', error);
        setDebugInfo(prev => ({
          ...prev,
          userRole: 'unknown',
          errors: [...prev.errors, `User info error: ${error.message}`]
        }));
      }
    };

    setDebugInfo(prev => ({
      ...prev,
      loadAttempts: prev.loadAttempts + 1,
      lastLoadTime: new Date().toISOString()
    }));

    // Only get user info once
    if (!debugInfo.userRole && !userInfoFetched.current) {
      userInfoFetched.current = true;
      getUserInfo();
    }

    if (courseOutlineStatus !== LOADING) {
      const duration = Date.now() - startTime;
      console.log('📊 [CourseOutlineTray] Loading completed:', {
        duration: `${duration}ms`,
        sequencesCount: Object.keys(sequences || {}).length,
        status: courseOutlineStatus,
        hasSequences: !!sequences
      });
      setDebugInfo(prev => ({
        ...prev,
        loadingDuration: duration,
        sequenceCount: Object.keys(sequences || {}).length,
        apiResponse: sequences ? 'success' : 'failed'
      }));
    }
  }, [courseOutlineStatus, courseId, sequences, debugInfo.userRole]); // Add debugInfo.userRole to prevent re-running

  // Monitor sequences changes
  useEffect(() => {
    if (sequences && Object.keys(sequences).length > 0) {
    }
  }, [sequences, activeSequenceId]);

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
              {/* Debug toggle button */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  style={{
                    background: showDebug ? '#ff6b6b' : '#51cf66',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '10px',
                    padding: '2px 6px',
                    marginLeft: '8px',
                    cursor: 'pointer'
                  }}
                  title="Toggle Debug Info"
                >
                  DEBUG
                </button>
              )}
            </div>
            
            {/* Debug Info Overlay */}
            {showDebug && (
              <div style={{
                position: 'fixed',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.9)',
                color: 'white',
                padding: '15px',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'monospace',
                zIndex: 9999,
                maxWidth: '400px',
                maxHeight: '80vh',
                overflow: 'auto'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#51cf66' }}>🔍 Course Outline Debug</h4>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong>User Role:</strong> {debugInfo.userRole || 'loading...'}
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong>Course ID:</strong> {debugInfo.courseId || 'loading...'}
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong>Load Attempts:</strong> {debugInfo.loadAttempts}
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong>Sequences Count:</strong> {debugInfo.sequenceCount}
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong>API Response:</strong> {debugInfo.apiResponse || 'pending...'}
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong>Course Outline Status:</strong> {courseOutlineStatus}
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong>Active Sequence ID:</strong> {activeSequenceId || 'none'}
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong>Current Unit ID:</strong> {unitId || 'none'}
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong>Loading Duration:</strong> {debugInfo.loadingDuration}ms
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong>Last Load:</strong> {debugInfo.lastLoadTime ? new Date(debugInfo.lastLoadTime).toLocaleTimeString() : 'never'}
                </div>
                
                {debugInfo.errors.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#ff6b6b' }}>Errors:</strong>
                    <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
                      {debugInfo.errors.map((error, index) => (
                        <li key={index} style={{ color: '#ff6b6b' }}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {sequences && Object.keys(sequences).length > 0 && (
                  <details style={{ marginTop: '10px' }}>
                    <summary style={{ color: '#51cf66', cursor: 'pointer', fontSize: '11px' }}>
                      📋 View Sequences ({Object.keys(sequences).length})
                    </summary>
                    <div style={{ marginTop: '5px', fontSize: '10px', maxHeight: '150px', overflow: 'auto' }}>
                      {Object.entries(sequences).map(([seqId, seq]) => (
                        <div key={seqId} style={{ 
                          margin: '2px 0', 
                          padding: '2px',
                          background: seqId === activeSequenceId ? 'rgba(81, 207, 102, 0.2)' : 'transparent',
                          borderRadius: '2px'
                        }}>
                          <span style={{ color: '#ff6b6b' }}>{seqId.slice(-8)}</span>: 
                          <span style={{ color: '#87ceeb' }}> {seq.title || 'No title'}</span>
                          {seqId === activeSequenceId && <span style={{ color: '#51cf66' }}> [ACTIVE]</span>}
                          <div style={{ fontSize: '9px', color: '#aaa', marginLeft: '10px' }}>
                            Units: {seq.unitIds ? seq.unitIds.length : 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                
                <div style={{ marginTop: '10px', fontSize: '10px', color: '#aaa' }}>
                  💡 Compare this info between admin and regular user to find the issue
                </div>
              </div>
            )}

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
