import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Alert } from '@openedx/paragon';

const TestTimer = ({ 
  testId, 
  totalTimeInMinutes, 
  onTimeExpired, 
  onTimeUpdate,
  isActive = true 
}) => {
  const [timeLeft, setTimeLeft] = useState(totalTimeInMinutes * 60); // Convert to seconds
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!isActive || isExpired) return;

    // Load saved time from localStorage
    const savedTimeKey = `test_timer_${testId}`;
    const savedTime = localStorage.getItem(savedTimeKey);
    const savedStartTime = localStorage.getItem(`${savedTimeKey}_start`);
    
    if (savedTime && savedStartTime) {
      const elapsed = Math.floor((Date.now() - parseInt(savedStartTime)) / 1000);
      const remaining = Math.max(0, parseInt(savedTime) - elapsed);
      setTimeLeft(remaining);
      startTimeRef.current = parseInt(savedStartTime);
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          setIsExpired(true);
          onTimeExpired && onTimeExpired();
          return 0;
        }
        
        const newTime = prevTime - 1;
        
        // Save to localStorage every 10 seconds
        if (newTime % 10 === 0) {
          localStorage.setItem(savedTimeKey, newTime.toString());
          localStorage.setItem(`${savedTimeKey}_start`, startTimeRef.current.toString());
        }
        
        onTimeUpdate && onTimeUpdate(newTime);
        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [testId, isActive, isExpired, onTimeExpired, onTimeUpdate]);

  // Clean up localStorage when component unmounts or test completes
  useEffect(() => {
    return () => {
      const savedTimeKey = `test_timer_${testId}`;
      localStorage.removeItem(savedTimeKey);
      localStorage.removeItem(`${savedTimeKey}_start`);
    };
  }, [testId]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (isExpired) return '#dc3545'; // Red
    if (timeLeft <= 300) return '#ffc107'; // Yellow (5 minutes)
    if (timeLeft <= 600) return '#fd7e14'; // Orange (10 minutes)
    return '#28a745'; // Green
  };

  const getProgressPercentage = () => {
    const totalSeconds = totalTimeInMinutes * 60;
    return ((totalSeconds - timeLeft) / totalSeconds) * 100;
  };

  if (isExpired) {
    return (
      <Alert variant="danger" className="test-timer-expired">
        <strong>Time's up!</strong> The test has ended.
      </Alert>
    );
  }

  return (
    <div className="test-timer-container">
      <div className="test-timer-display">
        <div className="timer-icon">⏱️</div>
        <div className="timer-content">
          <div className="timer-time" style={{ color: getTimeColor() }}>
            {formatTime(timeLeft)}
          </div>
          <div className="timer-label">Test Time Remaining</div>
        </div>
      </div>
      
      <div className="timer-progress">
        <div 
          className="progress-bar"
          style={{
            width: `${getProgressPercentage()}%`,
            backgroundColor: getTimeColor(),
            height: '4px',
            borderRadius: '2px',
            transition: 'width 1s ease'
          }}
        />
      </div>
    </div>
  );
};

TestTimer.propTypes = {
  testId: PropTypes.string.isRequired,
  totalTimeInMinutes: PropTypes.number.isRequired,
  onTimeExpired: PropTypes.func,
  onTimeUpdate: PropTypes.func,
  isActive: PropTypes.bool,
};

export default TestTimer;
