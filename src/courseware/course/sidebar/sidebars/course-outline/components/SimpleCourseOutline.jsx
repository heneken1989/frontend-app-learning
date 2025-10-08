import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { createPortal } from 'react-dom';

const SimpleCourseOutline = ({ 
  isOpen, 
  onClose, 
  courseId, 
  units = [], 
  activeUnitId,
  onUnitClick 
}) => {
  const [completionStatus, setCompletionStatus] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 60, left: 20 });

  // Check completion status for quiz units
  useEffect(() => {
    if (isOpen && units.length > 0) {
      checkCompletionStatus();
    }
  }, [isOpen, units]);

  // Calculate popup position when opening
  useEffect(() => {
    if (isOpen) {
      const calculatePosition = () => {
        // Find the Course Outline button/icon on the navigation bar specifically
        // Look for the one with the specific class for navbar trigger
        const courseOutlineButton = document.querySelector('.course-outline-navbar-trigger');
        if (courseOutlineButton) {
          const rect = courseOutlineButton.getBoundingClientRect();
          const popupWidth = 320;
          const popupHeight = 400;
          
          // Calculate position to the left of the icon
          let left = rect.left - popupWidth;
          let top = rect.top - 10;
          
          // Ensure popup doesn't go off the left edge of screen
          if (left < 10) {
            left = 10;
          }
          
          // Ensure popup doesn't go off the top edge of screen
          if (top < 10) {
            top = 10;
          }
          
          // Ensure popup doesn't go off the bottom edge of screen
          if (top + popupHeight > window.innerHeight - 10) {
            top = window.innerHeight - popupHeight - 10;
          }
          
          setPopupPosition({ top, left });
        } else {
          // Fallback: look for the outline-sidebar-heading-wrapper (the one on navbar)
          const courseOutlineButtonFallback = document.querySelector('.outline-sidebar-heading-wrapper');
          if (courseOutlineButtonFallback) {
            const rect = courseOutlineButtonFallback.getBoundingClientRect();
            const popupWidth = 320;
            const popupHeight = 400;
            
            // Calculate position to the left of the icon
            let left = rect.left - popupWidth;
            let top = rect.top - 10;
            
            // Ensure popup doesn't go off the left edge of screen
            if (left < 10) {
              left = 10;
            }
            
            // Ensure popup doesn't go off the top edge of screen
            if (top < 10) {
              top = 10;
            }
            
            // Ensure popup doesn't go off the bottom edge of screen
            if (top + popupHeight > window.innerHeight - 10) {
              top = window.innerHeight - popupHeight - 10;
            }
            
            setPopupPosition({ top, left });
          }
        }
      };
      
      calculatePosition();
      window.addEventListener('resize', calculatePosition);
      return () => window.removeEventListener('resize', calculatePosition);
    }
  }, [isOpen]);

  const checkCompletionStatus = async () => {
    setIsLoading(true);
    try {
      const quizUnits = units.filter(unit => 
        unit.icon === 'problem' || unit.title.toLowerCase().includes('quiz')
      );

      const promises = quizUnits.map(async (unit) => {
        try {
          const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                           document.querySelector('meta[name=csrf-token]')?.getAttribute('content') ||
                           'rN400a1rY6H0c7Ex86YaiA9ibJbFmEDf';
          
          const response = await fetch('http://local.openedx.io:8000/courseware/check_block_completion/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken,
              'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include',
            body: JSON.stringify({
              'block_key': unit.id
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            return {
              unitId: unit.id,
              isCompleted: data.is_completed || data.completion > 0
            };
          }
        } catch (error) {
          console.log(`Error checking completion for ${unit.title}:`, error);
        }
        return { unitId: unit.id, isCompleted: false };
      });

      const results = await Promise.all(promises);
      const statusMap = {};
      results.forEach(result => {
        statusMap[result.unitId] = result.isCompleted;
      });
      
      setCompletionStatus(statusMap);
    } catch (error) {
      console.log('Error checking completion status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Show only first 5 units
  const displayUnits = units.slice(0, 5);

  const popupContent = (
    <div className="simple-course-outline-overlay" onClick={onClose}>
      <div 
        className="simple-course-outline-popup" 
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: `${popupPosition.top}px`,
          left: `${popupPosition.left}px`,
          zIndex: 10000
        }}
      >
        <div className="simple-course-outline-header">
          <h4>Course Outline</h4>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="simple-course-outline-content">
          {isLoading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="unit-list">
              {displayUnits.map((unit, index) => {
                const isQuiz = unit.icon === 'problem' || unit.title.toLowerCase().includes('quiz');
                const isCompleted = completionStatus[unit.id] || false;
                const isActive = unit.id === activeUnitId;
                
                return (
                  <div
                    key={unit.id}
                    className={classNames('unit-item', {
                      'active': isActive,
                      'completed': isCompleted,
                      'quiz': isQuiz
                    })}
                    onClick={() => onUnitClick(unit.id)}
                  >
                    <span className="unit-number">{index + 1}</span>
                    <span className="unit-title">{unit.title}</span>
                    {isQuiz && (
                      <span className="completion-indicator">
                        {isCompleted ? '✅' : '⭕'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render popup at the top of the page
  return createPortal(popupContent, document.body);
};

SimpleCourseOutline.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  courseId: PropTypes.string.isRequired,
  units: PropTypes.array.isRequired,
  activeUnitId: PropTypes.string,
  onUnitClick: PropTypes.func.isRequired,
};

export default SimpleCourseOutline;
