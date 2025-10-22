import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { defaultMemoize as memoize } from 'reselect';

import {
  checkBlockCompletion,
  fetchCourse,
  fetchSequence,
  getResumeBlock,
  getSequenceForUnitDeprecated,
  saveSequencePosition,
} from './data';
import { TabPage } from '../tab-page';

import Course from './course';
import { handleNextSectionCelebration } from './course/celebration';
import withParamsAndNavigation from './utils';
import { checkTestModeFromURL, getSequencesForTestSection, getCurrentTestSection } from '../custom-components/TestSeriesPage/utils/testSectionManager';

// Helper function to redirect to first unit in test mode
const redirectToFirstTestUnit = (courseId, testModeInfo, navigate, isPreview) => {
  console.log('🎯 [redirectToFirstTestUnit] Redirecting to first test unit:', testModeInfo);
  
  // Get test sequences for the current test section
  const testSequences = getSequencesForTestSection(testModeInfo.sectionId);
  
  if (testSequences && testSequences.length > 0) {
    // Find the first sequence in the test
    const firstTestSequence = testSequences[0];
    
    if (firstTestSequence && firstTestSequence.unitIds && firstTestSequence.unitIds.length > 0) {
      // Get the first unit (quiz) in the first test sequence
      const firstUnitId = firstTestSequence.unitIds[0];
      const baseUrl = `/course/${courseId}/${firstTestSequence.id}`;
      const sequenceUrl = isPreview ? `/preview${baseUrl}` : baseUrl;
      
      console.log('🎯 [redirectToFirstTestUnit] Redirecting to first quiz:', {
        testSequence: firstTestSequence.id,
        firstUnitId: firstUnitId,
        redirectUrl: `${sequenceUrl}/${firstUnitId}`
      });
      
      navigate(`${sequenceUrl}/${firstUnitId}`, { replace: true });
      return true;
    }
  }
  
  return false;
};

// Look at where this is called in componentDidUpdate for more info about its usage
export const checkResumeRedirect = memoize(
  (courseStatus, courseId, sequenceId, firstSequenceId, navigate, isPreview) => {
    if (courseStatus === 'loaded' && !sequenceId) {
      // Check if we're in test mode first
      const testModeInfo = checkTestModeFromURL(window.location.pathname);
      
      if (testModeInfo && testModeInfo.isTestMode) {
        console.log('🎯 [checkResumeRedirect] Test mode detected, redirecting to first quiz');
        
        // Try to redirect to first test unit
        const redirected = redirectToFirstTestUnit(courseId, testModeInfo, navigate, isPreview);
        
        if (!redirected) {
          // Fallback: if we can't find test sequences, just redirect to first sequence
          if (firstSequenceId) {
            console.log('🎯 [checkResumeRedirect] Test mode fallback: redirecting to first sequence');
            navigate(`/course/${courseId}/${firstSequenceId}`, { replace: true });
          }
        }
        return;
      }
      
      // Regular resume logic for non-test mode
      // Note that getResumeBlock is just an API call, not a redux thunk.
      getResumeBlock(courseId).then((data) => {
        // This is a replace because we don't want this change saved in the browser's history.
        if (data.sectionId && data.unitId) {
          const baseUrl = `/course/${courseId}/${data.sectionId}`;
          const sequenceUrl = isPreview ? `/preview${baseUrl}` : baseUrl;
          navigate(`${sequenceUrl}/${data.unitId}`, { replace: true });
        } else if (firstSequenceId) {
          navigate(`/course/${courseId}/${firstSequenceId}`, { replace: true });
        }
      }, () => {});
    }
  },
);

// Look at where this is called in componentDidUpdate for more info about its usage
export const checkSectionUnitToUnitRedirect = memoize((
  courseStatus,
  courseId,
  sequenceStatus,
  section,
  unitId,
  navigate,
  isPreview,
) => {
  if (courseStatus === 'loaded' && sequenceStatus === 'failed' && section && unitId) {
    const baseUrl = `/course/${courseId}`;
    const courseUrl = isPreview ? `/preview${baseUrl}` : baseUrl;
    navigate(`${courseUrl}/${unitId}`, { replace: true });
  }
});

