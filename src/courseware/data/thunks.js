import { logInfo } from '@edx/frontend-platform/logging';
import { getCourseHomeCourseMetadata } from '../../course-home/data/api';
import {
  addModel, addModelsMap, updateModel, updateModels, updateModelsMap,
} from '../../generic/model-store';
import {
  getBlockCompletion,
  getCourseDiscussionConfig,
  getCourseMetadata,
  getCourseOutline,
  getCourseTopics,
  getCoursewareOutlineSidebarToggles,
  getLearningSequencesOutline,
  getSequenceMetadata,
  postIntegritySignature,
  postSequencePosition,
} from './api';
import {
  fetchCourseDenied,
  fetchCourseFailure,
  fetchCourseRequest,
  fetchCourseSuccess,
  fetchSequenceFailure,
  fetchSequenceRequest,
  fetchSequenceSuccess,
  fetchCourseOutlineRequest,
  fetchCourseOutlineSuccess,
  fetchCourseOutlineFailure,
  setCoursewareOutlineSidebarToggles,
  updateCourseOutlineCompletion,
} from './slice';

// Lazy fetch course metadata - only fetch when actually needed
let metadataFetchPromises = {};
export function fetchCourseMetadataLazy(courseId) {
  return async (dispatch, getState) => {
    // Check if already cached
    const state = getState();
    if (state && state.models?.coursewareMeta?.[courseId]) {
      return; // Already loaded
    }
    
    // Check if already fetching
    if (metadataFetchPromises[courseId]) {
      return metadataFetchPromises[courseId];
    }
    
    // Start fetch
    metadataFetchPromises[courseId] = getCourseMetadata(courseId).then((metadata) => {
      dispatch(addModel({
        modelType: 'coursewareMeta',
        model: metadata,
      }));
      delete metadataFetchPromises[courseId];
      return metadata;
    }).catch((error) => {
      delete metadataFetchPromises[courseId];
      console.warn('Failed to fetch course metadata (lazy):', error);
      throw error;
    });
    
    return metadataFetchPromises[courseId];
  };
}

export function fetchCourse(courseId) {
  return async (dispatch) => {
    dispatch(fetchCourseRequest({ courseId }));
    
    // DO NOT fetch course metadata here - it's not needed for quiz rendering
    // Metadata will be fetched lazily when components actually need it
    // This saves ~1.3s on initial load
    
    // DO NOT fetch courseHomeMetadata here - backend APIs will handle access control
    // If user doesn't have access, backend will return 403 which we handle below
    // This saves additional load time
    
    // Fetch only critical APIs needed for quiz rendering
    Promise.allSettled([
      getLearningSequencesOutline(courseId),
      getCoursewareOutlineSidebarToggles(courseId),
    ]).then(([
      learningSequencesOutlineResult,
      coursewareOutlineSidebarTogglesResult]) => {
      const fetchedOutline = learningSequencesOutlineResult.status === 'fulfilled';
      const fetchedCoursewareOutlineSidebarTogglesResult = coursewareOutlineSidebarTogglesResult.status === 'fulfilled';

      if (fetchedOutline) {
        const {
          courses, sections, sequences,
        } = learningSequencesOutlineResult.value;

        // This updates the course with a sectionIds array from the Learning Sequence data.
        dispatch(updateModelsMap({
          modelType: 'coursewareMeta',
          modelsMap: courses,
        }));
        dispatch(addModelsMap({
          modelType: 'sections',
          modelsMap: sections,
        }));
        // We update for sequences because the sequence metadata may have come back first.
        dispatch(updateModelsMap({
          modelType: 'sequences',
          modelsMap: sequences,
        }));
      }

      if (fetchedCoursewareOutlineSidebarTogglesResult) {
        const {
          enable_navigation_sidebar: enableNavigationSidebar,
          always_open_auxiliary_sidebar: alwaysOpenAuxiliarySidebar,
        } = coursewareOutlineSidebarTogglesResult.value;
        dispatch(setCoursewareOutlineSidebarToggles({ enableNavigationSidebar, alwaysOpenAuxiliarySidebar }));
      }

      // Handle access control - backend APIs will return 403 if user doesn't have access
      if (!fetchedOutline) {
        const { response } = learningSequencesOutlineResult.reason;
        if (response && response.status === 403) {
          // 403 responses mean user doesn't have access - backend handles access control
          logInfo(learningSequencesOutlineResult.reason);
          dispatch(fetchCourseDenied({ courseId }));
          return;
        } else {
          // Other errors
          dispatch(fetchCourseFailure({ courseId }));
          return;
        }
      }
      
      if (!fetchedCoursewareOutlineSidebarTogglesResult) {
        // Toggle fetch failure is not critical - continue anyway
      }
      
      // If we got here, outline was fetched successfully, so user has access
      // Allow quiz to render immediately
      dispatch(fetchCourseSuccess({ courseId }));
    });
  };
}

