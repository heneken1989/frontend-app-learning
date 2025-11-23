import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TestResultsPage.scss';

/**
 * Test Results Page - Displays test completion results
 * Shows module-by-module breakdown and total score
 */
const TestResultsPage = () => {
  const navigate = useNavigate();
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load results from localStorage
    const savedResults = localStorage.getItem('testResults');
    
    if (!savedResults) {
      console.warn('⚠️ No test results found, redirecting to home');
      navigate('/');
      return;
    }

    try {
      const results = JSON.parse(savedResults);
      console.log('📊 Loaded test results:', results);
      setResultsData(results);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error parsing test results:', error);
      navigate('/');
    }
  }, [navigate]);

  const handleBackToHome = () => {
    // Clear results from localStorage
    localStorage.removeItem('testResults');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="test-results-page loading">
        <div className="loading-spinner">Loading results...</div>
      </div>
    );
  }

  if (!resultsData || !resultsData.moduleScores) {
    return null;
  }

  const { moduleScores, completedAt, testSessionId } = resultsData;
  
  // Calculate total score
  let totalCorrect = 0;
  let totalQuestions = 0;
  
  Object.values(moduleScores).forEach(score => {
    totalCorrect += score.correct || 0;
    totalQuestions += score.total || 0;
  });
  
  const percentageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <div className="test-results-page">
      <div className="test-results-container">
        <div className="test-results-header">
          <h1>🏁 Test Completed!</h1>
          <p className="completion-time">
            Completed at: {new Date(completedAt).toLocaleString('ja-JP')}
          </p>
          {testSessionId && (
            <p className="session-id">Session ID: {testSessionId}</p>
          )}
        </div>

        <div className="test-results-summary">
          <div className="total-score-card">
            <h2>Total Score</h2>
            <div className="score-display">
              <span className="score-number">
                {totalCorrect} / {totalQuestions} correct
              </span>
            </div>
          </div>
        </div>

        <div className="module-results-section">
          <h2>Results by Module</h2>
          <div className="module-results-list">
            {Object.keys(moduleScores)
              .sort((a, b) => Number(a) - Number(b))
              .map(moduleNum => {
                const score = moduleScores[moduleNum];
                const modulePercentage = score.total > 0 
                  ? Math.round((score.correct / score.total) * 100) 
                  : 0;
                
                return (
                  <div key={moduleNum} className="module-result-item">
                    <div className="module-info">
                      <span className="module-label">Module {moduleNum}</span>
                      <span className="module-score">
                        {score.correct} / {score.total} correct
                      </span>
                    </div>
                    <div className="module-progress">
                      <div 
                        className="module-progress-bar" 
                        style={{ width: `${modulePercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="test-results-actions">
          <button 
            className="btn-back-home"
            onClick={handleBackToHome}
          >
            ⬅️ Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestResultsPage;

