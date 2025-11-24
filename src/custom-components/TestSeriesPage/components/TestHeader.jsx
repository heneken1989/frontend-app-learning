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
  sequenceId,
  courseId
}) => {
  const { authenticatedUser } = React.useContext(AppContext);
  const [timeLeft, setTimeLeft] = React.useState(0);
  const [previousModule, setPreviousModule] = React.useState(null);
  const [isTransitionPageActive, setIsTransitionPageActive] = React.useState(false);
  
  // Get unit and sequence data from model store (similar to PersistentNavigationBar)
  const unit = useModel('units', unitId);
  const sequence = useModel('sequences', sequenceId);
  
  // Parse module number from unit title (e.g., "1.1" -> 1)
  const parseModuleNumber = (title) => {
    if (!title) return null;
    const match = title.match(/^(\d+)\./);
    return match ? parseInt(match[1], 10) : null;
  };
  
  // Get current module from unit title
  const currentModule = unit?.title ? parseModuleNumber(unit.title) : null;

  // Module progress (current within module / total in module)
  const [moduleCurrent, setModuleCurrent] = React.useState(null);
  const [moduleTotal, setModuleTotal] = React.useState(null);

  // Helper to get LMS base URL
  const getLmsBaseUrl = () => {
    if (typeof window === 'undefined') return '';
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('local.openedx.io')) {
      return 'http://local.openedx.io:8000';
    }
    return 'https://lms.nihongodrill.com';
  };

  // Fetch course navigation and compute module progress
  React.useEffect(() => {
    const computeModuleProgress = async () => {
      try {
        if (!sequenceId || !courseId || !unitId || !currentModule) {
          return;
        }

        const lmsBaseUrl = getLmsBaseUrl();
        const response = await fetch(`${lmsBaseUrl}/api/course_home/v1/navigation/${courseId}`, {
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
        const seq = data?.blocks?.[sequenceId];
        if (!seq || !Array.isArray(seq.children)) {
          return;
        }

        // Build list of units in this module
        const moduleUnits = [];
        seq.children.forEach((childId) => {
          const child = data.blocks[childId];
          const title = child?.display_name || '';
          const modMatch = title.match(/^(\d+)\./);
          const modNum = modMatch ? parseInt(modMatch[1], 10) : null;
          if (modNum && modNum === currentModule) {
            moduleUnits.push(childId);
          }
        });

        const idxInModule = moduleUnits.indexOf(unitId);
        setModuleTotal(moduleUnits.length || null);
        setModuleCurrent(idxInModule >= 0 ? idxInModule + 1 : null);
      } catch (e) {
        // Swallow errors; fallback will be sequence-wide display
      }
    };

    computeModuleProgress();
  }, [sequenceId, courseId, unitId, currentModule]);
  
  // Get module-specific time for N5 course
  // We check if this is a multi-module test by checking if sequence has multiple units
  const getModuleTimeMinutes = () => {
    const isN5 = courseId && courseId.includes('N5');
    if (!isN5) return null;
    
    // Check if this is multi-module: if we have a module number and multiple units in sequence
    const isMultiModule = currentModule && sequence?.unitIds?.length > 1;
    if (!isMultiModule) return null;
    
    // N5 time per module: Module 1: 13 min, Module 2: 25 min, Module 3: 15 min
    const timeMap = {
      1: 20,
      2: 40,
      3: 35,
      4: 15, // Default for future modules
      5: 15,
    };
    
    const moduleMinutes = timeMap[currentModule] || 15;
    console.log(`⏱️ Module ${currentModule} time: ${moduleMinutes} minutes (Course: ${courseId})`);
    return moduleMinutes;
  };
  
  // Initialize and reset timer when module changes
  React.useEffect(() => {
    if (!sequenceId) return; // Wait for sequenceId to be available
    
    const moduleTime = getModuleTimeMinutes();
    const initialTime = moduleTime ? moduleTime * 60 : (testTimeInMinutes * 60 || 3600);
    const storageKey = `testTimer_${sequenceId}_${currentModule || 'default'}`;
    
    // Always check localStorage first on initial load
    if (!previousModule && typeof window !== 'undefined') {
      const savedTime = localStorage.getItem(storageKey);
      if (savedTime) {
        const timeLeftValue = parseInt(savedTime, 10);
        console.log(`⏱️ Restored timer from localStorage: ${timeLeftValue}s (Module: ${currentModule}, Key: ${storageKey})`);
        setTimeLeft(timeLeftValue);
        setPreviousModule(currentModule);
        return;
      }
    }
    
    // Check if module changed
    if (currentModule && currentModule !== previousModule) {
      console.log(`🔄 Module changed: ${previousModule} -> ${currentModule}, resetting timer to ${initialTime}s`);
      setTimeLeft(initialTime);
      setPreviousModule(currentModule);
      // Save new module timer
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, initialTime.toString());
      }
    } else if (!previousModule) {
      // Initial load - no saved time, use initial time
      console.log(`⏱️ Setting initial timer: ${initialTime}s (Module: ${currentModule})`);
      setTimeLeft(initialTime);
      setPreviousModule(currentModule);
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, initialTime.toString());
      }
    }
  }, [currentModule, previousModule, courseId, testTimeInMinutes, sequenceId]);
  
  // Listen for transition page events
  React.useEffect(() => {
    const checkTransitionState = () => {
      if (typeof window !== 'undefined' && sequenceId && unitId) {
        const transitionKey = `moduleTransition_${sequenceId}_${unitId}`;
        const savedTransition = localStorage.getItem(transitionKey);
        setIsTransitionPageActive(!!savedTransition);
      }
    };
    
    // Check on mount
    checkTransitionState();
    
    // Listen for custom events
    const handleTransitionActive = () => setIsTransitionPageActive(true);
    const handleTransitionInactive = () => setIsTransitionPageActive(false);
    
    window.addEventListener('transitionPageActive', handleTransitionActive);
    window.addEventListener('transitionPageInactive', handleTransitionInactive);
    
    // Also listen for transition page state changes via polling
    const interval = setInterval(checkTransitionState, 500);
    
    return () => {
      window.removeEventListener('transitionPageActive', handleTransitionActive);
      window.removeEventListener('transitionPageInactive', handleTransitionInactive);
      clearInterval(interval);
    };
  }, [sequenceId, unitId]);
  
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

  // Update time every second and save to localStorage
  React.useEffect(() => {
    // Don't run timer if transition page is active
    if (isTransitionPageActive) {
      console.log('⏸️ Timer paused - transition page is active');
      return;
    }
    
    const storageKey = `testTimer_${sequenceId}_${currentModule || 'default'}`;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTestTimeExpired && onTestTimeExpired();
          // Clear localStorage when time expires
          if (typeof window !== 'undefined') {
            localStorage.removeItem(storageKey);
            
            // Dispatch custom event for module test expiration
            const expireEvent = new CustomEvent('moduleTestExpired', {
              detail: {
                sequenceId,
                currentModule,
                unitId,
                courseId
              }
            });
            window.dispatchEvent(expireEvent);
            console.log('🚨 Module test expired, dispatching event:', {
              sequenceId,
              currentModule,
              unitId
            });
          }
          return 0;
        }
        const newTime = prev - 1;
        onTestTimeUpdate && onTestTimeUpdate(newTime);
        // Save to localStorage every second
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, newTime.toString());
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTestTimeExpired, onTestTimeUpdate, sequenceId, currentModule, unitId, courseId, isTransitionPageActive]);

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
            <span className="progress-text">
              {moduleCurrent && moduleTotal ? (
                <>
                  {moduleCurrent} of {moduleTotal}
                </>
              ) : (
                <>
                  {actualCurrentQuestion} of {actualTotalQuestions}
                </>
              )}
            </span>
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
  courseId: PropTypes.string,
};

export default injectIntl(TestHeader);
