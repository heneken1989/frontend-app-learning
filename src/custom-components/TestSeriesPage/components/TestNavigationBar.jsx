import React, { useState, useEffect, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Button } from '@openedx/paragon';
import { useModel } from '@src/generic/model-store';
import { AppContext } from '@edx/frontend-platform/react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSequenceNavigationMetadata } from '../../../courseware/course/sequence/sequence-navigation/hooks';
import { CourseOutlineSidebarTriggerSlot } from '../../../plugin-slots/CourseOutlineSidebarTriggerSlot';
import { CourseOutlineSidebarSlot } from '../../../plugin-slots/CourseOutlineSidebarSlot';
import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import ModuleTransitionPage from './ModuleTransitionPage';
import './TestNavigationBar.scss';

/**
 * Test Navigation Bar for test mode - only shows Next button
 */
const TestNavigationBar = ({ courseId, sequenceId, unitId, onClickNext, isAtTop = false }) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { authenticatedUser } = useContext(AppContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAudioQuiz, setHasAudioQuiz] = useState(false);
  const [testSessionId, setTestSessionId] = useState(null);
  const [cachedTotalQuestions, setCachedTotalQuestions] = useState(null);
  const [showModuleTransition, setShowModuleTransition] = useState(false);
  const [moduleTransitionData, setModuleTransitionData] = useState(null);
  
  const [container, setContainer] = useState(null);
  const containerRef = useRef(null);

  const {
    isFirstUnitInSequence, isLastUnitInSequence, nextLink, previousLink,
  } = useSequenceNavigationMetadata(sequenceId, unitId);

  // Get unit and sequence data from model store
  const unit = useModel('units', unitId);
  const sequence = useModel('sequences', sequenceId);
  
  // Get next unit if exists
  const getNextUnitId = () => {
    if (!sequence?.unitIds || !unitId) return null;
    const currentIndex = sequence.unitIds.findIndex(id => id === unitId);
    if (currentIndex >= 0 && currentIndex < sequence.unitIds.length - 1) {
      return sequence.unitIds[currentIndex + 1];
    }
    return null;
  };
  
  const nextUnitId = getNextUnitId();
  // Always call useModel with a valid ID (use unitId as fallback to maintain hook order)
  const nextUnit = useModel('units', nextUnitId || unitId || '');
  // Only use nextUnit if it's actually a different unit
  const actualNextUnit = (nextUnitId && nextUnit && nextUnit.id === nextUnitId) ? nextUnit : null;
  
  // Debug: log unit data
  useEffect(() => {
    console.log('🔍 [Unit Data] Current unit:', {
      unitId,
      title: unit?.title,
      complete: unit?.complete
    });
    console.log('🔍 [Unit Data] Next unit:', {
      nextUnitId,
      title: actualNextUnit?.title,
      complete: actualNextUnit?.complete
    });
    console.log('🔍 [Unit Data] Sequence:', {
      sequenceId,
      unitIds: sequence?.unitIds || [],
      totalUnits: (sequence?.unitIds || []).length
    });
  }, [unitId, nextUnitId, sequenceId]); // Use only IDs in dependency array

  // Debug navigation metadata
  useEffect(() => {
    console.log('🔍 [Navigation Metadata] Updated:', {
      sequenceId,
      unitId,
      isFirstUnitInSequence,
      isLastUnitInSequence,
      nextLink,
      previousLink
    });
    console.log('🔍 [Navigation Metadata] Sequence data:', sequence);
    console.log('🔍 [Navigation Metadata] Unit data:', unit);
  }, [sequenceId, unitId, isFirstUnitInSequence, isLastUnitInSequence, nextLink, previousLink, sequence, unit]);

  // Debug component mount/unmount
  useEffect(() => {
    console.log('🔄 [TestNavigationBar] Component mounted/updated with:', {
      sequenceId,
      unitId,
      testSessionId
    });
    
    return () => {
      console.log('🔄 [TestNavigationBar] Component unmounting');
    };
  }, [sequenceId, unitId, testSessionId]);
  
  // Restore module transition state on component mount
  useEffect(() => {
    if (sequenceId && unitId && typeof window !== 'undefined') {
      const transitionKey = `moduleTransition_${sequenceId}_${unitId}`;
      const savedTransition = localStorage.getItem(transitionKey);
      
      if (savedTransition) {
        try {
          const transitionData = JSON.parse(savedTransition);
          console.log('🔄 [Restore] Found saved module transition state:', transitionData);
          setModuleTransitionData(transitionData);
          setShowModuleTransition(true);
          
          // Dispatch event to notify timer is paused
          window.dispatchEvent(new Event('transitionPageActive'));
        } catch (error) {
          console.error('❌ Error parsing saved transition data:', error);
          localStorage.removeItem(transitionKey);
        }
      }
    }
  }, [sequenceId, unitId]);
  
  // Handle module test expiration event
  useEffect(() => {
    const handleModuleExpired = (event) => {
      const { sequenceId: eventSeqId, currentModule, unitId: eventUnitId } = event.detail;
      
      // Only handle if this event is for current sequence
      if (eventSeqId === sequenceId && eventUnitId === unitId) {
        console.log('⏰ [Timer Expired] Handling module test expiration:', {
          currentModule,
          sequenceId: eventSeqId,
          unitId: eventUnitId
        });
        
        // Check if there's a next unit
        if (actualNextUnit) {
          const navLink = pathname.startsWith('/preview') ? `/preview${nextLink}` : nextLink;
          
          // Parse module numbers to check for transition
          const parseModuleNumber = (title) => {
            if (!title) return null;
            const match = title.match(/^(\d+)\./);
            return match ? parseInt(match[1], 10) : null;
          };
          
          const currentUnitTitle = unit?.title;
          const nextUnitTitle = actualNextUnit?.title;
          
          const currentModuleNum = parseModuleNumber(currentUnitTitle);
          const nextModuleNum = actualNextUnit ? parseModuleNumber(nextUnitTitle) : null;
          
          const isModuleTransition = currentModuleNum && nextModuleNum && currentModuleNum !== nextModuleNum;
          
          if (isModuleTransition) {
            console.log('🔄 [Timer Expired] Module transition detected, showing transition page');
            const transitionData = {
              currentModule: currentModuleNum,
              nextModule: nextModuleNum,
              nextLink: navLink
            };
            setModuleTransitionData(transitionData);
            setShowModuleTransition(true);
            
            // Dispatch event to notify timer is paused
            window.dispatchEvent(new Event('transitionPageActive'));
            
            // Save transition state to localStorage
            if (typeof window !== 'undefined') {
              const transitionKey = `moduleTransition_${sequenceId}_${unitId}`;
              localStorage.setItem(transitionKey, JSON.stringify(transitionData));
              console.log('💾 Saved module transition state:', transitionKey);
            }
          } else {
            console.log('⏭️ [Timer Expired] No module transition, navigating to next unit');
            if (navLink) {
              navigate(navLink);
            }
          }
        } else {
          // No next unit - check if this is the last module
          console.log('🏁 [Timer Expired] No next unit, checking if this is the last module');
          
          const parseModuleNumber = (title) => {
            if (!title) return null;
            const match = title.match(/^(\d+)\./);
            return match ? parseInt(match[1], 10) : null;
          };
          
          const currentModuleNum = parseModuleNumber(unit?.title);
          console.log('🔍 Current module number:', currentModuleNum);
          
          // If this is module 3 or the last module, show final transition page
          if (currentModuleNum >= 3) {
            console.log('🎯 [Timer Expired] Module 3 or last module detected, showing final transition page');
            const transitionData = {
              currentModule: currentModuleNum,
              nextModule: null, // No next module - test completed
              nextLink: null
            };
            setModuleTransitionData(transitionData);
            setShowModuleTransition(true);
            
            // Dispatch event to notify timer is paused
            window.dispatchEvent(new Event('transitionPageActive'));
            
            // Save transition state to localStorage
            if (typeof window !== 'undefined') {
              const transitionKey = `moduleTransition_${sequenceId}_${unitId}`;
              localStorage.setItem(transitionKey, JSON.stringify(transitionData));
              console.log('💾 Saved final module transition state:', transitionKey);
            }
          } else {
            console.log('⏸️ [Timer Expired] Not last module, staying on current page');
          }
        }
      }
    };
    
    window.addEventListener('moduleTestExpired', handleModuleExpired);
    
    return () => {
      window.removeEventListener('moduleTestExpired', handleModuleExpired);
    };
  }, [sequenceId, unitId, actualNextUnit, unit, nextLink, pathname, navigate]);
  
  // Helper function to get total questions
  const getTotalQuestions = () => {
    console.log('🔍 Getting total questions...');
    console.log('🔍 Cached total questions:', cachedTotalQuestions);
    console.log('🔍 Sequence:', sequence);
    console.log('🔍 Unit:', unit);
    
    // Return cached value if available
    if (cachedTotalQuestions) {
      console.log('✅ Using cached total questions:', cachedTotalQuestions);
      return cachedTotalQuestions;
    }
    
    // Get total questions from sequence metadata
    if (sequence?.metadata?.total_questions) {
      console.log('✅ Found total_questions in sequence metadata:', sequence.metadata.total_questions);
      setCachedTotalQuestions(sequence.metadata.total_questions);
      return sequence.metadata.total_questions;
    }
    
    // Get total questions from sequence children
    if (sequence?.children?.length > 0) {
      console.log('✅ Found children in sequence:', sequence.children.length);
      setCachedTotalQuestions(sequence.children.length);
      return sequence.children.length;
    }
    
    // Get total questions from unitIds
    if (sequence?.unitIds?.length > 0) {
      console.log('✅ Found unitIds in sequence:', sequence.unitIds.length);
      setCachedTotalQuestions(sequence.unitIds.length);
      return sequence.unitIds.length;
    }
    
    console.log('❌ No total questions found in sequence data');
    return 0; // Return 0 to indicate no data
  };
  
  // Helper function to send total questions to quiz iframe
  const sendTotalQuestionsToQuiz = () => {
    const iframe = document.getElementById('unit-iframe');
    if (!iframe) return;
    
    const totalQuestions = getTotalQuestions();
    console.log(`📊 Sending totalQuestions ${totalQuestions} to quiz iframe`);
    
    iframe.contentWindow.postMessage({
      type: 'quiz.config',
      data: {
        totalQuestions: totalQuestions
      }
    }, '*');
  };

  // Parse module number from unit title (e.g., "1.4" -> 1, "2.1" -> 2)
  const parseModuleNumber = (title) => {
    if (!title) return null;
    const match = title.match(/^(\d+)\./);
    return match ? parseInt(match[1], 10) : null;
  };
  
  // Calculate if current unit is the last question in its module (at component level)
  const currentModule = unit?.title ? parseModuleNumber(unit.title) : null;
  const currentIndex = sequence?.unitIds ? sequence.unitIds.findIndex(id => id === unitId) : -1;
  const nextUnitIdForModuleCheck = (currentIndex >= 0 && currentIndex < (sequence?.unitIds?.length || 0) - 1) 
    ? sequence.unitIds[currentIndex + 1] 
    : null;
  
  // Get next unit data
  const nextUnitForModuleCheck = useModel('units', nextUnitIdForModuleCheck || '');
  const nextModule = (nextUnitIdForModuleCheck && nextUnitForModuleCheck && nextUnitForModuleCheck.id === nextUnitIdForModuleCheck) 
    ? parseModuleNumber(nextUnitForModuleCheck.title) 
    : null;
  
  // Check if current unit is the last question in its module
  const isLastQuestionInModule = currentModule && nextModule && currentModule !== nextModule;
  
  // Check if current unit is the last question in module 3 (final test question)
  const isLastQuestionInModule3 = currentModule === 3 && !nextUnitIdForModuleCheck;

  // Get next unit data from model store
  const getNextUnitData = () => {
    if (!sequence?.unitIds || !unitId) return null;
    
    const currentIndex = sequence.unitIds.findIndex(id => id === unitId);
    if (currentIndex >= 0 && currentIndex < sequence.unitIds.length - 1) {
      const nextUnitId = sequence.unitIds[currentIndex + 1];
      const nextUnit = useModel('units', nextUnitId);
      return nextUnit;
    }
    return null;
  };

  // Check if next unit is in a different module
  const checkModuleTransition = () => {
    if (!unit || !sequence?.unitIds) return { isTransition: false };
    
    const currentUnitTitle = unit.title;
    const currentModule = parseModuleNumber(currentUnitTitle);
    
    if (!currentModule) return { isTransition: false };
    
    // Get next unit
    const currentIndex = sequence.unitIds.findIndex(id => id === unitId);
    if (currentIndex >= 0 && currentIndex < sequence.unitIds.length - 1) {
      const nextUnitId = sequence.unitIds[currentIndex + 1];
      // Note: We can't directly use useModel in callback, so we'll check nextLink instead
      // We'll pass to Next button click handler
      return {
        isTransition: false,
        currentModule,
        nextUnitId
      };
    }
    
    return { isTransition: false };
  };

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


  // Create persistent container
  useEffect(() => {
    console.log('🔍 [Container] Creating container for unitId:', unitId);
    
    // Always create a new container
    containerRef.current = document.createElement('div');
    containerRef.current.id = `test-navigation-container-${unitId}`;
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
      console.log('🔍 [Container] Found main content, inserting container');
      mainContent.parentNode.insertBefore(containerRef.current, mainContent);
    } else {
      console.log('🔍 [Container] No main content found, inserting at body start');
      document.body.insertBefore(containerRef.current, document.body.firstChild);
    }
    setContainer(containerRef.current);

    return () => {
      // Cleanup on component unmount or when unitId changes
      if (containerRef.current && containerRef.current.parentNode) {
        console.log('🔍 [Container] Removing container for unitId:', unitId);
        containerRef.current.parentNode.removeChild(containerRef.current);
        containerRef.current = null;
      }
    };
  }, [unitId]); // Re-run when unitId changes

  // Message handling for iframe communication - only handle loading states
  useEffect(() => {
    const handleMessage = (event) => {
      console.log('📨 [NavigationBar] Received message:', event.data);
      console.log('📨 [NavigationBar] Message source:', event.source);
      console.log('📨 [NavigationBar] Message origin:', event.origin);
      
      // Handle quiz answers from template
      if (event.data && event.data.type === 'quiz.answers') {
        console.log('📨 [NavigationBar] Received quiz answers:', event.data);
        console.log('📨 [NavigationBar] Answers array:', event.data.answers);
        
        const { answers } = event.data;
        const totalQuestions = getTotalQuestions();
        
        // Calculate results
        const correctCount = answers.filter(a => a.isCorrect).length;
        const answeredCount = answers.length;
        
        console.log('📊 [NavigationBar] Calculated results:', {
          correctCount,
          answeredCount,
          totalQuestions: getTotalQuestions()
        });
        
        // Get current URL info
        const currentUrl = window.location.href;
        const urlParts = currentUrl.split('/');
        const coursePart = urlParts.find(part => part.startsWith('course-v1:'));
        const sequencePart = urlParts.find(part => part.includes('type@sequential'));
        const unitPart = urlParts.find(part => part.includes('type@vertical'));
        
        const { userId } = getUserInfo();
        
        console.log('📊 [NavigationBar] URL info:', {
          currentUrl,
          coursePart,
          sequencePart,
          unitPart,
          userId
        });
        
        // Validate required fields before sending
        const extractedUnitId = unitPart || unitId;
        const extractedCourseId = coursePart || courseId;
        
        // Get testSessionId from state or localStorage as fallback
        const currentTestSessionId = testSessionId || localStorage.getItem('currentTestSessionId');
        
        // Extract ID from sequenceId for TestSeriesPage matching
        // sequenceId format: "block-v1:Manabi+N51+2026+type@sequential+block@a2521e9752c54554a865727a1851d56e"
        // Extract: "a2521e9752c54554a865727a1851d56e"
        const sectionIdToSave = sequenceId ? sequenceId.split('block@')[1] : null;
        
        if (!sectionIdToSave || !extractedUnitId || !extractedCourseId || !userId || !currentTestSessionId) {
          console.error('❌ [Next Button] Missing required fields:', {
            section_id: sectionIdToSave,
            unit_id: extractedUnitId,
            course_id: extractedCourseId,
            user_id: userId,
            test_session_id: currentTestSessionId
          });
          return;
        }
        
        // Check if this is a complete test action
        const isCompletingTest = localStorage.getItem('completingTest') === 'true';
        
        // Prepare data to save
        const requestData = {
          section_id: sectionIdToSave, // Use sequenceId as section_id
          unit_id: extractedUnitId,
          course_id: extractedCourseId,
          user_id: userId,
          template_id: 67,
          test_session_id: currentTestSessionId,
          status: isCompletingTest ? 'completed' : 'processing', // Set status based on action
          quiz_data: {
            answers: answers.map(a => a.userAnswer),
            correctCount,
            answeredCount,
            totalQuestions,
            score: totalQuestions > 0 ? correctCount / totalQuestions : 0
          }
        };
        
        // Debug logging for Next button
        console.log('🔍 [Next Button] Debug data extraction:');
        console.log('🔍 [Next Button] Current URL:', currentUrl);
        console.log('🔍 [Next Button] URL parts:', urlParts);
        console.log('🔍 [Next Button] coursePart:', coursePart);
        console.log('🔍 [Next Button] sequencePart:', sequencePart);
        console.log('🔍 [Next Button] unitPart:', unitPart);
        console.log('🔍 [Next Button] Extracted IDs:');
        console.log('  - sequenceId (original):', sequenceId);
        console.log('  - section_id (extracted from sequenceId):', sectionIdToSave);
        console.log('  - unit_id:', extractedUnitId);
        console.log('  - course_id:', extractedCourseId);
        console.log('  - user_id:', userId);
        console.log('  - test_session_id (from state):', testSessionId);
        console.log('  - test_session_id (from localStorage):', localStorage.getItem('currentTestSessionId'));
        console.log('  - test_session_id (using):', currentTestSessionId);
        console.log('🔍 [Next Button] All required fields present:', {
          section_id: !!sectionIdToSave,
          unit_id: !!extractedUnitId,
          course_id: !!extractedCourseId,
          user_id: !!userId,
          test_session_id: !!currentTestSessionId
        });
        
        console.log('📤 [Next Button] Sending to server:', requestData);
        
        // Get LMS base URL from config
        const lmsBaseUrl = getConfig().LMS_BASE_URL;
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
        
        console.log('📤 Using LMS base URL:', lmsBaseUrl);
        console.log('📤 CSRF Token:', csrfToken ? 'Found' : 'Missing');
        
        // Save to database
        fetch(`${lmsBaseUrl}/courseware/save_quiz_results/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          body: JSON.stringify(requestData)
        })
        .then(async response => {
          if (response.ok) {
            console.log('✅ Quiz results saved successfully');
            // Only navigate if not completing test
            if (!isCompletingTest) {
              console.log('🔍 [Navigation] Checking navigation options:');
              console.log('🔍 [Navigation] nextLink:', nextLink);
              console.log('🔍 [Navigation] onClickNext:', onClickNext);
              console.log('🔍 [Navigation] pathname:', pathname);

              // Try to get nextLink from sequence data first
              let actualNextLink = nextLink;
              
              if (!actualNextLink && sequence?.unitIds && sequence.unitIds.length > 0) {
                console.log('🔍 [Navigation] No nextLink, trying to generate from sequence data');
                console.log('🔍 [Navigation] Sequence data:', sequence);
                console.log('🔍 [Navigation] Current unitId:', unitId);
                console.log('🔍 [Navigation] CourseId:', courseId);
                console.log('🔍 [Navigation] SequenceId:', sequenceId);
                
                // Find current unit index
                const currentUnitIndex = sequence.unitIds.findIndex(id => id === unitId);
                console.log('🔍 [Navigation] Current unit index:', currentUnitIndex);
                
                if (currentUnitIndex >= 0 && currentUnitIndex < sequence.unitIds.length - 1) {
                  // Generate nextLink for next unit
                  const nextUnitId = sequence.unitIds[currentUnitIndex + 1];
                  actualNextLink = `/course/${courseId}/${sequenceId}/${nextUnitId}`;
                  console.log('🔍 [Navigation] Generated nextLink:', actualNextLink);
                } else {
                  console.log('❌ [Navigation] No more units in sequence');
                }
              }

              // Navigation will be handled by Link component
              console.log('✅ Quiz results saved successfully, Link component will handle navigation');
            } else {
              // If completing test, proceed with test completion logic
              console.log('✅ Quiz results saved successfully, proceeding with test completion');
            }
          } else {
            // Get detailed error information
            const errorText = await response.text();
            console.error('❌ [Next Button] HTTP Error:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
        })
        .catch(error => {
          console.error('❌ [Next Button] Error saving quiz results:', error);
        });
        
        return;
      } else if (event.data && event.data.type === 'pong') {
        return;
      }
      
      const iframe = document.getElementById('unit-iframe');
      if (!iframe || event.source !== iframe.contentWindow) {
        return;
      }

      switch (event.data.type) {
        case 'problem.ready':
          setIsSubmitting(false);
          break;
        case 'problem.submit.start':
          setIsSubmitting(true);
          break;
        case 'problem.submit.done':
          setIsSubmitting(false);
          break;
        case 'quiz.meta':
          // Quiz iframe announces metadata such as audio capability
          if (event.data && event.data.hasAudio) {
            setHasAudioQuiz(true);
          }
          
          // Send total questions to quiz iframe
          sendTotalQuestionsToQuiz();
          break;
        case 'quiz.results.saved':
          break;
        case 'quiz.results.error':
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);


  // Initialize test session ID when component mounts
  useEffect(() => {
    console.log('🔄 [TestSessionId] Initializing test session ID...');
    
    // Check if there's an existing session in localStorage
    const existingSession = localStorage.getItem('currentTestSessionId');
    console.log('🔄 [TestSessionId] Existing session from localStorage:', existingSession);
    
    if (existingSession) {
      console.log('✅ [TestSessionId] Using existing session:', existingSession);
      setTestSessionId(existingSession);
    } else {
      // Create new session ID
      const sessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆕 [TestSessionId] Creating new session:', sessionId);
      setTestSessionId(sessionId);
      localStorage.setItem('currentTestSessionId', sessionId);
    }
  }, []);
  
  // Send total questions to quiz iframe when sequence data changes
  useEffect(() => {
    if (sequence) {
      console.log('🔄 Sequence data changed:', {
        sequence,
        metadata: sequence.metadata,
        children: sequence.children,
        unitIds: sequence.unitIds
      });
      
      const totalQuestions = getTotalQuestions();
      console.log('📊 Total questions from sequence:', totalQuestions);
      
      if (totalQuestions > 0) {
        console.log('✅ Sending total questions to quiz');
        sendTotalQuestionsToQuiz();
      } else {
        console.log('❌ No total questions found, skipping send');
      }
    }
  }, [sequence]);

  // Reset when unit changes but keep the navigation bar persistent
  useEffect(() => {
    setIsSubmitting(false);
    setHasAudioQuiz(false);
  }, [unitId]);

  // Reset cache when sequence changes
  useEffect(() => {
    setCachedTotalQuestions(null);
  }, [sequenceId]);

  // Cleanup on unmount - clear session if user leaves test
  useEffect(() => {
    return () => {
      // Only clear if this is a navigation away (not completion)
      const isCompleting = localStorage.getItem('testSummary');
      if (!isCompleting) {
        localStorage.removeItem('currentTestSessionId');
      }
    };
  }, []);


  // Helper function to get user ID using same method as LearningHeader
  const getUserInfo = () => {
    let userId = 'anonymous';
    let username = 'anonymous';
    
    // Try to get from getAuthenticatedUser first (more reliable)
    const authUser = getAuthenticatedUser();
    if (authUser) {
      userId = authUser.id || authUser.userId || 'anonymous';
      username = authUser.username || authUser.name || 'anonymous';
      console.log('🔍 [getUserInfo] Using getAuthenticatedUser:', { userId, username });
    } else if (authenticatedUser) {
      // Fallback to AppContext
      userId = authenticatedUser.id || 'anonymous';
      username = authenticatedUser.username || authenticatedUser.id || 'anonymous';
      console.log('🔍 [getUserInfo] Using AppContext authenticatedUser:', { userId, username });
    } else {
      // Fallback: try to get user ID from other sources
      console.log('🔍 [getUserInfo] No authenticated user, trying fallback...');
      
      // Try to get from localStorage or other sources
      const storedUserId = localStorage.getItem('userId') || localStorage.getItem('user_id');
      if (storedUserId) {
        userId = storedUserId;
        console.log('🔍 [getUserInfo] Using stored user ID:', userId);
      } else {
        // Try to get from window object or other global variables
        if (window.userId) {
          userId = window.userId;
          console.log('🔍 [getUserInfo] Using window.userId:', userId);
        } else if (window.user && window.user.id) {
          userId = window.user.id;
          console.log('🔍 [getUserInfo] Using window.user.id:', userId);
        } else {
          console.warn('❌ [getUserInfo] No user ID found, using anonymous');
        }
      }
    }
    
    console.log('🔍 [getUserInfo] Final user info:', { userId, username, authenticatedUser, authUser });
    return { userId, username };
  };

  // Test save results function - copy logic from PersistentNavigationBar handleSubmit
  const handleNextClick = () => {
    console.log('🔄 [handleNextClick] Called with:', {
      sequenceId,
      unitId,
      testSessionId,
      nextLink,
      onClickNext: onClickNext ? 'present' : 'missing',
      pathname,
      sequence: sequence ? 'present' : 'missing',
      unit: unit ? 'present' : 'missing',
      timestamp: new Date().toISOString()
    });
    
    // Send message to quiz iframe to get answers
    const iframe = document.getElementById('unit-iframe');
    if (!iframe) {
      console.error('❌ [Next Button] No iframe found');
      return;
    }

    try {
      console.log('📤 [Next Button] Sending quiz.get_answers to iframe');
      console.log('📤 [Next Button] Iframe element:', iframe);
      console.log('📤 [Next Button] Iframe contentWindow:', iframe.contentWindow);
      
      // Just tell iframe to send answers
      iframe.contentWindow.postMessage({
        type: 'quiz.get_answers'
      }, '*');
      
      console.log('📤 [Next Button] Message sent successfully');
      
    } catch (e) {
      console.error('❌ [Next Button] Error sending message:', e);
    }
    
    // The actual saving and navigation will be handled by the message handler
    // when it receives the quiz.answers response
  };

  // Create new test session
  const createNewTestSession = () => {
    const sessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setTestSessionId(sessionId);
    localStorage.setItem('currentTestSessionId', sessionId);
    return sessionId;
  };


  // Complete test function
  const handleCompleteTest = async () => {
    console.log('🔄 handleCompleteTest called');
    
    if (!testSessionId) {
      console.error('❌ No test session ID found');
      return;
    }
    
    console.log('📝 Current test session ID:', testSessionId);

    try {
      // Set flag to prevent navigation after saving
      localStorage.setItem('completingTest', 'true');
      
      // First, save current quiz result by requesting answers from iframe
      const iframe = document.getElementById('unit-iframe');
      if (iframe && iframe.contentWindow) {
        console.log('📤 [CompleteTest] Requesting answers from iframe');
        iframe.contentWindow.postMessage({
          type: 'quiz.get_answers'
        }, '*');
      }
      
      // Wait for answers to be processed and saved with status='completed'
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear the flag
      localStorage.removeItem('completingTest');
      
      // Get user info
      const { userId } = getUserInfo();
      
      // Get test summary from API
      const lmsBaseUrl = getConfig().LMS_BASE_URL;
      const summaryUrl = `${lmsBaseUrl}/courseware/get_test_summary/?user_id=${userId}&test_session_id=${testSessionId}`;
      
      const response = await fetch(summaryUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ Not JSON response:', contentType, responseText.substring(0, 200));
        throw new Error(`Expected JSON but got ${contentType}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        
        // Store summary in localStorage for TestIntroPage to access
        localStorage.setItem('testSummary', JSON.stringify(data.summary));
        
        // Set test completion status in localStorage for TestSeriesPage to detect
        localStorage.setItem('testCompleted', JSON.stringify({
          testSessionId: testSessionId,
          completedAt: new Date().toISOString(),
          summary: data.summary
        }));
        
        // Clear current test session (test completed)
        localStorage.removeItem('currentTestSessionId');
        
        // Notify parent window about test completion
        window.parent.postMessage({
          type: 'test.completed',
          data: {
            testSessionId: testSessionId,
            summary: data.summary,
            completedAt: new Date().toISOString()
          }
        }, '*');
        
        // Navigate back to TestIntroPage
        window.location.href = '/learning/test-series/intro';
      } else {
        console.error('❌ Failed to get test summary:', data.error);
        alert('Failed to complete test: ' + data.error);
      }
    } catch (error) {
      console.error('❌ Error completing test:', error);
      alert('Error completing test: ' + error.message);
    }
  };


  // Don't render anything if container not ready
  if (!container) {
    console.log('🔍 [TestNavigationBar] Container not ready, not rendering');
    return null;
  }

  console.log('🔍 [TestNavigationBar] Rendering with props:', {
    courseId,
    sequenceId,
    unitId,
    testSessionId,
    nextLink,
    onClickNext: onClickNext ? 'present' : 'missing'
  });
  
  // Check if button exists in DOM
  setTimeout(() => {
    const buttonId = `next-button-${unitId}`;
    const button = document.getElementById(buttonId);
    console.log('🔍 [TestNavigationBar] Button check:', {
      buttonId,
      buttonExists: !!button,
      buttonText: button ? button.textContent : 'not found'
    });
  }, 100);

  // Render Module Transition Page if needed
  if (showModuleTransition && moduleTransitionData) {
    return (
      <ModuleTransitionPage
        currentModule={moduleTransitionData.currentModule}
        nextModule={moduleTransitionData.nextModule}
        nextLink={moduleTransitionData.nextLink}
        onCompleteTest={handleCompleteTest}
        onContinue={async () => {
          // Save current quiz results before navigating (similar to Next button)
          try {
            console.log('📝 [Transition] Saving quiz results before navigation');
            
            // Get quiz answers from iframe
            const iframe = document.getElementById('unit-iframe');
            if (iframe && iframe.contentWindow) {
              console.log('📤 [Transition] Requesting answers from iframe');
              
              const answersPromise = new Promise((resolve) => {
                const messageHandler = (event) => {
                  if (event.data && event.data.type === 'quiz.answers') {
                    console.log('📨 [Transition] Received quiz answers');
                    window.removeEventListener('message', messageHandler);
                    resolve(event.data.answers);
                  }
                };
                
                window.addEventListener('message', messageHandler);
                iframe.contentWindow.postMessage({
                  type: 'quiz.get_answers'
                }, '*');
              });
              
              const answers = await answersPromise;
              
              // Save quiz results
              const totalQuestions = getTotalQuestions();
              const correctCount = answers.filter(a => a.isCorrect).length;
              const answeredCount = answers.length;
              const { userId } = getUserInfo();
              
              const prepareRequestData = () => ({
                course_id: courseId,
                section_id: sequenceId.split('block@')[1],
                unit_id: unitId,
                user_id: userId,
                template_id: 67,
                test_session_id: testSessionId || localStorage.getItem('currentTestSessionId'),
                quiz_data: {
                  answers,
                  correctCount,
                  answeredCount,
                  totalQuestions,
                  score: correctCount / totalQuestions
                }
              });
              
              await fetch(`${getConfig().LMS_BASE_URL}/courseware/save_quiz_results/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(prepareRequestData())
              });
              
              console.log('✅ [Transition] Quiz results saved successfully');
            }
          } catch (error) {
            console.error('❌ [Transition] Error saving quiz results:', error);
            // Continue anyway even if save fails
          }
          
          setShowModuleTransition(false);
          
          // Dispatch event to notify timer can resume (only if there's a next module)
          if (moduleTransitionData.nextModule) {
            window.dispatchEvent(new Event('transitionPageInactive'));
          }
          
          // Clear saved transition state
          if (typeof window !== 'undefined') {
            const transitionKey = `moduleTransition_${sequenceId}_${unitId}`;
            localStorage.removeItem(transitionKey);
            console.log('🗑️ Cleared saved transition state:', transitionKey);
          }
          
          if (moduleTransitionData.nextLink) {
            navigate(moduleTransitionData.nextLink);
          } else {
            // No next link - final module, navigate to learning home
            console.log('🏁 Final module completed, navigating to learning home');
            navigate('/learning');
          }
        }}
      />
    );
  }

  // Render into the persistent container
  return createPortal(
    <>
      <div className="test-navigation-bar d-flex align-items-center" style={{ 
        padding: '0.5rem',
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        zIndex: 10000,
        background: '#ebebeb',
        borderTop: '1px solid #ddd',
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
        width: '100%',
        height: '50px',
        justifyContent: 'center'
      }}>

        {/* Center - Next button and Complete Test button */}
        <div className="d-flex align-items-center gap-3" style={{ justifyContent: 'center', flex: 1 }}>
          {/* Show different buttons based on position */}
          {isLastQuestionInModule3 ? (
            <button
              onClick={() => {
                console.log('🔄 [Finish Test Button] Clicked');
                
                // Just show final transition page - save will be handled by transition page
                console.log('🔍 Current unit title:', unit?.title);
                console.log('🔍 Current module:', currentModule);
                console.log('🔍 This is the final question');
                
                // Show final transition page
                setModuleTransitionData({
                  currentModule,
                  nextModule: null, // No next module - test completed
                  nextLink: null
                });
                setShowModuleTransition(true);
                
                // Dispatch event to notify timer is paused
                window.dispatchEvent(new Event('transitionPageActive'));
                
                // Save transition state to localStorage
                if (typeof window !== 'undefined') {
                  const transitionKey = `moduleTransition_${sequenceId}_${unitId}`;
                  localStorage.setItem(transitionKey, JSON.stringify({
                    currentModule,
                    nextModule: null,
                    nextLink: null
                  }));
                  console.log('💾 Saved final module transition state:', transitionKey);
                }
              }}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                minWidth: '120px',
                textDecoration: 'none'
              }}
            >
              🏁 Finish Test
            </button>
          ) : isLastQuestionInModule ? (
            <button
              onClick={() => {
                console.log('🔄 [Finish Module Button] Clicked');
                
                // Just show transition page - save will be handled by transition page
                const navLink = pathname.startsWith('/preview') ? `/preview${nextLink}` : nextLink;
                
                console.log('🔍 Current unit title:', unit?.title);
                console.log('🔍 Current module:', currentModule);
                console.log('🔍 Next module:', nextModule);
                console.log('🔍 Next link:', navLink);
                
                // Show module transition page
                setModuleTransitionData({
                  currentModule,
                  nextModule,
                  nextLink: navLink
                });
                setShowModuleTransition(true);
                
                // Dispatch event to notify timer is paused
                window.dispatchEvent(new Event('transitionPageActive'));
                
                // Save transition state to localStorage
                if (typeof window !== 'undefined') {
                  const transitionKey = `moduleTransition_${sequenceId}_${unitId}`;
                  localStorage.setItem(transitionKey, JSON.stringify({
                    currentModule,
                    nextModule,
                    nextLink: navLink
                  }));
                  console.log('💾 Saved module transition state:', transitionKey);
                }
              }}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                minWidth: '120px',
                textDecoration: 'none'
              }}
            >
              ✅ Finish Module
            </button>
          ) : (
            <button
            onClick={() => {
              console.log('🔄 [Button Click] Next button clicked');
              
              // Send message to quiz iframe to get answers
              const iframe = document.getElementById('unit-iframe');
              if (!iframe) {
                console.error('❌ [Next Button] No iframe found');
                return;
              }

              try {
                console.log('📤 [Next Button] Sending quiz.get_answers to iframe');
                iframe.contentWindow.postMessage({
                  type: 'quiz.get_answers'
                }, '*');
                
                // Save quiz results and check module transition
                const navLink = pathname.startsWith('/preview') ? `/preview${nextLink}` : nextLink;
                console.log('🔍 [Navigation] Will navigate to:', navLink);
                
                // Wait for quiz.answers response before navigating
                const messageHandler = (event) => {
                  if (event.data && event.data.type === 'quiz.answers') {
                    console.log('📨 [Navigation] Received quiz answers, saving...');
                    window.removeEventListener('message', messageHandler);
                    
                    // Save quiz results
                    const { answers } = event.data;
                    const totalQuestions = getTotalQuestions();
                    const correctCount = answers.filter(a => a.isCorrect).length;
                    const answeredCount = answers.length;
                    
                    // Get user info
                    const { userId } = getUserInfo();
                    
                    // Check module transition before navigating
                    const currentUnitTitle = unit?.title;
                    const nextUnitTitle = actualNextUnit?.title;
                    
                    console.log('🔍 Current unit title:', currentUnitTitle);
                    console.log('🔍 Next unit title:', nextUnitTitle);
                    console.log('🔍 Next unit exists:', !!actualNextUnit);
                    
                    const currentModule = parseModuleNumber(currentUnitTitle);
                    const nextModule = actualNextUnit ? parseModuleNumber(nextUnitTitle) : null;
                    
                    console.log('🔍 Current module:', currentModule);
                    console.log('🔍 Next module:', nextModule);
                    
                    // Check if transitioning between modules
                    const isModuleTransition = currentModule && nextModule && currentModule !== nextModule;
                    console.log('🔍 Module transition:', isModuleTransition);
                    
                    // If no next unit (last question), check if this is the final module
                    if (!actualNextUnit) {
                      console.log('🔍 No next unit - this is the last question');
                      
                      // Check if this is module 3 or the last module
                      if (currentModule >= 3) {
                        console.log('🎯 [Next Button] Module 3 or last module detected, showing final transition page');
                        
                        // Save quiz results first
                        const prepareRequestData = () => ({
                          course_id: courseId,
                          section_id: sequenceId.split('block@')[1],
                          unit_id: unitId,
                          user_id: userId,
                          template_id: 67,
                          test_session_id: testSessionId || localStorage.getItem('currentTestSessionId'),
                          quiz_data: {
                            answers,
                            correctCount,
                            answeredCount,
                            totalQuestions,
                            score: correctCount / totalQuestions
                          }
                        });
                        
                        // Save quiz results
                        fetch(`${getConfig().LMS_BASE_URL}/courseware/save_quiz_results/`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(prepareRequestData())
                        })
                        .then(response => {
                          if (response.ok) {
                            console.log('✅ Quiz results saved successfully');
                            console.log('🏁 Final module: Showing final transition page');
                            // Show final transition page
                            setModuleTransitionData({
                              currentModule,
                              nextModule: null, // No next module - test completed
                              nextLink: null
                            });
                            setShowModuleTransition(true);
                            
                            // Dispatch event to notify timer is paused
                            window.dispatchEvent(new Event('transitionPageActive'));
                            
                            // Save transition state to localStorage
                            if (typeof window !== 'undefined') {
                              const transitionKey = `moduleTransition_${sequenceId}_${unitId}`;
                              localStorage.setItem(transitionKey, JSON.stringify({
                                currentModule,
                                nextModule: null,
                                nextLink: null
                              }));
                              console.log('💾 Saved final module transition state:', transitionKey);
                            }
                          } else {
                            console.error('❌ Error saving quiz results');
                            // Still show transition page even if save fails
                            setModuleTransitionData({
                              currentModule,
                              nextModule: null,
                              nextLink: null
                            });
                            setShowModuleTransition(true);
                          }
                        })
                        .catch(error => {
                          console.error('❌ Error saving quiz results:', error);
                          // Still show transition page even if save fails
                          setModuleTransitionData({
                            currentModule,
                            nextModule: null,
                            nextLink: null
                          });
                          setShowModuleTransition(true);
                        });
                        return; // Don't navigate yet
                      }
                    }
                    
                    if (isModuleTransition) {
                      // Save quiz results first before showing transition page
                      const prepareRequestData = () => ({
                        course_id: courseId,
                        section_id: sequenceId.split('block@')[1],
                        unit_id: unitId,
                        user_id: userId,
                        template_id: 67,
                        test_session_id: testSessionId || localStorage.getItem('currentTestSessionId'),
                        quiz_data: {
                          answers,
                          correctCount,
                          answeredCount,
                          totalQuestions,
                          score: correctCount / totalQuestions
                        }
                      });
                      
                      // Save quiz results
                      fetch(`${getConfig().LMS_BASE_URL}/courseware/save_quiz_results/`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(prepareRequestData())
                      })
                      .then(response => {
                        if (response.ok) {
                          console.log('✅ Quiz results saved successfully');
                          console.log('🔄 Module transition: Showing transition page');
                          // Show module transition page
                          setModuleTransitionData({
                            currentModule,
                            nextModule,
                            nextLink: navLink
                          });
                          setShowModuleTransition(true);
                        } else {
                          console.error('❌ Error saving quiz results');
                          // Still show transition page even if save fails
                          setModuleTransitionData({
                            currentModule,
                            nextModule,
                            nextLink: navLink
                          });
                          setShowModuleTransition(true);
                        }
                      })
                      .catch(error => {
                        console.error('❌ Error saving quiz results:', error);
                        // Still show transition page even if save fails
                        setModuleTransitionData({
                          currentModule,
                          nextModule,
                          nextLink: navLink
                        });
                        setShowModuleTransition(true);
                      });
                      return; // Don't navigate yet
                    }
                    
                    // Not a module transition, save and navigate normally
                    const prepareRequestData = () => ({
                      course_id: courseId,
                      section_id: sequenceId.split('block@')[1],
                      unit_id: unitId,
                      user_id: userId,
                      template_id: 67,
                      test_session_id: testSessionId || localStorage.getItem('currentTestSessionId'),
                      quiz_data: {
                        answers,
                        correctCount,
                        answeredCount,
                        totalQuestions,
                        score: correctCount / totalQuestions
                      }
                    });
                    
                    // Save quiz results
                    fetch(`${getConfig().LMS_BASE_URL}/courseware/save_quiz_results/`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(prepareRequestData())
                    })
                    .then(response => {
                      if (response.ok) {
                        console.log('✅ Quiz results saved successfully');
                        console.log('🔍 Navigating to:', navLink);
                        navigate(navLink);
                      } else {
                        console.error('❌ Error saving quiz results');
                      }
                    })
                    .catch(error => {
                      console.error('❌ Error saving quiz results:', error);
                    });
                  }
                };
                
                window.addEventListener('message', messageHandler);
              } catch (error) {
                console.error('❌ [Next Button] Error:', error);
              }
            }}
            style={{
              backgroundColor: '#00838f',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              minWidth: '100px',
              textDecoration: 'none'
            }}
          >
            Next
          </button>
          )}
          <button 
            onClick={handleCompleteTest}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            🏁 COMPLETE TEST
          </button>
        </div>
      </div>
    </>,
    container
  );
};

TestNavigationBar.propTypes = {
  courseId: PropTypes.string.isRequired,
  sequenceId: PropTypes.string.isRequired,
  unitId: PropTypes.string,
  onClickNext: PropTypes.func.isRequired,
  isAtTop: PropTypes.bool,
};

export default TestNavigationBar;
