import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * TransitionOverlay - Hiệu ứng tối mờ khi chuyển trang quiz với fade in/out mượt
 */
const TransitionOverlay = ({ isVisible, onTransitionComplete }) => {
  const [opacity, setOpacity] = useState(0);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const duration = 500; // 0.5 seconds for smooth fade

  useEffect(() => {
    if (isVisible) {
      // Fade in gradually
      startTimeRef.current = Date.now();
      document.body.classList.add('quiz-transitioning');
      
      const animate = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easeInOut = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        setOpacity(easeInOut);
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      // Fade out gradually
      startTimeRef.current = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easeInOut = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        setOpacity(1 - easeInOut);
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Remove class from body when fade out complete
          document.body.classList.remove('quiz-transitioning');
          if (onTransitionComplete) {
            onTransitionComplete();
          }
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    // Cleanup: cancel animation and remove class when component unmounts
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      document.body.classList.remove('quiz-transitioning');
    };
  }, [isVisible, onTransitionComplete]);

  if (!isVisible && opacity === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark overlay with 60% opacity
        zIndex: 9999,
        opacity: opacity,
        pointerEvents: isVisible ? 'auto' : 'none',
        willChange: 'opacity', // Optimize for animation
      }}
    />
  );
};

TransitionOverlay.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onTransitionComplete: PropTypes.func,
};

export default TransitionOverlay;

