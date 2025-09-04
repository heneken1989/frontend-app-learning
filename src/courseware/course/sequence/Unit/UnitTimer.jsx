import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Simple UnitTimer component that just shows the time
 */
const UnitTimer = ({ unitId, initialTimeByProblemType = null, onTimeExpired = () => {} }) => {
  const storageKey = `unit_timer_${unitId}`;
  const [timeLeft, setTimeLeft] = useState(
    typeof initialTimeByProblemType === 'number' && initialTimeByProblemType > 0
      ? initialTimeByProblemType
      : 0,
  );
  const timerRef = useRef();

  // Reset timer when initialTimeByProblemType changes
  useEffect(() => {
    // If the time limit changes, clear any previous saved value
    localStorage.removeItem(storageKey);

    if (typeof initialTimeByProblemType === 'number' && initialTimeByProblemType > 0) {
      setTimeLeft(initialTimeByProblemType);
    } else {
      setTimeLeft(0);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (typeof initialTimeByProblemType === 'number' && initialTimeByProblemType > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev > 1) { return prev - 1; }
          clearInterval(timerRef.current);
          if (onTimeExpired) { onTimeExpired(); }
          return 0;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [initialTimeByProblemType, onTimeExpired, storageKey]);

  // Load saved time from localStorage when component mounts
  useEffect(() => {
    const savedTime = localStorage.getItem(storageKey);
    if (savedTime) {
      const timeSpent = parseInt(savedTime, 10);
      setTimeLeft(timeSpent);

      if (initialTimeByProblemType && timeSpent >= initialTimeByProblemType) {
        setTimeLeft(0);
        onTimeExpired();
      }
    }
  }, [storageKey, initialTimeByProblemType, onTimeExpired]);

  // Save time to localStorage
  useEffect(() => {
    if (typeof timeLeft === 'number' && timeLeft > 0) {
      localStorage.setItem(storageKey, timeLeft.toString());
    }
  }, [timeLeft, storageKey]);

  // Format timer display (HH:MM:SS)
  const formatTime = () => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const secs = timeLeft % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      fontFamily: 'monospace',
      fontSize: '1.2rem',
      padding: '0.5rem',
      textAlign: 'center',
      backgroundColor: timeLeft === 0 ? '#e31837' : 'transparent',
      color: timeLeft === 0 ? 'white' : '#333',
      borderRadius: '4px',
      minWidth: '120px',
      transition: 'all 0.3s ease',
      boxShadow: timeLeft === 0 ? '0 2px 8px rgba(227, 24, 55, 0.3)' : 'none',
    }}
    >
      {formatTime()}
    </div>
  );
};

UnitTimer.propTypes = {
  unitId: PropTypes.string.isRequired,
  initialTimeByProblemType: PropTypes.number,
  onTimeExpired: PropTypes.func,
};


export default UnitTimer;
