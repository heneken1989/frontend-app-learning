import React from 'react';

import { StrictDict, useKeyedState } from '@edx/react-unit-test-utils/dist';
import { useModel } from '@src/generic/model-store';

import { modelKeys } from '../constants';

export const stateKeys = StrictDict({
  shouldDisplay: 'shouldDisplay',
});

/**
 * @return {bool} should the honor code be displayed?
 */
const useShouldDisplayHonorCode = ({ id, courseId }) => {
  const [shouldDisplay, setShouldDisplay] = useKeyedState(stateKeys.shouldDisplay, false);

  const unit = useModel(modelKeys.units, id);
  const meta = useModel(modelKeys.coursewareMeta, courseId);
  // Safe check: metadata may be loading in background (non-blocking)
  const graded = unit?.graded;
  const userNeedsIntegritySignature = meta?.userNeedsIntegritySignature;

  React.useEffect(() => {
    setShouldDisplay(userNeedsIntegritySignature && graded);
  }, [setShouldDisplay, userNeedsIntegritySignature, graded]);

  return shouldDisplay;
};

export default useShouldDisplayHonorCode;