// Look at where this is called in componentDidUpdate for more info about its usage
export const checkSectionToSequenceRedirect = memoize(
  (courseStatus, courseId, sequenceStatus, section, unitId, navigate) => {
    if (courseStatus === 'loaded' && sequenceStatus === 'failed' && section && !unitId) {
      // If the section is non-empty, redirect to its first sequence.
      if (section.sequenceIds && section.sequenceIds[0]) {
        navigate(`/course/${courseId}/${section.sequenceIds[0]}`, { replace: true });
      // Otherwise, just go to the course root, letting the resume redirect take care of things.
      } else {
        navigate(`/course/${courseId}`, { replace: true });
      }
    }
  },
);

// Look at where this is called in componentDidUpdate for more info about its usage
export const checkUnitToSequenceUnitRedirect = memoize((
  courseStatus,
  courseId,
  sequenceStatus,
  sequenceMightBeUnit,
  sequenceId,
  section,
  routeUnitId,
  navigate,
  isPreview,
) => {
  if (courseStatus === 'loaded' && sequenceStatus === 'failed' && !section && !routeUnitId) {
    if (sequenceMightBeUnit) {
      // If the sequence failed to load as a sequence, but it is marked as a possible unit, then
      // we need to look up the correct parent sequence for it, and redirect there.
      const unitId = sequenceId; // just for clarity during the rest of this method
      getSequenceForUnitDeprecated(courseId, unitId).then(
        parentId => {
          if (parentId) {
            const baseUrl = `/course/${courseId}/${parentId}`;
            const sequenceUrl = isPreview ? `/preview${baseUrl}` : baseUrl;
            navigate(`${sequenceUrl}/${unitId}`, { replace: true });
          } else {
            navigate(`/course/${courseId}`, { replace: true });
          }
        },
        () => { // error case
          navigate(`/course/${courseId}`, { replace: true });
        },
      );
    } else {
      // Invalid sequence that isn't a unit either. Redirect up to main course.
      navigate(`/course/${courseId}`, { replace: true });
    }
  }
});

// Look at where this is called in componentDidUpdate for more info about its usage
export const checkSequenceToSequenceUnitRedirect = memoize(
  (courseId, sequenceStatus, sequence, unitId, navigate, isPreview) => {
    if (sequenceStatus === 'loaded' && sequence.id && !unitId) {
      // Check if we're in test mode
      const testModeInfo = checkTestModeFromURL(window.location.pathname);
      
      if (testModeInfo && testModeInfo.isTestMode) {
        console.log('🎯 [checkSequenceToSequenceUnitRedirect] Test mode detected, redirecting to first quiz in sequence');
        
        if (sequence.unitIds !== undefined && sequence.unitIds.length > 0) {
          // In test mode, always go to the first unit (quiz) instead of active unit
          const firstUnitId = sequence.unitIds[0];
          const baseUrl = `/course/${courseId}/${sequence.id}`;
          const sequenceUrl = isPreview ? `/preview${baseUrl}` : baseUrl;
          
          console.log('🎯 [checkSequenceToSequenceUnitRedirect] Redirecting to first quiz in test sequence:', {
            sequenceId: sequence.id,
            firstUnitId: firstUnitId,
            redirectUrl: `${sequenceUrl}/${firstUnitId}`
          });
          
          // This is a replace because we don't want this change saved in the browser's history.
          navigate(`${sequenceUrl}/${firstUnitId}`, { replace: true });
        }
      } else {
        // Regular behavior for non-test mode
        if (sequence.unitIds !== undefined && sequence.unitIds.length > 0) {
          const baseUrl = `/course/${courseId}/${sequence.id}`;
          const sequenceUrl = isPreview ? `/preview${baseUrl}` : baseUrl;
          const nextUnitId = sequence.unitIds[sequence.activeUnitIndex];
          // This is a replace because we don't want this change saved in the browser's history.
          navigate(`${sequenceUrl}/${nextUnitId}`, { replace: true });
        }
      }
    }
  },
);

