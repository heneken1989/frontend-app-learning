/* eslint-disable @typescript-eslint/no-use-before-define */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import {
  sendTrackEvent,
  sendTrackingLogEvent,
} from '@edx/frontend-platform/analytics';
import { useIntl } from '@edx/frontend-platform/i18n';
import { useSelector } from 'react-redux';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';
import SequenceExamWrapper from '@edx/frontend-lib-special-exams';

import PageLoading from '@src/generic/PageLoading';
import { useModel } from '@src/generic/model-store';
import { useSequenceBannerTextAlert, useSequenceEntranceExamAlert } from '@src/alerts/sequence-alerts/hooks';
import SequenceContainerSlot from '../../../plugin-slots/SequenceContainerSlot';

import { getCoursewareOutlineSidebarSettings } from '../../data/selectors';
import CourseLicense from '../course-license';
import { NotificationsDiscussionsSidebarSlot } from '../../../plugin-slots/NotificationsDiscussionsSidebarSlot';
import messages from './messages';
import HiddenAfterDue from './hidden-after-due';
import { SequenceNavigation } from './sequence-navigation';
import PersistentNavigationBar from './sequence-navigation/PersistentNavigationBar';
import SequenceContent from './SequenceContent';
import { checkTestModeFromURL } from '../../../custom-components/TestSeriesPage/utils/testSectionManager';

