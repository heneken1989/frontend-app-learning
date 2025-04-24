import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Card, Button, Icon, Modal, Table, Alert } from '@openedx/paragon';
import { Pause, PlayArrow, Refresh, History, Save, Warning } from '@openedx/paragon/icons';

/**
 * UnitTimer component to track how long a student spends on a unit.
 */
const UnitTimer = ({ unitId, initialTimeByProblemType, onTimeExpired }) => {
  const intl = useIntl();
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completionLogs, setCompletionLogs] = useState([]);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const storageKey = `unit_timer_${unitId}`;
  const logsKey = `unit_timer_logs_${unitId}`;
  
  // Set initial time based on problem type if provided
  useEffect(() => {
    if (initialTimeByProblemType && initialTimeByProblemType > 0) {
      // Only set initial time if no previous time is stored
      const savedTime = localStorage.getItem(storageKey);
      if (!savedTime) {
        setSeconds(0); // Start from 0 for countdown
      }
    }
  }, [initialTimeByProblemType, storageKey]);
  
  // Load saved time from localStorage when component mounts
  useEffect(() => {
    const savedTime = localStorage.getItem(storageKey);
    if (savedTime) {
      const timeSpent = parseInt(savedTime, 10);
      setSeconds(timeSpent);
      
      // Check if time has already expired
      if (initialTimeByProblemType && timeSpent >= initialTimeByProblemType) {
        setIsTimeExpired(true);
        setIsRunning(false);
        onTimeExpired();
      }
    }
    
    // Also check if timer was paused
    const timerPaused = localStorage.getItem(`${storageKey}_paused`);
    if (timerPaused === 'true') {
      setIsRunning(false);
    }
    
    // Load completion logs
    const savedLogs = localStorage.getItem(logsKey);
    if (savedLogs) {
      try {
        setCompletionLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error('Error loading completion logs', e);
        setCompletionLogs([]);
      }
    }
  }, [storageKey, logsKey, initialTimeByProblemType, onTimeExpired]);
  
  // Save time to localStorage when component unmounts or when seconds changes
  useEffect(() => {
    localStorage.setItem(storageKey, seconds.toString());
  }, [seconds, storageKey]);
  
  // Save pause state to localStorage
  useEffect(() => {
    localStorage.setItem(`${storageKey}_paused`, (!isRunning).toString());
  }, [isRunning, storageKey]);
  
  // Save logs to localStorage when they change
  useEffect(() => {
    localStorage.setItem(logsKey, JSON.stringify(completionLogs));
  }, [completionLogs, logsKey]);
  
  // Start/pause timer
  useEffect(() => {
    let timer;
    if (isRunning && !isTimeExpired) {
      timer = setInterval(() => {
        setSeconds(prevSeconds => {
          const newSeconds = prevSeconds + 1;
          // Check if time limit is reached
          if (initialTimeByProblemType && newSeconds >= initialTimeByProblemType) {
            setIsTimeExpired(true);
            setIsRunning(false);
            onTimeExpired();
          }
          return newSeconds;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, isTimeExpired, initialTimeByProblemType, onTimeExpired]);
  
  // Format timer display (HH:MM:SS)
  const formatTime = (timeInSeconds = seconds) => {
    const timeLeft = initialTimeByProblemType ? Math.max(0, initialTimeByProblemType - timeInSeconds) : timeInSeconds;
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const secs = timeLeft % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle pause/resume
  const toggleTimer = () => {
    if (!isTimeExpired) {
      setIsRunning(!isRunning);
    }
  };
  
  // Handle reset
  const resetTimer = () => {
    setSeconds(0);
    setIsRunning(true);
    setIsTimeExpired(false);
  };
  
  // Log completion time
  const logCompletion = () => {
    const now = new Date();
    const newLog = {
      id: now.getTime(),
      unitId,
      timeSpent: seconds,
      dateCompleted: now.toISOString(),
    };
    
    setCompletionLogs([newLog, ...completionLogs]);
    resetTimer();
  };
  
  // Display history modal
  const openHistoryModal = () => {
    setIsModalOpen(true);
  };
  
  // Clear logs
  const clearLogs = () => {
    setCompletionLogs([]);
    setIsModalOpen(false);
  };
  
  return (
    <>
      <Card className="unit-timer mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center p-2">
          <div className="font-weight-bold">
            {initialTimeByProblemType ? 'Time Remaining:' : 'Time Spent:'}
          </div>
          <div className="d-flex align-items-center">
            <div 
              className={`unit-timer-display mr-3 ${isTimeExpired ? 'text-danger' : ''}`} 
              data-testid="unit-timer-display" 
              style={{ fontFamily: 'monospace', fontSize: '1.2rem', minWidth: '85px' }}
            >
              {formatTime()}
            </div>
            <div className="d-flex">
              <Button
                variant="outline-primary"
                size="sm"
                className="mr-2"
                onClick={toggleTimer}
                iconBefore={isRunning ? Pause : PlayArrow}
                aria-label={isRunning ? 'Pause timer' : 'Resume timer'}
                disabled={isTimeExpired}
              >
                {isRunning ? 'Pause' : 'Resume'}
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                className="mr-2"
                onClick={resetTimer}
                iconBefore={Refresh}
                aria-label="Reset timer"
              >
                Reset
              </Button>
              <Button
                variant="outline-success"
                size="sm"
                className="mr-2"
                onClick={logCompletion}
                iconBefore={Save}
                aria-label="Complete and save time"
                disabled={isTimeExpired}
              >
                Complete
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={openHistoryModal}
                iconBefore={History}
                aria-label="View completion history"
              >
                History
              </Button>
            </div>
          </div>
        </Card.Body>
        {isTimeExpired && (
          <Alert variant="danger" icon={Warning}>
            Time limit reached! You can no longer submit answers.
          </Alert>
        )}
      </Card>
      
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Completion History"
        size="lg"
        aria-labelledby="completion-history-modal"
      >
        <Modal.Body>
          {completionLogs.length > 0 ? (
            <>
              <Table
                data={completionLogs}
                columns={[
                  {
                    Header: 'Date',
                    accessor: 'dateCompleted',
                    Cell: ({ value }) => new Date(value).toLocaleString(),
                  },
                  {
                    Header: 'Time Spent',
                    accessor: 'timeSpent',
                    Cell: ({ value }) => formatTime(value),
                  },
                ]}
              />
              <Button
                variant="outline-danger"
                onClick={clearLogs}
                className="mt-3"
              >
                Clear History
              </Button>
            </>
          ) : (
            <p>No completion records found.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

UnitTimer.propTypes = {
  unitId: PropTypes.string.isRequired,
  initialTimeByProblemType: PropTypes.number,
  onTimeExpired: PropTypes.func,
};

UnitTimer.defaultProps = {
  initialTimeByProblemType: null,
  onTimeExpired: () => {},
};

export default UnitTimer; 