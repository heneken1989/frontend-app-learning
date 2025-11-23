import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  isUnitInTestSequence, 
  getTestConfiguration, 
  isTestModeFromURL,
  getTestInfoFromURL 
} from '../utils/testDetection';
import { 
  getTestConfiguration as getTestConfigFromManager,
  checkTestModeFromURL as checkTestModeFromURLManager
} from '../utils/testSectionManager';

/**
 * Hook to detect if current unit/quiz is part of a test sequence
 * @param {string} unitId - Current unit ID
 * @param {string} courseId - Current course ID
 * @param {string} sectionId - Current section ID
 * @param {Object} preloadedData - Preloaded course data
 * @returns {Object} Test detection state and methods
 */
export const useTestDetection = (unitId, courseId, sectionId, preloadedData = {}) => {
  const location = useLocation();
  const [testConfig, setTestConfig] = useState({
    isTestMode: false,
    testId: null,
    testName: null,
    testTimeInMinutes: null,
    courseId: null,
    sectionId: null,
    sequenceId: null,
    testType: null
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check if current unit is part of test sequence
  const checkTestSequence = useCallback(() => {
    // Exclude test-series listing page (not an actual test page) - check FIRST
    if (location.pathname === '/learning/test-series' || location.pathname === '/test-series' || location.pathname.match(/^\/learning\/test-series\/?$/)) {
      setTestConfig({
        isTestMode: false,
        testId: null,
        testName: null,
        testTimeInMinutes: null,
        courseId: null,
        sectionId: null,
        sequenceId: null,
        testType: null
      });
      setIsLoading(false);
      return;
    }
    
    if (!unitId || !courseId) {
      setTestConfig({
        isTestMode: false,
        testId: null,
        testName: null,
        testTimeInMinutes: null,
        courseId: null,
        sectionId: null,
        sequenceId: null,
        testType: null
      });
      setIsLoading(false);
      return;
    }

    try {
      // First try the new testSectionManager approach
      const managerConfig = getTestConfigFromManager(location.pathname, unitId, courseId);
      if (managerConfig.isTestMode) {
        setTestConfig(managerConfig);
        setIsLoading(false);
        return;
      }

      // Fallback to old approach
      const config = getTestConfiguration(unitId, courseId, sectionId, preloadedData);
      setTestConfig(config);
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking test sequence:', error);
      setTestConfig({
        isTestMode: false,
        testId: null,
        testName: null,
        testTimeInMinutes: null,
        courseId: null,
        sectionId: null,
        sequenceId: null,
        testType: null
      });
      setIsLoading(false);
    }
  }, [unitId, courseId, sectionId, preloadedData, location.pathname]);

  // Check URL for test mode indicators
  const checkURLForTestMode = useCallback(() => {
    // Exclude test-series listing page (not an actual test page)
    if (location.pathname === '/learning/test-series' || location.pathname === '/test-series' || location.pathname.match(/^\/learning\/test-series\/?$/)) {
      setTestConfig(prev => ({
        ...prev,
        isTestMode: false,
        testId: null,
        testName: null,
        testTimeInMinutes: null,
        courseId: null,
        sectionId: null,
        sequenceId: null,
        testType: null
      }));
      return;
    }
    
    // First try the new testSectionManager approach
    const managerTestInfo = checkTestModeFromURLManager(location.pathname);
    if (managerTestInfo && managerTestInfo.isTestMode) {
      setTestConfig(prev => ({
        ...prev,
        isTestMode: true,
        testId: managerTestInfo.sequenceId || prev.testId,
        courseId: managerTestInfo.courseId || prev.courseId,
        sectionId: managerTestInfo.sectionId || prev.sectionId,
        sequenceId: managerTestInfo.sequenceId || prev.sequenceId
      }));
      return;
    }

    // Fallback to old approach
    const urlTestInfo = getTestInfoFromURL(location.pathname, new URLSearchParams(location.search));
    const isTestURL = isTestModeFromURL(location.pathname);
    
    if (urlTestInfo && urlTestInfo.isTestMode) {
      setTestConfig(prev => ({
        ...prev,
        isTestMode: true,
        testId: urlTestInfo.testId || prev.testId,
        courseId: urlTestInfo.courseId || prev.courseId,
        sectionId: urlTestInfo.sectionId || prev.sectionId,
        sequenceId: urlTestInfo.sequenceId || prev.sequenceId
      }));
    } else if (isTestURL) {
      setTestConfig(prev => ({
        ...prev,
        isTestMode: true
      }));
    }
  }, [location.pathname, location.search]);

  // Re-check when dependencies change
  useEffect(() => {
    checkTestSequence();
  }, [checkTestSequence]);

  // Check URL on location change
  useEffect(() => {
    checkURLForTestMode();
  }, [checkURLForTestMode]);

  // Manual refresh method
  const refreshTestDetection = useCallback(() => {
    setIsLoading(true);
    checkTestSequence();
  }, [checkTestSequence]);

  // Get test timer props for LearningHeader
  const getTestTimerProps = useCallback(() => {
    if (!testConfig.isTestMode) {
      return {
        isTestMode: false,
        testId: null,
        testTimeInMinutes: null,
        onTestTimeExpired: null,
        onTestTimeUpdate: null
      };
    }

    return {
      isTestMode: true,
      testId: testConfig.testId,
      testTimeInMinutes: testConfig.testTimeInMinutes || 60,
      onTestTimeExpired: () => {
        console.log('Test time expired for:', testConfig.testName);
        // You can add custom logic here
      },
      onTestTimeUpdate: (timeLeft) => {
        console.log(`Test time remaining: ${timeLeft} seconds for ${testConfig.testName}`);
        // You can add custom logic here
      }
    };
  }, [testConfig]);

  return {
    testConfig,
    isLoading,
    refreshTestDetection,
    getTestTimerProps,
    isTestUnit: testConfig.isTestMode,
    testId: testConfig.testId,
    testName: testConfig.testName,
    testTimeInMinutes: testConfig.testTimeInMinutes
  };
};

export default useTestDetection;
