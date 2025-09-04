import React, { useEffect, useState } from 'react';

/**
 * Component to monitor page loading and auto-reload on issues
 */
const PageLoadMonitor = ({ 
  courseId = '', 
  unitId = '', 
  maxLoadTime = 15000, // 15 seconds
  maxRetries = 3,
  enableAutoReload = true // Enable for quiz content detection
}) => {
  const [loadStartTime, setLoadStartTime] = useState(Date.now());
  const [retryCount, setRetryCount] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    setLoadStartTime(startTime);
    
    console.log('🔍 [PageLoadMonitor] Starting page load monitoring:', {
      courseId,
      unitId,
      maxLoadTime,
      retryCount,
      timestamp: new Date().toISOString()
    });

    // Check if Unit ID exists (main condition for reload)
    const hasUnitId = () => {
      const hasId = unitId && unitId.length > 0;
      
      console.log('🔍 [PageLoadMonitor] Unit ID check:', {
        hasId,
        unitId,
        unitIdLength: unitId ? unitId.length : 0
      });
      
      return hasId;
    };

    // Monitor page load completion
    const checkPageLoad = () => {
      const currentTime = Date.now();
      const loadDuration = currentTime - startTime;
      
      // Check if page is still loading after max time AND we haven't loaded successfully
      if (loadDuration > maxLoadTime && isMonitoring) {
        const unitIdExists = hasUnitId();
        
        console.log('🔍 [PageLoadMonitor] Checking page load status:', {
          loadDuration: `${loadDuration}ms`,
          maxLoadTime: `${maxLoadTime}ms`,
          retryCount,
          courseId,
          unitId,
          unitIdExists,
          currentUrl: window.location.href
        });
        
        // Only reload if Unit ID is missing
        const shouldReload = !unitIdExists;
        
        console.log('🔍 [PageLoadMonitor] Reload decision:', {
          shouldReload,
          reason: shouldReload ? 'Unit ID not found' : 'Unit ID exists - no reload needed'
        });
        
        // DISABLED: No auto-reload at all
        console.log('ℹ️ [PageLoadMonitor] Auto-reload completely disabled - monitoring only');
        setIsMonitoring(false);
      }
    };

    // Check every 2 seconds
    const interval = setInterval(checkPageLoad, 2000);
    
    // Stop monitoring when page is fully loaded
    const handlePageLoad = () => {
      const loadDuration = Date.now() - startTime;
      console.log('✅ [PageLoadMonitor] Page loaded successfully:', {
        loadDuration: `${loadDuration}ms`,
        retryCount,
        courseId,
        unitId
      });
      setIsMonitoring(false);
      clearInterval(interval);
    };

    // Check if Unit ID exists and stop monitoring early
    const checkEarlyLoad = () => {
      const unitIdExists = hasUnitId();
      
      if (unitIdExists) {
        console.log('✅ [PageLoadMonitor] Unit ID found, stopping monitoring early');
        setIsMonitoring(false);
        clearInterval(interval);
      } else {
        console.log('⏳ [PageLoadMonitor] Unit ID not found yet, continuing monitoring');
      }
    };

    // Listen for page load events
    window.addEventListener('load', handlePageLoad);
    document.addEventListener('DOMContentLoaded', handlePageLoad);
    
    // Check for early load after a short delay
    setTimeout(checkEarlyLoad, 1000);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('load', handlePageLoad);
      document.removeEventListener('DOMContentLoaded', handlePageLoad);
    };
  }, [courseId, unitId, maxLoadTime, retryCount, isMonitoring]);

  // Monitor for JavaScript errors
  useEffect(() => {
    const handleError = (event) => {
      console.error('❌ [PageLoadMonitor] JavaScript error detected:', {
        error: event.error,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        courseId,
        unitId
      });
      
      // DISABLED: No auto-reload on errors
      console.log('ℹ️ [PageLoadMonitor] Auto-reload disabled - JavaScript error logged only');
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [retryCount, maxRetries, courseId, unitId]);

  // Monitor for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('❌ [PageLoadMonitor] Unhandled promise rejection:', {
        reason: event.reason,
        courseId,
        unitId
      });
      
      // DISABLED: No auto-reload on promise rejections
      console.log('ℹ️ [PageLoadMonitor] Auto-reload disabled - promise rejection logged only');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [retryCount, maxRetries, courseId, unitId]);

  // Don't render anything visible
  return null;
};

export default PageLoadMonitor;
