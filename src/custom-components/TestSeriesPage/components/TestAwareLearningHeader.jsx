import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import LearningHeader from '../../Header/src/learning-header/LearningHeader';
import useTestDetection from '../hooks/useTestDetection';

/**
 * Wrapper component that automatically detects test mode and configures LearningHeader accordingly
 */
const TestAwareLearningHeader = ({
  courseOrg = null,
  courseNumber = null,
  courseTitle = null,
  intl,
  showUserDropdown = true,
  courseId = null,
  unitId = null,
  preloadedData = {},
  // Manual override props (will override auto-detection)
  forceTestMode = false,
  testId = null,
  testTimeInMinutes = null,
  onTestTimeExpired = null,
  onTestTimeUpdate = null,
}) => {
  // Use test detection hook
  const { testConfig, getTestTimerProps } = useTestDetection(
    unitId,
    courseId,
    null, // sectionId not available in header context
    preloadedData
  );

  // Determine final test configuration
  const finalTestConfig = forceTestMode ? {
    isTestMode: true,
    testId: testId || testConfig.testId,
    testTimeInMinutes: testTimeInMinutes || testConfig.testTimeInMinutes,
    onTestTimeExpired: onTestTimeExpired,
    onTestTimeUpdate: onTestTimeUpdate,
  } : {
    isTestMode: testConfig.isTestMode,
    testId: testConfig.testId,
    testTimeInMinutes: testConfig.testTimeInMinutes,
    onTestTimeExpired: onTestTimeExpired || (() => {
      console.log('Test time expired for:', testConfig.testName || 'Unknown Test');
    }),
    onTestTimeUpdate: onTestTimeUpdate || ((timeLeft) => {
      console.log(`Test time remaining: ${timeLeft} seconds`);
    }),
  };

  return (
    <LearningHeader
      courseOrg={courseOrg}
      courseNumber={courseNumber}
      courseTitle={courseTitle}
      intl={intl}
      showUserDropdown={showUserDropdown}
      courseId={courseId}
      unitId={unitId}
      preloadedData={preloadedData}
      // Test Timer props
      isTestMode={finalTestConfig.isTestMode}
      testId={finalTestConfig.testId}
      testTimeInMinutes={finalTestConfig.testTimeInMinutes}
      onTestTimeExpired={finalTestConfig.onTestTimeExpired}
      onTestTimeUpdate={finalTestConfig.onTestTimeUpdate}
    />
  );
};

TestAwareLearningHeader.propTypes = {
  courseOrg: PropTypes.string,
  courseNumber: PropTypes.string,
  courseTitle: PropTypes.string,
  intl: intlShape.isRequired,
  showUserDropdown: PropTypes.bool,
  courseId: PropTypes.string,
  unitId: PropTypes.string,
  preloadedData: PropTypes.object,
  // Manual override props
  forceTestMode: PropTypes.bool,
  testId: PropTypes.string,
  testTimeInMinutes: PropTypes.number,
  onTestTimeExpired: PropTypes.func,
  onTestTimeUpdate: PropTypes.func,
};

export default injectIntl(TestAwareLearningHeader);
