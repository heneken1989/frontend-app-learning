// Utility functions to detect if a unit/quiz is part of a test sequence

/**
 * Check if a unit is part of a test sequence
 * @param {string} unitId - The unit ID to check
 * @param {string} courseId - The course ID
 * @param {string} sectionId - The section ID (optional)
 * @param {Object} preloadedData - Preloaded course data
 * @returns {Object|null} Test info if unit is part of test, null otherwise
 */
export const isUnitInTestSequence = (unitId, courseId, sectionId = null, preloadedData = {}) => {
  try {
    // Check if we have preloaded data for this course
    const courseData = preloadedData[courseId];
    if (!courseData) {
      return null;
    }

    // Look for test sections (containing "模試テスト" or "mock test")
    const testSections = courseData.sections.filter(section => 
      (section.display_name || '').toLowerCase().includes('模試テスト') ||
      (section.display_name || '').toLowerCase().includes('mock test') ||
      (section.display_name || '').toLowerCase().includes('test')
    );

    // If specific sectionId provided, check only that section
    if (sectionId) {
      const targetSection = courseData.sections.find(s => s.id === sectionId);
      if (targetSection && isTestSection(targetSection)) {
        const sequences = courseData.sequences[sectionId] || [];
        const testSequence = sequences.find(seq => 
          seq.sequences && seq.sequences.some(unit => unit.id === unitId)
        );
        
        if (testSequence) {
          return {
            isTestUnit: true,
            testId: testSequence.id,
            testName: testSequence.display_name,
            courseId,
            sectionId,
            sequenceId: testSequence.id,
            testType: 'sequence'
          };
        }
      }
      return null;
    }

    // Check all test sections
    for (const section of testSections) {
      const sequences = courseData.sequences[section.id] || [];
      
      for (const sequence of sequences) {
        // Check if unit is in this sequence
        if (sequence.sequences && sequence.sequences.some(unit => unit.id === unitId)) {
          return {
            isTestUnit: true,
            testId: sequence.id,
            testName: sequence.display_name,
            courseId,
            sectionId: section.id,
            sequenceId: sequence.id,
            testType: 'sequence'
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error checking if unit is in test sequence:', error);
    return null;
  }
};

/**
 * Check if a section is a test section
 * @param {Object} section - Section object
 * @returns {boolean} True if section is a test section
 */
export const isTestSection = (section) => {
  if (!section || !section.display_name) return false;
  
  const testKeywords = ['模試テスト', 'mock test', 'test', 'quiz', 'exam', '試験', 'テスト'];
  const sectionName = section.display_name.toLowerCase();
  
  return testKeywords.some(keyword => sectionName.includes(keyword.toLowerCase()));
};

/**
 * Get test configuration for a unit
 * @param {string} unitId - The unit ID
 * @param {string} courseId - The course ID
 * @param {string} sectionId - The section ID
 * @param {Object} preloadedData - Preloaded course data
 * @returns {Object} Test configuration
 */
export const getTestConfiguration = (unitId, courseId, sectionId, preloadedData = {}) => {
  const testInfo = isUnitInTestSequence(unitId, courseId, sectionId, preloadedData);
  
  if (testInfo) {
    return {
      isTestMode: true,
      testId: testInfo.testId,
      testName: testInfo.testName,
      testTimeInMinutes: 60, // Default test time - can be configured per test
      courseId: testInfo.courseId,
      sectionId: testInfo.sectionId,
      sequenceId: testInfo.sequenceId,
      testType: testInfo.testType
    };
  }
  
  return {
    isTestMode: false,
    testId: null,
    testName: null,
    testTimeInMinutes: null,
    courseId: null,
    sectionId: null,
    sequenceId: null,
    testType: null
  };
};

/**
 * Get all test sequences from preloaded data
 * @param {Object} preloadedData - Preloaded course data
 * @returns {Array} Array of test sequences
 */
export const getAllTestSequences = (preloadedData = {}) => {
  const testSequences = [];
  
  Object.entries(preloadedData).forEach(([courseId, courseData]) => {
    if (!courseData.sections) return;
    
    const testSections = courseData.sections.filter(isTestSection);
    
    testSections.forEach(section => {
      const sequences = courseData.sequences[section.id] || [];
      
      sequences.forEach(sequence => {
        testSequences.push({
          id: sequence.id,
          name: sequence.display_name,
          courseId,
          sectionId: section.id,
          sectionName: section.display_name,
          courseName: courseData.courseName || 'Unknown Course',
          unitCount: sequence.sequences ? sequence.sequences.length : 0
        });
      });
    });
  });
  
  return testSequences;
};

/**
 * Check if current URL indicates test mode
 * @param {string} currentPath - Current browser path
 * @returns {boolean} True if URL indicates test mode
 */
export const isTestModeFromURL = (currentPath) => {
  if (!currentPath) return false;
  
  // Exclude test-series listing page (not an actual test page)
  if (currentPath === '/learning/test-series' || currentPath === '/test-series' || currentPath.match(/^\/learning\/test-series\/?$/)) {
    return false;
  }
  
  const testPathPatterns = [
    '/test-series/results',
    '/test-series/module-transition',
    '/test/',
    '/mock-test',
    '/模試テスト'
  ];
  
  return testPathPatterns.some(pattern => currentPath.includes(pattern));
};

/**
 * Extract test info from URL parameters or path
 * @param {string} currentPath - Current browser path
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Object|null} Test info if found in URL
 */
export const getTestInfoFromURL = (currentPath, searchParams) => {
  try {
    // Check for test ID in URL parameters
    const testId = searchParams.get('testId') || searchParams.get('test_id');
    const courseId = searchParams.get('courseId') || searchParams.get('course_id');
    const sectionId = searchParams.get('sectionId') || searchParams.get('section_id');
    const sequenceId = searchParams.get('sequenceId') || searchParams.get('sequence_id');
    
    if (testId || courseId) {
      return {
        testId,
        courseId,
        sectionId,
        sequenceId,
        isTestMode: true
      };
    }
    
    // Check for test patterns in path
    const testMatch = currentPath.match(/\/test\/([^\/]+)/);
    if (testMatch) {
      return {
        testId: testMatch[1],
        isTestMode: true
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting test info from URL:', error);
    return null;
  }
};
