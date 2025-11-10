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
  const [showFinalSummary, setShowFinalSummary] = useState(false);
  const [finalSummaryData, setFinalSummaryData] = useState(null);
  
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

      setFinalSummaryData(merged);
      setShowFinalSummary(true);
      // Pause timer if summary is shown
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('transitionPageActive'));
      }
    } catch (e) {
      const scores = readModuleScores(sequenceId) || {};
      setFinalSummaryData(scores);
      setShowFinalSummary(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('transitionPageActive'));
      }
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
          // No next unit -> test finished: show the same Final Summary template as Finish button
          console.log('🏁 [Timer Expired] No next unit, showing unified final summary');

          // Ensure latest module scores include the last answered unit
          const parseModuleNumber = (title) => {
            if (!title) return null;
            const match = title.match(/^(\d+)\./);
            return match ? parseInt(match[1], 10) : null;
          };
          const currentModuleNum = parseModuleNumber(unit?.title);
          try {
            // Try to fetch answers from iframe to update module scores one last time
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
                // Deduplicate module aggregation per session+unit
                const currentSession = testSessionId || localStorage.getItem('currentTestSessionId');
                const aggKey = getModuleAggKey(currentSession, unitId);
                if (!wasModuleAggregated(aggKey)) {
                  if (currentModuleNum) updateModuleScores(sequenceId, currentModuleNum, correctCount, answeredCount);
                  markModuleAggregated(aggKey);
                }
                prepareFinalSummary();
              }).catch(() => {
                prepareFinalSummary();
              });
            } else {
              prepareFinalSummary();
            }
          } catch (e) {
            prepareFinalSummary();
          }
        }
      }
    };
    
    window.addEventListener('moduleTestExpired', handleModuleExpired);
    
    return () => {
      window.removeEventListener('moduleTestExpired', handleModuleExpired);
    };
  }, [sequenceId, unitId, actualNextUnit, unit, nextLink, pathname, navigate]);
  
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
  if (showFinalSummary && finalSummaryData) {
    return createPortal(
      <div
        className="module-transition-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#ffffff',
          zIndex: 200000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '64px',
        }}
      >
        <div className="module-transition-card" style={{ width: 'min(880px, 92%)', background: '#fff', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '16px 20px' }}>
          <h3 style={{ marginBottom: '1rem' }}>🏁 Test Finished</h3>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Results by Module</div>
            {Object.keys(finalSummaryData).sort((a,b)=>Number(a)-Number(b)).map(mod => (
              <div key={mod} className="d-flex justify-content-between" style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>
                <span>Module {mod}</span>
                <span>{finalSummaryData[mod].correct}/{finalSummaryData[mod].total} correct</span>
              </div>
            ))}
          </div>
          <div className="d-flex gap-2 justify-content-end">
            <button
              onClick={async () => {
                try {
                  // Try to request answers from iframe to save final result with status=completed
                  const iframe = document.getElementById('unit-iframe');
                  let answers = [];
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
                    answers = await answersPromise;
                  }

                  const totalQuestions = Array.isArray(answers) ? answers.length : 1;
                  const correctCount = Array.isArray(answers) ? answers.filter(a => a.isCorrect).length : 0;
                  const answeredCount = Array.isArray(answers) ? answers.length : 0;

                  const sectionIdToSave = sequenceId ? sequenceId.split('block@')[1] : null;
                  const currentTestSessionId = testSessionId || localStorage.getItem('currentTestSessionId');
                  if (sectionIdToSave && currentTestSessionId) {
                    const requestData = {
                      section_id: sectionIdToSave,
                      unit_id: unitId,
                      course_id: courseId,
                      user_id: getUserInfo().userId,
                      template_id: 67,
                      test_session_id: currentTestSessionId,
                      status: 'completed',
                      quiz_data: {
                        answers,
                        correctCount,
                        answeredCount,
                        totalQuestions,
                        score: totalQuestions > 0 ? (correctCount / totalQuestions) : 0,
                      },
                    };
                    await saveQuizResults(requestData).catch(() => {});
                  }
                } catch (e) {
                  // ignore and proceed to navigate
                }

                clearModuleScores(sequenceId);
                navigate('/learning');
              }}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                minWidth: '140px'
              }}
            >
              ⬅️ Back to Home
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }
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
              
              // Save quiz results (use number of dropdowns as questions)
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
                  score: correctCount / totalQuestions
                }
              });
              
              await saveQuizResults(prepareRequestData());
              
              console.log('✅ [Transition] Quiz results saved successfully');
              // Update per-module scores for the module just finished
              const moduleNumForScores = parseModuleNumber(unit?.title);
              updateModuleScores(sequenceId, moduleNumForScores, correctCount, answeredCount);
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
                
                // Request answers and show final summary
                const iframe = document.getElementById('unit-iframe');
                if (iframe && iframe.contentWindow) {
                  const answersPromise = new Promise((resolve) => {
                    const messageHandler = (event) => {
                      if (event.data && event.data.type === 'quiz.answers') {
                        window.removeEventListener('message', messageHandler);
                        resolve(event.data.answers);
                      }
                    };
                    window.addEventListener('message', messageHandler);
                    iframe.contentWindow.postMessage({ type: 'quiz.get_answers' }, '*');
                  });
                  answersPromise.then((answers) => {
                    const correctCount = (answers || []).filter(a => a.isCorrect).length;
                    const answeredCount = (answers || []).length;
                    updateModuleScores(sequenceId, currentModule, correctCount, answeredCount);
                    prepareFinalSummary();
                  }).catch(() => {
                    prepareFinalSummary();
                  });
                } else {
                  prepareFinalSummary();
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
                            // Update per-module scores and show final summary
                            updateModuleScores(sequenceId, currentModule, correctCount, answeredCount);
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
                      saveQuizResults(prepareRequestData())
                      .then(ok => {
                        if (ok) {
                          console.log('✅ Quiz results saved successfully');
                          console.log('🔄 Module transition: Showing transition page');
                          updateModuleScores(sequenceId, currentModule, correctCount, answeredCount);
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
                    saveQuizResults(prepareRequestData())
                      .then(ok => {
                      if (ok) {
                        console.log('✅ Quiz results saved successfully');
                          updateModuleScores(sequenceId, currentModule, correctCount, answeredCount);
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
