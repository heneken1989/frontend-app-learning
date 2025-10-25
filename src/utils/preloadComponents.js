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
