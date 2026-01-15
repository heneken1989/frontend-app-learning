import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { AppContext } from '@edx/frontend-platform/react';
import { useModel } from '@src/generic/model-store';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import TestTimer from '../TestTimer';
import './TestHeader.scss';

const TestHeader = ({ 
  intl, 
  testName, 
  testTimeInMinutes, 
  onTestTimeExpired,
  onTestTimeUpdate,
  currentQuestion = 1,
  totalQuestions = 32,
  unitId,
  sequenceId,
  courseId
}) => {
  const { authenticatedUser } = React.useContext(AppContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [timeLeft, setTimeLeft] = React.useState(0);
  const [previousModule, setPreviousModule] = React.useState(null);
  const [isTransitionPageActive, setIsTransitionPageActive] = React.useState(false);
  
  // Get unit and sequence data from model store (similar to PersistentNavigationBar)
  const unit = useModel('units', unitId);
  const sequence = useModel('sequences', sequenceId);
  
  // Parse module number from unit title (e.g., "1.1" -> 1)
  const parseModuleNumber = (title) => {
    if (!title) return null;
    const match = title.match(/^(\d+)\./);
    return match ? parseInt(match[1], 10) : null;
  };
  
  // Get current module from unit title
  const currentModule = unit?.title ? parseModuleNumber(unit.title) : null;
  
  // Module name mapping
  const getModuleName = (moduleNumber) => {
    const moduleNames = {
      1: 'Vocab-Grammar',
      2: 'Reading',
      3: 'Listening'
    };
    return moduleNames[moduleNumber] || 'Test';
  };

  // Module progress (current within module / total in module)
  const [moduleCurrent, setModuleCurrent] = React.useState(null);
  const [moduleTotal, setModuleTotal] = React.useState(null);
  const [moduleUnits, setModuleUnits] = React.useState([]); // Store all unit IDs in current module
  const [answeredQuestions, setAnsweredQuestions] = React.useState(new Set()); // Track which questions have been answered

  // Helper to get LMS base URL
  const getLmsBaseUrl = () => {
    if (typeof window === 'undefined') return '';
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('local.openedx.io')) {
      return 'http://local.openedx.io:8000';
    }
    return 'https://lms.nihongodrill.com';
  };

  // Helper to get CSRF token
  const getCsrfToken = () => {
    try {
      const el = typeof document !== 'undefined' ? document.querySelector('[name=csrfmiddlewaretoken]') : null;
      return el?.value || '';
    } catch (e) {
      return '';
    }
  };

  // Helper to get user info
  const getUserInfo = () => {
    let userId = 'anonymous';
    let username = 'anonymous';
    
    const authUser = getAuthenticatedUser();
    if (authUser) {
      userId = authUser.id || authUser.userId || 'anonymous';
      username = authUser.username || authUser.name || 'anonymous';
    } else if (authenticatedUser) {
      userId = authenticatedUser.id || 'anonymous';
      username = authenticatedUser.username || authenticatedUser.id || 'anonymous';
    } else {
      const storedUserId = localStorage.getItem('userId') || localStorage.getItem('user_id');
      if (storedUserId) {
        userId = storedUserId;
      } else if (window.userId) {
        userId = window.userId;
      } else if (window.user && window.user.id) {
        userId = window.user.id;
      }
    }
    
    return { userId, username };
  };

  // Helper to save quiz results
  const saveQuizResults = async (requestData) => {
    try {
      const url = `${getLmsBaseUrl()}/courseware/save_quiz_results/`;
      console.log('🌐 [TestHeader Save] Sending POST request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(requestData),
      });
      
      console.log('📡 [TestHeader Save] Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const responseData = await response.json().catch(() => null);
        console.log('✅ [TestHeader Save] Server response:', responseData);
      } else {
        const errorText = await response.text().catch(() => 'Unable to read error');
        console.error('❌ [TestHeader Save] Server error:', response.status, errorText);
      }
      
      return response.ok;
    } catch (e) {
      console.error('❌ [TestHeader Save] Network error:', e);
      return false;
    }
  };

  // Deduplication helpers (similar to TestNavigationBar)
  const savedUnitSetRef = React.useRef(new Set());
  const getUnitSaveKey = (sessionId, uId) => (sessionId && uId ? `saved_${sessionId}_${uId}` : null);
  const wasUnitSaved = (key) => {
    if (!key) return false;
    if (savedUnitSetRef.current.has(key)) return true;
    try {
      return (typeof window !== 'undefined' && localStorage.getItem(key) === '1');
    } catch (e) { return false; }
  };
  const markUnitSaved = (key) => {
    if (!key) return;
    savedUnitSetRef.current.add(key);
    try { if (typeof window !== 'undefined') localStorage.setItem(key, '1'); } catch (e) {}
  };
  
  // Check if answers array has any real user answers (non-empty)
  const hasRealAnswers = (answers) => {
    if (!Array.isArray(answers) || answers.length === 0) return false;
    
    // Check if answers are objects with userAnswer property
    if (typeof answers[0] === 'object' && answers[0] !== null) {
      return answers.some(answer => {
        const userAnswer = answer.userAnswer;
        return userAnswer && userAnswer.toString().trim() !== '';
      });
    }
    
    // Check if answers are strings
    return answers.some(answer => {
      return answer && answer.toString().trim() !== '';
    });
  };
  
  // Check if should allow save
  // Only allow save when user has selected an answer (has real answers)
  const shouldAllowSave = (saveKey, answers) => {
    if (!saveKey) {
      // If no saveKey, check if answers have real answers
      return hasRealAnswers(answers);
    }
    
    // Only allow save if answers have real user answers
    const hasAnswers = hasRealAnswers(answers);
    if (!hasAnswers) {
      console.log('⚠️ [TestHeader Save Logic] No real answers selected, skipping save');
      return false;
    }
    
    return true;
  };

  // Fetch course navigation and compute module progress
  React.useEffect(() => {
    const computeModuleProgress = async () => {
      try {
        if (!sequenceId || !courseId || !unitId || !currentModule) {
          setModuleUnits([]);
          return;
        }

        const lmsBaseUrl = getLmsBaseUrl();
        const response = await fetch(`${lmsBaseUrl}/api/course_home/v1/navigation/${courseId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          setModuleUnits([]);
          return;
        }

        const data = await response.json();
        const seq = data?.blocks?.[sequenceId];
        if (!seq || !Array.isArray(seq.children)) {
          setModuleUnits([]);
          return;
        }

        // Build list of units in this module
        const moduleUnitsList = [];
        seq.children.forEach((childId) => {
          const child = data.blocks[childId];
          const title = child?.display_name || '';
          const modMatch = title.match(/^(\d+)\./);
          const modNum = modMatch ? parseInt(modMatch[1], 10) : null;
          if (modNum && modNum === currentModule) {
            moduleUnitsList.push(childId);
          }
        });

        const idxInModule = moduleUnitsList.indexOf(unitId);
        setModuleTotal(moduleUnitsList.length || null);
        setModuleCurrent(idxInModule >= 0 ? idxInModule + 1 : null);
        setModuleUnits(moduleUnitsList); // Store module units for rendering
      } catch (e) {
        // Swallow errors; fallback will be sequence-wide display
        setModuleUnits([]);
      }
    };

    computeModuleProgress();
  }, [sequenceId, courseId, unitId, currentModule]);
  
  // Fetch quiz results to track answered questions
  React.useEffect(() => {
    const fetchAnsweredQuestions = async () => {
      try {
        console.log('🔍 [Fetch Answered Questions] Starting fetch...', {
          sequenceId,
          currentModule,
          moduleUnits_count: moduleUnits?.length,
          hasSequence: !!sequence
        });
        
        if (!sequenceId || !currentModule || !moduleUnits || moduleUnits.length === 0) {
          console.log('⚠️ [Fetch Answered Questions] Missing required data, clearing answered questions');
          setAnsweredQuestions(new Set());
          return;
        }
        
        // Get user ID
        const authUser = getAuthenticatedUser();
        const userId = authUser?.userId || authUser?.id || authenticatedUser?.userId || authenticatedUser?.id;
        
        if (!userId) {
          console.log('⚠️ [Fetch Answered Questions] No user ID found');
          setAnsweredQuestions(new Set());
          return;
        }
        
        // Get test session ID from localStorage
        const testSessionId = typeof window !== 'undefined' ? localStorage.getItem('currentTestSessionId') : null;
        if (!testSessionId) {
          console.log('⚠️ [Fetch Answered Questions] No test session ID found');
          setAnsweredQuestions(new Set());
          return;
        }
        
        // Extract section_id from sequenceId
        const sectionId = sequenceId.split('block@')[1];
        if (!sectionId) {
          console.log('⚠️ [Fetch Answered Questions] Could not extract section_id from sequenceId');
          setAnsweredQuestions(new Set());
          return;
        }
        
        // Fetch quiz results
        const lmsBaseUrl = getLmsBaseUrl();
        const apiUrl = `${lmsBaseUrl}/courseware/get_quiz_results/?user_id=${userId}&section_id=${sectionId}&test_session_id=${testSessionId}`;
        
        console.log('🌐 [Fetch Answered Questions] Fetching from:', apiUrl);
        console.log('📋 [Fetch Answered Questions] Request params:', {
          user_id: userId,
          section_id: sectionId,
          test_session_id: testSessionId
        });
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        console.log('📡 [Fetch Answered Questions] Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          console.warn('⚠️ [Fetch Answered Questions] Failed to fetch quiz results:', response.status);
          setAnsweredQuestions(new Set());
          return;
        }
        
        const data = await response.json();
        console.log('📦 [Fetch Answered Questions] Response data:', {
          success: data.success,
          results_count: data.results?.length,
          results_preview: data.results?.slice(0, 2).map(r => ({
            unit_id: r.unit_id,
            has_quiz_data: !!r.quiz_data,
            answers_count: r.quiz_data?.answers?.length || 0
          }))
        });
        
        if (!data.success || !data.results) {
          console.log('⚠️ [Fetch Answered Questions] No results or unsuccessful response');
          setAnsweredQuestions(new Set());
          return;
        }
        
        // Filter results for current module units
        const moduleResults = data.results.filter(r => moduleUnits.includes(r.unit_id));
        console.log('🔍 [Fetch Answered Questions] Filtered module results:', {
          total_results: data.results.length,
          module_results_count: moduleResults.length,
          module_units: moduleUnits,
          module_results_unit_ids: moduleResults.map(r => r.unit_id)
        });
        
        // Map unit_id to relative position in module
        // Each number in the display corresponds to one unit in the module
        if (!sequence?.unitIds || moduleUnits.length === 0) {
          console.log('⚠️ [Fetch Answered Questions] Missing sequence or module units');
          setAnsweredQuestions(new Set());
          return;
        }
        
        // Sort module units by their position in the sequence
        const sortedModuleUnits = [...moduleUnits].sort((a, b) => {
          const indexA = sequence.unitIds.indexOf(a);
          const indexB = sequence.unitIds.indexOf(b);
          return indexA - indexB;
        });
        
        // Create mapping: unit_id -> relative position in module (1, 2, 3, ...)
        const unitToRelativePosition = new Map();
        sortedModuleUnits.forEach((unitId, index) => {
          unitToRelativePosition.set(unitId, index + 1);
        });
        
        console.log('🗺️ [Fetch Answered Questions] Unit to position mapping:', 
          Array.from(unitToRelativePosition.entries()).map(([id, pos]) => ({ unit_id: id, position: pos }))
        );
        
        // Check which units have been answered
        const answeredSet = new Set();
        
        moduleResults.forEach(result => {
          const unitId = result.unit_id;
          const quizData = result.quiz_data || {};
          const answers = quizData.answers || [];
          
          console.log('🔍 [Fetch Answered Questions] Processing result for unit:', {
            unit_id: unitId,
            answers_type: Array.isArray(answers) ? (answers.length > 0 ? typeof answers[0] : 'empty') : typeof answers,
            answers_count: answers.length,
            answers_preview: Array.isArray(answers) && answers.length > 0 
              ? (typeof answers[0] === 'object' 
                  ? answers.slice(0, 2).map(a => ({ hasUserAnswer: !!a.userAnswer, userAnswer: a.userAnswer }))
                  : answers.slice(0, 2))
              : []
          });
          
          // Check if unit has at least one answered question
          let hasAnswered = false;
          
          if (Array.isArray(answers) && answers.length > 0) {
            if (typeof answers[0] === 'object' && answers[0] !== null) {
              // New format: array of objects with userAnswer
              hasAnswered = answers.some(answer => {
                const userAnswer = answer.userAnswer;
                const isAnswered = userAnswer && userAnswer.toString().trim() !== '';
                if (isAnswered) {
                  console.log('✅ [Fetch Answered Questions] Found answered question:', {
                    unit_id: unitId,
                    userAnswer: userAnswer
                  });
                }
                return isAnswered;
              });
            } else {
              // Old format: array of strings (answersSummary)
              hasAnswered = answers.some(answer => {
                const isAnswered = answer && answer.toString().trim() !== '';
                if (isAnswered) {
                  console.log('✅ [Fetch Answered Questions] Found answered question (old format):', {
                    unit_id: unitId,
                    answer: answer
                  });
                }
                return isAnswered;
              });
            }
          }
          
          // If unit has answered questions, mark its relative position
          if (hasAnswered) {
            const relativePos = unitToRelativePosition.get(unitId);
            if (relativePos) {
              answeredSet.add(relativePos);
              console.log('✅ [Fetch Answered Questions] Marked unit as answered:', {
                unit_id: unitId,
                relative_position: relativePos
              });
            } else {
              console.warn('⚠️ [Fetch Answered Questions] Unit answered but no position mapping found:', {
                unit_id: unitId,
                available_mappings: Array.from(unitToRelativePosition.keys())
              });
            }
          }
        });
        
        console.log('✅ [Fetch Answered Questions] Final answered positions:', Array.from(answeredSet));
        setAnsweredQuestions(answeredSet);
      } catch (error) {
        console.error('❌ [Fetch Answered Questions] Error:', error);
        setAnsweredQuestions(new Set());
      }
    };
    
    fetchAnsweredQuestions();
    
    // Listen for quiz saved events to refresh answered questions
    const handleQuizSaved = (event) => {
      console.log('🔄 [Fetch Answered Questions] Received quizResultsSaved event:', event.detail);
      setTimeout(() => {
        console.log('🔄 [Fetch Answered Questions] Refreshing after event...');
        fetchAnsweredQuestions();
      }, 500); // Small delay to ensure database is updated
    };
    
    window.addEventListener('quizResultsSaved', handleQuizSaved);
    
    return () => {
      window.removeEventListener('quizResultsSaved', handleQuizSaved);
    };
  }, [sequenceId, currentModule, moduleUnits, sequence, authenticatedUser, unitId]); // Add unitId to refresh when navigating
  
  // Get module-specific time for N5 course
  // We check if this is a multi-module test by checking if sequence has multiple units
  const getModuleTimeMinutes = () => {
    const isN5 = courseId && courseId.includes('N5');
    if (!isN5) return null;
    
    // Check if this is multi-module: if we have a module number and multiple units in sequence
    const isMultiModule = currentModule && sequence?.unitIds?.length > 1;
    if (!isMultiModule) return null;
    
    // N5 time per module: Module 1: 13 min, Module 2: 25 min, Module 3: 15 min
    const timeMap = {
      1: 20,
      2: 40,
      3: 35,
      4: 15, // Default for future modules
      5: 15,
    };
    
    const moduleMinutes = timeMap[currentModule] || 15;
    console.log(`⏱️ Module ${currentModule} time: ${moduleMinutes} minutes (Course: ${courseId})`);
    return moduleMinutes;
  };
  
  // Initialize and reset timer when module changes
  React.useEffect(() => {
    if (!sequenceId) return; // Wait for sequenceId to be available
    
    const moduleTime = getModuleTimeMinutes();
    const initialTime = moduleTime ? moduleTime * 60 : (testTimeInMinutes * 60 || 3600);
    const storageKey = `testTimer_${sequenceId}_${currentModule || 'default'}`;
    
    // Always check localStorage first on initial load
    if (!previousModule && typeof window !== 'undefined') {
      const savedTime = localStorage.getItem(storageKey);
      if (savedTime) {
        const timeLeftValue = parseInt(savedTime, 10);
        console.log(`⏱️ Restored timer from localStorage: ${timeLeftValue}s (Module: ${currentModule}, Key: ${storageKey})`);
        setTimeLeft(timeLeftValue);
        setPreviousModule(currentModule);
        return;
      }
    }
    
    // Check if module changed
    if (currentModule && currentModule !== previousModule) {
      console.log(`🔄 Module changed: ${previousModule} -> ${currentModule}, resetting timer to ${initialTime}s`);
      setTimeLeft(initialTime);
      setPreviousModule(currentModule);
      // Save new module timer
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, initialTime.toString());
      }
    } else if (!previousModule) {
      // Initial load - no saved time, use initial time
      console.log(`⏱️ Setting initial timer: ${initialTime}s (Module: ${currentModule})`);
      setTimeLeft(initialTime);
      setPreviousModule(currentModule);
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, initialTime.toString());
      }
    }
  }, [currentModule, previousModule, courseId, testTimeInMinutes, sequenceId]);
  
  // Listen for transition page events
  React.useEffect(() => {
    const checkTransitionState = () => {
      if (typeof window !== 'undefined' && sequenceId && unitId) {
        const transitionKey = `moduleTransition_${sequenceId}_${unitId}`;
        const savedTransition = localStorage.getItem(transitionKey);
        setIsTransitionPageActive(!!savedTransition);
      }
    };
    
    // Check on mount
    checkTransitionState();
    
    // Listen for custom events
    const handleTransitionActive = () => setIsTransitionPageActive(true);
    const handleTransitionInactive = () => setIsTransitionPageActive(false);
    
    window.addEventListener('transitionPageActive', handleTransitionActive);
    window.addEventListener('transitionPageInactive', handleTransitionInactive);
    
    // Also listen for transition page state changes via polling
    const interval = setInterval(checkTransitionState, 500);
    
    return () => {
      window.removeEventListener('transitionPageActive', handleTransitionActive);
      window.removeEventListener('transitionPageInactive', handleTransitionInactive);
      clearInterval(interval);
    };
  }, [sequenceId, unitId]);
  
  // Get current question number from unit title (similar to PersistentNavigationBar logic)
  const getCurrentQuestionNumber = () => {
    if (unit && unit.title) {
      // Extract number from title (e.g., "Unit 109" -> "109")
      const numberMatch = unit.title.match(/(\d+)/);
      if (numberMatch) {
        return parseInt(numberMatch[1], 10);
      }
    }
    
    // Fallback: extract from unitId
    if (unitId) {
      const match = unitId.match(/block@([a-f0-9]+)/);
      if (match) {
        const blockId = match[1];
        const numberMatch = blockId.match(/(\d{3})/);
        if (numberMatch) {
          return parseInt(numberMatch[1], 10);
        }
        return parseInt(blockId.substring(0, 3), 10);
      }
    }
    return currentQuestion;
  };
  
  // Get total questions from sequence data
  const getTotalQuestions = () => {
    // Get total units from sequence
    if (sequence && sequence.unitIds && Array.isArray(sequence.unitIds)) {
      return sequence.unitIds.length;
    }
    
    // Fallback to prop value or default
    return totalQuestions;
  };
  
  // Get current question position in sequence
  const getCurrentQuestionPosition = () => {
    if (sequence && sequence.unitIds && unitId) {
      const unitIndex = sequence.unitIds.indexOf(unitId);
      return unitIndex >= 0 ? unitIndex + 1 : getCurrentQuestionNumber();
    }
    return getCurrentQuestionNumber();
  };
  
  const actualCurrentQuestion = getCurrentQuestionPosition();
  const actualTotalQuestions = getTotalQuestions();
  
  // Navigate to a specific unit (with quiz save before navigation)
  const navigateToUnit = (targetUnitId) => {
    if (!targetUnitId || !courseId || !sequenceId) return;
    
    console.log('🔄 [TestHeader Navigate] Navigating to unit:', targetUnitId);
    
    // Build navigation link
    const navLink = pathname.startsWith('/preview')
      ? `/preview/course/${courseId}/${sequenceId}/${targetUnitId}`
      : `/course/${courseId}/${sequenceId}/${targetUnitId}`;
    
    // If navigating to the same unit, just navigate without saving
    if (targetUnitId === unitId) {
      console.log('⚠️ [TestHeader Navigate] Same unit, skipping save');
      navigate(navLink);
      return;
    }
    
    // Get current quiz answers from iframe before navigating
    const iframe = document.getElementById('unit-iframe');
    if (!iframe || !iframe.contentWindow) {
      console.log('⚠️ [TestHeader Navigate] No iframe found, navigating without save');
      navigate(navLink);
      return;
    }
    
    // Request answers from iframe
    let timeoutId = null;
    const messageHandler = (event) => {
      if (event.data && event.data.type === 'quiz.answers') {
        if (timeoutId) clearTimeout(timeoutId);
        window.removeEventListener('message', messageHandler);
        
        const { answers, templateId } = event.data;
        const totalQuestions = Array.isArray(answers) ? answers.length : 1;
        const correctCount = answers.filter(a => a.isCorrect).length;
        const answeredCount = answers.length;
        
        // Get user info
        const { userId } = getUserInfo();
        
        // Get test session ID
        const testSessionId = typeof window !== 'undefined' ? localStorage.getItem('currentTestSessionId') : null;
        if (!testSessionId) {
          console.log('⚠️ [TestHeader Navigate] No test session ID, navigating without save');
          navigate(navLink);
          return;
        }
        
        // Extract IDs
        const sectionIdToSave = sequenceId ? sequenceId.split('block@')[1] : null;
        const extractedUnitId = unitId;
        const extractedCourseId = courseId;
        
        if (!sectionIdToSave || !extractedUnitId || !extractedCourseId || !userId) {
          console.log('⚠️ [TestHeader Navigate] Missing required fields, navigating without save');
          navigate(navLink);
          return;
        }
        
        // Check if already saved
        // Allow save if not saved yet, or if saved but has no real answers (to update empty answers)
        const saveKey = getUnitSaveKey(testSessionId, extractedUnitId);
        if (!shouldAllowSave(saveKey, answers)) {
          console.log('✅ [TestHeader Navigate] Unit already saved with real answers, navigating');
          navigate(navLink);
          return;
        }
        
        // Prepare request data
        const templateIdToSave = templateId || 67;
        const requestData = {
          section_id: sectionIdToSave,
          unit_id: extractedUnitId,
          course_id: extractedCourseId,
          user_id: userId,
          template_id: templateIdToSave,
          test_session_id: testSessionId,
          status: 'processing',
          quiz_data: {
            answers: answers,
            answersSummary: answers.map(a => a.userAnswer),
            correctCount,
            answeredCount,
            totalQuestions,
            score: totalQuestions > 0 ? correctCount / totalQuestions : 0
          }
        };
        
        console.log('💾 [TestHeader Navigate] Saving quiz data before navigation:', {
          unit_id: extractedUnitId,
          section_id: sectionIdToSave,
          test_session_id: testSessionId,
          answers_count: answers.length
        });
        
        // Save quiz results
        saveQuizResults(requestData)
          .then(ok => {
            if (ok) {
              markUnitSaved(saveKey);
              console.log('✅ [TestHeader Navigate] Successfully saved, navigating');
              
              // Dispatch event to refresh answered questions
              if (typeof window !== 'undefined') {
                const eventDetail = { unitId: extractedUnitId, sectionId: sectionIdToSave };
                console.log('📢 [TestHeader Navigate] Dispatching quizResultsSaved event:', eventDetail);
                window.dispatchEvent(new CustomEvent('quizResultsSaved', {
                  detail: eventDetail
                }));
              }
            } else {
              console.error('❌ [TestHeader Navigate] Failed to save, navigating anyway');
            }
            
            // Navigate after save (or if save failed)
            navigate(navLink);
          })
          .catch(error => {
            console.error('❌ [TestHeader Navigate] Error saving quiz results:', error);
            // Navigate even if save fails
            navigate(navLink);
          });
      }
    };
    
    // Set timeout in case iframe doesn't respond
    timeoutId = setTimeout(() => {
      window.removeEventListener('message', messageHandler);
      console.log('⚠️ [TestHeader Navigate] Timeout waiting for answers, navigating without save');
      navigate(navLink);
    }, 3000);
    
    window.addEventListener('message', messageHandler);
    
    // Request answers from iframe
    try {
      iframe.contentWindow.postMessage({ type: 'quiz.get_answers' }, '*');
      console.log('📤 [TestHeader Navigate] Requested answers from iframe');
    } catch (e) {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('message', messageHandler);
      console.error('❌ [TestHeader Navigate] Error requesting answers:', e);
      navigate(navLink);
    }
  };

  // Render unit numbers with current unit highlighted (only for current module)
  // Shows relative numbers within the module (1, 2, 3, ..., 28) not absolute positions
  // Shows ALL numbers and makes them clickable
  const renderUnitNumbers = () => {
    // If no module units list or no sequence, return null
    if (!moduleUnits || moduleUnits.length === 0 || !sequence?.unitIds) {
      return null;
    }
    
    const units = [];
    
    // Sort module units by their position in the sequence
    const sortedModuleUnits = [...moduleUnits].sort((a, b) => {
      const indexA = sequence.unitIds.indexOf(a);
      const indexB = sequence.unitIds.indexOf(b);
      return indexA - indexB;
    });
    
    // Create array with relative positions (1, 2, 3, ...) for each unit in module
    const moduleUnitRelativePositions = sortedModuleUnits.map((unitId, index) => ({
      unitId: unitId,
      relativePosition: index + 1, // 1-based relative position within module
      absolutePosition: sequence.unitIds.indexOf(unitId) + 1 // Keep for reference
    }));
    
    if (moduleUnitRelativePositions.length === 0) return null;
    
    // Find current unit's relative position in module
    const currentUnitData = moduleUnitRelativePositions.find(item => item.unitId === unitId);
    const currentRelativePosition = currentUnitData ? currentUnitData.relativePosition : null;
    
    // Render ALL units (no truncation)
    moduleUnitRelativePositions.forEach((item) => {
      const isCurrent = item.relativePosition === currentRelativePosition;
      const isAnswered = answeredQuestions.has(item.relativePosition);
      
      // Determine styles based on state
      let backgroundColor = 'transparent';
      let color = '#666';
      let border = 'none';
      
      if (isCurrent) {
        backgroundColor = '#e6f7f9';
        color = '#0097a9';
      } else if (isAnswered) {
        backgroundColor = '#f0f8e6';
        color = '#4caf50';
        border = '1px solid #4caf50';
      }
      
      units.push(
        <span
          key={item.relativePosition}
          onClick={() => navigateToUnit(item.unitId)}
          style={{
            padding: '2px 6px',
            margin: '0 2px',
            fontSize: '0.85rem',
            fontWeight: isCurrent ? 'bold' : 'normal',
            color: color,
            backgroundColor: backgroundColor,
            border: border,
            borderRadius: '3px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            if (!isCurrent) {
              e.target.style.backgroundColor = isAnswered ? '#e8f5e9' : '#f0f0f0';
              e.target.style.color = isAnswered ? '#2e7d32' : '#0097a9';
            }
          }}
          onMouseLeave={(e) => {
            if (!isCurrent) {
              e.target.style.backgroundColor = isAnswered ? '#f0f8e6' : 'transparent';
              e.target.style.color = isAnswered ? '#4caf50' : '#666';
            }
          }}
        >
          {item.relativePosition}
        </span>
      );
    });
    
    return units;
  };

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update time every second and save to localStorage
  React.useEffect(() => {
    // Don't run timer if transition page is active
    if (isTransitionPageActive) {
      console.log('⏸️ Timer paused - transition page is active');
      return;
    }
    
    const storageKey = `testTimer_${sequenceId}_${currentModule || 'default'}`;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTestTimeExpired && onTestTimeExpired();
          // Clear localStorage when time expires
          if (typeof window !== 'undefined') {
            localStorage.removeItem(storageKey);
            
            // Dispatch custom event for module test expiration
            const expireEvent = new CustomEvent('moduleTestExpired', {
              detail: {
                sequenceId,
                currentModule,
                unitId,
                courseId
              }
            });
            window.dispatchEvent(expireEvent);
            console.log('🚨 Module test expired, dispatching event:', {
              sequenceId,
              currentModule,
              unitId
            });
          }
          return 0;
        }
        const newTime = prev - 1;
        onTestTimeUpdate && onTestTimeUpdate(newTime);
        // Save to localStorage every second
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, newTime.toString());
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTestTimeExpired, onTestTimeUpdate, sequenceId, currentModule, unitId, courseId, isTransitionPageActive]);

  return (
    <header className="test-header">
      <div className="test-header-container">
        {/* Left: Test Name with Module */}
        <div className="test-header-title">
          <h1 className="test-title">
            {currentModule ? `Module ${currentModule}: ${getModuleName(currentModule)}` : (testName || 'Test')}
          </h1>
          {/* Unit Numbers Display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '4px',
            flexWrap: 'wrap',
            gap: '2px'
          }}>
            {renderUnitNumbers()}
          </div>
        </div>

        {/* Right: Timer and Progress */}
        <div className="test-header-timer">
          <div className="timer-info">
            <span className="timer-icon">🕐</span>
            <span className="timer-text">Time Remaining {formatTime(timeLeft)}</span>
            <span className="progress-icon" aria-hidden="true">▢</span>
            <span className="progress-text">
              {moduleCurrent && moduleTotal ? (
                <>
                  {moduleCurrent} of {moduleTotal}
                </>
              ) : (
                <>
                  {actualCurrentQuestion} of {actualTotalQuestions}
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

TestHeader.propTypes = {
  intl: intlShape.isRequired,
  testName: PropTypes.string,
  testTimeInMinutes: PropTypes.number,
  onTestTimeExpired: PropTypes.func,
  onTestTimeUpdate: PropTypes.func,
  currentQuestion: PropTypes.number,
  totalQuestions: PropTypes.number,
  unitId: PropTypes.string,
  sequenceId: PropTypes.string,
  courseId: PropTypes.string,
};

export default injectIntl(TestHeader);
