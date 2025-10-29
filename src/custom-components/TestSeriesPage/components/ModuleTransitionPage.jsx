import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@openedx/paragon';
import { useNavigate } from 'react-router-dom';

/**
 * Module Transition Page - shown when moving between modules
 * Example: From quiz 1.4 (Module 1) to quiz 2.1 (Module 2)
 */
const ModuleTransitionPage = ({ 
  currentModule, 
  nextModule, 
  nextLink,
  onContinue,
  onCompleteTest
}) => {
  const navigate = useNavigate();

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else if (nextLink) {
      navigate(nextLink);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '12px',
        maxWidth: '600px',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem'
        }}>
          ✅
        </div>
        
        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#333'
        }}>
          {nextModule ? `Module ${currentModule} Completed!` : 'All Modules Completed!'}
        </h2>
        
        <p style={{
          fontSize: '1.1rem',
          color: '#666',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          {nextModule ? (
            <>
              You have completed all quizzes in Module {currentModule}.<br/>
              Ready to move on to Module {nextModule}?
            </>
          ) : (
            <>
              Congratulations! You have completed all modules in this test.<br/>
              Great job on finishing Module {currentModule}!
            </>
          )}
        </p>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <Button
            variant="outline-secondary"
            onClick={() => window.history.back()}
            style={{
              padding: '0.75rem 2rem',
              fontWeight: '600'
            }}
          >
            {nextModule ? `Review Module ${currentModule}` : 'Review Test'}
          </Button>
          
          {nextModule ? (
            <Button
              variant="primary"
              onClick={handleContinue}
              style={{
                padding: '0.75rem 2rem',
                fontWeight: '600',
                backgroundColor: '#0097a9',
                borderColor: '#0097a9'
              }}
            >
              Continue to Module {nextModule} →
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                if (onCompleteTest) {
                  onCompleteTest();
                } else {
                  navigate('/learning');
                }
              }}
              style={{
                padding: '0.75rem 2rem',
                fontWeight: '600',
                backgroundColor: '#0097a9',
                borderColor: '#0097a9'
              }}
            >
              Back to Learning Home
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

ModuleTransitionPage.propTypes = {
  currentModule: PropTypes.number.isRequired,
  nextModule: PropTypes.number, // Nullable for final module
  nextLink: PropTypes.string,
  onContinue: PropTypes.func,
  onCompleteTest: PropTypes.func,
};

export default ModuleTransitionPage;

