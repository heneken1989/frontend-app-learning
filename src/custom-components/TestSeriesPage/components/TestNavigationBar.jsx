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

  // Helpers for module score aggregation
  const getModuleScoresKey = (seqId) => `moduleScores_${seqId}`;
  const updateModuleScores = (seqId, moduleNum, unitCorrect, unitTotal) => {
    try {
      if (!seqId || !moduleNum) return;
      const key = getModuleScoresKey(seqId);
      const existing = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      const parsed = existing ? JSON.parse(existing) : {};
      const current = parsed[moduleNum] || { correct: 0, total: 0 };
      const next = {
        correct: (current.correct || 0) + (unitCorrect || 0),
        total: (current.total || 0) + (unitTotal || 0),
      };
      parsed[moduleNum] = next;
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(parsed));
      }
    } catch (e) {}
  };
  const readModuleScores = (seqId) => {
    try {
      const existing = typeof window !== 'undefined' ? localStorage.getItem(getModuleScoresKey(seqId)) : null;
      return existing ? JSON.parse(existing) : {};
    } catch (e) {
      return {};
    }
  };
  const clearModuleScores = (seqId) => {
    try {
      if (typeof window !== 'undefined') localStorage.removeItem(getModuleScoresKey(seqId));
    } catch (e) {}
  };

  // Build final summary using module totals from navigation (like TestHeader)
  const prepareFinalSummary = async () => {
    try {
      // First, ensure the current quiz result is saved with status='completed'
      const iframe = document.getElementById('unit-iframe');
      const currentTestSessionId = testSessionId || localStorage.getItem('currentTestSessionId');
      
      if (iframe && iframe.contentWindow && currentTestSessionId && unitId && courseId && sequenceId) {
        console.log('📤 [prepareFinalSummary] Saving final quiz result with status=completed');
        
        // Request answers from iframe
        const answersPromise = new Promise((resolve) => {
          const messageHandler = (event) => {
            if (event.data && event.data.type === 'quiz.answers') {
              window.removeEventListener('message', messageHandler);
              resolve(event.data.answers || []);
            }
          };
          window.addEventListener('message', messageHandler);
          iframe.contentWindow.postMessage({ type: 'quiz.get_answers' }, '*');
          
          // Timeout after 3 seconds
          setTimeout(() => {
            window.removeEventListener('message', messageHandler);
            resolve([]);
          }, 3000);
        });
        
        const answers = await answersPromise;
        const correctCount = (answers || []).filter(a => a.isCorrect).length;
        const answeredCount = (answers || []).length;
        const totalQuestions = Math.max(answeredCount, 1);
        
        // Extract IDs from current URL or use provided values
        const currentUrl = window.location.href;
        const urlParts = currentUrl.split('/');
        const coursePart = urlParts.find(p => p.startsWith('course-v1:'));
        const sequencePart = urlParts.find(p => p.includes('type@sequential'));
        const unitPart = urlParts.find(p => p.includes('type@vertical'));
        
        const extractedCourseId = coursePart || courseId;
        const extractedUnitId = unitPart?.split('+block@')[1] || unitId;
        const sectionIdToSave = sequenceId.split('block@')[1];
        const { userId } = getUserInfo();
        
        // Check if already saved to prevent duplicate
        const saveKey = getUnitSaveKey(currentTestSessionId, extractedUnitId);
        if (wasUnitSaved(saveKey)) {
          console.log('⚠️ [prepareFinalSummary] Unit already saved, skipping duplicate save');
        } else {
          // Save final quiz result with status='completed'
          const finalRequestData = {
            section_id: sectionIdToSave,
            unit_id: extractedUnitId,
            course_id: extractedCourseId,
            user_id: userId,
            template_id: 67,
            test_session_id: currentTestSessionId,
            status: 'completed', // Mark as completed
            quiz_data: {
              answers: (answers || []).map(a => a.userAnswer),
              correctCount,
              answeredCount,
              totalQuestions,
              score: totalQuestions > 0 ? correctCount / totalQuestions : 0
            }
          };
          
          console.log('📤 [prepareFinalSummary] Saving final result:', finalRequestData);
          await saveQuizResults(finalRequestData);
          markUnitSaved(saveKey); // Mark as saved to prevent duplicate
          console.log('✅ [prepareFinalSummary] Final quiz result saved with status=completed');
        }
      }
      
      const scores = readModuleScores(sequenceId) || {};
      let moduleTotals = {};

      // Fetch course navigation and compute totals per module number from unit titles
      if (courseId && sequenceId) {
        try {
          const response = await fetch(`${getLmsBaseUrl()}/api/course_home/v1/navigation/${courseId}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            const seq = data?.blocks?.[sequenceId];
            if (seq && Array.isArray(seq.children)) {
              const totals = {};
              seq.children.forEach((childId) => {
                const child = data.blocks[childId];
                const title = child?.display_name || '';
                // Extract module number from the first number before a dot
                const moduleMatch = title.match(/^(\d+)\./);
                const modNum = moduleMatch ? parseInt(moduleMatch[1], 10) : null;
                if (!modNum) {
                  return; // skip if we can't identify the module
                }
                // Count questions per unit using the same logic as TestSeriesPage.jsx
                // If title contains '-', split and count parts; else count as 1
                let questionsInUnit = 1;
                if (title.includes('-')) {
                  const parts = title
                    .split('-')
                    .map(s => s.trim())
                    .filter(Boolean);
                  questionsInUnit = Math.max(1, parts.length);
                }
                totals[modNum] = (totals[modNum] || 0) + questionsInUnit;
              });
              moduleTotals = totals;
            }
          }
        } catch (e) {
          // Ignore fetch errors; fallback to existing totals in scores
        }
      }

      // Merge: keep correct from scores, replace total with moduleTotals when available
      const merged = {};
      const keys = new Set([
        ...Object.keys(scores || {}),
        ...Object.keys(moduleTotals || {}),
      ]);
      keys.forEach((k) => {
        const key = String(k);
        const scoreEntry = scores[key] || {};
        merged[key] = {
          correct: Number(scoreEntry.correct || 0),
          total: Number(moduleTotals[key] != null ? moduleTotals[key] : (scoreEntry.total || 0)),
        };
      });

      // Save results to localStorage and navigate to results page
      localStorage.setItem('testResults', JSON.stringify({
        moduleScores: merged,
        testSessionId: currentTestSessionId,
        completedAt: new Date().toISOString(),
        sequenceId: sequenceId
      }));
      
      // Clear module scores after saving
      clearModuleScores(sequenceId);
      
      // Mark test as completed to prevent going back
      if (typeof window !== 'undefined') {
        localStorage.setItem(`testCompleted_${sequenceId}`, 'true');
        // Clear all timer states for this sequence
        for (let i = 1; i <= 3; i++) {
          localStorage.removeItem(`testTimer_${sequenceId}_${i}`);
        }
      }
      
      // Navigate to results page with replace to prevent back button
      navigate('/test-series/results', { replace: true });
    } catch (e) {
      const scores = readModuleScores(sequenceId) || {};
      const currentTestSessionId = testSessionId || localStorage.getItem('currentTestSessionId');
      localStorage.setItem('testResults', JSON.stringify({
        moduleScores: scores,
        testSessionId: currentTestSessionId,
        completedAt: new Date().toISOString(),
        sequenceId: sequenceId
      }));
      clearModuleScores(sequenceId);
      
      // Mark test as completed to prevent going back
      if (typeof window !== 'undefined') {
        localStorage.setItem(`testCompleted_${sequenceId}`, 'true');
        // Clear all timer states for this sequence
        for (let i = 1; i <= 3; i++) {
          localStorage.removeItem(`testTimer_${sequenceId}_${i}`);
        }
      }
      
      // Navigate to results page with replace to prevent back button
      navigate('/test-series/results', { replace: true });
    }
  };

  // Deduplication guards to prevent repeated saves/aggregation per unit
  const savedUnitSetRef = useRef(new Set());
  const moduleAggregatedSetRef = useRef(new Set());
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
  const getModuleAggKey = (sessionId, uId) => (sessionId && uId ? `agg_${sessionId}_${uId}` : null);
  const wasModuleAggregated = (key) => {
    if (!key) return false;
    if (moduleAggregatedSetRef.current.has(key)) return true;
    try { return (typeof window !== 'undefined' && localStorage.getItem(key) === '1'); } catch (e) { return false; }
  };
  const markModuleAggregated = (key) => {
    if (!key) return;
    moduleAggregatedSetRef.current.add(key);
    try { if (typeof window !== 'undefined') localStorage.setItem(key, '1'); } catch (e) {}
  };

  // Centralized network helpers to avoid duplicated fetch patterns
  const getLmsBaseUrl = () => getConfig().LMS_BASE_URL;
  const getCsrfToken = () => {
    try {
      const el = typeof document !== 'undefined' ? document.querySelector('[name=csrfmiddlewaretoken]') : null;
      return el?.value || '';
    } catch (e) {
      return '';
    }
  };
  const saveQuizResults = async (requestData) => {
    try {
      const response = await fetch(`${getLmsBaseUrl()}/courseware/save_quiz_results/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(requestData),
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  };
  
  // Check if test has been completed (timer expired) and prevent access
  useEffect(() => {
    if (sequenceId && typeof window !== 'undefined') {
      const testCompleted = localStorage.getItem(`testCompleted_${sequenceId}`);
      if (testCompleted === 'true') {
        console.log('🚫 [TestNavigationBar] Test already completed (timer expired), redirecting to results');
        // Test was completed (timer expired), redirect to results immediately
        navigate('/test-series/results', { replace: true });
        return;
      }
    }
  }, [sequenceId, navigate]);

  // Navigate to module transition page if saved state exists
  useEffect(() => {
    if (sequenceId && unitId && typeof window !== 'undefined') {
      // Check if test is completed first - don't restore transition if test is completed
      const testCompleted = localStorage.getItem(`testCompleted_${sequenceId}`);
      if (testCompleted === 'true') {
        console.log('🚫 [TestNavigationBar] Test completed, skipping transition restore');
        return; // Don't restore transition if test is completed
      }
      
      const transitionKey = `moduleTransition_${sequenceId}_${unitId}`;
      const savedTransition = localStorage.getItem(transitionKey);
      
      if (savedTransition) {
        try {
          const transitionData = JSON.parse(savedTransition);
          console.log('🔄 [Restore] Found saved module transition state, navigating to transition page:', transitionData);
          
          // Save sequenceId and unitId to localStorage for transition page
          localStorage.setItem('moduleTransition_sequenceId', sequenceId);
          localStorage.setItem('moduleTransition_unitId', unitId);
          
          // Navigate to transition page with replace to prevent back button
          navigate('/test-series/module-transition', { replace: true });
        } catch (error) {
          console.error('❌ Error parsing saved transition data:', error);
          localStorage.removeItem(transitionKey);
        }
      }
    }
  }, [sequenceId, unitId, navigate]);
  
  // Parse module number from unit title (e.g., "1.4" -> 1, "2.1" -> 2)
  // This must be defined BEFORE it's used
  const parseModuleNumber = (title) => {
    if (!title) return null;
    const match = title.match(/^(\d+)\./);
    return match ? parseInt(match[1], 10) : null;
  };

  // Parse number of questions from unit title (e.g., "1.1" -> 1, "1.1-1.2-1.3" -> 3)
  // This must be defined BEFORE it's used
  const parseUnitTitleForQuestionCount = (unitTitle) => {
    if (!unitTitle) return 1; // Default to 1 question if no title
    
    // Check if title contains multiple questions (e.g., "1.1-1.2-1.3")
    if (unitTitle.includes('-')) {
      // Split by '-' and count the parts
      const parts = unitTitle.split('-');
      const questionCount = parts.length;
      return questionCount;
    }
    
    // Single question (e.g., "1.1", "2.3")
    return 1;
  };

  // Calculate if current unit is the last question in its module (at component level)
  // This must be defined BEFORE the useEffect that uses it
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

  // Handle module test expiration event
  useEffect(() => {
    const handleModuleExpired = (event) => {
      const { sequenceId: eventSeqId, currentModule: expiredModule, unitId: eventUnitId } = event.detail;
      
      // Only handle if this event is for current sequence
      if (eventSeqId === sequenceId && eventUnitId === unitId) {
        console.log('⏰ [Timer Expired] Handling module test expiration:', {
          expiredModule,
          sequenceId: eventSeqId,
          unitId: eventUnitId
        });
        
        // Use the SAME currentModule and nextModule as Finish Module button
        // These are calculated at component level and accessible via closure
        console.log('⏰ [Timer Expired] Current module (from component):', currentModule);
        console.log('⏰ [Timer Expired] Next module (from component):', nextModule);
        
        // When timer expires, handle EXACTLY same as "Finish Module" or "Finish Test" button
        console.log('⏰ [Timer Expired] Handling exactly like Finish Module/Finish Test button');
        console.log('⏰ [Timer Expired] isLastQuestionInModule3:', isLastQuestionInModule3);
        console.log('⏰ [Timer Expired] currentModule:', currentModule);
        console.log('⏰ [Timer Expired] actualNextUnit:', actualNextUnit);
        console.log('⏰ [Timer Expired] nextUnitIdForModuleCheck:', nextUnitIdForModuleCheck);
        
        // Check if this is module 3 - ALWAYS use handleCompleteTest logic (EXACTLY same as Finish Test button)
        // Finish Test button only shows when isLastQuestionInModule3 is true
        // But when timer expires in module 3, we should always use handleCompleteTest regardless
        if (currentModule === 3) {
          // Module 3 -> test finished: use handleCompleteTest (EXACTLY same as Finish Test button)
          console.log('🏁 [Timer Expired] Module 3 detected, using handleCompleteTest (same as Finish Test)');
          
          // Call handleCompleteTest which handles everything: save answers, fetch summary, save to localStorage, and navigate
          handleCompleteTest();
          return;
        }
        
        // Check if this is the last question (no next unit) but not module 3
        if (!actualNextUnit) {
          // No next unit -> test finished: show final summary (same as Finish Test button)
          console.log('🏁 [Timer Expired] No next unit, showing unified final summary');
          
          // Mark test as completed to prevent going back
          if (typeof window !== 'undefined') {
            localStorage.setItem(`testCompleted_${sequenceId}`, 'true');
            // Clear all timer states for this sequence
            for (let i = 1; i <= 3; i++) {
              localStorage.removeItem(`testTimer_${sequenceId}_${i}`);
            }
          }

          const iframe = document.getElementById('unit-iframe');
          if (iframe && iframe.contentWindow) {
            const answersPromise = new Promise((resolve) => {
              const messageHandler = (event) => {
                if (event.data && event.data.type === 'quiz.answers') {
                  window.removeEventListener('message', messageHandler);
                  resolve(event.data.answers || []);
                }
              };
              window.addEventListener('message', messageHandler);
              iframe.contentWindow.postMessage({ type: 'quiz.get_answers' }, '*');
            });
            answersPromise.then((answers) => {
              const correctCount = (answers || []).filter(a => a.isCorrect).length;
              const answeredCount = (answers || []).length;
              // Get actual number of questions from unit title (e.g., "1.1-1.2-1.3" = 3 questions)
              const unitTitle = unit?.title || '';
              const actualQuestionCount = parseUnitTitleForQuestionCount(unitTitle);
              // Deduplicate module aggregation per session+unit
              const currentSession = testSessionId || localStorage.getItem('currentTestSessionId');
              const aggKey = getModuleAggKey(currentSession, unitId);
              if (!wasModuleAggregated(aggKey)) {
                if (currentModule) updateModuleScores(sequenceId, currentModule, correctCount, actualQuestionCount);
                markModuleAggregated(aggKey);
              }
              prepareFinalSummary();
            }).catch(() => {
              prepareFinalSummary();
            });
          } else {
            prepareFinalSummary();
          }
          return;
        }
        
        // There's a next unit, handle EXACTLY like Finish Module button
        // But we need to find the first unit of the NEXT module, not just the next quiz
        // When timer expires, we should jump to the first unit of next module
        // Use async function to find first unit of next module via navigation API
        const targetModule = currentModule ? currentModule + 1 : null;
        
        const findFirstUnitOfNextModule = async () => {
          if (!currentModule || !sequence?.unitIds || !courseId) {
            return null;
          }
          
          try {
            const response = await fetch(`${getLmsBaseUrl()}/api/course_home/v1/navigation/${courseId}`, {
              method: 'GET',
              headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
              credentials: 'include',
            });
            
            if (response.ok) {
              const data = await response.json();
              const seq = data?.blocks?.[sequenceId];
              if (seq && Array.isArray(seq.children)) {
                // Find first unit with module number = targetModule
                for (const childId of seq.children) {
                  const child = data.blocks[childId];
                  const title = child?.display_name || '';
                  const moduleMatch = title.match(/^(\d+)\./);
                  const modNum = moduleMatch ? parseInt(moduleMatch[1], 10) : null;
                  
                  if (modNum === targetModule) {
                    // Found first unit of next module
                    return childId;
                  }
                }
              }
            }
          } catch (e) {
            console.error('❌ Error fetching navigation API:', e);
          }
          
          return null;
        };
        
        // Find first unit of next module
        findFirstUnitOfNextModule().then((firstUnitOfNextModule) => {
          let navLink = null;
          
          if (firstUnitOfNextModule) {
            // Found first unit of next module
            navLink = pathname.startsWith('/preview')
              ? `/preview/course/${courseId}/${sequenceId}/${firstUnitOfNextModule}`
              : `/course/${courseId}/${sequenceId}/${firstUnitOfNextModule}`;
          } else if (nextModule && nextModule !== currentModule) {
            // Next quiz is already in next module, use nextLink (same as Finish Module)
            navLink = pathname.startsWith('/preview') ? `/preview${nextLink}` : nextLink;
          } else {
            // Fallback: use nextLink
            navLink = pathname.startsWith('/preview') ? `/preview${nextLink}` : nextLink;
          }
          
          console.log('🔍 [Timer Expired] Current unit title:', unit?.title);
          console.log('🔍 [Timer Expired] Current module:', currentModule);
          console.log('🔍 [Timer Expired] Next module:', nextModule);
          console.log('🔍 [Timer Expired] First unit of next module:', firstUnitOfNextModule);
          console.log('🔍 [Timer Expired] Next link (calculated):', navLink);
          
          // Continue with the same logic as Finish Module button
          // Get quiz answers and save before showing transition page
          const iframe = document.getElementById('unit-iframe');
          if (!iframe) {
            console.error('❌ [Timer Expired] No iframe found');
            return;
          }
          
          // Request answers from iframe (EXACTLY same as Finish Module)
          const messageHandler = (event) => {
            if (event.data && event.data.type === 'quiz.answers') {
              console.log('📨 [Timer Expired] Received quiz answers, saving...');
              window.removeEventListener('message', messageHandler);
              
              const { answers } = event.data;
              const totalQuestions = Array.isArray(answers) ? answers.length : 1;
              const correctCount = answers.filter(a => a.isCorrect).length;
              const answeredCount = answers.length;
              const { userId } = getUserInfo();
              
              // Save quiz results (EXACTLY same as Finish Module)
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
              
              // Get actual number of questions from unit title (e.g., "1.1-1.2-1.3" = 3 questions)
              const unitTitle = unit?.title || '';
              const actualQuestionCount = parseUnitTitleForQuestionCount(unitTitle);
              
              saveQuizResults(prepareRequestData())
                .then(ok => {
                  if (ok) {
                    console.log('✅ [Timer Expired] Quiz results saved successfully');
                    updateModuleScores(sequenceId, currentModule, correctCount, actualQuestionCount);
                  } else {
                    console.error('❌ [Timer Expired] Error saving quiz results');
                  }
                  // Navigate to transition page regardless of save result (EXACTLY same as Finish Module)
                  // Use targetModule (currentModule + 1) for transition page
                  navigateToModuleTransition(currentModule, targetModule, navLink);
                })
                .catch(error => {
                  console.error('❌ [Timer Expired] Error saving quiz results:', error);
                  // Navigate to transition page even if save fails (EXACTLY same as Finish Module)
                  navigateToModuleTransition(currentModule, targetModule, navLink);
                });
            }
          };
          
          window.addEventListener('message', messageHandler);
          iframe.contentWindow.postMessage({
            type: 'quiz.get_answers'
          }, '*');
        });
        
        return; // Exit early, async logic will handle the rest
        
      }
    };
    
    window.addEventListener('moduleTestExpired', handleModuleExpired);
    
    return () => {
      window.removeEventListener('moduleTestExpired', handleModuleExpired);
    };
  }, [sequenceId, unitId, actualNextUnit, unit, nextLink, pathname, navigate, testSessionId, courseId, sequence, currentModule, nextModule]);
  
  // Helper function to get total questions with fallback to navigation API
  const getTotalQuestions = async () => {
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
    
    // Fallback: try to fetch from navigation API if sequence is empty
    if (courseId && sequenceId && (!sequence || Object.keys(sequence).length === 0)) {
      console.log('🔄 Sequence is empty, trying navigation API fallback...');
      try {
        const response = await fetch(`${getLmsBaseUrl()}/api/course_home/v1/navigation/${courseId}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          const seq = data?.blocks?.[sequenceId];
          if (seq && Array.isArray(seq.children)) {
            // Count questions from unit titles (same logic as prepareFinalSummary)
            let totalQuestions = 0;
            seq.children.forEach((childId) => {
              const child = data.blocks[childId];
              const title = child?.display_name || '';
              let questionsInUnit = 1;
              if (title.includes('-')) {
                const parts = title.split('-').map(s => s.trim()).filter(Boolean);
                questionsInUnit = Math.max(1, parts.length);
              }
              totalQuestions += questionsInUnit;
            });
            
            if (totalQuestions > 0) {
              console.log('✅ Found total questions from navigation API:', totalQuestions);
              setCachedTotalQuestions(totalQuestions);
              return totalQuestions;
            }
          }
        } else {
          console.warn(`⚠️ Navigation API returned ${response.status}, ignoring`);
        }
      } catch (error) {
        console.warn('⚠️ Error fetching from navigation API:', error.message);
      }
    }
    
    console.log('❌ No total questions found in sequence data or navigation API');
    return 0; // Return 0 to indicate no data
  };
  
  // Helper function to send total questions to quiz iframe
  const sendTotalQuestionsToQuiz = async () => {
    const iframe = document.getElementById('unit-iframe');
    if (!iframe) return;
    
    const totalQuestions = await getTotalQuestions();
    console.log(`📊 Sending totalQuestions ${totalQuestions} to quiz iframe`);
    
    if (totalQuestions > 0) {
      iframe.contentWindow.postMessage({
        type: 'quiz.config',
        data: {
          totalQuestions: totalQuestions
        }
      }, '*');
    }
  };

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


  // Create persistent container that stays in place like TestHeader
  useEffect(() => {
    if (containerRef.current) {
      setContainer(containerRef.current);
      return () => {
        if (containerRef.current && containerRef.current.parentNode) {
          containerRef.current.parentNode.removeChild(containerRef.current);
          containerRef.current = null;
        }
      };
    }

    const newContainer = document.createElement('div');
    newContainer.id = 'test-navigation-container';
    newContainer.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      z-index: 10000;
      pointer-events: none;
    `;

    document.body.appendChild(newContainer);

    containerRef.current = newContainer;
    setContainer(newContainer);

    return () => {
      if (containerRef.current && containerRef.current.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current);
        containerRef.current = null;
      }
    };
  }, []);

  // Message handling for iframe communication - only handle loading states
  useEffect(() => {
    const handleMessage = (event) => {
      console.log('📨 [NavigationBar] Received message:', event.data);
      console.log('📨 [NavigationBar] Message source:', event.source);
      console.log('📨 [NavigationBar] Message origin:', event.origin);
      
      // Handle quiz answers from template
      // Skip if this is being handled by Next button's message handler
      // (Next button handler will set a flag before sending quiz.get_answers)
      if (event.data && event.data.type === 'quiz.answers') {
        // Check if Next button is handling this (by checking if message handler was registered)
        // We'll use a simple check: if the event was triggered by Next button's postMessage
        // For now, we'll let Next button handler take precedence by checking if it exists
        // Actually, we should skip this handler if Next button is active
        // Let's add a flag check
        const isNextButtonHandling = localStorage.getItem('nextButtonHandling') === 'true';
        if (isNextButtonHandling) {
          console.log('⚠️ [NavigationBar] Next button is handling this, skipping global handler');
          localStorage.removeItem('nextButtonHandling');
          return; // Let Next button handler take care of it
        }
        
        console.log('📨 [NavigationBar] Received quiz answers:', event.data);
        console.log('📨 [NavigationBar] Answers array:', event.data.answers);
        
        const { answers, templateId } = event.data;
        const totalQuestions = Array.isArray(answers) ? answers.length : 1;
        
        // Calculate results
        // For template 18 and 37: each answer item = 1 question
        // Template 18: each dropdown = 1 question
        // Template 37: each question block = 1 question (multiple questions per quiz)
        const correctCount = answers.filter(a => a.isCorrect).length;
        const answeredCount = answers.length;
        
        console.log('📊 [NavigationBar] Calculated results:', {
          correctCount,
          answeredCount,
          totalQuestions,
          templateId
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

        // Deduplicate saves per session+unit
        const saveKey = getUnitSaveKey(currentTestSessionId, extractedUnitId);
        if (wasUnitSaved(saveKey)) {
          return; // already saved for this unit
        }
        
        // Check if this is a complete test action
        const isCompletingTest = localStorage.getItem('completingTest') === 'true';
        
        // Determine template_id: use from message if available, otherwise default to 67 (test template)
        const templateIdToSave = templateId || 67;
        
        // Prepare data to save
        const requestData = {
          section_id: sectionIdToSave, // Use sequenceId as section_id
          unit_id: extractedUnitId,
          course_id: extractedCourseId,
          user_id: userId,
          template_id: templateIdToSave, // Use template_id from quiz answers (18, 37, etc.) or default to 67
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
        
        console.log('📤 Using LMS base URL:', getLmsBaseUrl());
        console.log('📤 CSRF Token:', getCsrfToken() ? 'Found' : 'Missing');
        
        // Save to database (centralized)
        saveQuizResults(requestData)
        .then(async ok => {
          if (ok) {
            markUnitSaved(saveKey);
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
            console.error('❌ [Next Button] HTTP Error saving quiz results');
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
  
  // Send total questions to quiz iframe when sequence data changes or when component mounts
  useEffect(() => {
    const fetchAndSendTotalQuestions = async () => {
      if (sequence || (courseId && sequenceId)) {
        console.log('🔄 Sequence data changed or component mounted:', {
          sequence,
          metadata: sequence?.metadata,
          children: sequence?.children,
          unitIds: sequence?.unitIds,
          courseId,
          sequenceId
        });
        
        const totalQuestions = await getTotalQuestions();
        console.log('📊 Total questions:', totalQuestions);
        
        if (totalQuestions > 0) {
          console.log('✅ Sending total questions to quiz');
          await sendTotalQuestionsToQuiz();
        } else {
          console.log('⚠️ No total questions found, will retry later');
          // Retry after a short delay in case API is still loading
          setTimeout(async () => {
            const retryTotal = await getTotalQuestions();
            if (retryTotal > 0) {
              await sendTotalQuestionsToQuiz();
            }
          }, 1000);
        }
      }
    };
    
    fetchAndSendTotalQuestions();
  }, [sequence, courseId, sequenceId]);

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
      let currentQuizAnswers = null;
      
      if (iframe && iframe.contentWindow) {
        console.log('📤 [CompleteTest] Requesting answers from iframe');
        
        // Wait for answers with promise
        const answersPromise = new Promise((resolve) => {
          const messageHandler = (event) => {
            if (event.data && event.data.type === 'quiz.answers') {
              window.removeEventListener('message', messageHandler);
              resolve(event.data.answers || []);
            }
          };
          window.addEventListener('message', messageHandler);
          iframe.contentWindow.postMessage({ type: 'quiz.get_answers' }, '*');
          
          // Timeout after 3 seconds
          setTimeout(() => {
            window.removeEventListener('message', messageHandler);
            resolve([]);
          }, 3000);
        });
        
        currentQuizAnswers = await answersPromise;
        
        // Save current quiz result to database with status='completed'
        if (currentQuizAnswers && currentQuizAnswers.length > 0 && unitId && courseId && sequenceId) {
          // Extract IDs from current URL or use provided values
          const currentUrl = window.location.href;
          const urlParts = currentUrl.split('/');
          const coursePart = urlParts.find(p => p.startsWith('course-v1:'));
          const unitPart = urlParts.find(p => p.includes('type@vertical'));
          
          const extractedCourseId = coursePart || courseId;
          const extractedUnitId = unitPart?.split('+block@')[1] || unitId;
          const sectionIdToSave = sequenceId.split('block@')[1];
          const { userId } = getUserInfo();
          
          // Calculate correctCount and actualQuestionCount first (needed for both save and updateModuleScores)
          const correctCount = currentQuizAnswers.filter(a => a.isCorrect).length;
          const answeredCount = currentQuizAnswers.length;
          
          // Get actual number of questions from unit title (e.g., "1.1-1.2-1.3" = 3 questions)
          const unitTitle = unit?.title || '';
          const actualQuestionCount = parseUnitTitleForQuestionCount(unitTitle);
          
          // Check if already saved to prevent duplicate
          const saveKey = getUnitSaveKey(testSessionId, extractedUnitId);
          if (wasUnitSaved(saveKey)) {
            console.log('⚠️ [CompleteTest] Unit already saved, skipping duplicate save');
          } else {
            console.log('📤 [CompleteTest] Saving current quiz result with status=completed');
            
            // Save current quiz result with status='completed'
            const currentQuizRequestData = {
              section_id: sectionIdToSave,
              unit_id: extractedUnitId,
              course_id: extractedCourseId,
              user_id: userId,
              template_id: 67,
              test_session_id: testSessionId,
              status: 'completed', // Mark as completed
              quiz_data: {
                answers: currentQuizAnswers.map(a => a.userAnswer),
                correctCount,
                answeredCount,
                totalQuestions: actualQuestionCount,
                score: actualQuestionCount > 0 ? correctCount / actualQuestionCount : 0
              }
            };
            
            console.log('📤 [CompleteTest] Saving current quiz result:', currentQuizRequestData);
            await saveQuizResults(currentQuizRequestData);
            markUnitSaved(saveKey); // Mark as saved to prevent duplicate
            console.log('✅ [CompleteTest] Current quiz result saved with status=completed');
          }
          
          // Update module scores in localStorage (IMPORTANT: use actual question count from unit title)
          if (currentModule) {
            updateModuleScores(sequenceId, currentModule, correctCount, actualQuestionCount);
            console.log('✅ [CompleteTest] Module scores updated in localStorage:', {
              module: currentModule,
              correct: correctCount,
              total: actualQuestionCount
            });
          }
        }
      }
      
      // Wait a bit more to ensure all saves are complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
        
        // Also prepare module scores for TestResultsPage (same as prepareFinalSummary)
        const scores = readModuleScores(sequenceId) || {};
        let moduleTotals = {};

        // Fetch course navigation and compute totals per module number from unit titles
        if (courseId && sequenceId) {
          try {
            const response = await fetch(`${getLmsBaseUrl()}/api/course_home/v1/navigation/${courseId}`, {
              method: 'GET',
              headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
              credentials: 'include',
            });
            if (response.ok) {
              const navData = await response.json();
              const seq = navData?.blocks?.[sequenceId];
              if (seq && Array.isArray(seq.children)) {
                const totals = {};
                seq.children.forEach((childId) => {
                  const child = navData.blocks[childId];
                  const title = child?.display_name || '';
                  // Extract module number from the first number before a dot
                  const moduleMatch = title.match(/^(\d+)\./);
                  const modNum = moduleMatch ? parseInt(moduleMatch[1], 10) : null;
                  if (!modNum) {
                    return; // skip if we can't identify the module
                  }
                  // Count questions per unit using the same logic as TestSeriesPage.jsx
                  // If title contains '-', split and count parts; else count as 1
                  let questionsInUnit = 1;
                  if (title.includes('-')) {
                    const parts = title
                      .split('-')
                      .map(s => s.trim())
                      .filter(Boolean);
                    questionsInUnit = Math.max(1, parts.length);
                  }
                  totals[modNum] = (totals[modNum] || 0) + questionsInUnit;
                });
                moduleTotals = totals;
              }
            }
          } catch (e) {
            // Ignore fetch errors; fallback to existing totals in scores
          }
        }

        // Merge: keep correct from scores, replace total with moduleTotals when available
        const merged = {};
        const keys = new Set([
          ...Object.keys(scores || {}),
          ...Object.keys(moduleTotals || {}),
        ]);
        keys.forEach((k) => {
          const key = String(k);
          const scoreEntry = scores[key] || {};
          merged[key] = {
            correct: Number(scoreEntry.correct || 0),
            total: Number(moduleTotals[key] != null ? moduleTotals[key] : (scoreEntry.total || 0)),
          };
        });

        // Save results to localStorage for TestResultsPage
        localStorage.setItem('testResults', JSON.stringify({
          moduleScores: merged,
          testSessionId: testSessionId,
          completedAt: new Date().toISOString(),
          sequenceId: sequenceId
        }));
        
        // Clear module scores after saving
        clearModuleScores(sequenceId);
        
        // Mark test as completed to prevent going back
        if (typeof window !== 'undefined') {
          localStorage.setItem(`testCompleted_${sequenceId}`, 'true');
          // Clear all timer states for this sequence
          for (let i = 1; i <= 3; i++) {
            localStorage.removeItem(`testTimer_${sequenceId}_${i}`);
          }
        }
        
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
        
        // Navigate to results page (summary page) instead of intro page
        navigate('/test-series/results', { replace: true });
      } else {
        console.error('❌ Failed to get test summary:', data.error);
        alert('Failed to complete test: ' + data.error);
      }
    } catch (error) {
      console.error('❌ Error completing test:', error);
      alert('Error completing test: ' + error.message);
    }
  };

  const findFirstUnitOfModule = async (targetModule) => {
    if (!targetModule || !courseId || !sequenceId) {
      return null;
    }

    try {
      const response = await fetch(`${getLmsBaseUrl()}/api/course_home/v1/navigation/${courseId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const seq = data?.blocks?.[sequenceId];
        if (seq && Array.isArray(seq.children)) {
          for (const childId of seq.children) {
            const child = data.blocks[childId];
            const title = child?.display_name || '';
            const moduleMatch = title.match(/^(\d+)\./);
            const modNum = moduleMatch ? parseInt(moduleMatch[1], 10) : null;
            if (modNum === targetModule) {
              return childId;
            }
          }
        }
      }
    } catch (e) {
      console.error('❌ Error fetching navigation API for module lookup:', e);
    }
    return null;
  };

  const buildCourseNavLink = (targetUnitId) => {
    if (!targetUnitId) {
      return null;
    }
    if (pathname.startsWith('/preview')) {
      return `/preview/course/${courseId}/${sequenceId}/${targetUnitId}`;
    }
    return `/course/${courseId}/${sequenceId}/${targetUnitId}`;
  };

  const handleFinishModuleClick = async () => {
    console.log('🔄 [Finish Module Button] Clicked');

    const iframe = document.getElementById('unit-iframe');
    if (!iframe) {
      console.error('❌ [Finish Module] No iframe found');
      return;
    }

    const targetModule = currentModule ? currentModule + 1 : null;
    let navLink = pathname.startsWith('/preview') ? `/preview${nextLink}` : nextLink;

    if (targetModule) {
      const firstUnitOfNextModule = await findFirstUnitOfModule(targetModule);
      if (firstUnitOfNextModule) {
        navLink = buildCourseNavLink(firstUnitOfNextModule);
      } else if (nextModule && nextModule !== currentModule) {
        navLink = pathname.startsWith('/preview') ? `/preview${nextLink}` : nextLink;
      }
    }

    console.log('🔍 Current unit title:', unit?.title);
    console.log('🔍 Current module:', currentModule);
    console.log('🔍 Next module:', nextModule);
    console.log('🔍 Target module:', targetModule);
    console.log('🔍 Next link (final):', navLink);

    const messageHandler = (event) => {
      if (event.data && event.data.type === 'quiz.answers') {
        console.log('📨 [Finish Module] Received quiz answers, saving...');
        window.removeEventListener('message', messageHandler);

        const { answers } = event.data;
        const totalQuestions = Array.isArray(answers) ? answers.length : 1;
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
            score: totalQuestions > 0 ? (correctCount / totalQuestions) : 0
          }
        });

        const unitTitle = unit?.title || '';
        const actualQuestionCount = parseUnitTitleForQuestionCount(unitTitle);

        saveQuizResults(prepareRequestData())
          .then(ok => {
            if (ok) {
              console.log('✅ [Finish Module] Quiz results saved successfully');
              if (currentModule) {
                updateModuleScores(sequenceId, currentModule, correctCount, actualQuestionCount);
              }
            } else {
              console.error('❌ [Finish Module] Error saving quiz results');
            }
            navigateToModuleTransition(currentModule, targetModule, navLink);
          })
          .catch(error => {
            console.error('❌ [Finish Module] Error saving quiz results:', error);
            navigateToModuleTransition(currentModule, targetModule, navLink);
          });
      }
    };

    window.addEventListener('message', messageHandler);
    iframe.contentWindow.postMessage({
      type: 'quiz.get_answers'
    }, '*');
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

  // Helper function to navigate to module transition page
  const navigateToModuleTransition = (currentModuleNum, nextModuleNum, navLink) => {
    const transitionData = {
      currentModule: currentModuleNum,
      nextModule: nextModuleNum,
      nextLink: navLink
    };

    // Save transition state to localStorage
    if (typeof window !== 'undefined') {
      const transitionKey = `moduleTransition_${sequenceId}_${unitId}`;
      localStorage.setItem(transitionKey, JSON.stringify(transitionData));
      localStorage.setItem('moduleTransition_sequenceId', sequenceId);
      localStorage.setItem('moduleTransition_unitId', unitId);
      // Mark that we're in transition page to prevent back navigation
      localStorage.setItem(`moduleTransitionActive_${sequenceId}`, 'true');
      console.log('💾 Saved module transition state:', transitionKey);
    }

    // Navigate to transition page with replace to prevent back button
    navigate('/test-series/module-transition', { replace: true });
  };

  // Render into the persistent container
  return createPortal(
    <>
      <div className="test-navigation-bar d-flex align-items-center" style={{ 
        padding: '0.5rem',
        position: 'relative',
        width: '100%',
        background: '#ebebeb',
        borderTop: '1px solid #ddd',
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
        height: '50px',
        justifyContent: 'center',
        pointerEvents: 'auto'
      }}>

        {/* Center - Next button and Complete Test button */}
        <div className="d-flex align-items-center gap-3" style={{ justifyContent: 'center', flex: 1, flexWrap: 'wrap' }}>
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
              fontSize: '14px',
              minWidth: '120px',
              textDecoration: 'none'
            }}
          >
            🏁 Finish Test
          </button>
          <button
            onClick={handleFinishModuleClick}
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
                // Set flag to indicate Next button is handling this
                localStorage.setItem('nextButtonHandling', 'true');
                
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
                    const totalQuestions = Array.isArray(answers) ? answers.length : 1;
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
                        
                        // Check if already saved to prevent duplicate
                        const currentSession = testSessionId || localStorage.getItem('currentTestSessionId');
                        const saveKey = getUnitSaveKey(currentSession, unitId);
                        
                        if (wasUnitSaved(saveKey)) {
                          console.log('⚠️ [Next Button] Unit already saved, skipping duplicate save');
                          // Still show final summary
                          prepareFinalSummary();
                          return;
                        }
                        
                        // Save quiz results first
                        const prepareRequestData = () => ({
                          course_id: courseId,
                          section_id: sequenceId.split('block@')[1],
                          unit_id: unitId,
                          user_id: userId,
                          template_id: 67,
                          test_session_id: currentSession,
                          quiz_data: {
                            answers,
                            correctCount,
                            answeredCount,
                            totalQuestions,
                            score: correctCount / totalQuestions
                          }
                        });
                        
                        // Get actual number of questions from unit title (e.g., "1.1-1.2-1.3" = 3 questions)
                        const unitTitle = unit?.title || '';
                        const actualQuestionCount = parseUnitTitleForQuestionCount(unitTitle);
                        
                        // Save quiz results
                        saveQuizResults(prepareRequestData())
                        .then(ok => {
                          if (ok) {
                            markUnitSaved(saveKey); // Mark as saved to prevent duplicate
                            console.log('✅ Quiz results saved successfully');
                            // Update per-module scores and show final summary
                            updateModuleScores(sequenceId, currentModule, correctCount, actualQuestionCount);
                            prepareFinalSummary();
                          } else {
                            console.error('❌ Error saving quiz results');
                            prepareFinalSummary();
                          }
                        })
                        .catch(error => {
                          console.error('❌ Error saving quiz results:', error);
                          prepareFinalSummary();
                        });
                        return; // Don't navigate yet
                      }
                    }
                    
                    if (isModuleTransition) {
                      // Check if already saved to prevent duplicate
                      const currentSession = testSessionId || localStorage.getItem('currentTestSessionId');
                      const saveKey = getUnitSaveKey(currentSession, unitId);
                      
                      if (wasUnitSaved(saveKey)) {
                        console.log('⚠️ [Next Button] Unit already saved, skipping duplicate save');
                        // Still navigate to transition page
                        navigateToModuleTransition(currentModule, nextModule, navLink);
                        return;
                      }
                      
                      // Save quiz results first before navigating to transition page
                      const prepareRequestData = () => ({
                        course_id: courseId,
                        section_id: sequenceId.split('block@')[1],
                        unit_id: unitId,
                        user_id: userId,
                        template_id: 67,
                        test_session_id: currentSession,
                        quiz_data: {
                          answers,
                          correctCount,
                          answeredCount,
                          totalQuestions,
                          score: correctCount / totalQuestions
                        }
                      });
                      
                      // Get actual number of questions from unit title (e.g., "1.1-1.2-1.3" = 3 questions)
                      const unitTitle = unit?.title || '';
                      const actualQuestionCount = parseUnitTitleForQuestionCount(unitTitle);
                      
                      // Save quiz results
                      saveQuizResults(prepareRequestData())
                      .then(ok => {
                        if (ok) {
                          markUnitSaved(saveKey); // Mark as saved to prevent duplicate
                          console.log('✅ Quiz results saved successfully');
                          console.log('🔄 Module transition: Navigating to transition page');
                          updateModuleScores(sequenceId, currentModule, correctCount, actualQuestionCount);
                        } else {
                          console.error('❌ Error saving quiz results');
                        }
                        // Navigate to transition page regardless of save result
                        navigateToModuleTransition(currentModule, nextModule, navLink);
                      })
                      .catch(error => {
                        console.error('❌ Error saving quiz results:', error);
                        // Navigate to transition page even if save fails
                        navigateToModuleTransition(currentModule, nextModule, navLink);
                      });
                      return; // Don't navigate yet
                    }
                    
                    // Not a module transition, save and navigate normally
                    // Check if already saved to prevent duplicate
                    const currentSession = testSessionId || localStorage.getItem('currentTestSessionId');
                    const saveKey = getUnitSaveKey(currentSession, unitId);
                    
                    if (wasUnitSaved(saveKey)) {
                      console.log('⚠️ [Next Button] Unit already saved, skipping duplicate save');
                      // Still navigate
                      console.log('🔍 Navigating to:', navLink);
                      navigate(navLink);
                    } else {
                      const prepareRequestData = () => ({
                        course_id: courseId,
                        section_id: sequenceId.split('block@')[1],
                        unit_id: unitId,
                        user_id: userId,
                        template_id: 67,
                        test_session_id: currentSession,
                        quiz_data: {
                          answers,
                          correctCount,
                          answeredCount,
                          totalQuestions,
                          score: correctCount / totalQuestions
                        }
                      });
                      
                      // Get actual number of questions from unit title (e.g., "1.1-1.2-1.3" = 3 questions)
                      const unitTitle = unit?.title || '';
                      const actualQuestionCount = parseUnitTitleForQuestionCount(unitTitle);
                      
                      // Save quiz results
                      saveQuizResults(prepareRequestData())
                        .then(ok => {
                          if (ok) {
                            markUnitSaved(saveKey); // Mark as saved to prevent duplicate
                            console.log('✅ Quiz results saved successfully');
                            updateModuleScores(sequenceId, currentModule, correctCount, actualQuestionCount);
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
                    }
                };
                
                window.addEventListener('message', messageHandler);
                
                // Clear flag after a timeout (in case message never arrives)
                setTimeout(() => {
                  localStorage.removeItem('nextButtonHandling');
                }, 5000);
              } catch (error) {
                console.error('❌ [Next Button] Error:', error);
                localStorage.removeItem('nextButtonHandling');
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
