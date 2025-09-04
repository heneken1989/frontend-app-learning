import { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { sendTrackEvent, sendTrackingLogEvent } from '@edx/frontend-platform/analytics';

import { useModel } from '@src/generic/model-store';
import { LOADED } from '@src/constants';
import { checkBlockCompletion, getCourseOutlineStructure } from '@src/courseware/data/thunks';
import OldSidebarContext from '@src/courseware/course/sidebar/SidebarContext';
import NewSidebarContext from '@src/courseware/course/new-sidebar/SidebarContext';
import {
  getCoursewareOutlineSidebarSettings,
  getCourseOutlineShouldUpdate,
  getCourseOutlineStatus,
  getSequenceId,
  getCourseOutline,
  getSequenceStatus,
} from '@src/courseware/data/selectors';
import { ID } from './constants';

// eslint-disable-next-line import/prefer-default-export
export const useCourseOutlineSidebar = () => {
  const dispatch = useDispatch();
  const isCollapsedOutlineSidebar = window.sessionStorage.getItem('hideCourseOutlineSidebar');
  const { enableNavigationSidebar: isEnabledSidebar } = useSelector(getCoursewareOutlineSidebarSettings);
  const courseOutlineShouldUpdate = useSelector(getCourseOutlineShouldUpdate);
  const courseOutlineStatus = useSelector(getCourseOutlineStatus);
  const sequenceStatus = useSelector(getSequenceStatus);
  const activeSequenceId = useSelector(getSequenceId);
  const { sections = {}, sequences = {}, units = {} } = useSelector(getCourseOutline);

  const { courseId } = useParams();
  const course = useModel('coursewareMeta', courseId);
  const { isNewDiscussionSidebarViewEnabled } = useModel('courseHomeMeta', courseId);
  const SidebarContext = isNewDiscussionSidebarViewEnabled ? NewSidebarContext : OldSidebarContext;

  const {
    unitId,
    initialSidebar,
    currentSidebar,
    toggleSidebar,
    shouldDisplayFullScreen,
  } = useContext(SidebarContext);

  const isOpenSidebar = !initialSidebar && isEnabledSidebar && !isCollapsedOutlineSidebar;
  const [isOpen, setIsOpen] = useState(true);

  const {
    entranceExamEnabled,
    entranceExamPassed,
  } = course.entranceExamData || {};
  const isActiveEntranceExam = entranceExamEnabled && !entranceExamPassed;

  const handleToggleCollapse = () => {
    if (currentSidebar === ID) {
      toggleSidebar(null);
      window.sessionStorage.setItem('hideCourseOutlineSidebar', 'true');
    } else {
      toggleSidebar(ID);
      window.sessionStorage.removeItem('hideCourseOutlineSidebar');
    }
  };

  const handleUnitClick = ({ sequenceId, activeUnitId, id }) => {
    const logEvent = (eventName, widgetPlacement) => {
      const findSequenceByUnitId = () => Object.values(sequences).find(seq => seq.unitIds.includes(activeUnitId));
      const activeSequence = findSequenceByUnitId(activeUnitId);
      const targetSequence = findSequenceByUnitId(id);
      const payload = {
        id: activeUnitId,
        current_tab: activeSequence.unitIds.indexOf(activeUnitId) + 1,
        tab_count: activeSequence.unitIds.length,
        target_id: id,
        target_tab: targetSequence.unitIds.indexOf(id) + 1,
        widget_placement: widgetPlacement,
      };

      if (activeSequence.id !== targetSequence.id) {
        payload.target_tab_count = targetSequence.unitIds.length;
      }

      sendTrackEvent(eventName, payload);
      sendTrackingLogEvent(eventName, payload);
    };

    logEvent('edx.ui.lms.sequence.tab_selected', 'left');
    dispatch(checkBlockCompletion(courseId, sequenceId, activeUnitId));

    // Hide the sidebar after selecting a unit on a mobile device.
    if (shouldDisplayFullScreen) {
      handleToggleCollapse();
    }
  };

  useEffect(() => {
    console.log('🔄 [CourseOutlineSidebar] useEffect triggered:', {
      isEnabledSidebar,
      courseOutlineStatus,
      courseOutlineShouldUpdate,
      courseId,
      timestamp: new Date().toISOString()
    });
    
    if ((isEnabledSidebar && courseOutlineStatus !== LOADED) || courseOutlineShouldUpdate) {
      console.log('📡 [CourseOutlineSidebar] Dispatching getCourseOutlineStructure for courseId:', courseId);
      dispatch(getCourseOutlineStructure(courseId));
    } else {
      console.log('⏭️ [CourseOutlineSidebar] Skipping API call - conditions not met');
      
      // Force refresh if we have sequences but some have 0 units (potential cache issue)
      if (sequences && Object.keys(sequences).length > 0) {
        const hasEmptySequences = Object.values(sequences).some(seq => 
          seq.unitIds && seq.unitIds.length === 0 && seq.title && seq.title.includes('ID')
        );
        
        if (hasEmptySequences) {
          console.log('🔄 [CourseOutlineSidebar] Force refresh - detected empty sequences, likely cache issue');
          dispatch(getCourseOutlineStructure(courseId));
        }
      }
    }
  }, [courseId, isEnabledSidebar, courseOutlineShouldUpdate]);

  useEffect(() => {
    if (isOpenSidebar && currentSidebar !== ID) {
      toggleSidebar(ID);
    }
  }, [initialSidebar, unitId]);

  return {
    courseId,
    unitId,
    currentSidebar,
    shouldDisplayFullScreen,
    isEnabledSidebar,
    isOpen,
    setIsOpen,
    handleToggleCollapse,
    isActiveEntranceExam,
    courseOutlineStatus,
    activeSequenceId,
    sections,
    sequences,
    units,
    handleUnitClick,
    sequenceStatus,
  };
};
