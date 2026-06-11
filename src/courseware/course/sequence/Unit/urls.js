import { getConfig } from '@edx/frontend-platform';
import { stringifyUrl } from 'query-string';

export const iframeParams = {
  show_title: 0,
  show_bookmark: 0,
  recheck_access: 1,
};

export const getIFrameUrl = ({
  id,
  view,
  format,
  examAccess,
  jumpToId,
  preview,
}) => {
  const xblockUrl = `${getConfig().LMS_BASE_URL}/xblock/${id}`;
  return stringifyUrl({
    url: xblockUrl,
    query: {
      ...iframeParams,
      view,
      preview,
      ...(format && { format }),
      ...(!examAccess.blockAccess && { exam_access: examAccess.accessToken }),
      jumpToId, // Pass jumpToId as query param as fragmentIdentifier is not passed to server.
    },
    fragmentIdentifier: jumpToId, // this is used by browser to scroll to correct block.
  });
};

const unitDataCache = {};
const unitDataInFlight = {};

export const fetchUnitById = (unitId) => {
  if (unitDataCache[unitId]) {
    return Promise.resolve(unitDataCache[unitId]);
  }

  if (unitDataInFlight[unitId]) {
    return unitDataInFlight[unitId];
  }

  unitDataInFlight[unitId] = fetch(`${getConfig().LMS_BASE_URL}/api/courseware/v1/units/${unitId}/`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch unit data');
      }
      return response.json();
    })
    .then((data) => {
      unitDataCache[unitId] = data;
      delete unitDataInFlight[unitId];
      return data;
    })
    .catch((error) => {
      delete unitDataInFlight[unitId];
      throw new Error(`Error fetching unit: ${error.message}`);
    });

  return unitDataInFlight[unitId];
};

export const fetchAllCourses = () => fetch(`${getConfig().LMS_BASE_URL}/api/all_courses/`)
  .then((response) => {
    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }
    return response.json();
  })
  .catch((error) => {
    throw new Error(`Error fetching courses: ${error.message}`);
  });

export const fetchSectionsByCourseId = (courseId) => {
  return fetch(`${getConfig().LMS_BASE_URL}/api/all_courses/${courseId}/sections/`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch sections');
      }
      return response.json();
    })
    .catch((error) => {
      throw new Error(`Error fetching sections: ${error.message}`);
    });
};

export const fetchSequencesBySectionId = (sectionId) => {
  return fetch(`${getConfig().LMS_BASE_URL}/api/sections/${encodeURIComponent(sectionId)}/sequences/`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch sequences');
      }
      return response.json();
    })
    .catch((error) => {
      throw new Error(`Error fetching sequences: ${error.message}`);
    });
};

export const fetchUnitsBySequenceId = (sequenceId) => {
  return fetch(`${getConfig().LMS_BASE_URL}/api/sequences/${encodeURIComponent(sequenceId)}/units/`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch units');
      }
      return response.json();
    })
    .catch((error) => {
      throw new Error(`Error fetching units: ${error.message}`);
    });
};

export default {
  getIFrameUrl,
  fetchUnitById,
  fetchAllCourses,
  fetchSectionsByCourseId,
  fetchSequencesBySectionId,
  fetchUnitsBySequenceId,
};
