import React from 'react';
import PropTypes from 'prop-types';
import { useSimpleCourseOutline } from '../hooks/useSimpleCourseOutline';
import SimpleCourseOutline from './SimpleCourseOutline';
import CourseOutlineIcon from './CourseOutlineIcon';

const CourseOutlineButton = ({ 
  courseId, 
  units = [], 
  activeUnitId,
  onUnitClick,
  className = '',
  size = 'medium'
}) => {
  const { isOpen, toggleOutline, closeOutline } = useSimpleCourseOutline();

  const handleUnitClick = (unitId) => {
    // Close popup if it's open when navigating to a different unit
    const existingPopup = document.getElementById('test-popup');
    if (existingPopup) {
      existingPopup.remove();
      // Clean up any existing styles
      const existingStyle = document.querySelector('style[data-popup-style]');
      if (existingStyle) {
        existingStyle.remove();
      }
      console.log('🔍 CourseOutline navigation: Popup closed');
    }
    
    if (onUnitClick) {
      onUnitClick(unitId);
    }
    closeOutline();
  };

  return (
    <>
      <CourseOutlineIcon
        onClick={toggleOutline}
        isActive={isOpen}
        className={className}
        size={size}
      />
      
      <SimpleCourseOutline
        isOpen={isOpen}
        onClose={closeOutline}
        courseId={courseId}
        units={units}
        activeUnitId={activeUnitId}
        onUnitClick={handleUnitClick}
      />
    </>
  );
};

CourseOutlineButton.propTypes = {
  courseId: PropTypes.string.isRequired,
  units: PropTypes.array.isRequired,
  activeUnitId: PropTypes.string,
  onUnitClick: PropTypes.func,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
};

export default CourseOutlineButton;
