import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { AppContext, getConfig } from '@edx/frontend-platform/react';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { Button, Card, Alert } from '@openedx/paragon';
import { Minus, Plus } from '@openedx/paragon/icons';
import LearningHeader from '../Header/src/learning-header/LearningHeader';
import TestIntroPage from './TestIntroPage';
import { fetchTestSeries, fetchIndividualTests, startTest } from './api/testApi';
import {
  fetchAllCourses, fetchSectionsByCourseId, fetchSequencesBySectionId,
} from '../../courseware/course/sequence/Unit/urls';
import { initializeTestSections, setCurrentTestSection, saveTestSequences } from './utils/testSectionManager';
import './TestSeriesPage.scss';

// Get dynamic LMS base URL
const getLmsBaseUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('local.openedx.io')) {
    return 'http://local.openedx.io:8000';
  } else {
    // Production - use LMS subdomain
    return 'https://lms.nihongodrill.com';
  }
};

const TestSeriesPage = ({ intl }) => {
  const { authenticatedUser } = React.useContext(AppContext);
  const [testData, setTestData] = useState([]);
  const [individualTests, setIndividualTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preloadedData, setPreloadedData] = useState({});
  const [showTestIntro, setShowTestIntro] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testStats, setTestStats] = useState({
    totalTests: 0,
    completedTests: 0,
    pendingTests: 0,
    averageScore: 0,
    totalSeries: 0,
    totalQuestions: 0
  });
  const [testAttempts, setTestAttempts] = useState({});
  const [testResults, setTestResults] = useState({});
  const [testCompletionStatus, setTestCompletionStatus] = useState({});
  const [testQuestionCounts, setTestQuestionCounts] = useState({});
  const [testUnitTitles, setTestUnitTitles] = useState({}); // Store unit titles for each test
  const [expandedTestId, setExpandedTestId] = useState(null);
  const [testHistory, setTestHistory] = useState({});
  const [expandedCourseId, setExpandedCourseId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch all courses first
        const courses = await fetchAllCourses();
        
        // Preload all sections and sequences for test courses
        const preloadAllData = async () => {
          const preloadedDataMap = {};
          
          // Find ALL sections with "模試テスト" across ALL courses
          const allTestSections = [];
          
          // Process ALL courses to find test sections
          const allCoursePromises = courses.map(async (course) => {
            try {
              const sectionsData = await fetchSectionsByCourseId(course.id);
              const testSections = sectionsData.filter(section => 
                (section.display_name || '').includes('模試テスト')
              );
              
              if (testSections.length > 0) {
                testSections.forEach(section => {
                  allTestSections.push({
                    course: course,
                    section: section
                  });
                });
              }
              
              return { course, testSections };
            } catch (err) {
              return { course, testSections: [] };
            }
          });
          
          const allResults = await Promise.all(allCoursePromises);
          
          // Now process each test section to get sequences
          const testSeries = [];
          for (const { course, section } of allTestSections) {
            try {
              const sequencesData = await fetchSequencesBySectionId(section.id);
              
              if (sequencesData.length > 0) {
                const testSeriesEntry = {
                  id: `${course.id}-${section.id}`,
                  title: `${course.display_name} - ${section.display_name}`,
                  courseId: course.id,
                  sectionId: section.id,
                  testSectionId: section.id, // Course section ID
                  progress: 0,
                  total: sequencesData.length,
                  type: 'series',
                  tests: sequencesData.map(seq => ({
                    id: seq.id,
                    unitId: seq.id, // Add unitId for API mapping
                    name: seq.display_name,
                    completed: false,
                    score: null,
                    courseId: course.id,
                    sectionId: section.id,
                    testSectionId: section.id, // Course section ID to each test
                    sequenceId: seq.id
                  }))
                };
                
                testSeries.push(testSeriesEntry);
              }
            } catch (err) {
              // Failed to process section
            }
          }
          
          setTestData(testSeries);
          
          // Flatten individual tests
          const individualTests = [];
          testSeries.forEach(series => {
            series.tests.forEach(test => {
              individualTests.push({
                ...test,
                unitId: test.unitId || test.id, // Ensure unitId is available
                seriesTitle: series.title,
                seriesId: series.id
              });
            });
          });
          
          setIndividualTests(individualTests);
          
          
          // Fetch unit titles and calculate question counts ONLY from Unit Title parsing
          
          const questionCounts = {};
          const unitTitles = {};
          for (const test of individualTests) {
            // Use the same testId logic as in render
            const testId = test.sequenceId?.split('block@')[1] || test.unitId || test.id;
            const unitData = await getTestUnitTitlesAndCount(test.sequenceId);
            if (unitData !== null) {
              questionCounts[testId] = unitData.questionCount;
              unitTitles[testId] = unitData.unitTitles;
            } else {
              
            }
          }
          setTestQuestionCounts(questionCounts);
          setTestUnitTitles(unitTitles);
          
          
          // Re-fetch results now that we have accurate question counts per test (ensures totals like 2/6)
          // Pass overrides to avoid relying on async state updates
          try {
            await fetchTestResults(null, questionCounts, unitTitles);
          } catch (e) {
            // ignore
          }
          
          // Calculate test statistics
          const stats = calculateTestStats(testSeries, individualTests);
          setTestStats(stats);
          
          // Initialize test sections and sequences in localStorage
          const testSections = allTestSections.map(({ course, section }) => ({
            id: section.id,
            display_name: section.display_name,
            courseId: course.id
          }));
          
          // Create preloadedData structure for test sections
          const testPreloadedData = {};
          allTestSections.forEach(({ course, section }) => {
            if (!testPreloadedData[course.id]) {
              testPreloadedData[course.id] = {
                sections: [],
                sequences: {}
              };
            }
            testPreloadedData[course.id].sections.push(section);
          });
          
          // Add sequences data
          for (const { course, section } of allTestSections) {
            try {
              const sequencesData = await fetchSequencesBySectionId(section.id);
              if (testPreloadedData[course.id]) {
                testPreloadedData[course.id].sequences[section.id] = sequencesData;
              }
            } catch (err) {
              
            }
          }
          
          initializeTestSections(testPreloadedData);
          

          // Single consolidated fetch using precomputed maps is done below
          
          
          return; // Skip the old logic below
        };
        
        await preloadAllData();
        setError(null);
      } catch (err) {
        console.error('Error loading test data:', err);
        setError('Failed to load test data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (authenticatedUser) {
      loadData();
    }
  }, [authenticatedUser]);

  // Force refresh data when page becomes visible (user returns from test)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && authenticatedUser) {
        // Re-fetch all test results
        fetchTestResults(null);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [authenticatedUser, testData]);

  // Function to match test results with individual tests
  const matchTestResultsWithTests = useCallback(() => {
    if (individualTests.length === 0) return;
    
    // Get all section_ids from test results
    const testResultSectionIds = Object.values(testResults).map(result => result.sectionId);
    
    // Find matching tests
    let matchCount = 0;
    individualTests.forEach((test, index) => {
      const systemSequenceId = test.sequenceId?.split('block@')[1];
      const hasMatch = testResultSectionIds.includes(systemSequenceId);
      
      if (hasMatch) {
        matchCount++;
        // Use test_session_id as the testId for matching
        const testId = test.sequenceId?.split('block@')[1] || test.unitId || test.id;
        
        // Only update if not already completed
        if (!testCompletionStatus[testId]) {
          setTestCompletionStatus(prev => ({
            ...prev,
            [testId]: true
          }));
        }
        
        // Find the matching test result for this sequence
        const matchingResult = Object.values(testResults).find(result => 
          result.sectionId === systemSequenceId
        );
        
        // Don't update testResults here to avoid infinite loop
        // The testResults are already set from API data
      }
    });
    
    
  }, [individualTests, testResults]);

  // Recalculate stats when test results change
  useEffect(() => {
    if (individualTests.length > 0) {
      const stats = calculateTestStats(testData, individualTests);
      setTestStats(stats);
    }
  }, [individualTests, testData, testResults, testCompletionStatus, testAttempts]);

  // Separate effect for matching test results (only run once when individual tests are loaded)
  useEffect(() => {
    if (individualTests.length > 0) {
      matchTestResultsWithTests();
    }
  }, [individualTests.length]);

  // Also run matching when testResults change
  useEffect(() => {
    if (individualTests.length > 0 && Object.keys(testResults).length > 0) {
      matchTestResultsWithTests();
    }
  }, [testResults]);

  // Listen for test completion events
  useEffect(() => {
    const handleTestCompletion = (event) => {
      if (event.data && event.data.type === 'test.completed') {
        const { testSessionId, summary, completedAt } = event.data.data;
        
        // Update completion status for the test
        if (summary && summary.unit_id) {
          setTestCompletionStatus(prev => ({
            ...prev,
            [summary.unit_id]: true
          }));
          
          // Update test results
          setTestResults(prev => ({
            ...prev,
            [summary.unit_id]: {
              score: summary.percentage || 0,
              correctAnswers: summary.correct_answers || 0,
              totalQuestions: summary.total_questions || 0,
              completedAt: completedAt,
              answeredQuestions: summary.answered_questions || 0,
              sectionId: summary.section_id,
              testSessionId: testSessionId
            }
          }));
          
          // Increment attempt count
          setTestAttempts(prev => ({
            ...prev,
            [summary.unit_id]: (prev[summary.unit_id] || 0) + 1
          }));
        }
      }
    };

    // Listen for localStorage changes (fallback)
    const handleStorageChange = (event) => {
      if (event.key === 'testCompleted') {
        try {
          const testCompleted = JSON.parse(event.newValue);
          if (testCompleted && testCompleted.summary) {
            
            const { summary, completedAt } = testCompleted;
            if (summary && summary.unit_id) {
              setTestCompletionStatus(prev => ({
                ...prev,
                [summary.unit_id]: true
              }));
              
              const sectionId = summary.section_id;
              const parsedTotal = typeof testQuestionCounts[sectionId] === 'number' ? testQuestionCounts[sectionId] : 0;
              const titles = testUnitTitles[sectionId] || [];
              const titlesTotal = Array.isArray(titles) ? titles.reduce((sum, u) => sum + (u?.questionCount || 1), 0) : 0;
              const totalQuestions = parsedTotal || titlesTotal || 0; // enforce Unit Title total
              const correctAnswers = summary.correct_answers || 0;
              const calculatedScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

              setTestResults(prev => ({
                ...prev,
                [summary.unit_id]: {
                  score: calculatedScore,
                  correctAnswers: correctAnswers,
                  totalQuestions: totalQuestions,
                  completedAt: completedAt,
                  answeredQuestions: summary.answered_questions || 0,
                  sectionId: sectionId,
                  testSessionId: testCompleted.testSessionId
                }
              }));
              
              setTestAttempts(prev => ({
                ...prev,
                [summary.unit_id]: (prev[summary.unit_id] || 0) + 1
              }));
              
              // Clear the localStorage flag
              localStorage.removeItem('testCompleted');
            }
          }
        } catch (error) {
          // Error parsing test completion data
        }
      }
    };

    // Add event listeners
    window.addEventListener('message', handleTestCompletion);
    window.addEventListener('storage', handleStorageChange);

    // Check for existing completion on mount
    const existingCompletion = localStorage.getItem('testCompleted');
    if (existingCompletion) {
      try {
        const testCompleted = JSON.parse(existingCompletion);
        if (testCompleted && testCompleted.summary) {
          handleStorageChange({ key: 'testCompleted', newValue: existingCompletion });
        }
      } catch (error) {
        // Error parsing existing completion
      }
    }

    return () => {
      window.removeEventListener('message', handleTestCompletion);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);



  // Function to parse unit title and count actual questions
  const parseUnitTitleForQuestionCount = (unitTitle) => {
    if (!unitTitle) return 1; // Default to 1 question if no title
    
    // Check if title contains multiple questions (e.g., "3.1-3.2-3.3")
    if (unitTitle.includes('-')) {
      // Split by '-' and count the parts
      const parts = unitTitle.split('-');
      const questionCount = parts.length;
      return questionCount;
    }
    
    // Single question (e.g., "1.1", "2.3")
    return 1;
  };

  // Caches to avoid redundant fetches: per-course navigation and per-sequence parsed unit data
  const courseNavCacheRef = useRef({}); // { [courseId]: blocks }
  const sequenceUnitDataCacheRef = useRef({}); // { [sequenceId]: { unitCount, unitTitles, questionCount } }

  // Function to get unit titles and count from sequence using navigation API (with caching)
  const getTestUnitTitlesAndCount = async (sequenceId) => {
    try {
      
      // Extract course ID from sequence ID
      // sequenceId format: block-v1:Manabi+N52+2026+type@sequential+block@...
      // Split by '+type@' and take the first part
      const parts = sequenceId.split('+type@');
      const courseId = parts.length > 1 ? `course-v1:${parts[0].replace('block-v1:', '')}` : null;
      
      
      // If no course ID found, return null
      if (!courseId) {
        console.log(`❌ No course ID found in sequenceId: ${sequenceId}`);
        return null;
      }
      
      // Return immediately if we already parsed this sequence
      if (sequenceUnitDataCacheRef.current[sequenceId]) {
        
        return sequenceUnitDataCacheRef.current[sequenceId];
      }

      let blocks = courseNavCacheRef.current[courseId];

      // Call navigation API to get course outline only if not cached
      if (!blocks) {
        const lmsBaseUrl = getLmsBaseUrl();
        try {
          const response = await fetch(`${lmsBaseUrl}/api/course_home/v1/navigation/${courseId}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });

          if (!response.ok) {
            // Log error but don't spam console
            if (response.status === 500) {
              console.warn(`⚠️ Navigation API returned 500 for course ${courseId}. This may be a server issue. Continuing without question counts.`);
            } else {
              console.log(`⚠️ Failed to get course outline: ${response.status}`);
            }
            // Return null gracefully instead of throwing
            return null;
          }

          const data = await response.json();
          
          if (!data.blocks) {
            console.warn(`⚠️ Navigation API response missing blocks for course ${courseId}`);
            return null;
          }
          blocks = data.blocks;
          courseNavCacheRef.current[courseId] = blocks; // cache per course
        } catch (error) {
          // Handle network errors gracefully
          console.warn(`⚠️ Error fetching navigation for course ${courseId}:`, error.message);
          return null;
        }
      }

      if (blocks) {
        
        
        // Find the sequence block
        const sequence = blocks[sequenceId];
          if (sequence) {
            
            
            // Get unit titles from sequence children
            const unitTitles = [];
            const unitCount = sequence.children ? sequence.children.length : 0;
            let totalQuestions = 0;
            
            if (sequence.children) {
              sequence.children.forEach((childId, index) => {
                const childBlock = blocks[childId];
                if (childBlock && childBlock.display_name) {
                  const unitTitle = childBlock.display_name;
                  const questionsInUnit = parseUnitTitleForQuestionCount(unitTitle);
                  
                  unitTitles.push({
                    id: childId,
                    title: unitTitle,
                    index: index + 1,
                    questionCount: questionsInUnit
                  });
                  
                  totalQuestions += questionsInUnit;
                }
              });
            }
            
            
            
            const parsed = {
              unitCount,
              unitTitles,
              questionCount: totalQuestions // Total questions based on parsed unit titles
            };
            sequenceUnitDataCacheRef.current[sequenceId] = parsed; // cache per sequence
            return parsed;
          } else {
            
          }
      }
      
      // No fallback - return null if API fails
      
      return null;
    } catch (error) {
      
      return null;
    }
  };


  const fetchTestResults = async (sectionId, questionCountsOverride = null, unitTitlesOverride = null) => {
    try {
      if (!authenticatedUser) {
        return;
      }

      // Use authenticated user ID
      const authUser = getAuthenticatedUser();
      const userId = authUser?.userId || authUser?.id || authenticatedUser?.userId || authenticatedUser?.id || 'anonymous';
      
      
      
      // Only fetch results for specific section if provided
      const lmsBaseUrl = getLmsBaseUrl();
      const apiUrl = sectionId 
        ? `${lmsBaseUrl}/courseware/get_test_summary/?user_id=${userId}&section_id=${sectionId}&limit=50`
        : `${lmsBaseUrl}/courseware/get_test_summary/?user_id=${userId}&limit=50`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.success && data.summaries) {
        // Group summaries by test_session_id
        const groupedSummaries = {};
        
        data.summaries.forEach((summary) => {
          const testSessionId = summary.test_session_id;
          if (!testSessionId) return;
          
          if (!groupedSummaries[testSessionId]) {
            groupedSummaries[testSessionId] = [];
          }
          groupedSummaries[testSessionId].push(summary);
        });
        
        
        
        // Process grouped test results
        const resultsMap = {};
        const completionMap = {};
        const attemptsMap = {};

        // Prefer override maps if provided to avoid async state timing issues
        const questionCountMap = questionCountsOverride || testQuestionCounts;
        const unitTitlesMap = unitTitlesOverride || testUnitTitles;

        // Process each test session group
        for (const [testSessionId, summaries] of Object.entries(groupedSummaries)) {
          // Calculate totals for this test session
          let totalCorrectAnswers = 0;
          let totalQuestions = 0; // Will be calculated from Unit Title parsing
          let totalAnsweredQuestions = 0;
          let latestCompletedAt = null;
          let sectionId = null;
          let allQuestions = [];
          let allWrongAnswers = [];
          
          summaries.forEach((summary) => {
            totalCorrectAnswers += summary.correct_answers || 0; // Sum correct answers
            totalAnsweredQuestions += summary.answered_questions || 0;
            
            // Get the latest completion date
            if (!latestCompletedAt || new Date(summary.completed_at) > new Date(latestCompletedAt)) {
              latestCompletedAt = summary.completed_at;
            }
            
            // Get section ID (should be the same for all summaries in a session)
            if (!sectionId) {
              sectionId = summary.section_id;
            }
            
            // Collect all questions and wrong answers
            if (summary.questions) {
              allQuestions = allQuestions.concat(summary.questions);
              allWrongAnswers = allWrongAnswers.concat(summary.questions.filter(q => !q.is_correct));
            }
          });
          
          // Determine total questions. Prefer persisted total from API; fallback to Unit Title parsing map
          if (sectionId) {
            // Enforce Unit Title totals with robust fallback from stored titles
            const parsedTotal = typeof questionCountMap[sectionId] === 'number' ? questionCountMap[sectionId] : 0;
            const titles = unitTitlesMap[sectionId] || [];
            const titlesTotal = Array.isArray(titles) ? titles.reduce((sum, u) => sum + (u?.questionCount || 1), 0) : 0;
            totalQuestions = parsedTotal || titlesTotal || 0;
            
          } else {
            
          }
          
          // Calculate wrong answers = total_questions - correct_answers
          const totalIncorrectAnswers = Math.max(0, totalQuestions - totalCorrectAnswers);
          
          // Calculate final score
          const calculatedScore = totalQuestions > 0 ? Math.round((totalCorrectAnswers / totalQuestions) * 100) : 0;
          
          // Use test_session_id as the identifier
          const testId = testSessionId;
          
          resultsMap[testId] = {
            score: calculatedScore,
            correctAnswers: totalCorrectAnswers,
            incorrectAnswers: totalIncorrectAnswers,
            totalQuestions: totalQuestions,
            answeredQuestions: totalAnsweredQuestions,
            completedAt: latestCompletedAt,
            sectionId: sectionId,
            testSessionId: testSessionId,
            questions: allQuestions,
            wrongAnswers: allWrongAnswers,
            // Add metadata about grouping
            groupedFrom: summaries.length,
            summaries: summaries // Keep original summaries for debugging
          };
          
          completionMap[testId] = true;
          attemptsMap[testId] = 1; // Each test session counts as 1 attempt
        }

        

        // Replace results with freshly computed map to avoid mixing old totals
        setTestResults(resultsMap);
        setTestCompletionStatus(prev => ({ ...prev, ...completionMap }));
        setTestAttempts(prev => ({ ...prev, ...attemptsMap }));
        
      }
    } catch (error) {
      // Error fetching test results
    }
  };

  const calculateTestStats = (testSeries, individualTests) => {
    const totalTests = individualTests.length;
    
    // Use same logic as render - check for test results by sectionId
    const completedTests = individualTests.filter(test => {
      const sectionId = test.sequenceId?.split('block@')[1];
      const testResult = Object.values(testResults).find(result => 
        result.sectionId === sectionId
      );
      return testResult ? true : (testCompletionStatus[test.unitId || test.id] || test.completed);
    }).length;
    
    const pendingTests = totalTests - completedTests;
    
    // Use real scores from API
    const completedTestsWithScores = individualTests.filter(test => {
      const sectionId = test.sequenceId?.split('block@')[1];
      const testResult = Object.values(testResults).find(result => 
        result.sectionId === sectionId
      );
      const isCompleted = testResult ? true : (testCompletionStatus[test.unitId || test.id] || test.completed);
      const hasScore = testResult?.score !== undefined || test.score !== null;
      return isCompleted && hasScore;
    });
    
    const averageScore = completedTestsWithScores.length > 0 
      ? Math.round(completedTestsWithScores.reduce((sum, test) => {
          const sectionId = test.sequenceId?.split('block@')[1];
          const testResult = Object.values(testResults).find(result => 
            result.sectionId === sectionId
          );
          const score = testResult?.score || test.score || 0;
          return sum + score;
        }, 0) / completedTestsWithScores.length)
      : 0;
    
    const totalSeries = testSeries.length;
    
    // Calculate total questions ONLY from Unit Title parsing logic
    const totalQuestions = Object.values(testQuestionCounts).reduce((sum, count) => sum + count, 0);
    
    // Also calculate total units for additional statistics
    const totalUnits = Object.values(testUnitTitles).reduce((sum, units) => sum + (units ? units.length : 0), 0);
    
    return {
      totalTests,
      completedTests,
      pendingTests,
      averageScore,
      totalSeries,
      totalQuestions,
      totalUnits
    };
  };

  const handleStartTest = (testId, testType, courseId, sectionId, sequenceId) => {
    // Increment attempt count
    setTestAttempts(prev => ({
      ...prev,
      [testId]: (prev[testId] || 0) + 1
    }));
    
    // Find the test info from current data
    let testInfo = null;
    
    // Search in test series
    for (const series of testData) {
      const test = series.tests.find(t => t.id === testId);
      if (test) {
        testInfo = {
          id: test.id,
          name: test.name,
          title: `${series.title} - ${test.name}`,
          duration: '60', // Duration in minutes for timer
          questionCount: '50 questions', // Default question count
          type: 'Multiple Choice',
          courseId: test.courseId,
          sectionId: test.sectionId,
          testSectionId: test.testSectionId, // Add test_section_id
          sequenceId: test.sequenceId,
          testType: testType
        };
        break;
      }
    }
    
    // Search in individual tests
    if (!testInfo) {
      const test = individualTests.find(t => t.id === testId);
      if (test) {
        testInfo = {
          id: test.id,
          name: test.name,
          title: `${test.seriesTitle} - ${test.name}`,
          duration: '60', // Duration in minutes for timer
          questionCount: '50 questions',
          type: 'Multiple Choice',
          courseId: test.courseId,
          sectionId: test.sectionId,
          testSectionId: test.testSectionId, // Add test_section_id
          sequenceId: test.sequenceId,
          testType: testType
        };
      }
    }
    
    if (testInfo) {
      // Set current test section in localStorage
      setCurrentTestSection(testInfo.sectionId, testInfo.courseId, testInfo.sequenceId);
      
      // Save sequential section ID to localStorage for TestNavigationBar to use
      if (testInfo.sequenceId) {
        // Extract sequential section ID from sequenceId
        const sequentialSectionId = testInfo.sequenceId.split('block@')[1];
        localStorage.setItem('currentTestSectionId', sequentialSectionId);
      }
      
      setSelectedTest(testInfo);
      setShowTestIntro(true);
    } else {
      alert('Test information not found. Please try again.');
    }
  };

  const handleConfirmStartTest = async (testInfo) => {
    try {
      const result = await startTest(testInfo.id, testInfo.testType, testInfo.courseId, testInfo.sectionId, testInfo.sequenceId);
      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      } else {
        // Fallback to test page
        window.location.href = `/test/${testInfo.id}`;
      }
    } catch (error) {
      console.error('Error starting test:', error);
      alert('Failed to start test. Please try again.');
    }
  };

  const handleBackFromIntro = () => {
    setShowTestIntro(false);
    setSelectedTest(null);
  };

  const renderOverviewStats = () => {
    const completionRate = testStats.totalTests > 0 ? Math.round((testStats.completedTests / testStats.totalTests) * 100) : 0;
    
    return (
      <div className="overview-stats mb-4">
        <div className="row g-3">
          <div className="col-md-2">
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-icon total-tests">📚</div>
                <div className="stat-info">
                  <h3 className="stat-number">{testStats.totalTests}</h3>
                  <p className="stat-label">Total Tests</p>
                </div>
              </div>
            </Card>
          </div>
          <div className="col-md-2">
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-icon completed-tests">✅</div>
                <div className="stat-info">
                  <h3 className="stat-number">{testStats.completedTests}</h3>
                  <p className="stat-label">Completed</p>
                </div>
              </div>
            </Card>
          </div>
          <div className="col-md-2">
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-icon pending-tests">⏳</div>
                <div className="stat-info">
                  <h3 className="stat-number">{testStats.pendingTests}</h3>
                  <p className="stat-label">Pending</p>
                </div>
              </div>
            </Card>
          </div>
          <div className="col-md-2">
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-icon average-score">📊</div>
                <div className="stat-info">
                  <h3 className="stat-number">{testStats.averageScore}%</h3>
                  <p className="stat-label">Average Score</p>
                </div>
              </div>
            </Card>
          </div>
          <div className="col-md-2">
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-icon total-questions">❓</div>
                <div className="stat-info">
                  <h3 className="stat-number">{testStats.totalQuestions}</h3>
                  <p className="stat-label">Total Questions</p>
                </div>
              </div>
            </Card>
          </div>
          <div className="col-md-2">
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-icon total-units">📚</div>
                <div className="stat-info">
                  <h3 className="stat-number">{testStats.totalUnits || 0}</h3>
                  <p className="stat-label">Total Units</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
        <div className="row mt-3">
          <div className="col-12">
            <Card className="progress-overview-card">
              <div className="progress-overview-content">
                <div className="progress-info">
                  <h4>Overall Progress</h4>
                  <p className="text-muted">{testStats.completedTests} of {testStats.totalTests} tests completed</p>
                </div>
                <div className="progress-bar-container">
                  <div className="custom-progress-bar">
                    <div 
                      className="custom-progress-fill"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <span className="progress-percentage">{completionRate}%</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // Function to render unit titles for a test
  const renderUnitTitles = (testId) => {
    const units = testUnitTitles[testId] || [];
    
    if (units.length === 0) {
      return (
        <div className="unit-titles-empty">
          <p className="text-muted mb-0">No unit information available</p>
        </div>
      );
    }

    return (
      <div className="unit-titles">
        <div className="unit-titles-header">
          <h6 className="mb-2">📚 Test Units ({units.length} units)</h6>
        </div>
        <div className="unit-titles-list">
          {units.map((unit, index) => (
            <div key={unit.id} className="unit-title-item">
              <div className="unit-info">
                <span className="unit-title">{unit.title}</span>
                <span className="unit-question-count">
                  ({unit.questionCount || 1} question{unit.questionCount > 1 ? 's' : ''})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Function to render wrong answers details
  const renderWrongAnswers = (testResult) => {
    if (!testResult || !testResult.wrongAnswers || testResult.wrongAnswers.length === 0) {
      return null;
    }

    return (
      <div className="wrong-answers-details mt-2">
        <div className="wrong-answers-header">
          <small className="text-muted">
            ❌ {testResult.wrongAnswers.length} wrong answers
          </small>
        </div>
        <div className="wrong-answers-list">
          {testResult.wrongAnswers.slice(0, 3).map((question, index) => (
            <div key={index} className="wrong-answer-item">
              <small className="text-danger">
                Q{question.question_number || index + 1}: {question.question_text || 'Question text not available'}
              </small>
            </div>
          ))}
          {testResult.wrongAnswers.length > 3 && (
            <small className="text-muted">
              ... and {testResult.wrongAnswers.length - 3} more
            </small>
          )}
        </div>
      </div>
    );
  };

  // Function to fetch test history for a specific test
  const fetchTestHistory = async (testId, sectionId) => {
    try {
      console.log(`🔍 Fetching test history for testId: ${testId}, sectionId: ${sectionId}`);
      
      if (!authenticatedUser) {
        console.log('❌ No authenticated user');
        return;
      }

      const authUser = getAuthenticatedUser();
      const userId = authUser?.userId || authUser?.id || authenticatedUser?.userId || authenticatedUser?.id || 'anonymous';
      
      console.log('🔍 [fetchTestHistory] Using user ID:', userId);
      console.log('🔍 [fetchTestHistory] Auth user:', authUser);
      console.log('🔍 [fetchTestHistory] Context user:', authenticatedUser);
      console.log('🔍 [fetchTestHistory] Section ID:', sectionId);
      
      // Try with specific section ID first
      const lmsBaseUrl = getLmsBaseUrl();
      let apiUrl = `${lmsBaseUrl}/courseware/get_test_summary/?user_id=${userId}&section_id=${sectionId}&limit=10`;
      
      console.log(`📡 API URL (with section): ${apiUrl}`);

      let response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log(`📡 Response status (with section): ${response.status}`);

      let data = null;
      if (response.ok) {
        data = await response.json();
        console.log(`📊 Raw API data (with section):`, data);
      }

      // If no results with specific section ID, try without section filter
      if (!data || !data.success || !data.summaries || data.summaries.length === 0) {
        console.log('🔍 No results with specific section, trying without section filter...');
        apiUrl = `${lmsBaseUrl}/courseware/get_test_summary/?user_id=${userId}&limit=10`;
        
        console.log(`📡 API URL (without section): ${apiUrl}`);

        response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        console.log(`📡 Response status (without section): ${response.status}`);

        if (response.ok) {
          data = await response.json();
          console.log(`📊 Raw API data (without section):`, data);
        }
      }

      if (data && data.success && data.summaries) {
        console.log(`📊 Found ${data.summaries.length} summaries`);
        
        // Filter results for this specific test
        let filteredSummaries = data.summaries
          .filter(summary => {
            console.log(`🔍 Checking summary section_id: ${summary.section_id} against target: ${sectionId}`);
            return summary.section_id === sectionId;
          });

        // If no results found with specific section ID, keep empty array
        if (filteredSummaries.length === 0) {
          console.log('🔍 No test results found for this section');
          filteredSummaries = []; // Keep empty instead of using all results
        }

        // Group summaries by test_session_id
        const groupedSummaries = {};
        filteredSummaries.forEach((summary) => {
          const testSessionId = summary.test_session_id;
          if (!testSessionId) return;
          
          if (!groupedSummaries[testSessionId]) {
            groupedSummaries[testSessionId] = [];
          }
          groupedSummaries[testSessionId].push(summary);
        });

        console.log('🔍 Grouped summaries for test history:', groupedSummaries);

        // Process each test session group and create test history
        const testHistory = Object.entries(groupedSummaries)
          .map(([testSessionId, summaries]) => {
            // Calculate totals for this test session
            let totalCorrectAnswers = 0;
            let totalQuestions = 0; // Will be calculated from Unit Title parsing
            let totalAnsweredQuestions = 0;
            let latestCompletedAt = null;
            
            summaries.forEach((summary) => {
              totalCorrectAnswers += summary.correct_answers || 0; // Sum correct answers
              totalAnsweredQuestions += summary.answered_questions || 0;
              
              // Get the latest completion date
              if (!latestCompletedAt || new Date(summary.completed_at) > new Date(latestCompletedAt)) {
                latestCompletedAt = summary.completed_at;
              }
            });
            
            // Determine total questions for this section (prefer API total, fallback to parsed map)
            if (sectionId) {
              const parsedTotalH = typeof testQuestionCounts[sectionId] === 'number' ? testQuestionCounts[sectionId] : 0;
              const titlesH = testUnitTitles[sectionId] || [];
              const titlesTotalH = Array.isArray(titlesH) ? titlesH.reduce((sum, u) => sum + (u?.questionCount || 1), 0) : 0;
              totalQuestions = parsedTotalH || titlesTotalH || 0;
              console.log('📊 [History] Total questions (Unit Title parsing):', { sectionId, parsedTotalH, titlesTotalH, totalQuestions });
            }
            
            // Calculate wrong answers = total_questions - correct_answers
            const totalIncorrectAnswers = Math.max(0, totalQuestions - totalCorrectAnswers);
            
            // Calculate final score
            const calculatedScore = totalQuestions > 0 ? Math.round((totalCorrectAnswers / totalQuestions) * 100) : 0;
            
            return {
              testSessionId: testSessionId,
              score: calculatedScore,
              correctAnswers: totalCorrectAnswers,
              incorrectAnswers: totalIncorrectAnswers,
              totalQuestions: totalQuestions,
              answeredQuestions: totalAnsweredQuestions,
              completedAt: latestCompletedAt,
              duration: 'N/A',
              groupedFrom: summaries.length
            };
          })
          .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
          .slice(0, 3) // Get only 3 most recent
          .map((summary, index) => ({
            attemptNumber: index + 1,
            score: summary.score,
            correctAnswers: summary.correctAnswers,
            incorrectAnswers: summary.incorrectAnswers,
            totalQuestions: summary.totalQuestions,
            completedAt: summary.completedAt,
            testSessionId: summary.testSessionId,
            duration: summary.duration,
            groupedFrom: summary.groupedFrom
          }));

        console.log(`📊 Processed grouped test history:`, testHistory);

        setTestHistory(prev => ({
          ...prev,
          [testId]: testHistory
        }));
      } else {
        console.log('❌ No successful data or summaries found');
      }
    } catch (error) {
      console.error('❌ Error fetching test history:', error);
    }
  };

  // Function to group tests by course
  const groupTestsByCourse = (tests) => {
    const grouped = {};
    tests.forEach(test => {
      const courseId = test.courseId;
      if (!grouped[courseId]) {
        grouped[courseId] = {
          courseId: courseId,
          courseName: test.seriesTitle?.split(' - ')[0] || 'Unknown Course',
          tests: []
        };
      }
      grouped[courseId].tests.push(test);
    });
    return Object.values(grouped);
  };

  // Function to toggle course expansion
  const toggleCourseExpansion = (courseId) => {
    setExpandedCourseId(expandedCourseId === courseId ? null : courseId);
  };

  // Function to toggle test details
  const toggleTestDetails = async (testId, sectionId) => {
    console.log(`🔍 Toggle test details - testId: ${testId}, sectionId: ${sectionId}`);
    console.log(`🔍 Current expandedTestId: ${expandedTestId}`);
    console.log(`🔍 Current testHistory for this test:`, testHistory[testId]);
    
    if (expandedTestId === testId) {
      console.log('🔍 Collapsing test details');
      setExpandedTestId(null);
    } else {
      console.log('🔍 Expanding test details');
      setExpandedTestId(testId);
      // Fetch test history if not already loaded
      if (!testHistory[testId]) {
        console.log('🔍 Fetching test history...');
        await fetchTestHistory(testId, sectionId);
      } else {
        console.log('🔍 Test history already loaded');
      }
    }
  };

  // Function to render test history
  const renderTestHistory = (testId) => {
    const history = testHistory[testId] || [];
    
    if (history.length === 0) {
      return (
        <div className="test-history-empty">
          <p className="text-muted mb-0">No test attempts found for this section</p>
        </div>
      );
    }

    return (
      <div className="test-history">
        <div className="test-history-header">
          <h6 className="mb-2">📊 Recent Results (Last 3 attempts)</h6>
        </div>
        <div className="test-history-list">
          {history.map((attempt, index) => (
            <div key={index} className="test-history-item">
              <div className="attempt-header">
                <span className="attempt-number">Attempt #{attempt.attemptNumber}</span>
                <span className="attempt-date">
                  {new Date(attempt.completedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="attempt-details">
                <div className="score-info">
                  <span className={`score-badge ${
                    attempt.score === 100 ? 'score-perfect' : 
                    attempt.score >= 70 ? 'score-good' : 
                    attempt.score >= 50 ? 'score-average' : 
                    'score-poor'
                  }`}>
                    {attempt.score}%
                  </span>
                </div>
                <div className="answers-info">
                  <span className="correct-answers">
                    ✅ {attempt.correctAnswers} correct
                  </span>
                  <span className="incorrect-answers">
                    ❌ {attempt.incorrectAnswers} wrong
                  </span>
                  <span className="total-questions">
                    📝 {attempt.totalQuestions} total
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  

  const renderTestTable = () => {
    const groupedCourses = groupTestsByCourse(individualTests);
    
    return (
      <div className="test-table-container">
        <div className="test-table-header">
          <h3 className="table-title">模試テスト一覧 (Test List)</h3>
        </div>
        
        <div className="test-table">
          {groupedCourses.map((course, courseIndex) => {
            const completedInCourse = course.tests.filter(test => {
              const sectionId = test.sequenceId?.split('block@')[1];
              const testResult = Object.values(testResults).find(result => 
                result.sectionId === sectionId
              );
              return testResult ? true : (testCompletionStatus[test.unitId || test.id] || test.completed);
            }).length;
            
            return (
              <div key={course.courseId} className="course-group">
                {/* Course Header */}
                <div 
                  className="course-header clickable-row"
                  onClick={() => toggleCourseExpansion(course.courseId)}
                >
                  <div className="course-info">
                    <h4 className="course-name">
                      {course.courseName}
                      <span className="expand-icon">
                        {expandedCourseId === course.courseId ? ' 🔽' : ' ▶️'}
                      </span>
                    </h4>
                    <div className="course-progress-container">
                      <div className="course-progress-bar">
                        <div 
                          className="course-progress-fill"
                          style={{ 
                            width: `${course.tests.length > 0 ? (completedInCourse / course.tests.length) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <div className="course-stats">
                        <span className="course-progress">
                          {completedInCourse}/{course.tests.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Course Tests */}
                {expandedCourseId === course.courseId && (
                  <div className="course-tests">
                    <div className="table-header">
                      <div className="table-cell header-cell">No</div>
                      <div className="table-cell header-cell">Name</div>
                      <div className="table-cell header-cell">Time</div>
                      <div className="table-cell header-cell questions-header">Questions</div>
                      <div className="table-cell header-cell">Attempts</div>
                      <div className="table-cell header-cell score-header">Score</div>
                      <div className="table-cell header-cell">Action</div>
                    </div>
                    
                    {course.tests.map((test, testIndex) => {
            // Use sequence ID as the primary testId for matching
            const testId = test.sequenceId?.split('block@')[1] || test.unitId || test.id;
            const sectionId = test.sequenceId?.split('block@')[1];
            
            // Find test result by matching sectionId with test's sequenceId
            const testResult = Object.values(testResults).find(result => 
              result.sectionId === sectionId
            );
            
            // Use test result data for completion status and attempts
            const isCompleted = testResult ? true : (testCompletionStatus[testId] || test.completed);
            const attempts = testResult ? 1 : (testAttempts[testId] || 0);
            const maxAttempts = 3;
            const hasAttempted = attempts > 0;
            const score = testResult?.score || 0;
            
            // Debug test result data
            if (testResult) {
              console.log(`🔍 Test "${test.name}" result:`, {
                totalQuestions: testResult.totalQuestions,
                correctAnswers: testResult.correctAnswers,
                incorrectAnswers: testResult.incorrectAnswers,
                sectionId: testResult.sectionId,
                testSessionId: testResult.testSessionId
              });
            } else {
              console.log(`🔍 No test result found for "${test.name}" with sequenceId: ${test.sequenceId?.split('block@')[1]}`);
            }
            
            // Decide displayed question count and source, and log decision
            const displayedDecision = (() => {
              if (testResult?.totalQuestions) {
                return { displayedQuestions: testResult.totalQuestions, source: 'testResult' };
              }
              if (testQuestionCounts[testId]) {
                return { displayedQuestions: testQuestionCounts[testId], source: 'testQuestionCounts' };
              }
              return { displayedQuestions: null, source: 'none' };
            })();

            // Use the same total for both the Questions column and Score breakdown
            const computedTotalQuestions = displayedDecision.displayedQuestions || 0;
            const computedCorrectAnswers = testResult?.correctAnswers || 0;
            const computedIncorrectAnswers = Math.max(0, computedTotalQuestions - computedCorrectAnswers);
            const computedScore = computedTotalQuestions > 0
              ? Math.round((computedCorrectAnswers / computedTotalQuestions) * 100)
              : (testResult?.score || 0);

            return (
              <React.Fragment key={test.id}>
                <div 
                  className={`table-row ${expandedTestId === testId ? 'expanded' : ''} clickable-row`}
                  onClick={() => {
                    // Use section ID from test result if available, otherwise use sequence ID
                    const sectionId = testResult?.sectionId || test.sequenceId?.split('block@')[1];
                    toggleTestDetails(testId, sectionId);
                  }}
                >
                  <div className="table-cell">{testIndex + 1}</div>
                  <div className="table-cell test-name-cell">
                    <div className="test-name">
                      {test.name}
                      <span className="expand-icon">
                        {expandedTestId === testId ? ' 🔽' : ' ▶️'}
                      </span>
                    </div>
                    {test.seriesTitle && (
                      <div className="test-series-name">{test.seriesTitle}</div>
                    )}
                  </div>
                  <div className="table-cell">60 minutes</div>
                  <div className="table-cell">
                    <div className="question-count-info">
                      {displayedDecision.displayedQuestions !== null ? (
                        <span className="question-count">{displayedDecision.displayedQuestions}</span>
                      ) : (
                        <span className="question-count-loading">-</span>
                      )}
                    </div>
                  </div>
                  <div className="table-cell">
                    <div className={`attempts-badge ${hasAttempted ? 'attempted' : 'not-attempted'}`}>
                      {attempts}/{maxAttempts}
                    </div>
                  </div>
                  <div className="table-cell">
                    {isCompleted ? (
                      <div className="score-details">
                        <span className={`score-display ${
                          computedScore === 100 ? 'score-perfect' : 
                          computedScore > 0 ? 'score-partial' : 
                          'score-zero'
                        }`}>
                          {computedScore}%
                        </span>
                        {testResult && (
                          <div className="score-breakdown">
                            <small className="text-muted">
                              {computedCorrectAnswers}/{computedTotalQuestions} correct
                            </small>
                            {computedIncorrectAnswers > 0 && (
                              <small className="text-danger d-block">
                                {computedIncorrectAnswers} wrong
                              </small>
                            )}
                          </div>
                        )}
                        {renderWrongAnswers(testResult)}
                      </div>
                    ) : (
                      <span className="no-results">-</span>
                    )}
                  </div>
                  <div className="table-cell">
                    <Button
                      variant={isCompleted ? 'outline-primary' : 'primary'}
                      size="sm"
                      className="action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartTest(
                          test.id, 
                          'individual', 
                          test.courseId, 
                          test.sectionId, 
                          test.sequenceId
                        );
                      }}
                    >
                      {isCompleted ? 'Redo' : 'Start'}
                    </Button>
                  </div>
                </div>
                
                {/* Expanded row for test history and unit titles */}
                {expandedTestId === testId && (
                  <div className="table-row-expanded">
                    <div className="expanded-content">
                      <div className="row">
                        <div className="col-md-6">
                          {renderTestHistory(testId)}
                        </div>
                        <div className="col-md-6">
                          {renderUnitTitles(testId)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };



  // Show TestIntroPage if selected
  if (showTestIntro && selectedTest) {
    return (
      <TestIntroPage
        intl={intl}
        testInfo={selectedTest}
        onStartTest={handleConfirmStartTest}
        onBack={handleBackFromIntro}
      />
    );
  }

  if (!authenticatedUser) {
    return (
      <div className="d-flex flex-column min-vh-100">
        <LearningHeader intl={intl} courses={[]} preloadedData={preloadedData} setPreloadedData={setPreloadedData} />
        <main className="flex-grow-1">
          <div className="test-series-page">
            <div className="login-prompt">
              <h2>Please log in to view your test progress</h2>
              <Button
                variant="primary"
                onClick={() => window.location.href = '/login'}
              >
                Login
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex flex-column min-vh-100">
        <LearningHeader intl={intl} courses={[]} preloadedData={preloadedData} setPreloadedData={setPreloadedData} />
        <main className="flex-grow-1">
          <div className="test-series-page">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading test data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex flex-column min-vh-100">
        <LearningHeader intl={intl} courses={[]} preloadedData={preloadedData} setPreloadedData={setPreloadedData} />
        <main className="flex-grow-1">
          <div className="test-series-page">
            <div className="error-container">
              <Alert variant="danger">
                {error}
              </Alert>
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <LearningHeader intl={intl} courses={[]} preloadedData={preloadedData} setPreloadedData={setPreloadedData} isTestMode={false} />
      <main className="flex-grow-1">
        <div className="test-series-page">
          <div className="container-xl py-4">
            <div className="page-header mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="h2 mb-2">模試テスト (Test Series)</h1>
                  <p className="text-muted">Track your progress and take practice tests</p>
                </div>
              </div>
            </div>

            {renderOverviewStats()}


            <div className="tab-content">
              {renderTestTable()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

TestSeriesPage.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(TestSeriesPage);
