import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';

/**
 * Iframe component with dark transition effect during loading
 */
const NoLoadingContentIFrame = ({
  iframeUrl = '',
  title = '',
  elementId = '',
  onLoaded = null,
  shouldShowContent = true,
  loadingMessage = '',
  courseId = '',
  hasQuiz = false,
  enableAutoReload = false, // Disable auto-reload - only PageLoadMonitor handles Unit ID reload
  ...otherProps
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [lastLoadTime, setLastLoadTime] = useState(Date.now());
  const hideTimeoutRef = useRef(null);

  useEffect(() => {
    // Only reset if URL actually changed
    if (!iframeUrl) {
      return;
    }
    
    // Clear any existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    // Reset loading state when URL changes
    setIsLoading(true);
    setShowContent(false);
    setLoadAttempts(prev => prev + 1);
    setLastLoadTime(Date.now());
    
    console.log('🔄 [NoLoadingContentIFrame] URL changed, starting load:', iframeUrl);
    
    // Hide loading message after a short delay
    hideTimeoutRef.current = setTimeout(() => {
      console.log('⏰ [NoLoadingContentIFrame] Hiding loading message');
      setIsLoading(false);
      setShowContent(true);
    }, 1000); // Hide after 1 second
    
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [iframeUrl]); // Only depend on iframeUrl

  const handleLoad = () => {
    console.log('✅ [NoLoadingContentIFrame] Iframe loaded successfully');
    
    // Clear the hide timeout since iframe loaded
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    setIsLoading(false);
    setShowContent(true);
    if (onLoaded) onLoaded();
  };

  const handleError = () => {
    console.error('❌ [NoLoadingContentIFrame] Iframe load error detected');
    // DISABLED: No auto-reload at all
    console.log('ℹ️ [NoLoadingContentIFrame] Auto-reload completely disabled - error logged only');
  };

  return (
    <>
      <style>{`
        .content-iframe {
          /* Disabled: transition: opacity 0.3s ease-in-out; */
        }

        .content-iframe.loading {
          opacity: 0.8; /* Show iframe content even while loading */
        }

        .content-iframe.visible {
          opacity: 1;
        }

        .loading-message {
          /* Completely hidden - no loading spinner */
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }

        .loading-message.hidden {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }

        @keyframes autoHide {
          0% {
            opacity: 1;
            visibility: visible;
          }
          100% {
            opacity: 0;
            visibility: hidden;
          }
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #ffebee;
          border-top: 3px solid #f44336;
          border-radius: 50%;
          /* Disabled: animation: spin 1s linear infinite; */
        }

        .loading-dots {
          display: flex;
          gap: 4px;
        }

        .loading-dot {
          width: 8px;
          height: 8px;
          background: #f44336;
          border-radius: 50%;
          /* Disabled: animation: bounce 1.4s infinite ease-in-out both; */
        }

        /* Disabled: .loading-dot:nth-child(1) { animation-delay: -0.32s; } */
        /* Disabled: .loading-dot:nth-child(2) { animation-delay: -0.16s; } */
        /* Disabled: .loading-dot:nth-child(3) { animation-delay: 0s; } */

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes fadeOutScale {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
        }

        .iframe-container {
          position: relative;
          width: 100%;
          min-height: 400px;
        }
      `}</style>

      <div className="iframe-container">
        <div className={`loading-message ${!isLoading ? 'hidden' : ''}`}>
          <div className="loading-spinner"></div>
          <span>データを読み込んでいます</span>
          <div className="loading-dots">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        </div>
        
        <iframe
          id={elementId}
          src={iframeUrl}
          title={title}
          allow="microphone *; camera *; midi *; geolocation *; encrypted-media *; clipboard-write *; autoplay *"
          allowFullScreen
          height="700"
          scrolling="no"
          referrerPolicy="origin"
          className={`content-iframe ${isLoading ? 'loading' : 'visible'}`}
          style={{
            width: '100%',
            border: 'none',
            minHeight: '400px',
            borderRadius: '8px',
            background: '#ffffff'
          }}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    </>
  );
};

NoLoadingContentIFrame.propTypes = {
  iframeUrl: PropTypes.string,
  title: PropTypes.string,
  elementId: PropTypes.string,
  onLoaded: PropTypes.func,
  shouldShowContent: PropTypes.bool,
  loadingMessage: PropTypes.string,
  courseId: PropTypes.string,
  hasQuiz: PropTypes.bool,
  enableAutoReload: PropTypes.bool,
};


export default NoLoadingContentIFrame;