import { useState, useEffect } from 'react';
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
    loadingDuration: 0
  });
  const [showDebug, setShowDebug] = useState(process.env.NODE_ENV === 'development');

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

  // Debug monitoring
  useEffect(() => {
    const startTime = Date.now();
    setDebugInfo(prev => ({
      ...prev,
      loadAttempts: prev.loadAttempts + 1,
      lastLoadTime: new Date().toISOString()
    }));

    console.log('🔍 [CourseOutlineTray] Loading started', {
      courseId,
      status: courseOutlineStatus,
      timestamp: new Date().toISOString(),
      attempt: debugInfo.loadAttempts + 1
    });

    if (courseOutlineStatus !== LOADING) {
      const duration = Date.now() - startTime;
      setDebugInfo(prev => ({
        ...prev,
        loadingDuration: duration,
        sequenceCount: Object.keys(sequences || {}).length
      }));

      console.log('✅ [CourseOutlineTray] Loading completed', {
        courseId,
        status: courseOutlineStatus,
        duration: `${duration}ms`,
        sequenceCount: Object.keys(sequences || {}).length,
        sequences: sequences
      });
    }
  }, [courseOutlineStatus, courseId, sequences]);

  // Monitor sequences changes
  useEffect(() => {
    if (sequences && Object.keys(sequences).length > 0) {
      console.log('📊 [CourseOutlineTray] Sequences updated', {
        count: Object.keys(sequences).length,
        sequenceIds: Object.keys(sequences),
        activeSequenceId,
        sequences
      });
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
                background: 'rgba(0, 0, 0, 0.9)',
                color: '#00ff00',
                fontFamily: 'monospace',
                fontSize: '11px',
                padding: '8px',
                margin: '4px',
                borderRadius: '4px',
                border: '1px solid #333',
                maxHeight: '150px',
                overflow: 'auto'
              }}>
                <div style={{ fontWeight: 'bold', color: '#ffff00', marginBottom: '4px' }}>
                  🔍 COURSE OUTLINE DEBUG
                </div>
                <div>Course ID: <span style={{ color: '#ff6b6b' }}>{courseId}</span></div>
                <div>Status: <span style={{ color: courseOutlineStatus === LOADING ? '#ffa500' : '#00ff00' }}>
                  {courseOutlineStatus}
                </span></div>
                <div>Load Attempts: <span style={{ color: '#87ceeb' }}>{debugInfo.loadAttempts}</span></div>
                <div>Sequences: <span style={{ color: '#87ceeb' }}>
                  {Object.keys(sequences || {}).length}
                </span></div>
                <div>Active Sequence: <span style={{ color: '#ff6b6b' }}>{activeSequenceId}</span></div>
                <div>Unit ID: <span style={{ color: '#ff6b6b' }}>{unitId}</span></div>
                <div>Last Load: <span style={{ color: '#87ceeb' }}>
                  {debugInfo.lastLoadTime ? new Date(debugInfo.lastLoadTime).toLocaleTimeString() : 'N/A'}
                </span></div>
                <div>Duration: <span style={{ color: '#87ceeb' }}>{debugInfo.loadingDuration}ms</span></div>
                
                {sequences && Object.keys(sequences).length > 0 && (
                  <details style={{ marginTop: '8px' }}>
                    <summary style={{ color: '#ffff00', cursor: 'pointer' }}>Sequences Data</summary>
                    <div style={{ marginLeft: '8px', fontSize: '10px' }}>
                      {Object.entries(sequences).map(([seqId, seq]) => (
                        <div key={seqId} style={{ margin: '2px 0' }}>
                          <span style={{ color: '#ffa500' }}>{seqId.slice(-8)}</span>: 
                          <span style={{ color: '#87ceeb' }}> {seq.title}</span>
                          {seqId === activeSequenceId && <span style={{ color: '#00ff00' }}> [ACTIVE]</span>}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                
                <div style={{ marginTop: '8px', fontSize: '10px', color: '#888' }}>
                  Network: {navigator.connection?.effectiveType || 'unknown'} | 
                  Online: {navigator.onLine ? '✅' : '❌'}
                </div>
              </div>
            )}

            <ol className="outline-tray-content">
              {sequences[activeSequenceId] && (
                <SidebarSequence
                  courseId={courseId}
                  sequence={sequences[activeSequenceId]}
                  defaultOpen
                  activeUnitId={unitId}
                />
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
