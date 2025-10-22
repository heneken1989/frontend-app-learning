import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { AppContext } from '@edx/frontend-platform/react';
import { useModel } from '@src/generic/model-store';
import TestTimer from '../TestTimer';
import './TestHeader.scss';

const TestHeader = ({ 
  intl, 
  testName, 
  testTimeInMinutes, 
  onTestTimeExpired,
  onTestTimeUpdate,
  currentQuestion = 1,
  totalQuestions = 32,
  unitId,
  sequenceId
}) => {
  const { authenticatedUser } = React.useContext(AppContext);
  const [timeLeft, setTimeLeft] = React.useState(testTimeInMinutes * 60 || 3600);
  
  // Get unit and sequence data from model store (similar to PersistentNavigationBar)
  const unit = useModel('units', unitId);
  const sequence = useModel('sequences', sequenceId);
  
  // Get current question number from unit title (similar to PersistentNavigationBar logic)
  const getCurrentQuestionNumber = () => {
    if (unit && unit.title) {
      // Extract number from title (e.g., "Unit 109" -> "109")
      const numberMatch = unit.title.match(/(\d+)/);
      if (numberMatch) {
        return parseInt(numberMatch[1], 10);
      }
    }
    
    // Fallback: extract from unitId
    if (unitId) {
      const match = unitId.match(/block@([a-f0-9]+)/);
      if (match) {
        const blockId = match[1];
        const numberMatch = blockId.match(/(\d{3})/);
        if (numberMatch) {
          return parseInt(numberMatch[1], 10);
        }
        return parseInt(blockId.substring(0, 3), 10);
      }
    }
    return currentQuestion;
  };
  
  // Get total questions from sequence data
  const getTotalQuestions = () => {
    // Get total units from sequence
    if (sequence && sequence.unitIds && Array.isArray(sequence.unitIds)) {
      return sequence.unitIds.length;
    }
    
    // Fallback to prop value or default
    return totalQuestions;
  };
  
  // Get current question position in sequence
  const getCurrentQuestionPosition = () => {
    if (sequence && sequence.unitIds && unitId) {
      const unitIndex = sequence.unitIds.indexOf(unitId);
      return unitIndex >= 0 ? unitIndex + 1 : getCurrentQuestionNumber();
    }
    return getCurrentQuestionNumber();
  };
  
  const actualCurrentQuestion = getCurrentQuestionPosition();
  const actualTotalQuestions = getTotalQuestions();
  

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update time every second
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTestTimeExpired && onTestTimeExpired();
          return 0;
        }
        onTestTimeUpdate && onTestTimeUpdate(prev - 1);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTestTimeExpired, onTestTimeUpdate]);

  return (
    <header className="test-header">
      <div className="test-header-container">
        {/* Left: Test Name */}
        <div className="test-header-title">
          <h1 className="test-title">{testName || 'Test'}</h1>
        </div>

        {/* Right: Timer and Progress */}
        <div className="test-header-timer">
          <div className="timer-info">
            <span className="timer-icon">🕐</span>
            <span className="timer-text">Time Remaining {formatTime(timeLeft)}</span>
            <span className="progress-icon" aria-hidden="true">▢</span>
            <span className="progress-text">{actualCurrentQuestion} of {actualTotalQuestions}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

TestHeader.propTypes = {
  intl: intlShape.isRequired,
  testName: PropTypes.string,
  testTimeInMinutes: PropTypes.number,
  onTestTimeExpired: PropTypes.func,
  onTestTimeUpdate: PropTypes.func,
  currentQuestion: PropTypes.number,
  totalQuestions: PropTypes.number,
  unitId: PropTypes.string,
  sequenceId: PropTypes.string,
};

export default injectIntl(TestHeader);
