// Test Section Manager - Manages test sections in localStorage

const TEST_SECTIONS_KEY = 'test_sections';
const CURRENT_TEST_SECTION_KEY = 'current_test_section';
const TEST_SEQUENCES_KEY = 'test_sequences';

/**
 * Save test sections to localStorage
 * @param {Array} testSections - Array of test section objects
 */
export const saveTestSections = (testSections) => {
  try {
    const testSectionIds = testSections.map(section => ({
      id: section.id,
      name: section.display_name,
      courseId: section.courseId,
      isTestSection: true
    }));
    
    localStorage.setItem(TEST_SECTIONS_KEY, JSON.stringify(testSectionIds));
  } catch (error) {
    // Error saving sections
  }
};

/**
 * Get test sections from localStorage
 * @returns {Array} Array of test section objects
 */
export const getTestSections = () => {
  try {
    const stored = localStorage.getItem(TEST_SECTIONS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return parsed;
  } catch (error) {
    return [];
  }
};

/**
 * Check if a section ID is a test section
 * @param {string} sectionId - Section ID to check
 * @returns {boolean} True if section is a test section
 */
export const isTestSection = (sectionId) => {
  const testSections = getTestSections();
  return testSections.some(section => section.id === sectionId);
};

/**
 * Get test section info by ID
 * @param {string} sectionId - Section ID
 * @returns {Object|null} Test section info or null
 */
export const getTestSectionInfo = (sectionId) => {
  const testSections = getTestSections();
  return testSections.find(section => section.id === sectionId) || null;
};

/**
 * Set current test section (when user starts a test)
 * @param {string} sectionId - Current test section ID
 * @param {string} courseId - Course ID
 * @param {string} sequenceId - Sequence ID
 */
export const setCurrentTestSection = (sectionId, courseId, sequenceId) => {
  try {
    const testInfo = {
      sectionId,
      courseId,
      sequenceId,
      startTime: Date.now(),
      isActive: true
    };
    
    localStorage.setItem(CURRENT_TEST_SECTION_KEY, JSON.stringify(testInfo));
  } catch (error) {
    // Error setting current test
  }
};

/**
 * Get current test section
 * @returns {Object|null} Current test section info or null
 */
export const getCurrentTestSection = () => {
  try {
    const stored = localStorage.getItem(CURRENT_TEST_SECTION_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return parsed;
  } catch (error) {
    return null;
  }
};

/**
 * Clear current test section (when test ends)
 */
export const clearCurrentTestSection = () => {
  try {
    localStorage.removeItem(CURRENT_TEST_SECTION_KEY);
  } catch (error) {
    // Error clearing current test
  }
};

/**
 * Extract course and sequence info from Open edX URL
 * @param {string} currentPath - Current browser path
 * @returns {Object|null} Course and sequence info
 */
export const extractCourseInfoFromURL = (currentPath) => {
  if (!currentPath) return null;
  
  // Pattern for Open edX URLs like:
  // /learning/course/course-v1:Manabi+N51+2026/block-v1:Manabi+N51+2026+type@sequential+block@26bda9b5c2b54e6d855bc6259903286d/block-v1:Manabi+N51+2026+type@vertical+block@833840f30afa4b30926faaa76f078c92
  const coursePattern = /\/learning\/course\/([^\/]+)\/([^\/]+)/;
  const match = currentPath.match(coursePattern);
  
  if (match) {
    const courseId = match[1]; // course-v1:Manabi+N51+2026
    const sequenceId = match[2]; // block-v1:Manabi+N51+2026+type@sequential+block@26bda9b5c2b54e6d855bc6259903286d
    
    return {
      courseId,
      sequenceId,
      isSequential: sequenceId.includes('type@sequential'),
      isVertical: sequenceId.includes('type@vertical')
    };
  }
  
  return null;
};

/**
 * Check if current URL indicates test mode
 * @param {string} currentPath - Current browser path
 * @returns {Object|null} Test info if in test mode
 */
export const checkTestModeFromURL = (currentPath) => {
  if (!currentPath) return null;
  
  // Extract course info from URL
  const courseInfo = extractCourseInfoFromURL(currentPath);
  if (!courseInfo) return null;
  
  const { courseId, sequenceId } = courseInfo;
  
  
  // Check if this sequence belongs to a test section
  const currentTest = getCurrentTestSection();
  
  if (currentTest && currentTest.courseId === courseId) {
    
    // Check if the current sequence is actually part of the test
    const testSequences = getTestSequences();
    const sequences = testSequences[currentTest.sectionId] || [];
    const isInTestSequence = sequences.some(seq => seq.id === sequenceId);
    
    
    if (isInTestSequence) {
      return {
        isTestMode: true,
        courseId,
        sequenceId,
        sectionId: currentTest.sectionId,
        testInfo: currentTest
      };
    } else {
      clearCurrentTestSection();
    }
  }
  
  // Check if this sequence is in any test section
  const testSequences = getTestSequences();
  const testSections = getTestSections();
  
  for (const section of testSections) {
    if (section.courseId === courseId) {
      const sequences = testSequences[section.id] || [];
      const isInTestSequence = sequences.some(seq => seq.id === sequenceId);
      
      if (isInTestSequence) {
        return {
          isTestMode: true,
          courseId,
          sequenceId,
          sectionId: section.id,
          testInfo: {
            sectionId: section.id,
            courseId: section.courseId,
            sequenceId: sequenceId,
            isActive: true
          }
        };
      }
    }
  }
  
  // Check for other test patterns
  const testPatterns = [
    /\/test-series/,
    /\/test\//,
    /\/mock-test/
  ];
  
  for (const pattern of testPatterns) {
    if (pattern.test(currentPath)) {
      return {
        isTestMode: true,
        courseId: courseId,
        sequenceId: sequenceId,
        sectionId: null,
        testInfo: null
      };
    }
  }
  
  return null;
};

/**
 * Save test sequences to localStorage
 * @param {Object} testSequences - Object with sectionId as key and sequences as value
 */
export const saveTestSequences = (testSequences) => {
  try {
    localStorage.setItem(TEST_SEQUENCES_KEY, JSON.stringify(testSequences));
  } catch (error) {
    // Error saving sequences
  }
};

/**
 * Get test sequences from localStorage
 * @returns {Object} Object with sectionId as key and sequences as value
 */
export const getTestSequences = () => {
  try {
    const stored = localStorage.getItem(TEST_SEQUENCES_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    return parsed;
  } catch (error) {
    return {};
  }
};

/**
 * Get sequences for a specific test section
 * @param {string} sectionId - Section ID
 * @returns {Array} Array of sequences for the section
 */
export const getSequencesForTestSection = (sectionId) => {
  const testSequences = getTestSequences();
  return testSequences[sectionId] || [];
};

/**
 * Initialize test sections from course data
 * @param {Object} preloadedData - Preloaded course data
 */
export const initializeTestSections = (preloadedData) => {
  const testSections = [];
  const testSequences = {};
  
  Object.entries(preloadedData).forEach(([courseId, courseData]) => {
    if (!courseData.sections) return;
    
    const testSectionsInCourse = courseData.sections.filter(section => 
      (section.display_name || '').toLowerCase().includes('模試テスト') ||
      (section.display_name || '').toLowerCase().includes('mock test') ||
      (section.display_name || '').toLowerCase().includes('test')
    );
    
    testSectionsInCourse.forEach(section => {
      testSections.push({
        id: section.id,
        display_name: section.display_name,
        courseId: courseId
      });
      
      // Save sequences for this test section
      if (courseData.sequences && courseData.sequences[section.id]) {
        testSequences[section.id] = courseData.sequences[section.id];
      }
    });
  });
  
  saveTestSections(testSections);
  saveTestSequences(testSequences);
  return testSections;
};

// ---------- Debug helpers ----------
export const getStorageSnapshot = () => {
  const sections = getTestSections();
  const sequences = getTestSequences();
  const current = getCurrentTestSection();
  return {
    sectionsCount: sections.length,
    sections,
    sequencesSectionCount: Object.keys(sequences).length,
    sequences,
    current,
  };
};

export const attachTestStorageDebug = () => {
  if (typeof window === 'undefined') return;
  if (window.testStorage) return; // don't reattach
  window.testStorage = {
    snapshot: () => {
      const snap = getStorageSnapshot();
      return snap;
    },
    sections: () => getTestSections(),
    sequences: () => getTestSequences(),
    current: () => getCurrentTestSection(),
    clearCurrent: () => clearCurrentTestSection(),
    checkTestMode: (url) => checkTestModeFromURL(url),
    saveSections: saveTestSections,
    saveSequences: saveTestSequences,
  };
};

// Auto-attach in browser contexts
attachTestStorageDebug();

/**
 * Save sequences for a specific test section
 * @param {string} sectionId - Section ID
 * @param {Array} sequences - Array of sequences
 */
export const saveSequencesForTestSection = (sectionId, sequences) => {
  try {
    const testSequences = getTestSequences();
    testSequences[sectionId] = sequences;
    saveTestSequences(testSequences);
  } catch (error) {
    // Error saving sequences for test section
  }
};

/**
 * Check if sequences are cached for a test section
 * @param {string} sectionId - Section ID
 * @returns {boolean} True if sequences are cached
 */
export const hasSequencesForTestSection = (sectionId) => {
  const testSequences = getTestSequences();
  return testSequences[sectionId] && testSequences[sectionId].length > 0;
};

/**
 * Get test configuration for current context
 * @param {string} currentPath - Current browser path
 * @param {string} unitId - Current unit ID
 * @param {string} courseId - Current course ID
 * @returns {Object} Test configuration
 */
export const getTestConfiguration = (currentPath, unitId, courseId) => {
  // Check URL for test mode
  const urlTestInfo = checkTestModeFromURL(currentPath);
  
  if (urlTestInfo && urlTestInfo.isTestMode) {
    return {
      isTestMode: true,
      testId: urlTestInfo.sequenceId,
      testName: `Test in ${urlTestInfo.sectionId}`,
      testTimeInMinutes: 60, // Default test time
      courseId: urlTestInfo.courseId,
      sectionId: urlTestInfo.sectionId,
      sequenceId: urlTestInfo.sequenceId,
      testType: 'sequence'
    };
  }
  
  // Check if current unit is in a test section
  const currentTest = getCurrentTestSection();
  if (currentTest && currentTest.courseId === courseId) {
    return {
      isTestMode: true,
      testId: currentTest.sequenceId,
      testName: `Test in ${currentTest.sectionId}`,
      testTimeInMinutes: 60,
      courseId: currentTest.courseId,
      sectionId: currentTest.sectionId,
      sequenceId: currentTest.sequenceId,
      testType: 'sequence'
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