// Look at where this is called in componentDidUpdate for more info about its usage
export const checkSequenceUnitMarkerToSequenceUnitRedirect = memoize(
  (courseId, sequenceStatus, sequence, unitId, navigate, isPreview) => {
    if (sequenceStatus !== 'loaded' || !sequence.id) {
      return;
    }

    const baseUrl = `/course/${courseId}/${sequence.id}`;
    const hasUnits = sequence.unitIds?.length > 0;

    if (hasUnits) {
      const sequenceUrl = isPreview ? `/preview${baseUrl}` : baseUrl;
      if (unitId === 'first') {
        const firstUnitId = sequence.unitIds[0];
        navigate(`${sequenceUrl}/${firstUnitId}`, { replace: true });
      } else if (unitId === 'last') {
        const lastUnitId = sequence.unitIds[sequence.unitIds.length - 1];
        navigate(`${sequenceUrl}/${lastUnitId}`, { replace: true });
      }
    } else {
      // No units... go to general sequence page
      navigate(baseUrl, { replace: true });
    }
  },
);

class CoursewareContainer extends Component {
  checkSaveSequencePosition = memoize((unitId) => {
    const {
      courseId,
      sequenceId,
      sequenceStatus,
      sequence,
    } = this.props;
    if (sequenceStatus === 'loaded' && sequence.saveUnitPosition && unitId) {
      const activeUnitIndex = sequence.unitIds.indexOf(unitId);
      this.props.saveSequencePosition(courseId, sequenceId, activeUnitIndex);
    }
  });

  checkFetchCourse = memoize((courseId) => {
    this.props.fetchCourse(courseId);
  });

  checkFetchSequence = memoize((sequenceId) => {
    if (sequenceId) {
      this.props.fetchSequence(sequenceId, this.props.isPreview);
    }
  });

  componentDidMount() {
    const {
      routeCourseId,
      routeSequenceId,
    } = this.props;
    // Load data whenever the course or sequence ID changes.
    this.checkFetchCourse(routeCourseId);
    this.checkFetchSequence(routeSequenceId);
  }

  componentDidUpdate() {
    const {
      courseId,
      sequenceId,
      courseStatus,
      sequenceStatus,
      sequenceMightBeUnit,
      sequence,
      firstSequenceId,
      sectionViaSequenceId,
      routeCourseId,
      routeSequenceId,
      routeUnitId,
      navigate,
      isPreview,
    } = this.props;

    // Load data whenever the course or sequence ID changes.
    this.checkFetchCourse(routeCourseId);
    this.checkFetchSequence(routeSequenceId);

    // Check if we should save our sequence position.  Only do this when the route unit ID changes.
    this.checkSaveSequencePosition(routeUnitId);

    // Coerce the route ids into null here because they can be undefined, but the redux ids would be null instead.
    if (courseId !== (routeCourseId || null) || sequenceId !== (routeSequenceId || null)) {
      // The non-route ids are pulled from redux state - they are changed at the same time as the status variables.
      // But the route ids are pulled directly from the route. So if the route changes, and we start a fetch above,
      // there's a race condition where the route ids are for one course, but the status and the other ids are for a
      // different course. Since all the logic below depends on the status variables and the route unit id, we'll wait
      // until the ids match and thus the redux states got updated. So just bail for now.
      return;
    }

    // All courseware URLs should normalize to the format /course/:courseId/:sequenceId/:unitId
    // via the series of redirection rules below.
    // See docs/decisions/0008-liberal-courseware-path-handling.md for more context.
    // (It would be ideal to move this logic into the thunks layer and perform
    //  all URL-changing checks at once. See TNL-8182.)

    // Check resume redirect:
    //   /course/:courseId -> /course/:courseId/:sequenceId/:unitId
    // based on sequence/unit where user was last active.
    checkResumeRedirect(courseStatus, courseId, sequenceId, firstSequenceId, navigate, isPreview);

    // Check section-unit to unit redirect:
    //    /course/:courseId/:sectionId/:unitId -> /course/:courseId/:unitId
    // by simply ignoring the :sectionId.
    // (It may be desirable at some point to be smarter here; for example, we could replace
    //  :sectionId with the parent sequence of :unitId and/or check whether the :unitId
    //  is actually within :sectionId. However, the way our Redux store is currently factored,
    //  the unit's metadata is not available to us if the section isn't loadable.)
    // Before performing this redirect, we *do* still check that a section is loadable;
    // otherwise, we could get stuck in a redirect loop, since a sequence that failed to load
    // would endlessly redirect to itself through `checkSectionUnitToUnitRedirect`
    // and `checkUnitToSequenceUnitRedirect`.
    checkSectionUnitToUnitRedirect(
      courseStatus,
      courseId,
      sequenceStatus,
      sectionViaSequenceId,
      routeUnitId,
      navigate,
      isPreview,
    );

    // Check section to sequence redirect:
    //    /course/:courseId/:sectionId         -> /course/:courseId/:sequenceId
    // by redirecting to the first sequence within the section.
    checkSectionToSequenceRedirect(
      courseStatus,
      courseId,
      sequenceStatus,
      sectionViaSequenceId,
      routeUnitId,
      navigate,
    );

    // Check unit to sequence-unit redirect:
    //    /course/:courseId/:unitId -> /course/:courseId/:sequenceId/:unitId
    // by filling in the ID of the parent sequence of :unitId.
    checkUnitToSequenceUnitRedirect(
      courseStatus,
      courseId,
      sequenceStatus,
      sequenceMightBeUnit,
      sequenceId,
      sectionViaSequenceId,
      routeUnitId,
      navigate,
      isPreview,
    );

    // Check sequence to sequence-unit redirect:
    //    /course/:courseId/:sequenceId -> /course/:courseId/:sequenceId/:unitId
    // by filling in the ID the most-recently-active unit in the sequence, OR
    // the ID of the first unit the sequence if none is active.
    checkSequenceToSequenceUnitRedirect(
      courseId,
      sequenceStatus,
      sequence,
      routeUnitId,
      navigate,
      isPreview,
    );

    // Check sequence-unit marker to sequence-unit redirect:
    //    /course/:courseId/:sequenceId/first -> /course/:courseId/:sequenceId/:unitId
    //    /course/:courseId/:sequenceId/last -> /course/:courseId/:sequenceId/:unitId
    // by filling in the ID the first or last unit in the sequence.
    // "Sequence unit marker" is an invented term used only in this component.
    checkSequenceUnitMarkerToSequenceUnitRedirect(
      courseId,
      sequenceStatus,
      sequence,
      routeUnitId,
      navigate,
      isPreview,
    );
  }

