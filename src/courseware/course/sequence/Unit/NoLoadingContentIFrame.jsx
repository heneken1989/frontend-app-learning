import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

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
  ...otherProps
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Reset loading state when URL changes
    setIsLoading(true);
    setShowContent(false);
    
    // Hide loading message quickly - don't wait for full load
    const quickHideTimeout = setTimeout(() => {
      setIsLoading(false);
      setShowContent(true);
    }, 800); // Hide after 800ms regardless of load status
    
    return () => clearTimeout(quickHideTimeout);
  }, [iframeUrl]);

  const handleLoad = () => {
    // Hide loading message immediately when iframe starts loading
    setIsLoading(false);
    setShowContent(true);
    if (onLoaded) onLoaded();
  };

  return (
    <>
      <style>{`
        .content-iframe {
          transition: opacity 0.3s ease-in-out;
        }

        .content-iframe.loading {
          opacity: 0.8; /* Show iframe content even while loading */
        }

        .content-iframe.visible {
          opacity: 1;
        }

        .loading-message {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.2rem;
          font-weight: 500;
          color: #333;
          background: rgba(255, 255, 255, 0.95);
          padding: 1.5rem 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 10;
          pointer-events: none;
          opacity: ${isLoading ? '1' : '0'};
          visibility: ${isLoading ? 'visible' : 'hidden'};
          transition: all 0.4s ease-in-out;
          display: flex;
          align-items: center;
          gap: 1rem;
          backdrop-filter: blur(10px);
          animation: ${isLoading ? 'fadeInScale 0.4s ease-out' : 'fadeOutScale 0.3s ease-in'};
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #ffebee;
          border-top: 3px solid #f44336;
          border-radius: 50%;
          animation: spin 1s linear infinite;
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
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .loading-dot:nth-child(1) { animation-delay: -0.32s; }
        .loading-dot:nth-child(2) { animation-delay: -0.16s; }
        .loading-dot:nth-child(3) { animation-delay: 0s; }

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
        {isLoading && (
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <span>データを読み込んでいます</span>
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        )}
        
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
};


export default NoLoadingContentIFrame;