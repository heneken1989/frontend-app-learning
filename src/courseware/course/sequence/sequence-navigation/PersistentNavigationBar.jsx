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
  const [showScriptButton, setShowScriptButton] = useState(false); // Show script button for template 63
  const [template63QuizData, setTemplate63QuizData] = useState(null); // Store quiz data for template 63
  const [isScriptVisible, setIsScriptVisible] = useState(false); // Track if script popup is visible
  const [hasAudioQuiz, setHasAudioQuiz] = useState(false); // Whether current quiz has audio

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
        case 'quiz.meta':
          // Quiz iframe announces metadata such as audio capability
          if (event.data && event.data.hasAudio) {
            setHasAudioQuiz(true);
          }
          break;
        case 'quiz.data.ready':
          // Debug: Log message from template
          console.log('🔍 Received quiz.data.ready message:', event.data);
          console.log('🔍 Event data type:', typeof event.data);
          console.log('🔍 Event data keys:', Object.keys(event.data || {}));
          
          // Handle quiz data directly from quiz iframe
          // Check if template wants to show popup
          if (event.data.templateConfig && event.data.templateConfig.showPopup === false) {
            console.log('🔍 Template config shows popup disabled');
            return;
          }
          
          // Check if this is template 39, 40, 63, 65, or 67 to show script button
          if (event.data.quizData && (event.data.quizData.templateId === 39 || event.data.quizData.templateId === 40 || event.data.quizData.templateId === 63 || event.data.quizData.templateId === 65 || event.data.quizData.templateId === 67)) {
            console.log(`🔍 Template ${event.data.quizData.templateId} detected - showing script button`);
            console.log(`🔍 Template ${event.data.quizData.templateId} quiz data:`, event.data.quizData);
            setShowScriptButton(true);
            setTemplate63QuizData(event.data.quizData); // Store quiz data
            // Don't auto-show popup for template 39, 40, 63, 65, and 67
            return;
          }
          
          // Check if this is template 41 - only show script button after submission
          if (event.data.quizData && event.data.quizData.templateId === 41) {
            console.log(`🔍 Template ${event.data.quizData.templateId} detected - showing script button after submission`);
            console.log(`🔍 Template ${event.data.quizData.templateId} quiz data:`, event.data.quizData);
            setShowScriptButton(true);
            setTemplate63QuizData(event.data.quizData); // Store quiz data
            // Don't auto-show popup for template 41
            return;
          }
          
          // If no templateConfig or showPopup is true/undefined, show popup
          if (event.data.quizData) {
            console.log('🔍 Calling showTestPopup with quizData:', event.data.quizData);
            showTestPopup(event.data.quizData);
          } else {
            console.log('🔍 No quizData in event.data');
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
    setShowScriptButton(false); // Reset script button when unit changes
    setTemplate63QuizData(null); // Reset template 63 quiz data when unit changes
    setIsScriptVisible(false); // Reset script visibility when unit changes
    setHasAudioQuiz(false); // Reset audio flag on unit change
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
        
        // Hide script button and reset script state for template 63
        setShowScriptButton(false);
        setIsScriptVisible(false);
        setTemplate63QuizData(null);
        
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

  const handleShowScript = () => {
    console.log('🔍 ShowScript button clicked, isScriptVisible:', isScriptVisible);
    
    if (isScriptVisible) {
      // Hide script popup
      console.log('🔍 Hiding script popup');
      const existingPopup = document.getElementById('test-popup');
      if (existingPopup) {
        existingPopup.remove();
        // Clean up any existing styles
        const existingStyle = document.querySelector('style[data-popup-style]');
        if (existingStyle) {
          existingStyle.remove();
        }
      }
      setIsScriptVisible(false);
    } else {
      // Show script popup
        console.log('🔍 Template 39/40/41/63/65/67 quiz data:', template63QuizData);
      
      if (template63QuizData) {
        console.log(`🔍 Showing script popup for template ${template63QuizData.templateId}`);
        showTestPopup(template63QuizData);
        setIsScriptVisible(true);
      } else {
        console.log('🔍 No template 39/40/41/63/65/67 quiz data available');
        
        // Fallback: try to get from localStorage
        try {
          const storedData = localStorage.getItem('quizGradeSubmitted');
          const timestamp = localStorage.getItem('quizGradeSubmittedTimestamp');
          
          if (storedData && timestamp) {
            const timeDiff = Date.now() - parseInt(timestamp);
            if (timeDiff < 10000) { // Only if data is less than 10 seconds old
              const quizData = JSON.parse(storedData);
              if (quizData && (quizData.templateId === 39 || quizData.templateId === 40 || quizData.templateId === 41 || quizData.templateId === 63 || quizData.templateId === 65 || quizData.templateId === 67)) {
                console.log(`🔍 Found template ${quizData.templateId} data in localStorage`);
                showTestPopup(quizData);
                setIsScriptVisible(true);
              }
            }
          }
        } catch (error) {
          console.error('🔍 Error getting quiz data for script:', error);
        }
      }
    }
  };

  // Function to decode script text from encoded format
  const decodeScriptText = (encodedText) => {
    if (!encodedText) return '';
    
    console.log('🔍 decodeScriptText input:', encodedText);
    
    // First decode escape characters
    let decodedText = encodedText
      .replace(/\\u3009/g, '）')   // Decode Japanese closing parenthesis (single backslash)
      .replace(/\\u3008/g, '（')   // Decode Japanese opening parenthesis (single backslash)
      .replace(/\\u300d/g, '」')   // Decode Japanese closing bracket (single backslash)
      .replace(/\\u300c/g, '「')   // Decode Japanese opening bracket (single backslash)
      .replace(/\\t/g, '\t')       // Decode tabs
      .replace(/\\r/g, '\r')       // Decode carriage returns
      .replace(/\\\\n/g, '<br>')   // Decode double backslash newlines to HTML breaks
      .replace(/\\n/g, '<br>')     // Decode single backslash newlines to HTML breaks
      .replace(/\\'/g, "'")        // Decode single quotes
      .replace(/\\"/g, '"')        // Decode double quotes
      .replace(/\\\\/g, '\\')      // Decode backslashes (must be last)
      .replace(/BREAK/g, '<br>');   // Replace BREAK markers with HTML line breaks
    
    // Then convert furigana: 事務所(じむしょ) -> <ruby>事務所<rt>じむしょ</rt></ruby>
    // First convert Japanese parentheses: 毎日（まいにち） -> <ruby>毎日<rt>まいにち</rt></ruby>
    decodedText = decodedText.replace(/([一-龯ひらがなカタカナ0-9]+)（([^）]+)）/g, function(match, p1, p2) {
      return '<ruby>' + p1 + '<rt>' + p2 + '</rt></ruby>';
    });
    // Then convert regular parentheses: 車(くるま) -> <ruby>車<rt>くるま</rt></ruby>
    decodedText = decodedText.replace(/([一-龯ひらがなカタカナ0-9]+)\(([^)]+)\)/g, function(match, p1, p2) {
      return '<ruby>' + p1 + '<rt>' + p2 + '</rt></ruby>';
    });
    
    console.log('🔍 decodeScriptText output:', decodedText);
    
    return decodedText;
  };

  // Function to show test popup with data from localStorage
  const showTestPopup = (quizData = null) => {
    // Debug: Log received data
    console.log('🔍 showTestPopup called with quizData:', quizData);
    
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
        
        console.log('🔍 localStorage data:', { storedData, timestamp });
        
        if (storedData && timestamp) {
          const timeDiff = Date.now() - parseInt(timestamp);
          console.log('🔍 Time diff:', timeDiff);
          if (timeDiff < 10000) { // Only if data is less than 10 seconds old
            quizData = JSON.parse(storedData);
            console.log('🔍 Parsed quizData from localStorage:', quizData);
          }
        }
      } catch (error) {
        console.error('🔍 Error parsing localStorage data:', error);
      }
    }
    
    // Debug: Final quizData
    console.log('🔍 Final quizData:', quizData);
    if (quizData && quizData.templateId === 29) {
      console.log('🔍 Template ID29 scriptText:', quizData.scriptText);
      console.log('🔍 ScriptText type:', typeof quizData.scriptText);
      console.log('🔍 ScriptText length:', quizData.scriptText?.length);
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
      background-color: rgba(60, 60, 60, 0.95);
      z-index: 9999;
      transition: transform 0.3s ease;
      max-height: calc(100vh - 60px);
      overflow-y: auto;
    `;

    // Create inner content wrapper
    const innerWrapper = document.createElement('div');
    innerWrapper.style.cssText = `
      width: fit-content;
      max-width: 80%;
      min-width: 300px;
      margin: 20px auto;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      border: 1px solid #ddd;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
      padding: 1rem;
      margin-top: 20px;
      margin-bottom: 20px;
    `;
    
    // Generate popup content based on template type
    let popupContent = '';
    let processedScriptText = '';
    
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
            .grammar-rearrangement-popup { 
              font-family: 'Noto Serif JP', 'Noto Sans JP', 'Kosugi Maru', 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
              font-size: 1.2rem !important;
            }
            .grammar-rearrangement-popup ruby { 
              font-size: 1.2rem !important; 
            }
            .grammar-rearrangement-popup rt { 
              font-size: 0.6em !important; 
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
              <div class="answer-column-title" style="margin: 0 0 15px 0; color: #666; font-size: 1.2rem; font-weight: bold;">正しい順序 (Correct Order)</div>
              <div class="correct-paragraph" style="padding: 15px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 1.2rem; line-height: 1.6; color: #333;">
                ${correctParagraph}
              </div>
            </div>
            
            <!-- Your Answer Column -->
            <div class="answer-column" style="flex: 1;">
              <div class="answer-column-title" style="margin: 0 0 15px 0; color: #666; font-size: 1.2rem; font-weight: bold;">あなたの答え (Your Answer)</div>
              <div class="user-answer-paragraph" style="padding: 15px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 1.2rem; line-height: 1.6; color: #333;">
                ${userAnswerParagraph}
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (quizData && quizData.templateId === 29) {
      // Template 29: Grammar Single Select - Show Script Text Only
      const encodedScriptText = quizData.scriptText || '';
      
      // Decode the script text to restore special characters
      processedScriptText = decodeScriptText(encodedScriptText);
      
      console.log('🔍 ===== TEMPLATE ID29 HIGHLIGHTING DEBUG START =====');
      console.log('🔍 Template ID29 - encodedScriptText:', encodedScriptText);
      console.log('🔍 Template ID29 - processedScriptText:', processedScriptText);
      console.log('🔍 Template ID29 - correctAnswer:', quizData.correctAnswer);
      console.log('🔍 Template ID29 - correctAnswer type:', typeof quizData.correctAnswer);
      
      // Add highlighting for correct answer only - only highlight underlined words
      let highlightedScriptText = processedScriptText;
      if (quizData.correctAnswer) {
        const correctAnswer = quizData.correctAnswer;
        
        // Debug logging
        console.log('🔍 DEBUG - Template ID29 Highlighting:');
        console.log('🔍 Original scriptText:', quizData.scriptText);
        console.log('🔍 Processed scriptText:', processedScriptText);
        console.log('🔍 Correct answer:', correctAnswer);
        console.log('🔍 Correct answer type:', typeof correctAnswer);
        
        // Extract text content from correct answer (handle furigana and HTML tags)
        const extractTextContent = (text) => {
          // Remove HTML tags first
          let cleanText = text.replace(/<[^>]*>/g, '');
          
          console.log('🔍 extractTextContent input:', cleanText);
          
          // Handle pattern like 駅(えき) or 電車（でんしゃ） or 高（たか）い - kanji with furigana in parentheses
          // Support both regular () and full-width （） parentheses
          const simpleFuriganaMatch = cleanText.match(/^([一-龯ひらがなカタカナ0-9]+)[（(]([^）)]+)[）)]$/);
          if (simpleFuriganaMatch) {
            const kanji = simpleFuriganaMatch[1].trim();
            const furigana = simpleFuriganaMatch[2].trim();
            
            console.log('🔍 Simple furigana match:', { kanji, furigana });
            
            // Extract hiragana parts from kanji (like い in 高（たか）い)
            const hiraganaParts = kanji.match(/[ひらがな]+/g) || [];
            
            console.log('🔍 Hiragana parts:', hiraganaParts);
            
            // Options: kanji match, furigana match, and kanji+furigana match
            const options = [
              kanji, // 電車 - for kanji match
              furigana, // でんしゃ - for furigana match
              kanji + furigana, // 電車でんしゃ - for kanji+furigana match
            ];
            
            // Add full furigana (furigana + hiragana parts) only if there are hiragana parts
            if (hiraganaParts.length > 0) {
              const fullFurigana = furigana + hiraganaParts.join('');
              options.push(fullFurigana); // たかい - for furigana+hiragana match
              console.log('🔍 Full furigana:', fullFurigana);
            }
            
            console.log('🔍 Simple furigana options (limited):', options);
            return options;
          }
          
          // Handle pure hiragana/katakana text (like でんしゃ, みっつ, etc.)
          const pureKanaMatch = cleanText.match(/^[ひらがなカタカナ]+$/);
          if (pureKanaMatch) {
            console.log('🔍 Pure kana match:', cleanText);
            
            const options = [
              cleanText, // Original: でんしゃ - only one option for pure kana
            ];
            
            console.log('🔍 Pure kana options (limited):', options);
            return options;
          }
          
          // Handle furigana patterns like [みっつ] or (みっつ) or 三（みっ）つ
          // Extract both kanji and furigana parts
          const furiganaMatch = cleanText.match(/^(.+?)\[([^\]]+)\]$/);
          if (furiganaMatch) {
            const kanji = furiganaMatch[1].trim();
            const furigana = furiganaMatch[2].trim();
            
            // Options: kanji match, furigana match, and kanji+furigana match
            const options = [
              kanji, // For kanji match
              furigana, // For furigana match
              kanji + furigana, // For kanji+furigana match
            ];
            
            console.log('🔍 Furigana pattern options (limited):', options);
            return options;
          }
          
          // Handle pattern like 三（みっ）つ - kanji with furigana in parentheses
          const parenFuriganaMatch = cleanText.match(/^(.+?)（([^）]+)）(.+?)$/);
          if (parenFuriganaMatch) {
            const beforeKanji = parenFuriganaMatch[1].trim();
            const furigana = parenFuriganaMatch[2].trim();
            const afterKanji = parenFuriganaMatch[3].trim();
            
            console.log('🔍 Paren furigana match:', { beforeKanji, furigana, afterKanji });
            
            // Options: kanji match, furigana+hiragana match, and kanji+furigana+hiragana match
            const options = [
              beforeKanji + afterKanji, // 三つ - for kanji match
              furigana + afterKanji, // みっつ - for furigana+hiragana match
              beforeKanji + furigana + afterKanji, // 三みっつ - for kanji+furigana+hiragana match
            ];
            
            console.log('🔍 Paren furigana options (limited):', options);
            return options;
          }
          
          // Handle ruby/rt tags - extract both kanji and furigana
          const rubyMatch = cleanText.match(/<ruby[^>]*>([^<]+)<rt[^>]*>([^<]+)<\/rt><\/ruby>/);
          if (rubyMatch) {
            const kanji = rubyMatch[1].trim();
            const furigana = rubyMatch[2].trim();
            return [kanji, furigana];
          }
          
          // Remove ruby/rt tags and content
          cleanText = cleanText.replace(/<ruby[^>]*>.*?<\/ruby>/g, '');
          cleanText = cleanText.replace(/<rt[^>]*>.*?<\/rt>/g, '');
          
          console.log('🔍 Final clean text:', cleanText.trim());
          return [cleanText.trim()];
        };
        
        const cleanCorrectAnswer = extractTextContent(correctAnswer);
        
        // Debug logging for extraction
        console.log('🔍 Clean correct answer options:', cleanCorrectAnswer);
        
        // Find all underlined spans and check if any contain the clean text
        const underlinedSpans = processedScriptText.match(/<span[^>]*style="[^"]*text-decoration:\s*underline[^"]*"[^>]*>.*?<\/span>/g);
        
        // Debug logging for underlined spans
        console.log('🔍 Found underlined spans:', underlinedSpans);
        
        if (underlinedSpans) {
          let foundMatch = false; // Flag to stop after first match
          
          for (let index = 0; index < underlinedSpans.length && !foundMatch; index++) {
            const span = underlinedSpans[index];
            const spanText = extractTextContent(span);
            const spanTextArray = Array.isArray(spanText) ? spanText : [spanText];
            
            // Debug logging for each span
            console.log(`🔍 Span ${index}:`, span);
            console.log(`🔍 Span ${index} extracted text:`, spanTextArray);
            
            // Check if any of the clean correct answer options match any of the span text options
            const hasMatch = cleanCorrectAnswer.some(correctOption => 
              spanTextArray.some(spanOption => spanOption === correctOption)
            );
            
            console.log(`🔍 Span ${index} has match:`, hasMatch);
            
            if (hasMatch) {
              // Extract the content inside the span (without the span tags)
              const spanContent = span.replace(/<span[^>]*>/, '').replace(/<\/span>/, '');
              console.log(`🔍 Span ${index} content to highlight:`, spanContent);
              // Replace this specific underlined span with highlighted version, preserving the original span structure
              const highlightedSpan = span.replace(/<span[^>]*>/, '<span class="correct-answer" style="text-decoration: underline;">').replace(/<\/span>/, '</span>');
              highlightedScriptText = highlightedScriptText.replace(span, highlightedSpan);
              foundMatch = true; // Stop after first match
              console.log(`🔍 Found match at span ${index}, stopping search`);
            }
          }
        }
        
        // Also check for ruby tags that might contain the correct answer
        const rubyTags = processedScriptText.match(/<ruby[^>]*>.*?<\/ruby>/g);
        console.log('🔍 Found ruby tags:', rubyTags);
        
        if (rubyTags) {
          rubyTags.forEach((rubyTag, index) => {
            console.log(`🔍 Ruby tag ${index}:`, rubyTag);
            
            // Extract both kanji and furigana from ruby tag
            const rubyMatch = rubyTag.match(/<ruby[^>]*>([^<]+)<rt[^>]*>([^<]+)<\/rt><\/ruby>/);
            if (rubyMatch) {
              const kanji = rubyMatch[1].trim();
              const furigana = rubyMatch[2].trim();
              
              console.log(`🔍 Ruby tag ${index} - kanji:`, kanji, 'furigana:', furigana);
              
              // Check if correct answer matches kanji, furigana, or both
              const hasRubyMatch = cleanCorrectAnswer.some(correctOption => 
                correctOption === kanji || correctOption === furigana || correctOption === (kanji + furigana) || correctOption === (furigana + kanji)
              );
              
              console.log(`🔍 Ruby tag ${index} has match:`, hasRubyMatch);
              
              if (hasRubyMatch) {
                // Replace the ruby tag with highlighted version
                highlightedScriptText = highlightedScriptText.replace(rubyTag, `<span class="correct-answer">${rubyTag}</span>`);
              }
            }
          });
        }
        
        // Remove direct text matching - only highlight underlined spans that match
        console.log('🔍 Skipping direct text matches - only highlighting underlined spans');
        
        // Debug logging for final result
        console.log('🔍 ===== TEMPLATE ID29 HIGHLIGHTING DEBUG END =====');
        console.log('🔍 Final highlighted script text:', highlightedScriptText);
        console.log('🔍 Highlighting changes made:', highlightedScriptText !== processedScriptText);
        console.log('🔍 ===== TEMPLATE ID29 HIGHLIGHTING DEBUG END =====');
      }
      
      popupContent = `
        <div class="grammar-single-select-popup">
          <style>
            .grammar-single-select-popup { 
              font-family: 'Noto Serif JP', 'Noto Sans JP', 'Kosugi Maru', 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
              font-size: 1.2rem !important;
            }
            .grammar-single-select-popup ruby { 
              font-size: 1.2rem !important; 
            }
            .grammar-single-select-popup rt { 
              font-size: 0.6em !important; 
              color: #666 !important; 
            }
            .grammar-single-select-popup .script-text rt {
              color: #666 !important;
            }
            .grammar-single-select-popup .script-text span[style*="text-decoration: underline"] {
              text-decoration: underline !important;
              text-decoration-color: #333 !important;
              text-decoration-thickness: 2px !important;
              text-underline-offset: 2px !important;
            }
            .grammar-single-select-popup .script-text .script-highlight {
              color: #b40000 !important;
              font-weight: normal !important;
            }
            .grammar-single-select-popup .script-text .script-highlight rt {
              color: #b40000 !important;
            }
            .grammar-single-select-popup .correct-answer {
              color: #2e7d32 !important;
              font-weight: bold !important;
              background-color: #e8f5e8 !important;
              padding: 2px 6px !important;
              border-radius: 3px !important;
              text-decoration: underline !important;
              text-decoration-color: #2e7d32 !important;
              text-decoration-thickness: 2px !important;
              text-underline-offset: 2px !important;
            }
            .grammar-single-select-popup .correct-answer ruby {
              color: #2e7d32 !important;
              font-weight: bold !important;
            }
            .grammar-single-select-popup .correct-answer rt {
              color: #2e7d32 !important;
              font-weight: bold !important;
              background-color: #e8f5e8 !important;
            }
            .grammar-single-select-popup .correct-answer rb {
              color: #2e7d32 !important;
              font-weight: bold !important;
            }
          </style>
          
          <!-- Script Text Section -->
          <div class="script-section">
            <div class="script-title" style="margin: 0 0 10px 0; color: #333; font-size: 1.2rem; font-weight: bold; text-align: center;">スクリプト (Script)</div>
            <div class="script-text" style="padding: 12px; background: #f8f9fa; border-radius: 4px; font-size: 1.2rem; line-height: 1.5; color: #333; text-align: left;">
              ${highlightedScriptText}
            </div>
          </div>
        </div>
      `;
    } else if (quizData && quizData.templateId === 41) {
      // Template 41: Highlight Japanese - Show explanation with correct words replaced
      const paragraphText = decodeScriptText(quizData.paragraphText || '');
      const fixedWordsExplanation = quizData.fixedWordsExplanation || '';
      
      console.log('🔍 Template ID41 - paragraphText:', paragraphText);
      console.log('🔍 Template ID41 - fixedWordsExplanation:', fixedWordsExplanation);
      
      // Parse fixed words explanation to create mapping
      const fixedWordsMap = {};
      const indexedFixedWordsMap = {};
      const correctWords = []; // This will be populated from the mapping
      
      if (fixedWordsExplanation) {
        const pairs = fixedWordsExplanation.split(',').map(p => p.trim());
        console.log('🔍 Popup - Parsing pairs:', pairs);
        
        pairs.forEach(pair => {
          // Replace full-width equals sign (＝) with standard equals sign (=)
          const normalizedPair = pair.replace(/＝/g, '=');
          
          // Check if this is an indexed format (word:index=fixed)
          if (normalizedPair.includes(':') && normalizedPair.includes('=')) {
            const [wrongWithIndex, fixed] = normalizedPair.split('=').map(s => s.trim());
            if (wrongWithIndex && fixed) {
              const [wrong, indexStr] = wrongWithIndex.split(':').map(s => s.trim());
              // For furigana format like 会社員（かいしゃいん）, extract only the main part
              const normWrong = wrong.replace(/（[^）]*）/g, '').replace(/[.,!?;:()\"'-]/g, '').toLowerCase();
              const index = parseInt(indexStr, 10);
              
              if (!isNaN(index)) {
                if (!indexedFixedWordsMap[normWrong]) {
                  indexedFixedWordsMap[normWrong] = {};
                }
                indexedFixedWordsMap[normWrong][index] = fixed;
                
                // For indexed format, don't add to correctWords - only specific occurrences are correct
                console.log('🔍 Popup - Indexed format - not adding to correctWords, will use indexedFixedWordsMap only');
              } else {
                // Only add to correctWords if no valid index (fallback for simple format)
                if (!correctWords.includes(normWrong)) {
                  correctWords.push(normWrong);
                  console.log('🔍 Popup - Added to correctWords (no index):', normWrong);
                }
              }
            }
          } 
          // Simple format (word=fixed)
          else if (normalizedPair.includes('=')) {
            console.log('🔍 Popup - Processing simple format:', normalizedPair);
            const [wrong, fixed] = normalizedPair.split('=').map(s => s.trim());
            console.log('🔍 Popup - wrong:', wrong, 'fixed:', fixed);
            if (wrong && fixed) {
              // Normalize both wrong and fixed words to remove furigana and punctuation
              // For furigana format like 会社員（かいしゃいん）, extract only the main part
              const normWrong = wrong.replace(/（[^）]*）/g, '').replace(/[.,!?;:()\"'-]/g, '').toLowerCase();
              const normFixed = fixed.replace(/（[^）]*）/g, '').replace(/[.,!?;:()\"'-]/g, '').toLowerCase();
              console.log('🔍 Popup - normWrong:', normWrong, 'normFixed:', normFixed);
              
              // Add to correctWords if not already included
              if (!correctWords.includes(normWrong)) {
                correctWords.push(normWrong);
              }
              
              // Store in both maps
              fixedWordsMap[normWrong] = fixed; // Keep original fixed word with furigana
              console.log('🔍 Popup - Added to fixedWordsMap:', normWrong, '->', fixed);
              
              // Also treat as an indexed mapping with index 0
              if (!indexedFixedWordsMap[normWrong]) {
                indexedFixedWordsMap[normWrong] = {};
              }
              indexedFixedWordsMap[normWrong][0] = fixed; // Keep original fixed word with furigana
              console.log('🔍 Popup - Added to indexedFixedWordsMap:', normWrong, '[0] ->', fixed);
            }
          }
        });
      }
      
      // Function to convert furigana format from 車(くるま) to <ruby>車<rt>くるま</rt></ruby>
      const convertFurigana = (text) => {
        if (!text || typeof text !== "string") return text;

        // Chỉ Kanji (và vài ký tự đặc biệt)
        const kanjiWord = "[\u4E00-\u9FFF々〆〤ヶ]+";

        // Dấu ngoặc Nhật (全角)
        const reJaParens = new RegExp("(" + kanjiWord + ")（([^）]+)）", "g");
        text = text.replace(reJaParens, (match, p1, p2) => {
          return '<ruby>' + p1 + '<rt>' + p2 + '</rt></ruby>';
        });

        // Dấu ngoặc ASCII (半角)
        const reAsciiParens = new RegExp("(" + kanjiWord + ")\\(([^)]+)\\)", "g");
        text = text.replace(reAsciiParens, (match, p1, p2) => {
          return '<ruby>' + p1 + '<rt>' + p2 + '</rt></ruby>';
        });

        return text;
      };
      
      // Function to split words
      const splitWords = (text) => {
        // First, replace <br> tags with spaces to avoid breaking words
        const textWithSpaces = text.replace(/<br\s*\/?>/gi, ' ');
        // Then split on spaces and filter out empty strings
        return textWithSpaces.split(/[\u0020\u3000]+/).filter(Boolean);
      };
      
      // Function to normalize word
      const normalize = (word) => {
        // For ruby tags, extract only the main text (not the furigana)
        if (word.includes('<ruby>') && word.includes('</ruby>')) {
          const rubyMatch = word.match(/<ruby>([^<]+)<rt>[^<]+<\/rt><\/ruby>/);
          if (rubyMatch) {
            return rubyMatch[1].replace(/[.,!?;:()\"'-]/g, '').toLowerCase();
          }
        }
        // For other HTML tags, remove them
        let cleanWord = word.replace(/<[^>]*>/g, '');
        // Then remove punctuation
        return cleanWord.replace(/[.,!?;:()\"'-]/g, '').toLowerCase();
      };
      
      // Create explanation text with correct words replaced and highlighted
      const createExplanationText = () => {
        // First, split by <br> tags to preserve line breaks
        const lines = paragraphText.split(/<br\s*\/?>/gi);
        const explanationLines = [];
        
        lines.forEach((line, lineIndex) => {
          const words = splitWords(line);
          const explanationWords = [];
          const wordCounts = {};
          
          words.forEach((word, idx) => {
          const norm = normalize(word);
          
          // Initialize count for this word if not already done
          if (!wordCounts[norm]) {
            wordCounts[norm] = 0;
          }
          
          // Check if this word has any mapping (indexed or simple)
          const hasIndexedMapping = indexedFixedWordsMap[norm] && indexedFixedWordsMap[norm][wordCounts[norm]] !== undefined;
          const hasSimpleMapping = fixedWordsMap[norm] && wordCounts[norm] === 0; // Only for first occurrence (index 0)
          
          console.log('🔍 Popup - Word:', word, 'norm:', norm, 'count:', wordCounts[norm]);
          console.log('🔍 Popup - hasIndexedMapping:', hasIndexedMapping);
          console.log('🔍 Popup - hasSimpleMapping:', hasSimpleMapping);
          console.log('🔍 Popup - indexedFixedWordsMap[norm]:', indexedFixedWordsMap[norm]);
          console.log('🔍 Popup - fixedWordsMap[norm]:', fixedWordsMap[norm]);
          
          if (hasIndexedMapping || hasSimpleMapping) {
            console.log('🔍 Popup - Processing word:', word, 'norm:', norm, 'count:', wordCounts[norm]);
            console.log('🔍 Popup - indexedFixedWordsMap[norm]:', indexedFixedWordsMap[norm]);
            console.log('🔍 Popup - fixedWordsMap[norm]:', fixedWordsMap[norm]);
            
            // Get the correct answer for this specific occurrence
            let correctAnswer = word;
            if (hasIndexedMapping) {
              correctAnswer = indexedFixedWordsMap[norm][wordCounts[norm]];
              console.log('🔍 Popup - Using indexed mapping:', correctAnswer);
            } else if (hasSimpleMapping) {
              correctAnswer = fixedWordsMap[norm];
              console.log('🔍 Popup - Using simple mapping:', correctAnswer);
            } else {
              console.log('🔍 Popup - No mapping found, using original:', correctAnswer);
            }
            
            // Apply furigana conversion to both original word and correct answer
            const wordWithFurigana = convertFurigana(word);
            const correctAnswerWithFurigana = convertFurigana(correctAnswer);
            
            // Create segmented display: correct word/explanation word
            const segmentedAnswer = `<span class="segmented-word">
              <span class="correct-part">${wordWithFurigana}</span>
              <span class="explanation-part">/ ${correctAnswerWithFurigana}</span>
            </span>`;
            explanationWords.push(segmentedAnswer);
          } else {
            // Keep original word with furigana conversion
            const wordWithFurigana = convertFurigana(word);
            explanationWords.push(wordWithFurigana);
          }
          
            // Increment the count for this word after processing
            wordCounts[norm]++;
          });
          
          // Join words in this line
          explanationLines.push(explanationWords.join(' '));
        });
        
        // Join lines with <br> tags
        return explanationLines.join('<br>');
      };
      
      const explanationText = createExplanationText();
      
      popupContent = `
        <div class="highlight-japanese-popup">
          <style>
            .highlight-japanese-popup { 
              font-family: 'Noto Serif JP', 'Noto Sans JP', 'Kosugi Maru', 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
              font-size: 1.2rem !important;
            }
            .highlight-japanese-popup ruby { 
              font-size: 1.2rem !important;
              display: inline !important;
              line-height: 1.2 !important;
              vertical-align: baseline !important;
              position: relative !important;
              white-space: nowrap !important;
            }
            .highlight-japanese-popup rt { 
              font-size: 0.4em !important; 
              color: #666 !important;
              line-height: 1 !important;
              display: block !important;
              text-align: center !important;
              position: absolute !important;
              top: -0.6em !important;
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
              z-index: 5 !important;
              /* Chrome version-specific fixes */
              -webkit-transform: translateY(0) !important;
              transform: translateY(0) !important;
            }
            /* Chrome-specific fixes */
            @supports (-webkit-appearance: none) {
              .highlight-japanese-popup rt {
                top: -0.8em !important;
                font-size: 0.35em !important;
              }
            }
            /* Fallback for browsers that don't support ruby */
            @supports not (display: ruby) {
              .highlight-japanese-popup ruby {
                display: inline-block !important;
                vertical-align: top !important;
              }
              .highlight-japanese-popup rt {
                display: block !important;
                font-size: 0.5em !important;
                line-height: 1 !important;
                margin-top: -0.5em !important;
                position: static !important;
                top: auto !important;
                left: auto !important;
                right: auto !important;
                width: auto !important;
              }
            }
            .highlight-japanese-popup .explanation-text {
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
              border: 1px solid #e9ecef;
              font-size: 1.2rem;
              line-height: 1.8;
              color: #333;
              text-align: left;
            }
            .highlight-japanese-popup .segmented-word {
              display: inline-block !important;
              border: 2px solid #00838f !important;
              border-radius: 6px !important;
              overflow: hidden !important;
              margin: 0 3px !important;
              vertical-align: middle !important;
              padding: 2px !important;
            }
            .highlight-japanese-popup .correct-part {
              background-color: #00838f !important;
              color: white !important;
              padding: 8px 6px 4px 6px !important;
              font-weight: bold !important;
              display: inline-block !important;
              border-radius: 4px !important;
              line-height: 1.4 !important;
            }
            .highlight-japanese-popup .explanation-part {
              background-color: #f5f5f5 !important;
              color: #333 !important;
              padding: 8px 6px 4px 6px !important;
              display: inline-block !important;
              line-height: 1.4 !important;
            }
            .highlight-japanese-popup .correct-part ruby,
            .highlight-japanese-popup .explanation-part ruby {
              font-size: 1.2rem !important;
            }
            .highlight-japanese-popup .correct-part rt,
            .highlight-japanese-popup .explanation-part rt {
              font-size: 0.6em !important;
              color: inherit !important;
            }
            .highlight-japanese-popup .correct-part rt {
              color: rgba(255,255,255,0.8) !important;
            }
            .highlight-japanese-popup .explanation-part rt {
              color: #666 !important;
            }
          </style>
          
          <!-- Explanation Section -->
          <div class="explanation-section">
            <div class="explanation-title" style="margin: 0 0 15px 0; color: #333; font-size: 1.4rem; font-weight: bold; text-align: center;">Explanation</div>
            <div class="explanation-text">
              ${explanationText}
            </div>
          </div>
        </div>
      `;
    } else if (quizData && (quizData.templateId === 39 || quizData.templateId === 40 || quizData.templateId === 63 || quizData.templateId === 65 || quizData.templateId === 67)) {
      // Template 39, 40, 63, 65 & 67: Listen quizzes - Show Script Text Only
      const encodedScriptText = quizData.scriptText || '';
      
      // Decode the script text to restore special characters
      processedScriptText = decodeScriptText(encodedScriptText);
      
      console.log(`🔍 Template ID${quizData.templateId} - processedScriptText:`, processedScriptText);
      console.log(`🔍 Template ID${quizData.templateId} - quizData.correctAnswer:`, quizData.correctAnswer);
      
      // Add highlighting for correct answer only - only highlight underlined words
      let highlightedScriptText = processedScriptText;
      if (quizData.correctAnswer) {
        const correctAnswer = quizData.correctAnswer;
        
        // Debug logging
        console.log(`🔍 DEBUG - Template ID${quizData.templateId} Highlighting:`);
        console.log('🔍 Original scriptText:', quizData.scriptText);
        console.log('🔍 Processed scriptText:', processedScriptText);
        console.log('🔍 Correct answer:', correctAnswer);
        console.log('🔍 Correct answer type:', typeof correctAnswer);
        
        // Extract text content from correct answer (handle furigana and HTML tags)
        const extractTextContent = (text) => {
          // Remove HTML tags first
          let cleanText = text.replace(/<[^>]*>/g, '');
          
          // Handle furigana patterns like [みっつ] or (みっつ) or 三（みっ）つ
          // Extract both kanji and furigana parts
          const furiganaMatch = cleanText.match(/^(.+?)\[([^\]]+)\]$/);
          if (furiganaMatch) {
            const kanji = furiganaMatch[1].trim();
            const furigana = furiganaMatch[2].trim();
            
            // Options: kanji match, furigana match, and kanji+furigana match
            const options = [
              kanji, // For kanji match
              furigana, // For furigana match
              kanji + furigana, // For kanji+furigana match
            ];
            
            console.log('🔍 Furigana pattern options (limited):', options);
            return options;
          }
          
          // Handle pattern like 三（みっ）つ - kanji with furigana in parentheses
          const parenFuriganaMatch = cleanText.match(/^(.+?)（([^）]+)）(.+?)$/);
          if (parenFuriganaMatch) {
            const beforeKanji = parenFuriganaMatch[1].trim();
            const furigana = parenFuriganaMatch[2].trim();
            const afterKanji = parenFuriganaMatch[3].trim();
            
            console.log('🔍 Paren furigana match:', { beforeKanji, furigana, afterKanji });
            
            // Options: kanji match, furigana+hiragana match, and kanji+furigana+hiragana match
            const options = [
              beforeKanji + afterKanji, // 三つ - for kanji match
              furigana + afterKanji, // みっつ - for furigana+hiragana match
              beforeKanji + furigana + afterKanji, // 三みっつ - for kanji+furigana+hiragana match
            ];
            
            console.log('🔍 Paren furigana options (limited):', options);
            return options;
          }
          
          // Handle ruby/rt tags - extract both kanji and furigana
          const rubyMatch = cleanText.match(/<ruby[^>]*>([^<]+)<rt[^>]*>([^<]+)<\/rt><\/ruby>/);
          if (rubyMatch) {
            const kanji = rubyMatch[1].trim();
            const furigana = rubyMatch[2].trim();
            return [kanji, furigana];
          }
          
          // Remove ruby/rt tags and content
          cleanText = cleanText.replace(/<ruby[^>]*>.*?<\/ruby>/g, '');
          cleanText = cleanText.replace(/<rt[^>]*>.*?<\/rt>/g, '');
          
          return [cleanText.trim()];
        };
        
        const cleanCorrectAnswer = extractTextContent(correctAnswer);
        
        // Debug logging for extraction
        console.log('🔍 Clean correct answer options:', cleanCorrectAnswer);
        
        // Find all underlined spans and check if any contain the clean text
        const underlinedSpans = processedScriptText.match(/<span[^>]*style="[^"]*text-decoration:\s*underline[^"]*"[^>]*>.*?<\/span>/g);
        
        // Debug logging for underlined spans
        console.log('🔍 Found underlined spans:', underlinedSpans);
        
        if (underlinedSpans) {
          let foundMatch = false; // Flag to stop after first match
          
          for (let index = 0; index < underlinedSpans.length && !foundMatch; index++) {
            const span = underlinedSpans[index];
            const spanText = extractTextContent(span);
            const spanTextArray = Array.isArray(spanText) ? spanText : [spanText];
            
            // Debug logging for each span
            console.log(`🔍 Span ${index}:`, span);
            console.log(`🔍 Span ${index} extracted text:`, spanTextArray);
            
            // Check if any of the clean correct answer options match any of the span text options
            const hasMatch = cleanCorrectAnswer.some(correctOption => 
              spanTextArray.some(spanOption => spanOption === correctOption)
            );
            
            console.log(`🔍 Span ${index} has match:`, hasMatch);
            
            if (hasMatch) {
              // Extract the content inside the span (without the span tags)
              const spanContent = span.replace(/<span[^>]*>/, '').replace(/<\/span>/, '');
              console.log(`🔍 Span ${index} content to highlight:`, spanContent);
              // Replace this specific underlined span with highlighted version, preserving the original span structure
              const highlightedSpan = span.replace(/<span[^>]*>/, '<span class="correct-answer" style="text-decoration: underline;">').replace(/<\/span>/, '</span>');
              highlightedScriptText = highlightedScriptText.replace(span, highlightedSpan);
              foundMatch = true; // Stop after first match
              console.log(`🔍 Found match at span ${index}, stopping search`);
            }
          }
        }
        
        // Debug logging for final result
        console.log('🔍 Final highlighted script text:', highlightedScriptText);
      }
      
      popupContent = `
        <div class="listen-image-select-popup">
          <style>
            .listen-image-select-popup { 
              font-family: 'Noto Serif JP', 'Noto Sans JP', 'Kosugi Maru', 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
              font-size: 1.2rem !important;
            }
            .listen-image-select-popup ruby { 
              font-size: 1.2rem !important; 
            }
            .listen-image-select-popup rt { 
              font-size: 0.6em !important; 
              color: #666 !important; 
            }
            .listen-image-select-popup .script-text rt {
              color: #666 !important;
            }
            .listen-image-select-popup .script-text span[style*="text-decoration: underline"] {
              text-decoration: underline !important;
              text-decoration-color: #333 !important;
              text-decoration-thickness: 2px !important;
              text-underline-offset: 2px !important;
            }
            .listen-image-select-popup .script-text .script-highlight {
              color: #b40000 !important;
              font-weight: normal !important;
            }
            .listen-image-select-popup .script-text .script-highlight rt {
              color: #b40000 !important;
            }
          </style>
          
          <!-- Script Text Section -->
          <div class="script-section">
            <div class="script-title" style="margin: 0 0 10px 0; color: #333; font-size: 1.2rem; font-weight: bold; text-align: center;">スクリプト (Script)</div>
            <div class="script-text" style="padding: 12px; background: #f8f9fa; border-radius: 4px; font-size: 1.2rem; line-height: 1.5; color: #333; text-align: left;">
              ${highlightedScriptText}
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
            <div class="answer-column-title" style="margin: 0 0 15px 0; color: #666; font-size: 1.2rem; font-weight: normal; font-family: 'Noto Serif JP', 'Noto Sans JP', 'Kosugi Maru', 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">Correct answer</div>
            <div id="correct-answers" style="display: flex; flex-direction: column; gap: 8px;">
              ${quizData.options.map(option => `
                <div class="answer-option" style="display: flex; align-items: center; gap: 8px; padding: 8px 0;">
                  <div style="width: 16px; height: 16px; border: 1px solid #ccc; border-radius: 2px; display: flex; align-items: center; justify-content: center; background: ${option.isCorrect ? '#666' : 'white'};">
                    ${option.isCorrect ? '✓' : ''}
                  </div>
                  <span style="font-size: 1.2rem; color: #333; font-family: 'Noto Serif JP', 'Noto Sans JP', 'Kosugi Maru', 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">${option.text}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Your Answer Column -->
          <div class="answer-column" style="flex: 1;">
            <div class="answer-column-title" id="your-answer-title" style="margin: 0 0 15px 0; color: #666; font-size: 1.2rem; font-weight: normal; font-family: 'Noto Serif JP', 'Noto Sans JP', 'Kosugi Maru', 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">Your answer: ${quizData.score || 0}/1</div>
            <div id="your-answers" style="display: flex; flex-direction: column; gap: 8px;">
              ${quizData.options.map(option => `
                <div class="answer-option" style="display: flex; align-items: center; gap: 8px; padding: 8px 0;">
                  <div style="width: 16px; height: 16px; border: 1px solid #ccc; border-radius: 2px; display: flex; align-items: center; justify-content: center; background: ${option.isSelected ? '#666' : 'white'};">
                    ${option.isSelected ? '✓' : ''}
                  </div>
                  <span style="font-size: 1.2rem; color: #333; font-family: 'Noto Serif JP', 'Noto Sans JP', 'Kosugi Maru', 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">${option.text}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } else {
      // Show fallback content
      popupContent = `
        <div style="text-align: center; color: #666; font-family: 'Noto Serif JP', 'Noto Sans JP', 'Kosugi Maru', 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 1.2rem;">
          <p>No quiz data available</p>
        </div>
      `;
    }
    
    console.log('🔍 Final popupContent for template ID63:', popupContent);
    console.log('🔍 popupContent length:', popupContent.length);
    
    // Use innerHTML to properly render HTML tags in production
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
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          minWidth: '120px',
          height: '40px',
          padding: '8px 16px',
          fontSize: '14px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        <span className="submit-label">{buttonText}</span>
      </Button>
    );
  };

  const renderShowScriptButton = () => {
    if (!showScriptButton) return null;

    const buttonText = isScriptVisible ? 'HideScript' : 'ShowScript';
    const buttonColor = isScriptVisible ? '#ff9800' : '#2196f3'; // Orange when hiding, blue when showing

    return (
      <Button
        variant="outline-primary"
        className="show-script-button mx-2"
        onClick={handleShowScript}
        style={{
          backgroundColor: buttonColor,
          borderColor: buttonColor,
          color: 'white',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          minWidth: '100px',
          height: '40px',
          padding: '8px 16px',
          fontSize: '14px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {buttonText}
      </Button>
    );
  };

  const renderPreviousButton = () => {
    const buttonStyle = `previous-button ${isAtTop ? 'text-dark mr-3' : 'justify-content-center'}`;
    
    const handlePreviousClick = () => {
      // Close popup if it's open when navigating to previous unit
      const existingPopup = document.getElementById('test-popup');
      if (existingPopup) {
        existingPopup.remove();
        // Clean up any existing styles
        const existingStyle = document.querySelector('style[data-popup-style]');
        if (existingStyle) {
          existingStyle.remove();
        }
        // Reset button state to "確認"
        setCurrentButtonState('確認');
      }
      
      if (onClickPrevious) {
        onClickPrevious();
      }
    };
    
    return (
      <PreviousButton
        className="go-back-button"
        isFirstUnit={isFirstUnitInSequence}
        variant="outline-secondary"
        buttonLabel={intl.formatMessage(messages.previousButton)}
        buttonStyle={buttonStyle}
        onClick={handlePreviousClick}
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
      // Close popup if it's open when navigating to next unit
      const existingPopup = document.getElementById('test-popup');
      if (existingPopup) {
        existingPopup.remove();
        // Clean up any existing styles
        const existingStyle = document.querySelector('style[data-popup-style]');
        if (existingStyle) {
          existingStyle.remove();
        }
        // Reset button state to "確認"
        setCurrentButtonState('確認');
      }
      
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
      <div className="unit-navigation-bar d-flex align-items-center" style={{ 
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
        {/* Center - Check/ShowScript buttons */}
        <div className="d-flex align-items-center" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          {hasAudioQuiz ? (
            <>
              {renderShowScriptButton()}
              {renderSubmitButton()}
            </>
          ) : (
            <>
              {renderSubmitButton()}
              {renderShowScriptButton()}
            </>
          )}
        </div>

        {/* Right side - Unit Title, CourseOutline, Next */}
        <div className="d-flex align-items-center" style={{ gap: '8px', marginLeft: 'auto' }}>
          {/* Unit title display */}
          <div style={{ 
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
          {renderNextButton()}
        </div>
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