  handleUnitNavigationClick = () => {
    const {
      courseId,
      sequenceId,
      routeUnitId,
    } = this.props;

    this.props.checkBlockCompletion(courseId, sequenceId, routeUnitId);
  };

  handleNextSequenceClick = () => {
    const {
      course,
      nextSequence,
      sequence,
      sequenceId,
    } = this.props;

    if (nextSequence !== null) {
      const celebrateFirstSection = course && course.celebrations && course.celebrations.firstSection;
      if (celebrateFirstSection && sequence.sectionId !== nextSequence.sectionId) {
        handleNextSectionCelebration(sequenceId, nextSequence.id);
      }
    }
  };

  handlePreviousSequenceClick = () => {};

  render() {
    const {
      courseStatus,
      courseId,
      sequenceId,
      routeUnitId,
    } = this.props;

    return (
      <TabPage
        activeTabSlug="courseware"
        courseId={courseId}
        unitId={routeUnitId}
        courseStatus={courseStatus}
        metadataModel="coursewareMeta"
      >
        <Course
          courseId={courseId}
          sequenceId={sequenceId}
          unitId={routeUnitId}
          nextSequenceHandler={this.handleNextSequenceClick}
          previousSequenceHandler={this.handlePreviousSequenceClick}
          unitNavigationHandler={this.handleUnitNavigationClick}
        />
      </TabPage>
    );
  }
}

const sequenceShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  unitIds: PropTypes.arrayOf(PropTypes.string),
  sectionId: PropTypes.string.isRequired,
  saveUnitPosition: PropTypes.any, // eslint-disable-line
});

const sectionShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  sequenceIds: PropTypes.arrayOf(PropTypes.string).isRequired,
});

const courseShape = PropTypes.shape({
  celebrations: PropTypes.shape({
    firstSection: PropTypes.bool,
  }),
});

CoursewareContainer.propTypes = {
  routeCourseId: PropTypes.string.isRequired,
  routeSequenceId: PropTypes.string,
  routeUnitId: PropTypes.string,
  courseId: PropTypes.string,
  sequenceId: PropTypes.string,
  firstSequenceId: PropTypes.string,
  courseStatus: PropTypes.oneOf(['loaded', 'loading', 'failed', 'denied']).isRequired,
  sequenceStatus: PropTypes.oneOf(['loaded', 'loading', 'failed']).isRequired,
  sequenceMightBeUnit: PropTypes.bool.isRequired,
  nextSequence: sequenceShape,
  previousSequence: sequenceShape,
  sectionViaSequenceId: sectionShape,
  course: courseShape,
  sequence: sequenceShape,
  saveSequencePosition: PropTypes.func.isRequired,
  checkBlockCompletion: PropTypes.func.isRequired,
  fetchCourse: PropTypes.func.isRequired,
  fetchSequence: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  isPreview: PropTypes.bool.isRequired,
};

