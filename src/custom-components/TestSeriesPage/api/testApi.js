import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';
import {
  fetchAllCourses, fetchSectionsByCourseId, fetchSequencesBySectionId,
} from '../../../courseware/course/sequence/Unit/urls';
import { setCurrentTestSection } from '../utils/testSectionManager';

const API_BASE_URL = getConfig().LMS_BASE_URL;

export const fetchTestSeries = async () => {
  try {
    // Fetch all courses
    const courses = await fetchAllCourses();
    
    // Filter courses that contain "模試テスト" in their display name
    const testCourses = courses.filter(course => 
      (course.display_name || '').toLowerCase().includes('模試テスト') ||
      (course.display_name || '').toLowerCase().includes('mock test')
    );

    const testSeries = [];

    // Process each test course
    for (const course of testCourses) {
      try {
        // Fetch sections for this course
        const sections = await fetchSectionsByCourseId(course.id);
        
        // Find sections that contain "模試テスト" or "mock test"
        const testSections = sections.filter(section => 
          (section.display_name || '').toLowerCase().includes('模試テスト') ||
          (section.display_name || '').toLowerCase().includes('mock test')
        );

        // Process each test section
        for (const section of testSections) {
          try {
            // Fetch sequences (subsections) for this section
            const sequences = await fetchSequencesBySectionId(section.id);
            
            if (sequences && sequences.length > 0) {
              // Create test series entry
              const testSeriesEntry = {
                id: `${course.id}-${section.id}`,
                title: `${course.display_name} - ${section.display_name}`,
                courseId: course.id,
                sectionId: section.id,
                progress: 0, // TODO: Calculate actual progress
                total: sequences.length,
                type: 'series',
                tests: sequences.map(seq => ({
                  id: seq.id,
                  name: seq.display_name,
                  completed: false, // TODO: Check actual completion status
                  score: null, // TODO: Get actual score
                  courseId: course.id,
                  sectionId: section.id,
                  sequenceId: seq.id
                }))
              };
              
              testSeries.push(testSeriesEntry);
            }
          } catch (sectionError) {
            console.warn(`Failed to fetch sequences for section ${section.id}:`, sectionError);
          }
        }
      } catch (courseError) {
        console.warn(`Failed to fetch sections for course ${course.id}:`, courseError);
      }
    }

    return testSeries;
  } catch (error) {
    console.error('Error fetching test series:', error);
    // Return mock data as fallback
    return [
      {
        id: 'mock-1',
        title: '模試テスト N5 Mock Test Series',
        progress: 2,
        total: 3,
        type: 'series',
        tests: [
          { id: 'mock-1-1', name: 'N5 Mock Test 1', completed: true, score: 85 },
          { id: 'mock-1-2', name: 'N5 Mock Test 2', completed: true, score: 78 },
          { id: 'mock-1-3', name: 'N5 Mock Test 3', completed: false, score: null }
        ]
      },
      {
        id: 'mock-2',
        title: '模試テスト N4 Mock Test Series',
        progress: 1,
        total: 3,
        type: 'series',
        tests: [
          { id: 'mock-2-1', name: 'N4 Mock Test 1', completed: true, score: 82 },
          { id: 'mock-2-2', name: 'N4 Mock Test 2', completed: false, score: null },
          { id: 'mock-2-3', name: 'N4 Mock Test 3', completed: false, score: null }
        ]
      }
    ];
  }
};

export const fetchIndividualTests = async () => {
  try {
    // Use the same logic as fetchTestSeries but flatten all individual tests
    const testSeries = await fetchTestSeries();
    
    // Flatten all individual tests from all series
    const individualTests = [];
    testSeries.forEach(series => {
      series.tests.forEach(test => {
        individualTests.push({
          ...test,
          seriesTitle: series.title,
          seriesId: series.id
        });
      });
    });
    
    return individualTests;
  } catch (error) {
    console.error('Error fetching individual tests:', error);
    // Return mock data as fallback
    return [
      { id: 'mock-ind-1', name: 'N5 Grammar Practice Test', completed: true, score: 90, type: 'individual' },
      { id: 'mock-ind-2', name: 'N5 Vocabulary Test', completed: false, score: null, type: 'individual' },
      { id: 'mock-ind-3', name: 'N4 Reading Comprehension', completed: true, score: 88, type: 'individual' },
      { id: 'mock-ind-4', name: 'N4 Listening Test', completed: false, score: null, type: 'individual' }
    ];
  }
};

export const startTest = async (testId, testType, courseId, sectionId, sequenceId) => {
  try {
    // If we have course/section/sequence info, redirect directly to the first unit
    if (courseId && sectionId && sequenceId) {
      // Get the first unit ID from the sequence
      try {
        const sequences = await fetchSequencesBySectionId(sectionId);
        const targetSequence = sequences.find(seq => seq.id === sequenceId);
        
        if (targetSequence && targetSequence.unitIds && targetSequence.unitIds.length > 0) {
          const firstUnitId = targetSequence.unitIds[0];
          
          // Set current test section in localStorage for test mode detection
          setCurrentTestSection(sectionId, courseId, sequenceId);
          
          const redirectUrl = `/learning/course/${encodeURIComponent(courseId)}/${encodeURIComponent(sequenceId)}/${encodeURIComponent(firstUnitId)}`;
          
          console.log('🎯 [startTest] Redirecting directly to first unit:', {
            courseId,
            sectionId,
            sequenceId,
            firstUnitId,
            redirectUrl
          });
          
          return { redirect_url: redirectUrl };
        }
      } catch (error) {
        console.warn('Failed to fetch sequence details, falling back to progress page:', error);
      }
      
      // Fallback: redirect to sequence page if we can't get unit details
      const redirectUrl = `/learning/course/${encodeURIComponent(courseId)}/${encodeURIComponent(sequenceId)}`;
      return { redirect_url: redirectUrl };
    }

    // Fallback: try API call
    const client = getAuthenticatedHttpClient();
    const response = await client.post(`${API_BASE_URL}/api/tests/${testId}/start/`, {
      test_type: testType
    });
    return response.data;
  } catch (error) {
    console.error('Error starting test:', error);
    throw error;
  }
};

export const getTestProgress = async (testId) => {
  try {
    const client = getAuthenticatedHttpClient();
    const response = await client.get(`${API_BASE_URL}/api/tests/${testId}/progress/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching test progress:', error);
    throw error;
  }
};
