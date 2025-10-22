// Preload critical components for better UX
export const preloadCriticalComponents = () => {
  // Preload the most commonly used components
  const criticalComponents = [
    () => import('../custom-components/LearningHome'),
    () => import('../courseware'),
    () => import('../course-home/outline-tab'),
  ];

  // Preload after initial page load
  setTimeout(() => {
    criticalComponents.forEach(importFn => {
      importFn().catch(err => {
        console.warn('Failed to preload component:', err);
      });
    });
  }, 500); // Reduced from 2 seconds to 500ms for faster preloading
};

// Preload components on hover (for better UX)
export const preloadOnHover = (importFn) => {
  return () => {
    const timeoutId = setTimeout(() => {
      importFn().catch(err => {
        console.warn('Failed to preload component on hover:', err);
      });
    }, 100); // Small delay to avoid unnecessary preloads

    return () => clearTimeout(timeoutId);
  };
};
