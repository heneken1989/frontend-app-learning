import { Factory } from 'rosie';
import MockAdapter from 'axios-mock-adapter';

import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';

import { FAILED, LOADING } from '@src/constants';
import * as thunks from './thunks';

import { appendBrowserTimezoneToUrl, executeThunk } from '../../utils';

import { buildSimpleCourseBlocks } from '../../shared/data/__factories__/courseBlocks.factory';
import { buildOutlineFromBlocks } from './__factories__/learningSequencesOutline.factory';
import { initializeMockApp } from '../../setupTest';
import initializeStore from '../../store';

const { loggingService } = initializeMockApp();

const axiosMock = new MockAdapter(getAuthenticatedHttpClient());

describe('Data layer integration tests', () => {
  const courseBaseUrl = `${getConfig().LMS_BASE_URL}/api/courseware/course`;
  const learningSequencesUrlRegExp = new RegExp(`${getConfig().LMS_BASE_URL}/api/learning_sequences/v1/course_outline/*`);
  const sequenceBaseUrl = `${getConfig().LMS_BASE_URL}/api/courseware/sequence`;

  // building minimum set of api responses to test all thunks
  const courseMetadata = Factory.build('courseMetadata');
  const courseId = courseMetadata.id;
  const courseHomeMetadata = Factory.build('courseHomeMetadata');
  const { courseBlocks, unitBlocks, sequenceBlocks } = buildSimpleCourseBlocks(courseId);
  const sequenceMetadata = Factory.build(
    'sequenceMetadata',
    {},
    { courseId, unitBlocks, sequenceBlock: sequenceBlocks[0] },
  );
  const simpleOutline = buildOutlineFromBlocks(courseBlocks);

  let courseUrl = `${courseBaseUrl}/${courseId}`;
  courseUrl = appendBrowserTimezoneToUrl(courseUrl);

  const courseHomeMetadataUrl = appendBrowserTimezoneToUrl(
    `${getConfig().LMS_BASE_URL}/api/course_home/course_metadata/${courseId}`,
  );
  const sequenceUrl = `${sequenceBaseUrl}/${sequenceMetadata.item_id}`;
  const sequenceId = sequenceBlocks[0].id;
  const unitId = unitBlocks[0].id;
  const coursewareSidebarSettingsUrl = `${getConfig().LMS_BASE_URL}/courses/${courseId}/courseware-navigation-sidebar/toggles/`;
  const courseNavigationUrl = `${getConfig().LMS_BASE_URL}/api/course_home/v1/navigation/${courseId}`;

  let store;

  beforeEach(() => {
    axiosMock.reset();
    loggingService.logError.mockReset();

    store = initializeStore();
  });

  describe('Test fetchCourse', () => {
    it('Should fail to fetch course and blocks if request error happens', async () => {
      axiosMock.onGet(courseUrl).networkError();
      axiosMock.onGet(learningSequencesUrlRegExp).networkError();
      axiosMock.onGet(coursewareSidebarSettingsUrl).networkError();

      await executeThunk(thunks.fetchCourse(courseId), store.dispatch);

      expect(loggingService.logError).toHaveBeenCalled();
      expect(store.getState().courseware).toEqual(expect.objectContaining({
        courseId,
        courseOutline: {},
        courseStatus: FAILED,
        coursewareOutlineSidebarSettings: {},
        courseOutlineStatus: LOADING,
        sequenceId: null,
        sequenceMightBeUnit: false,
        sequenceStatus: LOADING,
      }));
    });

    it('Should fetch, normalize, and save metadata, but with denied status', async () => {
      const forbiddenCourseMetadata = Factory.build('courseMetadata');
      const forbiddenCourseHomeMetadata = Factory.build('courseHomeMetadata', {
        course_access: {
          has_access: false,
        },
      });
      const forbiddenCourseHomeUrl = appendBrowserTimezoneToUrl(
        `${getConfig().LMS_BASE_URL}/api/course_home/course_metadata/${courseId}`,
      );
      const forbiddenCourseBlocks = Factory.build('courseBlocks', {
        courseId: forbiddenCourseMetadata.id,
      });
      let forbiddenCourseUrl = `${courseBaseUrl}/${forbiddenCourseMetadata.id}`;
      forbiddenCourseUrl = appendBrowserTimezoneToUrl(forbiddenCourseUrl);

      axiosMock.onGet(forbiddenCourseHomeUrl).reply(200, forbiddenCourseHomeMetadata);
      axiosMock.onGet(forbiddenCourseUrl).reply(200, forbiddenCourseMetadata);
      axiosMock.onGet(learningSequencesUrlRegExp).reply(200, buildOutlineFromBlocks(forbiddenCourseBlocks));

      await executeThunk(thunks.fetchCourse(forbiddenCourseMetadata.id), store.dispatch);

      const state = store.getState();

      expect(state.courseware.courseStatus).toEqual('denied');

      // check that at least one key camel cased, thus course data normalized
      expect(state.models.courseHomeMeta[forbiddenCourseMetadata.id].courseAccess).not.toBeUndefined();
    });

    it('Should fetch, normalize, and save metadata', async () => {
      axiosMock.onGet(courseHomeMetadataUrl).reply(200, courseHomeMetadata);
      axiosMock.onGet(courseUrl).reply(200, courseMetadata);
      axiosMock.onGet(learningSequencesUrlRegExp).reply(200, buildOutlineFromBlocks(courseBlocks));
      axiosMock.onGet(coursewareSidebarSettingsUrl).reply(200, {
        enable_navigation_sidebar: true,
        always_open_auxiliary_sidebar: true,
      });

      await executeThunk(thunks.fetchCourse(courseId), store.dispatch);

      const state = store.getState();

      expect(state.courseware.courseStatus).toEqual('loaded');
      expect(state.courseware.courseId).toEqual(courseId);
      expect(state.courseware.sequenceStatus).toEqual('loading');
      expect(state.courseware.sequenceId).toEqual(null);
      expect(state.courseware.coursewareOutlineSidebarSettings).toEqual({
        enableNavigationSidebar: true,
        alwaysOpenAuxiliarySidebar: true,
      });

      // check that at least one key camel cased, thus course data normalized
      expect(state.models.coursewareMeta[courseId].marketingUrl).not.toBeUndefined();
    });

    it('Should fetch, normalize, and save metadata; filtering has no effect', async () => {
      // Very similar to previous test, but pass back an outline for filtering
      // (even though it won't actually filter down in this case).
      axiosMock.onGet(courseHomeMetadataUrl).reply(200, courseHomeMetadata);
      axiosMock.onGet(courseUrl).reply(200, courseMetadata);
      axiosMock.onGet(learningSequencesUrlRegExp).reply(200, simpleOutline);
      axiosMock.onGet(coursewareSidebarSettingsUrl).reply(200, {
        enable_navigation_sidebar: false,
        always_open_auxiliary_sidebar: false,
      });

      await executeThunk(thunks.fetchCourse(courseId), store.dispatch);

      const state = store.getState();

      expect(state.courseware.courseStatus).toEqual('loaded');
      expect(state.courseware.courseId).toEqual(courseId);
      expect(state.courseware.sequenceStatus).toEqual('loading');
      expect(state.courseware.sequenceId).toEqual(null);
      expect(state.courseware.coursewareOutlineSidebarSettings).toEqual({
        enableNavigationSidebar: false,
        alwaysOpenAuxiliarySidebar: false,
      });

      // check that at least one key camel cased, thus course data normalized
      expect(state.models.coursewareMeta[courseId].marketingUrl).not.toBeUndefined();
      expect(state.models.sequences.length === 1);

      Object.values(state.models.sections).forEach(section => expect(section.sequenceIds.length === 1));
    });

    it('Should fetch, normalize, and save metadata; filtering removes sequence', async () => {
      // Very similar to previous test, but pass back an outline for filtering
      // (even though it won't actually filter down in this case).
      axiosMock.onGet(courseHomeMetadataUrl).reply(200, courseHomeMetadata);
      axiosMock.onGet(courseUrl).reply(200, courseMetadata);

      // Create an outline with basic matching metadata, but then empty it out...
      const emptyOutline = buildOutlineFromBlocks(courseBlocks);
      emptyOutline.sequences = {};
      emptyOutline.sections = [];
      axiosMock.onGet(learningSequencesUrlRegExp).reply(200, emptyOutline);
      await executeThunk(thunks.fetchCourse(courseId), store.dispatch);

      const state = store.getState();

      expect(state.courseware.courseStatus).toEqual('loaded');
      expect(state.courseware.courseId).toEqual(courseId);
      expect(state.courseware.sequenceStatus).toEqual('loading');
      expect(state.courseware.sequenceId).toEqual(null);

      // check that at least one key camel cased, thus course data normalized
      expect(state.models.coursewareMeta[courseId].marketingUrl).not.toBeUndefined();
      expect(state.models.sequences === null);

      Object.values(state.models.sections).forEach(section => expect(section.sequenceIds.length === 0));
    });
  });

  describe('Test fetchSequence', () => {
    it('Should result in fetch failure if navigation outline request fails', async () => {
      axiosMock.onGet(learningSequencesUrlRegExp).reply(200, simpleOutline);
      axiosMock.onGet(coursewareSidebarSettingsUrl).reply(200, { enable_navigation_sidebar: true });
      axiosMock.onGet(courseNavigationUrl).networkError();

      await executeThunk(thunks.fetchCourse(courseId), store.dispatch);
      await executeThunk(thunks.fetchSequence(sequenceId), store.dispatch, store.getState);

      expect(store.getState().courseware.sequenceStatus).toEqual('failed');
    });

    it('Should treat a unit id as sequenceMightBeUnit when not found in outline sequences', async () => {
      axiosMock.onGet(learningSequencesUrlRegExp).reply(200, simpleOutline);
      axiosMock.onGet(coursewareSidebarSettingsUrl).reply(200, { enable_navigation_sidebar: true });
      axiosMock.onGet(courseNavigationUrl).reply(200, { blocks: courseBlocks.blocks });

      await executeThunk(thunks.fetchCourse(courseId), store.dispatch);
      await executeThunk(thunks.fetchSequence(unitId), store.dispatch, store.getState);

      expect(store.getState().courseware.sequenceStatus).toEqual('failed');
      expect(store.getState().courseware.sequenceMightBeUnit).toEqual(true);
    });

    it('Should hydrate sequence models from navigation outline without the heavy sequence API', async () => {
      axiosMock.onGet(learningSequencesUrlRegExp).reply(200, simpleOutline);
      axiosMock.onGet(coursewareSidebarSettingsUrl).reply(200, { enable_navigation_sidebar: true });
      axiosMock.onGet(courseNavigationUrl).reply(200, { blocks: courseBlocks.blocks });

      await executeThunk(thunks.fetchCourse(courseId), store.dispatch);

      let state = store.getState();
      expect(state.models.sequences).toEqual({
        [sequenceId]: expect.not.objectContaining({
          gatedContent: expect.any(Object),
          activeUnitIndex: expect.any(Number),
        }),
      });

      state = store.getState();
      expect(state.courseware.courseStatus).toEqual('loaded');
      expect(state.courseware.courseId).toEqual(courseId);
      expect(state.courseware.sequenceStatus).toEqual('loading');
      expect(state.courseware.sequenceId).toEqual(null);

      await executeThunk(thunks.fetchSequence(sequenceId), store.dispatch, store.getState);

      state = store.getState();
      expect(state.models.sequences).toEqual({
        [sequenceId]: expect.objectContaining({
          gatedContent: expect.objectContaining({ gated: false }),
          activeUnitIndex: expect.any(Number),
          unitIds: expect.arrayContaining([unitId]),
        }),
      });
      expect(state.models.units).toEqual({
        [unitId]: expect.objectContaining({
          complete: expect.any(Boolean),
          bookmarked: false,
        }),
      });

      expect(state.courseware.courseStatus).toEqual('loaded');
      expect(state.courseware.courseId).toEqual(courseId);
      expect(state.courseware.sequenceStatus).toEqual('loaded');
      expect(state.courseware.sequenceId).toEqual(sequenceId);
      expect(axiosMock.history.get.find((req) => req.url === sequenceUrl)).toBeUndefined();
    });
  });

  describe('Thunks that require fetched sequences', () => {
    beforeEach(async () => {
      // thunks tested in this block rely on fact, that store already has
      // some info about sequence
      axiosMock.onGet(learningSequencesUrlRegExp).reply(200, simpleOutline);
      axiosMock.onGet(coursewareSidebarSettingsUrl).reply(200, { enable_navigation_sidebar: true });
      axiosMock.onGet(courseNavigationUrl).reply(200, { blocks: courseBlocks.blocks });
      await executeThunk(thunks.fetchCourse(courseId), store.dispatch);
      await executeThunk(thunks.fetchSequence(sequenceMetadata.item_id), store.dispatch, store.getState);
    });

    describe('Test checkBlockCompletion', () => {
      const getCourseOutlineURL = `${getConfig().LMS_BASE_URL}/api/course_home/v1/navigation/${courseId}`;
      const getCompletionURL = `${getConfig().LMS_BASE_URL}/courses/${courseId}/xblock/${sequenceId}/handler/get_completion`;

      it('Should fail to check completion and log error', async () => {
        axiosMock.onPost(getCompletionURL).networkError();
        axiosMock.onGet(getCourseOutlineURL).networkError();

        await executeThunk(
          thunks.checkBlockCompletion(courseId, sequenceId, unitId),
          store.dispatch,
          store.getState,
        );
        await executeThunk(
          thunks.getCourseOutlineStructure(courseId, sequenceId, unitId),
          store.dispatch,
          store.getState,
        );

        expect(loggingService.logError).toHaveBeenCalled();
        expect(axiosMock.history.post[0].url).toEqual(getCompletionURL);
      });

      it('Should update complete field of unit model and course outline', async () => {
        axiosMock.onPost(getCompletionURL).reply(201, { complete: true });
        axiosMock.onGet(getCourseOutlineURL).reply(201, {
          ...courseBlocks,
          ...sequenceBlocks,
          ...unitBlocks,
        });

        await executeThunk(thunks.getCourseOutlineStructure(courseId), store.dispatch, store.getState);

        const [unit] = Object.values(store.getState().courseware.courseOutline.units);
        const [sequence] = Object.values(store.getState().courseware.courseOutline.sequences);
        const [section] = Object.values(store.getState().courseware.courseOutline.sections);

        expect(unit.complete).not.toBeTruthy();
        expect(sequence.complete).not.toBeTruthy();
        expect(section.complete).not.toBeTruthy();

        await executeThunk(thunks.checkBlockCompletion(courseId, sequenceId, unit.id), store.dispatch, store.getState);

        expect(store.getState().models.units[unit.id].complete).toBeTruthy();
        expect(store.getState().courseware.courseOutline.units[unit.id].complete).toBeTruthy();
        expect(store.getState().courseware.courseOutline.sequences[sequence.id].complete).toBeTruthy();
        expect(store.getState().courseware.courseOutline.sections[section.id].complete).toBeTruthy();
      });

      it('Shouldn\'t update complete field if complete is false', async () => {
        axiosMock.onPost(getCompletionURL).reply(201, { complete: false });
        axiosMock.onGet(getCourseOutlineURL).reply(201, {
          ...courseBlocks,
          ...sequenceBlocks,
          ...unitBlocks,
        });

        await executeThunk(thunks.getCourseOutlineStructure(courseId), store.dispatch, store.getState);

        const [unit] = Object.values(store.getState().courseware.courseOutline.units);
        const [sequence] = Object.values(store.getState().courseware.courseOutline.sequences);
        const [section] = Object.values(store.getState().courseware.courseOutline.sections);

        await executeThunk(thunks.checkBlockCompletion(courseId, sequenceId, unit.id), store.dispatch, store.getState);

        expect(store.getState().models.units[unit.id].complete).not.toBeTruthy();
        expect(store.getState().courseware.courseOutline.units[unit.id].complete).not.toBeTruthy();
        expect(store.getState().courseware.courseOutline.sequences[sequence.id].complete).not.toBeTruthy();
        expect(store.getState().courseware.courseOutline.sections[section.id].complete).not.toBeTruthy();
      });
    });

    describe('Test saveSequencePosition', () => {
      const gotoPositionURL = `${getConfig().LMS_BASE_URL}/courses/${courseId}/xblock/${sequenceId}/handler/goto_position`;

      beforeEach(async () => {
        axiosMock.onGet(learningSequencesUrlRegExp).reply(200, simpleOutline);
        axiosMock.onGet(coursewareSidebarSettingsUrl).reply(200, { enable_navigation_sidebar: true });
        axiosMock.onGet(courseNavigationUrl).reply(200, { blocks: courseBlocks.blocks });
        await executeThunk(thunks.fetchCourse(courseId), store.dispatch);
        await executeThunk(thunks.fetchSequence(sequenceId), store.dispatch, store.getState);
      });

      it('Should change and revert sequence model activeUnitIndex in case of error', async () => {
        axiosMock.onPost(gotoPositionURL).networkError();

        const oldPosition = store.getState().models.sequences[sequenceId].activeUnitIndex;
        const newPosition = oldPosition + 1;

        await executeThunk(
          thunks.saveSequencePosition(courseId, sequenceId, newPosition),
          store.dispatch,
          store.getState,
        );

        expect(axiosMock.history.post[0].url).toEqual(gotoPositionURL);
        expect(store.getState().models.sequences[sequenceId].activeUnitIndex).toEqual(oldPosition);
      });

      it('Should update sequence model activeUnitIndex', async () => {
        axiosMock.onPost(gotoPositionURL).reply(201, {});

        const oldPosition = store.getState().models.sequences[sequenceId].activeUnitIndex;
        const newPosition = oldPosition + 1;

        await executeThunk(
          thunks.saveSequencePosition(courseId, sequenceId, newPosition),
          store.dispatch,
          store.getState,
        );

        expect(axiosMock.history.post[0].url).toEqual(gotoPositionURL);
        expect(store.getState().models.sequences[sequenceId].activeUnitIndex).toEqual(newPosition);
      });

      it('Should skip the API call when the position is unchanged', async () => {
        const currentPosition = store.getState().models.sequences[sequenceId].activeUnitIndex;

        await executeThunk(
          thunks.saveSequencePosition(courseId, sequenceId, currentPosition),
          store.dispatch,
          store.getState,
        );

        expect(axiosMock.history.post).toHaveLength(0);
      });
    });
  });

  describe('test saveIntegritySignature', () => {
    it('Should update userNeedsIntegritySignature upon success', async () => {
      const courseMetadataNeedSignature = Factory.build('courseMetadata', {
        user_needs_integrity_signature: true,
      });

      let courseUrlNeedSignature = `${courseBaseUrl}/${courseMetadataNeedSignature.id}`;
      courseUrlNeedSignature = appendBrowserTimezoneToUrl(courseUrlNeedSignature);

      axiosMock.onGet(courseUrlNeedSignature).reply(200, courseMetadataNeedSignature);

      await executeThunk(thunks.fetchCourse(courseMetadataNeedSignature.id), store.dispatch);
      expect(
        store.getState().models.coursewareMeta[courseMetadataNeedSignature.id].userNeedsIntegritySignature,
      ).toEqual(true);

      const integritySignatureUrl = `${getConfig().LMS_BASE_URL}/api/agreements/v1/integrity_signature/${courseMetadataNeedSignature.id}`;
      axiosMock.onPost(integritySignatureUrl).reply(200, {});
      await executeThunk(
        thunks.saveIntegritySignature(courseMetadataNeedSignature.id),
        store.dispatch,
        store.getState,
      );
      expect(
        store.getState().models.coursewareMeta[courseMetadataNeedSignature.id].userNeedsIntegritySignature,
      ).toEqual(false);
    });
  });
});
