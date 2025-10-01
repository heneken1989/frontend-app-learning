import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Button } from '@openedx/paragon';
import { useModel } from '@src/generic/model-store';
import { GetCourseExitNavigation } from '../../course-exit';
import { useSequenceNavigationMetadata } from './hooks';
import messages from './messages';
import PreviousButton from './generic/PreviousButton';
import NextButton from './generic/NextButton';
import { NextUnitTopNavTriggerSlot } from '../../../../plugin-slots/NextUnitTopNavTriggerSlot';
import { CourseOutlineSidebarTriggerSlot } from '../../../../plugin-slots/CourseOutlineSidebarTriggerSlot';
import { CourseOutlineSidebarSlot } from '../../../../plugin-slots/CourseOutlineSidebarSlot';

/**
 * Persistent Navigation Bar that stays fixed and doesn't re-render during unit changes
 */
const PersistentNavigationBar = ({ courseId, sequenceId, unitId, onClickPrevious, onClickNext, isAtTop = false }) => {
  const intl = useIntl();
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitButton, setShowSubmitButton] = useState(true); // Always show Check button
  const [currentButtonState, setCurrentButtonState] = useState('確認'); // '確認' or 'やり直し'

  const [container, setContainer] = useState(null);
  const containerRef = useRef(null);

  const {
    isFirstUnitInSequence, isLastUnitInSequence, nextLink, previousLink,
  } = useSequenceNavigationMetadata(sequenceId, unitId);

  // Get unit data from model store
  const unit = useModel('units', unitId);

  // Get unit title for display
  const getUnitTitle = () => {
    // Try to get title from unit data first
    if (unit && unit.title) {
      // Extract number from title (e.g., "Unit 109" -> "109")
      const numberMatch = unit.title.match(/(\d+)/);
      if (numberMatch) {
        return numberMatch[1]; // Return just the number like 109, 110, 111
      }
      // If no number found, return the full title
      return unit.title;
    }
    
    // Fallback: extract from unitId
    if (unitId) {
      const match = unitId.match(/block@([a-f0-9]+)/);
      if (match) {
        const blockId = match[1];
        const numberMatch = blockId.match(/(\d{3})/);
        if (numberMatch) {
          return numberMatch[1];
        }
        return blockId.substring(0, 3);
      }
    }
    return 'Unit';
  };

  const courseExitNav = GetCourseExitNavigation(courseId, intl);

  // Create persistent container
  useEffect(() => {
    if (!containerRef.current) {
      // Create a container that stays in DOM
      containerRef.current = document.createElement('div');
      containerRef.current.id = 'persistent-navigation-container';
      containerRef.current.style.cssText = `
        position: relative;
        width: 100%;
        background: white;
        border-bottom: 1px solid #eee;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
      `;
      
      // Insert before the main content area instead of at body start
      const mainContent = document.querySelector('.courseware-sequence') || document.querySelector('.unit') || document.querySelector('main');
      if (mainContent) {
        mainContent.parentNode.insertBefore(containerRef.current, mainContent);
      } else {
        document.body.insertBefore(containerRef.current, document.body.firstChild);
      }
      setContainer(containerRef.current);
    }

    return () => {
      // Cleanup on component unmount
      if (containerRef.current && containerRef.current.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current);
        containerRef.current = null;
      }
    };
  }, []);

  // Message handling for iframe communication - only handle loading states
  useEffect(() => {
    const handleMessage = (event) => {
      const iframe = document.getElementById('unit-iframe');
      if (!iframe || event.source !== iframe.contentWindow) {
        return;
      }

      // BLOCK problem.complete to prevent reload
      if (event.data.type === 'problem.complete') {
        return;
      }

      switch (event.data.type) {
        case 'problem.ready':
          // Just reset loading state, don't change button text
          setIsSubmitting(false);
          break;
        case 'problem.submit.start':
          setIsSubmitting(true);
          break;
        case 'problem.submit.done':
          setIsSubmitting(false);
          // DON'T change button state here - only manual clicks should change it
          break;
        case 'quiz.data.ready':
          // Handle quiz data directly from quiz iframe
          // Check if template wants to show popup
          if (event.data.templateConfig && event.data.templateConfig.showPopup === false) {
            return;
          }
          
          // If no templateConfig or showPopup is true/undefined, show popup
          if (event.data.quizData) {
            showTestPopup(event.data.quizData);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Reset button state when unit changes - always back to "確認"
  useEffect(() => {
    if (unitId) {
      setCurrentButtonState('確認');
    }
  }, [unitId]);

  // Reset when unit changes but keep the navigation bar persistent
  useEffect(() => {
    setIsSubmitEnabled(true);
    setIsSubmitting(false);
    // Keep showSubmitButton as true - always show Check button

    // Don't send any automatic messages - only when user clicks submit
  }, [unitId]);

  const handleSubmit = () => {
    const iframe = document.getElementById('unit-iframe');

    if (!iframe || isSubmitting) {
      return;
    }

    try {
      // Toggle button state manually - ONLY on user click
      if (currentButtonState === '確認') {
        // First click: Send check message
        iframe.contentWindow.postMessage({ type: 'problem.submit', action: 'check' }, '*');
        setCurrentButtonState('やり直し');
      } else {
        // Second click: Send reset message and close popup
        iframe.contentWindow.postMessage({ type: 'problem.submit', action: 'reset' }, '*');
        setCurrentButtonState('確認');
        
        // Close popup if it's open
        const existingPopup = document.getElementById('test-popup');
        if (existingPopup) {
          existingPopup.remove();
          // Clean up any existing styles
          const existingStyle = document.querySelector('style[data-popup-style]');
          if (existingStyle) {
            existingStyle.remove();
          }
        }
        
        // Reset timer on header
        window.dispatchEvent(new CustomEvent('resetTimer', { 
          detail: { 
            unitId: unitId,
            timestamp: Date.now()
          } 
        }));
      }
    } catch (e) {
      console.error('Error sending message to iframe:', e);
    }
  };

  // Function to show test popup with data from localStorage
  const showTestPopup = (quizData = null) => {
    // Remove existing popup if any
    const existingPopup = document.getElementById('test-popup');
    if (existingPopup) {
      existingPopup.remove();
    }

    // If no data provided, try to get from localStorage
    if (!quizData) {
      try {
        const storedData = localStorage.getItem('quizGradeSubmitted');
        const timestamp = localStorage.getItem('quizGradeSubmittedTimestamp');
        
        if (storedData && timestamp) {
          const timeDiff = Date.now() - parseInt(timestamp);
          if (timeDiff < 10000) { // Only if data is less than 10 seconds old
            quizData = JSON.parse(storedData);
          }
        }
      } catch (error) {
        // Handle error silently
      }
    }

    // Create answer paragraph container (like in quiz iframe)
    const popup = document.createElement('div');
    popup.id = 'test-popup';
    popup.style.cssText = `
      position: fixed;
      bottom: 60px;
      left: 0;
      right: 0;
      padding: 0;
      background-color: rgba(99, 97, 97, 0.95);
      z-index: 9999;
      transition: transform 0.3s ease;
      max-height: calc(100vh - 60px);
      overflow-y: auto;
    `;

    // Create inner content wrapper
    const innerWrapper = document.createElement('div');
    innerWrapper.style.cssText = `
      max-width: 70%;
      margin: 0 auto;
      background: #fff;
      border-radius: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.15);
      border: 1px solid #ddd;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      max-height: calc(100vh - 80px);
      overflow-y: auto;
      padding: 1.5rem;
      margin-top: 0;
      margin-bottom: 0;
    `;
    
    // Generate popup content based on template type
    let popupContent = '';
    
    if (quizData && quizData.templateId === 22) {
      // Template 22: Grammar Sentence Rearrangement
      const correctWords = quizData.correctWords || [];
      const userWords = quizData.userWords || [];
      const paragraphText = quizData.paragraphText || '';
      const score = quizData.score || 0;
      const correctCount = quizData.correctCount || 0;
      const totalQuestions = quizData.totalQuestions || 0;
      
      // Process HTML content to extract text and build paragraphs with boxes
      let processedParagraphText = paragraphText;
      
      if (paragraphText.includes('<span') && paragraphText.includes('blank')) {
        // Remove ALL content inside blank spans and replace with placeholders
        // Handle both empty and filled blank spans
        let tempText = paragraphText;
        
        // First try regex approach for all blank spans (based on Python pattern)
        const regexPattern = /<span[^>]*id="blank\d+"[^>]*>[\s\S]*?<\/span>/g;
        tempText = tempText.replace(regexPattern, '___BLANK_PLACEHOLDER___');
        
        // If regex didn't work, use manual approach
        let replaceCount = 0;
        while (tempText.includes('<span') && (tempText.includes('class="blank"') || tempText.includes('class="blank filled"'))) {
          const startIndex = tempText.indexOf('<span');
          const endIndex = tempText.indexOf('</span>', startIndex);
          if (endIndex !== -1) {
            tempText = tempText.substring(0, startIndex) + '___BLANK_PLACEHOLDER___' + tempText.substring(endIndex + 7);
            replaceCount++;
          } else {
            break;
          }
        }
        
        processedParagraphText = tempText
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      // Clean up any remaining HTML tags except ruby/rt for furigana
      processedParagraphText = processedParagraphText
        .replace(/<div[^>]*>/g, '') // Remove div tags
        .replace(/<\/div>/g, '') // Remove closing div tags
        .replace(/<meta[^>]*>/g, '') // Remove meta tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // Clean up any duplicate text that might exist in the template
      // Remove any repeated words or phrases that could cause duplicates
      processedParagraphText = processedParagraphText
        .replace(/(\w+)\s+\1/g, '$1') // Remove consecutive duplicate words
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // Build correct paragraph with all words highlighted in green
      let correctParagraph = processedParagraphText;
      if (correctWords.length > 0) {
        let blankIndex = 0;
        correctParagraph = processedParagraphText.replace(/___BLANK_PLACEHOLDER___/g, () => {
          const correctWord = correctWords[blankIndex] || '';
          blankIndex++;
          return `<span style="display: inline-block; padding: 4px 8px; margin: 0 2px; border-radius: 3px; font-weight: bold; background: #2e7d32; color: #fff;">${correctWord}</span>`;
        });
      }
      
      // Build user answer paragraph with correct/incorrect styling
      let userAnswerParagraph = processedParagraphText;
      if (userWords.length > 0) {
        // Clean up userWords by removing meta tags but preserving furigana
        const cleanedUserWords = userWords.map(word => {
          return word
            .replace(/<meta[^>]*>/g, '') // Remove meta tags
            .trim();
        });
        
        // Replace ___BLANK_PLACEHOLDER___ with user answers
        let blankIndex = 0;
        userAnswerParagraph = processedParagraphText.replace(/___BLANK_PLACEHOLDER___/g, () => {
          const userWord = cleanedUserWords[blankIndex] || '';
          const correctWord = correctWords[blankIndex] || '';
          
          // Compare text content (remove HTML tags for comparison)
          const userText = userWord.replace(/<[^>]*>/g, '').trim();
          const correctText = correctWord.replace(/<[^>]*>/g, '').trim();
          
          // For sentence rearrangement, we need to check if the word is in the correct position
          // Use the correctWords array from the actual data
          const expectedWord = correctWords[blankIndex] ? correctWords[blankIndex].replace(/<[^>]*>/g, '').trim() : '';
          const isCorrect = userText === expectedWord;
          
          blankIndex++;
          
          if (userWord) {
            return `<span style="display: inline-block; padding: 4px 8px; margin: 0 2px; border-radius: 3px; font-weight: bold; background: ${isCorrect ? '#2e7d32' : '#b40000'}; color: #fff;">${userWord}</span>`;
          } else {
            return `<span style="display: inline-block; padding: 4px 8px; margin: 0 2px; border-radius: 3px; font-weight: bold; background: #b40000; color: #fff; min-width: 40px; min-height: 20px;"></span>`;
          }
        });
      }
      
      popupContent = `
        <div class="grammar-rearrangement-popup">
          <style>
            .grammar-rearrangement-popup ruby { 
              font-size: 16px !important; 
            }
            .grammar-rearrangement-popup rt { 
              font-size: 12px !important; 
              color: #666 !important; 
            }
            .grammar-rearrangement-popup .correct-paragraph rt,
            .grammar-rearrangement-popup .user-answer-paragraph rt {
              color: #666 !important;
            }
            .grammar-rearrangement-popup .correct-paragraph span[style*="background: #2e7d32"] rt,
            .grammar-rearrangement-popup .user-answer-paragraph span[style*="background: #2e7d32"] rt {
              color: #fff !important;
            }
            .grammar-rearrangement-popup .user-answer-paragraph span[style*="background: #b40000"] rt {
              color: #fff !important;
            }
          </style>
          <div class="answer-comparison" style="display: flex; gap: 30px;">
            <!-- Correct Order Column -->
            <div class="answer-column" style="flex: 1;">
              <div class="answer-column-title" style="margin: 0 0 15px 0; color: #666; font-size: 14px; font-weight: bold;">正しい順序 (Correct Order)</div>
              <div class="correct-paragraph" style="padding: 15px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 16px; line-height: 1.6; color: #333;">
                ${correctParagraph}
              </div>
            </div>
            
            <!-- Your Answer Column -->
            <div class="answer-column" style="flex: 1;">
              <div class="answer-column-title" style="margin: 0 0 15px 0; color: #666; font-size: 14px; font-weight: bold;">あなたの答え (Your Answer)</div>
              <div class="user-answer-paragraph" style="padding: 15px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 16px; line-height: 1.6; color: #333;">
                ${userAnswerParagraph}
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (quizData && quizData.templateId === 29) {
      // Template 29: Grammar Single Select - Show Script Text Only
      const scriptText = quizData.scriptText || '';
      
      // Function to convert furigana format and underline text in quotes
      const convertFurigana = (text) => {
        if (!text || typeof text !== "string") return text;
        
        // First underline text in quotes: "text" -> <span style="text-decoration: underline;">text</span>
        text = text.replace(/"([^"]+)"/g, '<span style="text-decoration: underline;">$1</span>');
        
        // Japanese parentheses: 毎日（まいにち） -> <ruby>毎日<rt>まいにち</rt></ruby>
        const reJaParens = /([一-龯ひらがなカタカナ0-9]+)（([^）]+)）/g;
        text = text.replace(reJaParens, (match, p1, p2) => {
          return `<ruby>${p1}<rt>${p2}</rt></ruby>`;
        });
        
        // ASCII parentheses: 車(くるま) -> <ruby>車<rt>くるま</rt></ruby>
        const reAsciiParens = /([一-龯ひらがなカタカナ0-9]+)\(([^)]+)\)/g;
        text = text.replace(reAsciiParens, (match, p1, p2) => {
          return `<ruby>${p1}<rt>${p2}</rt></ruby>`;
        });
        
        return text;
      };
      
      const processedScriptText = convertFurigana(scriptText);
      
      popupContent = `
        <div class="grammar-single-select-popup">
          <style>
            .grammar-single-select-popup ruby { 
              font-size: 16px !important; 
            }
            .grammar-single-select-popup rt { 
              font-size: 12px !important; 
              color: #666 !important; 
            }
            .grammar-single-select-popup .script-text rt {
              color: #666 !important;
            }
          </style>
          
          <!-- Script Text Section -->
          <div class="script-section">
            <div class="script-title" style="margin: 0 0 15px 0; color: #333; font-size: 16px; font-weight: bold; text-align: center;">スクリプト (Script)</div>
            <div class="script-text" style="padding: 15px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 16px; line-height: 1.6; color: #333; text-align: center;">
              ${processedScriptText}
            </div>
          </div>
        </div>
      `;
    } else if (quizData && quizData.options && quizData.options.length > 0) {
      // Original template (multiple choice)
      popupContent = `
        <div class="answer-comparison" style="display: flex; gap: 30px; margin-bottom: 20px;">
          <!-- Correct Answer Column -->
          <div class="answer-column" style="flex: 1;">
            <div class="answer-column-title" style="margin: 0 0 15px 0; color: #666; font-size: 14px; font-weight: normal;">Correct answer</div>
            <div id="correct-answers" style="display: flex; flex-direction: column; gap: 8px;">
              ${quizData.options.map(option => `
                <div class="answer-option" style="display: flex; align-items: center; gap: 8px; padding: 8px 0;">
                  <div style="width: 16px; height: 16px; border: 1px solid #ccc; border-radius: 2px; display: flex; align-items: center; justify-content: center; background: ${option.isCorrect ? '#666' : 'white'};">
                    ${option.isCorrect ? '✓' : ''}
                  </div>
                  <span style="font-size: 14px; color: #333;">${option.text}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Your Answer Column -->
          <div class="answer-column" style="flex: 1;">
            <div class="answer-column-title" id="your-answer-title" style="margin: 0 0 15px 0; color: #666; font-size: 14px; font-weight: normal;">Your answer: ${quizData.score || 0}/1</div>
            <div id="your-answers" style="display: flex; flex-direction: column; gap: 8px;">
              ${quizData.options.map(option => `
                <div class="answer-option" style="display: flex; align-items: center; gap: 8px; padding: 8px 0;">
                  <div style="width: 16px; height: 16px; border: 1px solid #ccc; border-radius: 2px; display: flex; align-items: center; justify-content: center; background: ${option.isSelected ? '#666' : 'white'};">
                    ${option.isSelected ? '✓' : ''}
                  </div>
                  <span style="font-size: 14px; color: #333;">${option.text}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } else {
      // Show fallback content
      popupContent = `
        <div style="text-align: center; color: #666;">
          <p>No quiz data available</p>
        </div>
      `;
    }
    
    innerWrapper.innerHTML = popupContent;
    
    // Add inner wrapper to popup
    popup.appendChild(innerWrapper);
    
    // Add responsive styles
    const style = document.createElement('style');
    style.setAttribute('data-popup-style', 'true');
    style.textContent = `
      @media (max-width: 768px) {
        #test-popup .inner-wrapper {
          max-width: 85% !important;
        }
      }
      @media (max-width: 480px) {
        #test-popup .inner-wrapper {
          max-width: 95% !important;
          padding: 1rem !important;
        }
        #test-popup .answer-comparison {
          flex-direction: column !important;
          gap: 15px !important;
        }
        #test-popup .grammar-rearrangement-popup .answer-comparison {
          flex-direction: column !important;
          gap: 15px !important;
        }
        #test-popup .grammar-single-select-popup .answer-comparison {
          flex-direction: column !important;
          gap: 15px !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Add class to inner wrapper for responsive targeting
    innerWrapper.className = 'inner-wrapper';
    
    // Add popup to body
    document.body.appendChild(popup);
    
    // Auto remove after 15 seconds
    setTimeout(() => {
      if (popup.parentNode) {
        popup.remove();
        // Clean up style
        if (style.parentNode) {
          style.remove();
        }
        setCurrentButtonState('確認');
      }
    }, 15000);
  };

  const renderSubmitButton = () => {
    // Simple button state - only changes on manual clicks
    const buttonText = isSubmitting ? '確認中...' : currentButtonState;
    

    return (
      <Button
        variant="brand"
        className="submit-answer-button mx-2"
        onClick={handleSubmit}
        disabled={isSubmitting}
        style={{
          backgroundColor: '#f44336', // Red color like in the image
          borderColor: '#f44336',
          color: 'white',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        <span className="submit-label">{buttonText}</span>
      </Button>
    );
  };

  const renderPreviousButton = () => {
    const buttonStyle = `previous-button ${isAtTop ? 'text-dark mr-3' : 'justify-content-center'}`;
    return (
      <PreviousButton
        className="go-back-button"
        isFirstUnit={isFirstUnitInSequence}
        variant="outline-secondary"
        buttonLabel={intl.formatMessage(messages.previousButton)}
        buttonStyle={buttonStyle}
        onClick={onClickPrevious}
        previousLink={previousLink}
        isAtTop={isAtTop}
        disabled={isFirstUnitInSequence}
      />
    );
  };

  const renderNextButton = () => {
    const { exitActive, exitText } = courseExitNav;
    const buttonText = (isLastUnitInSequence && exitText) ? exitText : intl.formatMessage(messages.nextButton);
    const disabled = isLastUnitInSequence;
    const variant = 'outline-primary';
    const buttonStyle = `next-button ${isAtTop ? 'text-dark' : 'justify-content-center'}`;

    const handleNextClick = () => {
      // No need to save answers when navigating - only when user clicks Check button
      if (onClickNext) {
        onClickNext();
      }
    };

    if (isAtTop) {
      return (
        <NextUnitTopNavTriggerSlot
          {...{
            variant,
            buttonStyle,
            buttonText: buttonText,
            disabled,
            sequenceId,
            nextLink,
            onClickHandler: handleNextClick,
            isAtTop,
            style: {
              backgroundColor: '#00838f', // Teal color like in the image
              borderColor: '#00838f',
              color: 'white',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }
          }}
        />
      );
    }

    return (
      <NextButton
        className="go-next-button"
        variant={variant}
        buttonStyle={buttonStyle}
        onClickHandler={handleNextClick}
        disabled={disabled}
        buttonText={buttonText}
        nextLink={nextLink}
        hasEffortEstimate
        style={{
          backgroundColor: '#00838f', // Teal color like in the image
          borderColor: '#00838f',
          color: 'white',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
    );
  };

  // Don't render anything if container not ready
  if (!container) {
    return null;
  }

  // Render into the persistent container
  return createPortal(
    <>
      <div className="unit-navigation-bar d-flex align-items-center justify-content-center" style={{ 
        padding: '1rem',
        position: 'fixed',
        bottom: '0', // Move to bottom to cover bottom bar
        left: '0',
        right: '0',
        zIndex: 10000, // Higher than bottom bar
        background: '#ebebeb', // Light gray color like in the image
        borderTop: '1px solid #ddd', // Slightly darker border
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)', // Shadow above
        width: '100%',
        height: '60px' // Reduced height from 70px to 60px
      }}>
        {renderSubmitButton()}
        {renderNextButton()}
                  {/* Unit title display */}
                  <div style={{ 
                    marginLeft: '16px',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    {getUnitTitle()}
                  </div>
                  <CourseOutlineSidebarSlot />
      </div>
      

    </>,
    container
  );
};

PersistentNavigationBar.propTypes = {
  courseId: PropTypes.string.isRequired,
  sequenceId: PropTypes.string.isRequired,
  unitId: PropTypes.string,
  onClickPrevious: PropTypes.func.isRequired,
  onClickNext: PropTypes.func.isRequired,
  isAtTop: PropTypes.bool,
};

export default PersistentNavigationBar;