const Sequence = ({
  unitId = null,
  sequenceId = null,
  courseId,
  unitNavigationHandler,
  nextSequenceHandler,
  previousSequenceHandler,
}) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const [accessInfo, setAccessInfo] = useState(null);
  
  // Safe check: metadata may be loading in background (non-blocking)
  const coursewareMeta = useModel('coursewareMeta', courseId) || {};
  const {
    canAccessProctoredExams,
    license,
  } = coursewareMeta;
  const courseHomeMeta = useModel('courseHomeMeta', courseId) || {};
  const {
    isStaff,
    originalUserIsStaff,
  } = courseHomeMeta;
  const sequence = useModel('sequences', sequenceId);
  const section = useModel('sections', sequence ? sequence.sectionId : null);
  const unit = useModel('units', unitId);
  const sequenceStatus = useSelector(state => state.courseware.sequenceStatus);
  const sequenceMightBeUnit = useSelector(state => state.courseware.sequenceMightBeUnit);
  const { enableNavigationSidebar: isEnabledOutlineSidebar } = useSelector(getCoursewareOutlineSidebarSettings);

  // Fetch access_info
  useEffect(() => {
    const fetchAccessInfo = async () => {
      try {
        const user = getAuthenticatedUser();
        if (!user) {
          setAccessInfo({ access_type: 'free', unit_limit: 20 });
          return;
        }

        const lmsBaseUrl = getConfig().LMS_BASE_URL;
        const response = await fetch(`${lmsBaseUrl}/api/payment/user/access-info/`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setAccessInfo(data.access_info || { access_type: 'free', unit_limit: 20 });
        } else {
          setAccessInfo({ access_type: 'free', unit_limit: 20 });
        }
      } catch (error) {
        console.warn('Failed to fetch access_info:', error);
        setAccessInfo({ access_type: 'free', unit_limit: 20 });
      }
    };

    fetchAccessInfo();
  }, []);

  // Check if current unit is beyond limit and redirect if needed
  useEffect(() => {
    if (accessInfo && sequence && unitId && section) {
      const unitIndex = sequence.unitIds?.indexOf(unitId) ?? -1;
      const sectionTitle = section?.title || '';
      
      // Check section access for section_access users
      if (accessInfo.access_type === 'section_access' && accessInfo.allowed_sections) {
        const excludedSections = accessInfo.excluded_sections || [];
        
        // Check if section is excluded
        const isExcluded = excludedSections.includes(sectionTitle);
        
        // Check if allowed_sections is ['*'] (all sections)
        const hasAllSections = accessInfo.allowed_sections.includes('*');
        
        // If section is excluded, limit to 20 units
        if (isExcluded) {
          if (unitIndex >= 20) {
            const lastAllowedIndex = 19;
            const lastAllowedUnitId = sequence.unitIds[lastAllowedIndex];
            if (lastAllowedUnitId) {
              console.warn(`Unit ${unitId} is beyond limit for excluded section "${sectionTitle}". Redirecting to last allowed unit.`);
              navigate(`/course/${courseId}/${sequenceId}/${lastAllowedUnitId}`, { replace: true });
            }
          }
          return; // Exit early for excluded sections
        }
        
        // If has all sections (and not excluded), no limit - allow all units
        if (hasAllSections) {
          return; // No limit for all sections access
        }
        
        // If section title is NOT in allowed_sections, limit to 20 units
        if (sectionTitle && !accessInfo.allowed_sections.includes(sectionTitle)) {
          if (unitIndex >= 20) {
            const lastAllowedIndex = 19;
            const lastAllowedUnitId = sequence.unitIds[lastAllowedIndex];
            if (lastAllowedUnitId) {
              console.warn(`Unit ${unitId} is beyond limit for section "${sectionTitle}". Redirecting to last allowed unit.`);
              navigate(`/course/${courseId}/${sequenceId}/${lastAllowedUnitId}`, { replace: true });
            }
          }
        }
        // If section is in allowed_sections, no limit - allow all units
      } else if (accessInfo.access_type === 'free' && accessInfo.unit_limit) {
        // Free user: check unit limit
        if (unitIndex >= accessInfo.unit_limit) {
          const lastAllowedIndex = accessInfo.unit_limit - 1;
          const lastAllowedUnitId = sequence.unitIds[lastAllowedIndex];
          if (lastAllowedUnitId) {
            console.warn(`Unit ${unitId} is beyond limit. Redirecting to last allowed unit.`);
            navigate(`/course/${courseId}/${sequenceId}/${lastAllowedUnitId}`, { replace: true });
          }
        }
      }
    }
  }, [accessInfo, sequence, unitId, courseId, sequenceId, navigate, section]);

  const handleNext = () => {
    if (!sequence || !unitId) return;
    
    const currentIndex = sequence.unitIds.indexOf(unitId);
    const nextIndex = currentIndex + 1;
    
    // Check access limit for free users or section_access users
    if (accessInfo) {
      const sectionTitle = section?.title || '';
      
      if (accessInfo.access_type === 'section_access' && accessInfo.allowed_sections) {
        const excludedSections = accessInfo.excluded_sections || [];
        
        // Check if section is excluded
        const isExcluded = excludedSections.includes(sectionTitle);
        
        // Check if allowed_sections is ['*'] (all sections)
        const hasAllSections = accessInfo.allowed_sections.includes('*');
        
        // If section is excluded, limit to 20 units
        if (isExcluded) {
          if (nextIndex >= 20) {
            const upgrade = window.confirm(
              `Section "${sectionTitle}" không được bao gồm trong gói của bạn. Bạn có muốn nâng cấp để xem tất cả units không?`
            );
            if (upgrade) {
              window.location.href = '/learning/payment';
            }
            return; // Block navigation
          }
          return; // Allow navigation within first 20 units for excluded sections
        }
        
        // If has all sections (and not excluded), no limit - allow navigation
        if (hasAllSections) {
          return; // No limit for all sections access
        }
        
        // If section title is NOT in allowed_sections, limit to 20 units
        if (sectionTitle && !accessInfo.allowed_sections.includes(sectionTitle)) {
          if (nextIndex >= 20) {
            const upgrade = window.confirm(
              `Bạn chưa mua Section "${sectionTitle}". Bạn có muốn nâng cấp để xem tất cả units không?`
            );
            if (upgrade) {
              window.location.href = '/learning/payment';
            }
            return; // Block navigation
          }
        }
        // If section is in allowed_sections, no limit - allow navigation
      } else if (accessInfo.access_type === 'free' && accessInfo.unit_limit) {
        if (nextIndex >= accessInfo.unit_limit) {
          const upgrade = window.confirm(
            'Bạn đã đạt đến giới hạn 20 units miễn phí. Bạn có muốn nâng cấp để xem tất cả units không?'
          );
          if (upgrade) {
            window.location.href = '/learning/payment';
          }
          return; // Block navigation
        }
      }
    }
    
    const newUnitId = sequence.unitIds[nextIndex];
    if (newUnitId) {
      handleNavigate(newUnitId);
    }

    if (nextIndex >= sequence.unitIds.length) {
      nextSequenceHandler();
    }
  };

  const handlePrevious = () => {
    const previousIndex = sequence.unitIds.indexOf(unitId) - 1;
    const newUnitId = sequence.unitIds[previousIndex];
    handleNavigate(newUnitId);

    if (previousIndex < 0) {
      previousSequenceHandler();
    }
  };

  const handleNavigate = (destinationUnitId) => {
    unitNavigationHandler(destinationUnitId);
  };

  const logEvent = (eventName, widgetPlacement, targetUnitId) => {
    // Note: tabs are tracked with a 1-indexed position
    // as opposed to a 0-index used throughout this MFE
    const currentIndex = sequence.unitIds.length > 0 ? sequence.unitIds.indexOf(unitId) : 0;
    const payload = {
      current_tab: currentIndex + 1,
      id: unitId,
      tab_count: sequence.unitIds.length,
      widget_placement: widgetPlacement,
    };
    if (targetUnitId) {
      const targetIndex = sequence.unitIds.indexOf(targetUnitId);
      payload.target_tab = targetIndex + 1;
    }
    sendTrackEvent(eventName, payload);
    sendTrackingLogEvent(eventName, payload);
  };

  useSequenceBannerTextAlert(sequenceId);
  useSequenceEntranceExamAlert(courseId, sequenceId, intl);

  useEffect(() => {
    function receiveMessage(event) {
      const { type } = event.data;
      if (type === 'entranceExam.passed') {
        // DISABLED: No auto-reload after entrance exam passed
        console.log('ℹ️ [Sequence] Auto-reload disabled - entrance exam passed logged only');
      }
    }
    global.addEventListener('message', receiveMessage);
  }, []);

  const [unitHasLoaded, setUnitHasLoaded] = useState(false);
  const handleUnitLoaded = () => {
    setUnitHasLoaded(true);
  };

  // We want hide the unit navigation if we're in the middle of navigating to another unit
  // but not if other things about the unit change, like the bookmark status.
  // The array property of this useEffect ensures that we only hide the unit navigation
  // while navigating to another unit.
  useEffect(() => {
    if (unit) {
      setUnitHasLoaded(false);
    }
  }, [(unit || {}).id]);

  // If sequence might be a unit, we want to keep showing a spinner - the courseware container will redirect us when
  // it knows which sequence to actually go to.
  const loading = sequenceStatus === 'loading' || (sequenceStatus === 'failed' && sequenceMightBeUnit);
  if (loading) {
    if (!sequenceId) {
      return (<div> {intl.formatMessage(messages.noContent)} </div>);
    }
    return (
      <PageLoading
        srMessage={intl.formatMessage(messages.loadingSequence)}
      />
    );
  }

  if (sequenceStatus === 'loaded' && sequence.isHiddenAfterDue) {
    // Shouldn't even be here - these sequences are normally stripped out of the navigation.
    // But we are here, so render a notice instead of the normal content.
    return <HiddenAfterDue courseId={courseId} />;
  }

  const gated = sequence && sequence.gatedContent !== undefined && sequence.gatedContent.gated;


  const defaultContent = (
    <>
      <div className="sequence-container d-inline-flex flex-row w-100">
        <div className="sequence w-100">
          {!isEnabledOutlineSidebar && (
            <div className="sequence-navigation-container">
              <SequenceNavigation
                sequenceId={sequenceId}
                unitId={unitId}
                nextHandler={() => {
                  logEvent('edx.ui.lms.sequence.next_selected', 'top');
                  handleNext();
                }}
                onNavigate={(destinationUnitId) => {
                  logEvent('edx.ui.lms.sequence.tab_selected', 'top', destinationUnitId);
                  handleNavigate(destinationUnitId);
                }}
                previousHandler={() => {
                  logEvent('edx.ui.lms.sequence.previous_selected', 'top');
                  handlePrevious();
                }}
                {...{
                  nextSequenceHandler,
                  handleNavigate,
                }}
              />
            </div>
          )}

          <div className="unit-container flex-grow-1">
            <SequenceContent
              courseId={courseId}
              gated={gated}
              sequenceId={sequenceId}
              unitId={unitId}
              unitLoadedHandler={handleUnitLoaded}
              isOriginalUserStaff={originalUserIsStaff}
              isEnabledOutlineSidebar={isEnabledOutlineSidebar}
            />
          </div>
        </div>
        <NotificationsDiscussionsSidebarSlot courseId={courseId} />
      </div>
      <SequenceContainerSlot courseId={courseId} unitId={unitId} />
    </>
  );

  if (sequenceStatus === 'loaded') {
    // Check if we're in test mode
    const isTestMode = checkTestModeFromURL(window.location.pathname);
    
    console.log('🔍 [Sequence] Test mode check:', {
      pathname: window.location.pathname,
      isTestMode: isTestMode,
      willRenderPersistentBar: !isTestMode
    });

    return (
      <div>
        {/* Persistent Navigation Bar - only render if NOT in test mode */}
        {!isTestMode && (
          <PersistentNavigationBar
            courseId={courseId}
            sequenceId={sequenceId}
            unitId={unitId}
            onClickPrevious={() => {
              logEvent('edx.ui.lms.sequence.previous_selected', 'persistent');
              handlePrevious();
            }}
            onClickNext={() => {
              logEvent('edx.ui.lms.sequence.next_selected', 'persistent');
              handleNext();
            }}
            isAtTop={false}
          />
        )}
        
        <SequenceExamWrapper
          sequence={sequence}
          courseId={courseId}
          isStaff={isStaff}
          originalUserIsStaff={originalUserIsStaff}
          canAccessProctoredExams={canAccessProctoredExams}
        >
          {defaultContent}
        </SequenceExamWrapper>

      </div>
    );
  }

  // sequence status 'failed' and any other unexpected sequence status.
  return (
    <p className="text-center py-5 mx-auto" style={{ maxWidth: '30em' }}>
      {intl.formatMessage(messages.loadFailure)}
    </p>
  );
};

Sequence.propTypes = {
  unitId: PropTypes.string,
  sequenceId: PropTypes.string,
  courseId: PropTypes.string.isRequired,
  unitNavigationHandler: PropTypes.func.isRequired,
  nextSequenceHandler: PropTypes.func.isRequired,
  previousSequenceHandler: PropTypes.func.isRequired,
};


export default Sequence;
