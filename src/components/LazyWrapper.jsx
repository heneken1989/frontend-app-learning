import React, { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

const LazyWrapper = ({ 
  children, 
  fallback = <LoadingSpinner message="Loading..." />,
  errorFallback = <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
    <p>Something went wrong. Please try refreshing the page.</p>
  </div>
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

export default LazyWrapper;
