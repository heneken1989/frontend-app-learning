// TỐI ƯU HÓA PRELOADING STRATEGY - CHIA NHỎ THEO ĐỘ ƯU TIÊN
export const preloadCriticalComponents = () => {
  // Tier 1: Critical components - preload ngay lập tức
  const tier1Components = [
    () => import('../custom-components/LearningHome'),
  ];

  // Tier 2: Important components - preload sau 500ms
  const tier2Components = [
    () => import('../course-home/outline-tab'),
    () => import('../course-home/dates-tab'),
  ];

  // Tier 3: Secondary components - preload sau 1.5s
  const tier3Components = [
    () => import('../courseware'),
    () => import('../course-home/progress-tab/ProgressTab'),
    () => import('../custom-components/ProgressPage'),
  ];

  // Tier 4: Optional components - preload sau 3s
  const tier4Components = [
    () => import('../custom-components/PaymentPage'),
    () => import('../custom-components/TestSeriesPage'),
  ];

  // Preload Tier 1 ngay lập tức
  tier1Components.forEach(importFn => {
    importFn().catch(err => {
      console.warn('Failed to preload tier 1 component:', err);
    });
  });

  // Preload Tier 2 sau 500ms
  setTimeout(() => {
    tier2Components.forEach(importFn => {
      importFn().catch(err => {
        console.warn('Failed to preload tier 2 component:', err);
      });
    });
  }, 500);

  // Preload Tier 3 sau 1.5s
  setTimeout(() => {
    tier3Components.forEach(importFn => {
      importFn().catch(err => {
        console.warn('Failed to preload tier 3 component:', err);
      });
    });
  }, 1500);

  // Preload Tier 4 sau 3s
  setTimeout(() => {
    tier4Components.forEach(importFn => {
      importFn().catch(err => {
        console.warn('Failed to preload tier 4 component:', err);
      });
    });
  }, 3000);
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
