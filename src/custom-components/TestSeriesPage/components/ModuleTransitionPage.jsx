import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@openedx/paragon';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';

/**
 * Module Transition Page - shown when moving between modules
 * Example: From quiz 1.4 (Module 1) to quiz 2.1 (Module 2)
 * 
 * This component can be used in two ways:
 * 1. As a standalone page (reads data from localStorage)
 * 2. As a component with props (for backward compatibility)
 */
const ModuleTransitionPage = ({ 
  currentModule: propCurrentModule, 
  nextModule: propNextModule, 
  nextLink: propNextLink,
  onContinue: propOnContinue,
  onCompleteTest: propOnCompleteTest
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [transitionData, setTransitionData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Prevent back navigation when on transition page
  useEffect(() => {
    // Push current state to history to prevent back navigation
    window.history.pushState(null, null, window.location.href);
    
    const handlePopState = (event) => {
      // Prevent going back - push state again
      window.history.pushState(null, null, window.location.href);
      console.log('🚫 [ModuleTransitionPage] Back navigation prevented');
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Read data from localStorage if used as standalone page
  useEffect(() => {
    // If props are provided, use them (backward compatibility)
    if (propCurrentModule !== undefined) {
      setTransitionData({
        currentModule: propCurrentModule,
        nextModule: propNextModule,
        nextLink: propNextLink
      });
      setLoading(false);
      return;
    }

    // Otherwise, read from localStorage or URL params
    const sequenceId = searchParams.get('sequenceId') || localStorage.getItem('moduleTransition_sequenceId');
    const unitId = searchParams.get('unitId') || localStorage.getItem('moduleTransition_unitId');
    
    if (sequenceId && unitId) {
      const transitionKey = `moduleTransition_${sequenceId}_${unitId}`;
      const savedTransition = localStorage.getItem(transitionKey);
      
      if (savedTransition) {
        try {
          const data = JSON.parse(savedTransition);
          setTransitionData(data);
          console.log('📖 [ModuleTransitionPage] Loaded transition data:', data);
        } catch (error) {
          console.error('❌ Error parsing transition data:', error);
        }
      }
    }
    
    setLoading(false);
  }, [propCurrentModule, propNextModule, propNextLink, searchParams]);

  const handleContinue = async () => {
    // If onContinue prop is provided, use it
    if (propOnContinue) {
      await propOnContinue();
      return;
    }

    // Otherwise, handle navigation
    const nextLink = transitionData?.nextLink || propNextLink;
    
    if (nextLink) {
      // Clear transition state before navigating
      const sequenceId = searchParams.get('sequenceId') || localStorage.getItem('moduleTransition_sequenceId');
      const unitId = searchParams.get('unitId') || localStorage.getItem('moduleTransition_unitId');
      
      if (sequenceId && unitId) {
        const transitionKey = `moduleTransition_${sequenceId}_${unitId}`;
        localStorage.removeItem(transitionKey);
        // Clear transition active flag
        localStorage.removeItem(`moduleTransitionActive_${sequenceId}`);
        console.log('🗑️ [ModuleTransitionPage] Cleared transition state:', transitionKey);
      }
      
      // Dispatch event to notify timer can resume
      window.dispatchEvent(new Event('transitionPageInactive'));
      
      navigate(nextLink);
    } else {
      // No next link - final module, navigate to learning home
      console.log('🏁 [ModuleTransitionPage] Final module completed, navigating to learning home');
      navigate('/');
    }
  };

  const handleCompleteTest = async () => {
    if (propOnCompleteTest) {
      await propOnCompleteTest();
      return;
    }

    // Get test session ID and user info
    const testSessionId = localStorage.getItem('currentTestSessionId');
    const authUser = getAuthenticatedUser();
    const userId = authUser?.id || authUser?.userId || 'anonymous';

    if (!testSessionId) {
      console.error('❌ No test session ID found');
      navigate('/');
      return;
    }

    try {
      const lmsBaseUrl = getConfig().LMS_BASE_URL;
      const summaryUrl = `${lmsBaseUrl}/courseware/get_test_summary/?user_id=${userId}&test_session_id=${testSessionId}`;
      
      const response = await fetch(summaryUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('testSummary', JSON.stringify(data.summary));
        localStorage.setItem('testCompleted', JSON.stringify({
          testSessionId: testSessionId,
          completedAt: new Date().toISOString(),
          summary: data.summary
        }));
        localStorage.removeItem('currentTestSessionId');
        
        navigate('/test-series/intro');
      } else {
        console.error('❌ Failed to get test summary:', data.error);
        navigate('/');
      }
    } catch (error) {
      console.error('❌ Error completing test:', error);
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  const currentModule = transitionData?.currentModule || propCurrentModule;
  const nextModule = transitionData?.nextModule || propNextModule;

  if (!currentModule) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '12px',
          maxWidth: '600px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2>No transition data found</h2>
          <Button
            variant="primary"
            onClick={() => navigate('/')}
            style={{ marginTop: '1rem' }}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '16px',
        maxWidth: '700px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          fontSize: '5rem',
          marginBottom: '1.5rem',
          animation: 'bounce 1s ease-in-out'
        }}>
          ✅
        </div>
        
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#333'
        }}>
          {nextModule && nextModule !== currentModule ? (
            `Module ${currentModule} Completed!`
          ) : nextModule ? (
            `Module ${currentModule} Completed!`
          ) : (
            'All Modules Completed!'
          )}
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          color: '#666',
          marginBottom: '3rem',
          lineHeight: '1.8'
        }}>
          {nextModule && nextModule !== currentModule ? (
            <>
              You have completed all quizzes in <strong>Module {currentModule}</strong>.<br/>
              Ready to move on to <strong>Module {nextModule}</strong>?
            </>
          ) : nextModule ? (
            <>
              You have completed all quizzes in <strong>Module {currentModule}</strong>.<br/>
              Continue with the remaining quizzes?
            </>
          ) : (
            <>
              Congratulations! You have completed all modules in this test.<br/>
              Great job on finishing <strong>Module {currentModule}</strong>!
            </>
          )}
        </p>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Review button removed - cannot go back from transition page */}
          
          {nextModule && nextModule !== currentModule ? (
            <Button
              variant="primary"
              onClick={handleContinue}
              style={{
                padding: '0.75rem 2rem',
                fontWeight: '600',
                fontSize: '1rem',
                backgroundColor: '#0097a9',
                borderColor: '#0097a9'
              }}
            >
              Next Module →
            </Button>
          ) : nextModule ? (
            <Button
              variant="primary"
              onClick={handleContinue}
              style={{
                padding: '0.75rem 2rem',
                fontWeight: '600',
                fontSize: '1rem',
                backgroundColor: '#0097a9',
                borderColor: '#0097a9'
              }}
            >
              Next Module →
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleCompleteTest}
              style={{
                padding: '0.75rem 2rem',
                fontWeight: '600',
                fontSize: '1rem',
                backgroundColor: '#0097a9',
                borderColor: '#0097a9'
              }}
            >
              Complete Test
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

ModuleTransitionPage.propTypes = {
  currentModule: PropTypes.number,
  nextModule: PropTypes.number,
  nextLink: PropTypes.string,
  onContinue: PropTypes.func,
  onCompleteTest: PropTypes.func,
};

export default ModuleTransitionPage;

