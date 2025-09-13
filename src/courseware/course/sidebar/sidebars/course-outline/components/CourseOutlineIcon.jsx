import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const CourseOutlineIcon = ({ 
  onClick, 
  isActive = false,
  className = '',
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'course-outline-icon-small',
    medium: 'course-outline-icon-medium',
    large: 'course-outline-icon-large'
  };

  return (
    <button
      className={classNames(
        'course-outline-icon',
        sizeClasses[size],
        { 'active': isActive },
        className
      )}
      onClick={onClick}
      title="Course Outline"
      aria-label="Open Course Outline"
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" 
          fill="currentColor"
        />
      </svg>
    </button>
  );
};

CourseOutlineIcon.propTypes = {
  onClick: PropTypes.func.isRequired,
  isActive: PropTypes.bool,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
};

export default CourseOutlineIcon;
