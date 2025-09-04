import React, { useEffect, useState } from 'react';

/**
 * Component to monitor page loading and auto-reload on issues
 */
const PageLoadMonitor = ({ 
  courseId = '', 
  unitId = '', 
  maxLoadTime = 15000, // 15 seconds
  maxRetries = 3 
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

    // Monitor page load completion
    const checkPageLoad = () => {
      const currentTime = Date.now();
      const loadDuration = currentTime - startTime;
      
      // Check if page is still loading after max time AND we haven't loaded successfully
      if (loadDuration > maxLoadTime && isMonitoring) {
        // Check if page actually appears to be stuck (no iframe content loaded)
        const iframe = document.querySelector('#unit-iframe');
        const hasContent = iframe && iframe.contentDocument && iframe.contentDocument.body && iframe.contentDocument.body.children.length > 0;
        
        if (!hasContent) {
          console.warn('⚠️ [PageLoadMonitor] Page load timeout with no content detected:', {
            loadDuration: `${loadDuration}ms`,
            maxLoadTime: `${maxLoadTime}ms`,
            retryCount,
            courseId,
            unitId,
            hasIframe: !!iframe,
            hasContent
          });
          
          if (retryCount < maxRetries) {
            console.log('🔄 [PageLoadMonitor] Auto-reloading page...');
            setRetryCount(prev => prev + 1);
            window.location.reload();
          } else {
            console.error('❌ [PageLoadMonitor] Max retries reached, stopping auto-reload');
            setIsMonitoring(false);
          }
        } else {
          console.log('✅ [PageLoadMonitor] Page has content, not reloading');
          setIsMonitoring(false);
        }
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

    // Listen for page load events
    window.addEventListener('load', handlePageLoad);
    document.addEventListener('DOMContentLoaded', handlePageLoad);

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
      
      // Auto-reload on critical errors
      if (retryCount < maxRetries) {
        setTimeout(() => {
          console.log('🔄 [PageLoadMonitor] Auto-reloading due to JavaScript error');
          window.location.reload();
        }, 3000);
      }
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
      
      // Auto-reload on critical promise rejections
      if (retryCount < maxRetries) {
        setTimeout(() => {
          console.log('🔄 [PageLoadMonitor] Auto-reloading due to unhandled promise rejection');
          window.location.reload();
        }, 3000);
      }
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