CoursewareContainer.defaultProps = {
  courseId: null,
  sequenceId: null,
  routeSequenceId: null,
  routeUnitId: null,
  firstSequenceId: null,
  nextSequence: null,
  previousSequence: null,
  sectionViaSequenceId: null,
  course: null,
  sequence: null,
};

const currentCourseSelector = createSelector(
  (state) => state.models.coursewareMeta || {},
  (state) => state.courseware.courseId,
  (coursesById, courseId) => (coursesById[courseId] ? coursesById[courseId] : null),
);

const currentSequenceSelector = createSelector(
  (state) => state.models.sequences || {},
  (state) => state.courseware.sequenceId,
  (sequencesById, sequenceId) => (sequencesById[sequenceId] ? sequencesById[sequenceId] : null),
);

const sequenceIdsSelector = createSelector(
  (state) => state.courseware.courseStatus,
  currentCourseSelector,
  (state) => state.models.sections,
  (courseStatus, course, sectionsById) => {
    if (courseStatus !== 'loaded') {
      return [];
    }
    const { sectionIds = [] } = course;
    return sectionIds.flatMap(sectionId => sectionsById[sectionId].sequenceIds);
  },
);

const previousSequenceSelector = createSelector(
  sequenceIdsSelector,
  (state) => state.models.sequences || {},
  (state) => state.courseware.sequenceId,
  (sequenceIds, sequencesById, sequenceId) => {
    if (!sequenceId || sequenceIds.length === 0) {
      return null;
    }
    const sequenceIndex = sequenceIds.indexOf(sequenceId);
    const previousSequenceId = sequenceIndex > 0 ? sequenceIds[sequenceIndex - 1] : null;
    return previousSequenceId !== null ? sequencesById[previousSequenceId] : null;
  },
);

const nextSequenceSelector = createSelector(
  sequenceIdsSelector,
  (state) => state.models.sequences || {},
  (state) => state.courseware.sequenceId,
  (sequenceIds, sequencesById, sequenceId) => {
    if (!sequenceId || sequenceIds.length === 0) {
      return null;
    }
    const sequenceIndex = sequenceIds.indexOf(sequenceId);
    const nextSequenceId = sequenceIndex < sequenceIds.length - 1 ? sequenceIds[sequenceIndex + 1] : null;
    return nextSequenceId !== null ? sequencesById[nextSequenceId] : null;
  },
);

const firstSequenceIdSelector = createSelector(
  (state) => state.courseware.courseStatus,
  currentCourseSelector,
  (state) => state.models.sections || {},
  (courseStatus, course, sectionsById) => {
    if (courseStatus !== 'loaded') {
      return null;
    }
    const { sectionIds = [] } = course;

    if (sectionIds.length === 0) {
      return null;
    }

    return sectionsById[sectionIds[0]].sequenceIds[0];
  },
);

const sectionViaSequenceIdSelector = createSelector(
  (state) => state.models.sections || {},
  (state) => state.courseware.sequenceId,
  (sectionsById, sequenceId) => (sectionsById[sequenceId] ? sectionsById[sequenceId] : null),
);

const mapStateToProps = (state) => {
  const {
    courseId,
    sequenceId,
    courseStatus,
    sequenceStatus,
    sequenceMightBeUnit,
  } = state.courseware;

  return {
    courseId,
    sequenceId,
    courseStatus,
    sequenceStatus,
    sequenceMightBeUnit,
    course: currentCourseSelector(state),
    sequence: currentSequenceSelector(state),
    previousSequence: previousSequenceSelector(state),
    nextSequence: nextSequenceSelector(state),
    firstSequenceId: firstSequenceIdSelector(state),
    sectionViaSequenceId: sectionViaSequenceIdSelector(state),
  };
};

export default connect(mapStateToProps, {
  checkBlockCompletion,
  saveSequencePosition,
  fetchCourse,
  fetchSequence,
})(withParamsAndNavigation(CoursewareContainer));
