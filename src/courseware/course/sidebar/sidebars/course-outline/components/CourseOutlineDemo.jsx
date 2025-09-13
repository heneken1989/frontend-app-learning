import React from 'react';
import { CourseOutlineButton } from './index';

const CourseOutlineDemo = () => {
  // Mock data for demo
  const mockUnits = [
    {
      id: 'block-v1:Manabi+N51+2026+type@vertical+block@unit1',
      title: 'Grammar Quiz 1',
      icon: 'problem',
      complete: false
    },
    {
      id: 'block-v1:Manabi+N51+2026+type@vertical+block@unit2',
      title: 'Reading Comprehension',
      icon: 'problem',
      complete: true
    },
    {
      id: 'block-v1:Manabi+N51+2026+type@vertical+block@unit3',
      title: 'Vocabulary Test',
      icon: 'problem',
      complete: false
    },
    {
      id: 'block-v1:Manabi+N51+2026+type@vertical+block@unit4',
      title: 'Listening Exercise',
      icon: 'problem',
      complete: true
    },
    {
      id: 'block-v1:Manabi+N51+2026+type@vertical+block@unit5',
      title: 'Writing Assignment',
      icon: 'problem',
      complete: false
    }
  ];

  const handleUnitClick = (unitId) => {
    console.log('Unit clicked:', unitId);
    // Navigate to unit or perform other actions
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Course Outline Demo</h3>
      <p>Click the icon below to open the simple course outline:</p>
      
      <CourseOutlineButton
        courseId="course-v1:Manabi+N51+2026"
        units={mockUnits}
        activeUnitId="block-v1:Manabi+N51+2026+type@vertical+block@unit2"
        onUnitClick={handleUnitClick}
        size="medium"
      />
    </div>
  );
};

export default CourseOutlineDemo;
