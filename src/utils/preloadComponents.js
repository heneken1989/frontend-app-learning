// TỐI ƯU HÓA PRELOADING STRATEGY - GIẢM TẢI BAN ĐẦU
export const preloadCriticalComponents = () => {
  // Chỉ preload component quan trọng nhất
  const criticalComponent = () => import('../custom-components/LearningHome');

  // Preload ngay lập tức - chỉ 1 component
  criticalComponent().catch(err => {
    console.warn('Failed to preload critical component:', err);
  });

  // Preload các components khác sau khi trang đã load xong
  // Sử dụng requestIdleCallback để không ảnh hưởng đến performance
  const preloadSecondaryComponents = () => {
    const secondaryComponents = [
      () => import('../course-home/outline-tab'),
      () => import('../course-home/dates-tab'),
    ];

    secondaryComponents.forEach(importFn => {
      importFn().catch(err => {
        console.warn('Failed to preload secondary component:', err);
      });
    });
  };

  // Preload khi browser rảnh rỗi
  if (window.requestIdleCallback) {
    window.requestIdleCallback(preloadSecondaryComponents, { timeout: 2000 });
  } else {
    // Fallback cho browsers không support requestIdleCallback
    setTimeout(preloadSecondaryComponents, 2000);
  }
};

// TỐI ƯU HÓA MỚI: Lazy load các thư viện nặng
export const preloadHeavyLibraries = () => {
  // Chỉ preload khi cần thiết
  const heavyLibraries = [
    () => import('chart.js'), // Chỉ load khi cần vẽ chart
    () => import('recharts'), // Chỉ load khi cần vẽ chart
    () => import('lodash'), // Chỉ load khi cần utility functions
  ];

  // Preload sau khi trang đã load hoàn toàn
  setTimeout(() => {
    heavyLibraries.forEach(importFn => {
      importFn().catch(err => {
        console.warn('Failed to preload heavy library:', err);
      });
    });
  }, 5000); // Delay 5 giây để không ảnh hưởng đến load time ban đầu
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
