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

    // Check if this is a quiz unit
    const isQuizUnit = () => {
      // Check URL patterns that indicate quiz content
      const currentUrl = window.location.href;
      const isQuiz = currentUrl.includes('quiz') || 
                    currentUrl.includes('problem') || 
                    currentUrl.includes('xblock') ||
                    unitId.includes('quiz') ||
                    unitId.includes('problem');
      
      // Also check if iframe contains quiz elements
      const iframe = document.querySelector('#unit-iframe');
      if (iframe && iframe.contentDocument) {
        const quizElements = iframe.contentDocument.querySelectorAll(
          '.problem, .xblock, .quiz, [data-block-type="problem"], [data-block-type="quiz"]'
        );
        return isQuiz || quizElements.length > 0;
      }
      
      return isQuiz;
    };

    // Check if quiz content is actually loaded
    const hasQuizContent = () => {
      const iframe = document.querySelector('#unit-iframe');
      if (!iframe || !iframe.contentDocument) return false;
      
      const iframeDoc = iframe.contentDocument;
      
      // Check for quiz-specific content
      const quizContent = iframeDoc.querySelectorAll(
        '.problem, .xblock, .quiz, .problem-header, .problem-progress, ' +
        '[data-block-type="problem"], [data-block-type="quiz"], ' +
        '.submit-attempt-container, .action, .btn-primary'
      );
      
      // Check for any meaningful content (not just empty page)
      const hasContent = iframeDoc.body && 
                        iframeDoc.body.children.length > 0 &&
                        iframeDoc.body.textContent.trim().length > 50;
      
      return quizContent.length > 0 || hasContent;
    };

    // Monitor page load completion
    const checkPageLoad = () => {
      const currentTime = Date.now();
      const loadDuration = currentTime - startTime;
      
      // Check if page is still loading after max time AND we haven't loaded successfully
      if (loadDuration > maxLoadTime && isMonitoring) {
        const iframe = document.querySelector('#unit-iframe');
        const hasIframe = !!iframe;
        const iframeLoaded = iframe && iframe.contentDocument;
        const isQuiz = isQuizUnit();
        const hasContent = hasQuizContent();
        
        console.log('🔍 [PageLoadMonitor] Checking page load status:', {
          loadDuration: `${loadDuration}ms`,
          maxLoadTime: `${maxLoadTime}ms`,
          retryCount,
          courseId,
          unitId,
          hasIframe,
          iframeLoaded,
          isQuiz,
          hasContent
        });
        
        // Only reload if:
        // 1. Iframe doesn't exist or isn't loaded, OR
        // 2. It's a quiz unit but has no quiz content
        const shouldReload = (!hasIframe || !iframeLoaded) || (isQuiz && !hasContent);
        
        if (shouldReload && retryCount < maxRetries && enableAutoReload) {
          console.warn('⚠️ [PageLoadMonitor] Quiz content missing or iframe not loaded, auto-reloading...');
          setRetryCount(prev => prev + 1);
          window.location.reload();
        } else if (!enableAutoReload) {
          console.log('ℹ️ [PageLoadMonitor] Auto-reload disabled, not reloading');
          setIsMonitoring(false);
        } else if (!shouldReload) {
          console.log('✅ [PageLoadMonitor] Content loaded properly, stopping monitoring');
          setIsMonitoring(false);
        } else {
          console.error('❌ [PageLoadMonitor] Max retries reached, stopping auto-reload');
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

    // Check if iframe is already loaded and stop monitoring early
    const checkEarlyLoad = () => {
      const iframe = document.querySelector('#unit-iframe');
      if (iframe && iframe.contentDocument) {
        const isQuiz = isQuizUnit();
        const hasContent = hasQuizContent();
        
        // For quiz units, make sure content is actually loaded
        if (isQuiz && !hasContent) {
          console.log('⏳ [PageLoadMonitor] Quiz unit detected but content not ready, continuing monitoring');
          return;
        }
        
        console.log('✅ [PageLoadMonitor] Iframe already loaded with proper content, stopping monitoring early');
        setIsMonitoring(false);
        clearInterval(interval);
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
