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
