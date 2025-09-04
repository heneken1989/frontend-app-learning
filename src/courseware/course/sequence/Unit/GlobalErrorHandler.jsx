import React, { useEffect } from 'react';

/**
 * Global error handler component for auto-reload on critical errors
 */
const GlobalErrorHandler = ({ 
  courseId = '', 
  unitId = '',
  maxRetries = 3,
  enableAutoReload = false // Disable by default
}) => {
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    console.log('🛡️ [GlobalErrorHandler] Initializing global error monitoring');

    // Handle JavaScript errors
    const handleError = (event) => {
      console.error('❌ [GlobalErrorHandler] JavaScript error:', {
        error: event.error,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        courseId,
        unitId,
        retryCount
      });
      
      // Only auto-reload on critical errors that seem to break the page
      const isCriticalError = event.filename && (
        event.filename.includes('courseware') || 
        event.filename.includes('sequence') ||
        event.filename.includes('unit')
      );
      
      if (isCriticalError && retryCount < maxRetries && enableAutoReload) {
        retryCount++;
        console.log(`🔄 [GlobalErrorHandler] Auto-reloading due to critical error (attempt ${retryCount}/${maxRetries})`);
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else if (!isCriticalError) {
        console.log('ℹ️ [GlobalErrorHandler] Non-critical error, not reloading');
      } else if (!enableAutoReload) {
        console.log('ℹ️ [GlobalErrorHandler] Auto-reload disabled, not reloading');
      } else {
        console.error('❌ [GlobalErrorHandler] Max retries reached, stopping auto-reload');
      }
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      console.error('❌ [GlobalErrorHandler] Unhandled promise rejection:', {
        reason: event.reason,
        courseId,
        unitId,
        retryCount
      });
      
      // Only auto-reload on critical promise rejections
      const isCriticalRejection = event.reason && (
        event.reason.message && (
          event.reason.message.includes('courseware') ||
          event.reason.message.includes('sequence') ||
          event.reason.message.includes('unit') ||
          event.reason.message.includes('API')
        )
      );
      
      if (isCriticalRejection && retryCount < maxRetries && enableAutoReload) {
        retryCount++;
        console.log(`🔄 [GlobalErrorHandler] Auto-reloading due to critical promise rejection (attempt ${retryCount}/${maxRetries})`);
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else if (!isCriticalRejection) {
        console.log('ℹ️ [GlobalErrorHandler] Non-critical promise rejection, not reloading');
      } else if (!enableAutoReload) {
        console.log('ℹ️ [GlobalErrorHandler] Auto-reload disabled, not reloading');
      }
    };

    // Handle network errors
    const handleOffline = () => {
      console.warn('⚠️ [GlobalErrorHandler] Network offline detected');
    };

    const handleOnline = () => {
      console.log('✅ [GlobalErrorHandler] Network back online');
      // Reload when network comes back online after being offline
      if (retryCount > 0) {
        console.log('🔄 [GlobalErrorHandler] Reloading after network recovery');
        window.location.reload();
      }
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Monitor for stuck loading states
    const monitorLoading = () => {
      const loadingElements = document.querySelectorAll('.loading, [class*="loading"], .spinner, [class*="spinner"]');
      if (loadingElements.length > 0) {
        console.log('🔍 [GlobalErrorHandler] Loading elements detected:', loadingElements.length);
        
        // Check if loading has been stuck for too long
        setTimeout(() => {
          const stillLoading = document.querySelectorAll('.loading, [class*="loading"], .spinner, [class*="spinner"]');
          if (stillLoading.length > 0 && retryCount < maxRetries) {
            console.warn('⚠️ [GlobalErrorHandler] Stuck loading state detected, auto-reloading');
            retryCount++;
            window.location.reload();
          }
        }, 20000); // 20 seconds
      }
    };

    // Start monitoring after a delay
    const monitorTimeout = setTimeout(monitorLoading, 5000);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clearTimeout(monitorTimeout);
    };
  }, [courseId, unitId, maxRetries]);

  // Don't render anything visible
  return null;
};

export default GlobalErrorHandler;