export function fetchSequence(sequenceId, isPreview) {
  return async (dispatch) => {
    dispatch(fetchSequenceRequest({ sequenceId }));
    try {
      const { sequence, units } = await getSequenceMetadata(sequenceId, { preview: isPreview ? '1' : '0' });
      if (sequence.blockType !== 'sequential') {
        // Some other block types (particularly 'chapter') can be returned
        // by this API. We want to error in that case, since downstream
        // courseware code is written to render Sequences of Units.
        dispatch(fetchSequenceFailure({ sequenceId }));
      } else {
        dispatch(updateModel({
          modelType: 'sequences',
          model: sequence,
        }));
        dispatch(updateModels({
          modelType: 'units',
          models: units,
        }));
        dispatch(fetchSequenceSuccess({ sequenceId }));
      }
    } catch (error) {
      // Some errors are expected - for example, CoursewareContainer may request sequence metadata for a unit and rely
      // on the request failing to notice that it actually does have a unit (mostly so it doesn't have to know anything
      // about the opaque key structure). In such cases, the backend gives us a 422.
      const sequenceMightBeUnit = error?.response?.status === 422;
      if (!sequenceMightBeUnit) {
      }
      dispatch(fetchSequenceFailure({ sequenceId, sequenceMightBeUnit }));
    }
  };
}

export function checkBlockCompletion(courseId, sequenceId, unitId) {
  return async (dispatch, getState) => {
    const { models } = getState();
    if (models.units[unitId]?.complete) {
      return {}; // do nothing. Things don't get uncompleted after they are completed.
    }

    try {
      const isComplete = await getBlockCompletion(courseId, sequenceId, unitId);
      dispatch(updateModel({
        modelType: 'units',
        model: {
          id: unitId,
          complete: isComplete,
        },
      }));
      dispatch(updateCourseOutlineCompletion({ sequenceId, unitId, isComplete }));
      return isComplete;
    } catch (error) {
    }
    return {};
  };
}

export function saveSequencePosition(courseId, sequenceId, activeUnitIndex) {
  return async (dispatch, getState) => {
    const { models } = getState();
    const initialActiveUnitIndex = models.sequences[sequenceId].activeUnitIndex;
    // Optimistically update the position.
    dispatch(updateModel({
      modelType: 'sequences',
      model: {
        id: sequenceId,
        activeUnitIndex,
      },
    }));
    try {
      await postSequencePosition(courseId, sequenceId, activeUnitIndex);
      // Update again under the assumption that the above call succeeded, since it doesn't return a
      // meaningful response.
      dispatch(updateModel({
        modelType: 'sequences',
        model: {
          id: sequenceId,
          activeUnitIndex,
        },
      }));
    } catch (error) {
      dispatch(updateModel({
        modelType: 'sequences',
        model: {
          id: sequenceId,
          activeUnitIndex: initialActiveUnitIndex,
        },
      }));
    }
  };
}

export function saveIntegritySignature(courseId, isMasquerading) {
  return async (dispatch) => {
    try {
      // If the request is made by a staff user masquerading as a specific learner,
      // don't actually create a signature for them on the backend,
      // only the modal dialog will be dismissed
      if (!isMasquerading) {
        await postIntegritySignature(courseId);
      }
      dispatch(updateModel({
        modelType: 'coursewareMeta',
        model: {
          id: courseId,
          userNeedsIntegritySignature: false,
        },
      }));
    } catch (error) {
    }
  };
}

export function getCourseDiscussionTopics(courseId) {
  return async (dispatch) => {
    try {
      const config = await getCourseDiscussionConfig(courseId);
      // Only load topics for the openedx provider, the legacy provider uses
      // the xblock
      if (config.provider === 'openedx') {
        const topics = await getCourseTopics(courseId);
        dispatch(updateModels({
          modelType: 'discussionTopics',
          models: topics.filter(topic => topic.usageKey),
          idField: 'usageKey',
        }));
      }
    } catch (error) {
    }
  };
}

export function getCourseOutlineStructure(courseId) {
  return async (dispatch) => {
    dispatch(fetchCourseOutlineRequest());
    try {
      const courseOutline = await getCourseOutline(courseId);
      dispatch(fetchCourseOutlineSuccess({ courseOutline }));
    } catch (error) {
      dispatch(fetchCourseOutlineFailure());
    }
  };
}

