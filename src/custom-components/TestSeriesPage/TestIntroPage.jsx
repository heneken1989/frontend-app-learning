import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { AppContext } from '@edx/frontend-platform/react';
import { Button } from '@openedx/paragon';
import LearningHeader from '../Header/src/learning-header/LearningHeader';
import Footer from '../Footer';
import TestTimer from './TestTimer';
import './TestIntroPage.scss';

const TestResultCard = ({ summaries }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  return (
    <div className="results-card">
      <div className="results-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h4>View All Test Results ({summaries.length} tests)</h4>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="results-details">
          {summaries.map((summary, summaryIndex) => (
            <div key={summary.test_session_id} className="test-summary">
              <h4>Test #{summaries.length - summaryIndex}</h4>
              <div className="results-stats">
                <div className="stat-item">
                  <span className="stat-label">Score:</span>
                  <span className="stat-value">{summary.percentage}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Correct:</span>
                  <span className="stat-value">{summary.correct_answers}/{summary.total_questions}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Completed:</span>
                  <span className="stat-value">
                    {new Date(summary.completed_at).toLocaleString()}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Questions Answered:</span>
                  <span className="stat-value">{summary.answered_questions}/{summary.total_questions}</span>
                </div>
              </div>
              <div className="question-results">
                {summary.questions.map((question, index) => (
                  <div 
                    key={question.unit_id} 
                    className={`question-result ${
                      question.status === 'not_answered' 
                        ? 'not-answered'
                        : question.is_correct 
                          ? 'correct' 
                          : 'incorrect'
                    }`}
                  >
                    <span className="question-number">Q{index + 1}</span>
                    <span className="question-score">{question.score}</span>
                    <span className="question-status">
                      {question.status === 'not_answered' 
                        ? '⚪' 
                        : question.is_correct 
                          ? '✅' 
                          : '❌'
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

TestResultCard.propTypes = {
  summaries: PropTypes.arrayOf(
    PropTypes.shape({
      percentage: PropTypes.number.isRequired,
      correct_answers: PropTypes.number.isRequired,
      total_questions: PropTypes.number.isRequired,
      answered_questions: PropTypes.number.isRequired,
      completed_at: PropTypes.string.isRequired,
      questions: PropTypes.arrayOf(
        PropTypes.shape({
          unit_id: PropTypes.string.isRequired,
          score: PropTypes.number.isRequired,
          is_correct: PropTypes.bool.isRequired,
          status: PropTypes.string.isRequired
        })
      ).isRequired
    })
  ).isRequired
};

const TestIntroPage = ({ intl, testInfo, onStartTest, onBack }) => {
  const { authenticatedUser } = React.useContext(AppContext);
  const [testSummaries, setTestSummaries] = React.useState([]);
  const [showSummary, setShowSummary] = React.useState(false);

  const handleStartTest = () => {
    // Create new test session when starting test
    const sessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('currentTestSessionId', sessionId);
    console.log('🆔 Starting new test with session ID:', sessionId);
    
    if (onStartTest) {
      onStartTest(testInfo);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  // Fetch recent test summaries from the API when component mounts
  React.useEffect(() => {
    const fetchTestSummaries = async () => {
      try {
        console.log('🔍 Starting to fetch test summaries...');
        console.log('📋 Test Info:', testInfo);

        // Get user info from AppContext first
        console.log('👤 Auth Context User:', authenticatedUser);
        
        if (!authenticatedUser) {
          console.error('❌ No authenticated user in AppContext');
          return;
        }

        // First get all test results to find the correct section_id
        // Get dynamic LMS base URL
        const lmsBaseUrl = window.location.hostname === 'localhost' || window.location.hostname.includes('local.openedx.io')
          ? 'http://local.openedx.io:8000'
          : 'https://lms.nihongodrill.com';
        const debugUrl = `${lmsBaseUrl}/courseware/get_test_summary/?user_id=${authenticatedUser.username}`;
        console.log('🔍 Fetching all test results:', debugUrl);
        const debugResponse = await fetch(debugUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        const debugData = await debugResponse.json();
        console.log('📊 All test results:', debugData);

        // Get section_id from test results if available
        let sectionId = null;
        if (debugData.success && debugData.summaries && debugData.summaries.length > 0) {
          sectionId = debugData.summaries[0].section_id;
          console.log('📑 Found section ID from test results:', sectionId);
        } else {
          // Fallback to testInfo
          sectionId = testInfo?.sectionId;
          console.log('📑 Using section ID from testInfo:', sectionId);
        }
        
        if (!sectionId) {
          console.error('❌ No section ID found');
          return;
        }

        const apiUrl = `${lmsBaseUrl}/courseware/get_test_summary/?user_id=${authenticatedUser.username}&section_id=${sectionId}&limit=3`;
        console.log('🌐 Fetching from URL:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        console.log('📥 API Response Status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error Response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 API Response Data:', data);

        if (data.success && data.summaries) {
          console.log('📊 Setting test summaries:', data.summaries);
          setTestSummaries(data.summaries);
          setShowSummary(true);
        } else {
          console.warn('⚠️ No summaries in response or success is false');
        }
      } catch (error) {
        console.error('❌ Error fetching test summaries:', error);
      }
    };

    if (testInfo?.sectionId) {
      console.log('🎯 Section ID changed, fetching summaries...');
      fetchTestSummaries();
    } else {
      console.log('⏳ Waiting for section ID...');
    }
  }, [testInfo?.sectionId, authenticatedUser]);

  const handleViewResults = () => {
    setShowSummary(true);
  };

  const handleStartNewTest = () => {
    // Keep the summary but hide it
    setShowSummary(false);
    
    // Create new test session for new test
    const sessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('currentTestSessionId', sessionId);
    console.log('🆔 Starting new test (Take Test Again) with session ID:', sessionId);
    
    handleStartTest();
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <LearningHeader 
        intl={intl} 
        courses={[]} 
        preloadedData={{}} 
        setPreloadedData={() => {}}
      />
      <main className="flex-grow-1 test-intro-main">
        <div className="test-intro-container">
          <div className="test-intro-content">
            <div className="test-intro-header">
              <h1 className="test-intro-title">{testInfo?.title || 'Test Introduction'}</h1>
              <p className="test-intro-subtitle">Are you ready to take the test?</p>
            </div>

            <div className="test-intro-details">
              <div className="test-info-card">
                <h3>Test Information</h3>
                <div className="test-info-grid">
                  <div className="test-info-item">
                    <span className="test-info-label">Test Name:</span>
                    <span className="test-info-value">{testInfo?.name || 'Mock Test'}</span>
                  </div>
                  <div className="test-info-item">
                    <span className="test-info-label">Duration:</span>
                    <span className="test-info-value">{testInfo?.duration ? `${testInfo.duration} minutes` : '60 minutes'}</span>
                  </div>
                  <div className="test-info-item">
                    <span className="test-info-label">Questions:</span>
                    <span className="test-info-value">{testInfo?.questionCount || '50 questions'}</span>
                  </div>
                  <div className="test-info-item">
                    <span className="test-info-label">Type:</span>
                    <span className="test-info-value">{testInfo?.type || 'Multiple Choice'}</span>
                  </div>
                </div>
              </div>

              <div className="test-instructions">
                <h3>Instructions</h3>
                <ul className="instruction-list">
                  <li>Read each question carefully before selecting your answer</li>
                  <li>You can navigate between questions using the navigation buttons</li>
                  <li>Make sure to save your answers before moving to the next question</li>
                  <li>You can review and change your answers before submitting</li>
                  <li>Once submitted, you cannot change your answers</li>
                </ul>
              </div>

              <div className="test-requirements">
                <h3>Requirements</h3>
                <ul className="requirement-list">
                  <li>Stable internet connection</li>
                  <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                  <li>JavaScript enabled</li>
                  <li>Quiet environment for concentration</li>
                </ul>
              </div>
            </div>

            {/* Test Results Summary */}
            {testSummaries.length > 0 && showSummary && (
              <div className="test-results-summary">
                <h3>🎉 Recent Test Results</h3>
                <TestResultCard 
                  summaries={testSummaries}
                />
              </div>
            )}

            <div className="test-intro-actions">
              <Button
                variant="outline-secondary"
                size="lg"
                onClick={handleBack}
                className="back-button"
              >
                ← Back to Test Series
              </Button>
              
              {testSummaries.length > 0 ? (
                <>
                  <Button
                    variant="outline-primary"
                    size="lg"
                    onClick={handleViewResults}
                    className="view-results-button"
                  >
                    📊 View Results
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleStartNewTest}
                    className="start-test-button"
                  >
                    🔄 Take Test Again
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartTest}
                  className="start-test-button"
                >
                  Yes, take it now
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

TestIntroPage.propTypes = {
  intl: intlShape.isRequired,
  testInfo: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    title: PropTypes.string,
    duration: PropTypes.string,
    questionCount: PropTypes.string,
    type: PropTypes.string,
    courseId: PropTypes.string,
    sectionId: PropTypes.string,
    sequenceId: PropTypes.string,
    unitId: PropTypes.string,
  }),
  onStartTest: PropTypes.func,
  onBack: PropTypes.func,
};

export default injectIntl(TestIntroPage);