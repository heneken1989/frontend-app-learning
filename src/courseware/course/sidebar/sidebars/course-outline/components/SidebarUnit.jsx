import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';

import messages from '../messages';
import UnitIcon, { UNIT_ICON_TYPES } from './UnitIcon';
import UnitLinkWrapper from './UnitLinkWrapper';

const SidebarUnit = ({
  id,
  intl,
  courseId,
  sequenceId,
  isFirst,
  unit,
  isActive,
  isLocked,
  activeUnitId,
}) => {
  const {
    complete,
    title,
    icon = UNIT_ICON_TYPES.other,
  } = unit;

  // State để track completion status từ API
  const [isCompleted, setIsCompleted] = useState(complete);
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Check if this is a quiz/problem unit
  const isQuizUnit = icon === UNIT_ICON_TYPES.problem || title.toLowerCase().includes('quiz');

  // Check completion status using our custom API (only once)
  useEffect(() => {
    if (isQuizUnit && !isChecking && !hasChecked) {
      const checkCompletionStatus = async () => {
        setIsChecking(true);
        try {
          console.log(`🔍 Checking completion for quiz: ${title}`, { id, idType: typeof id });
          
          // Get CSRF token
          const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                           document.querySelector('meta[name=csrf-token]')?.getAttribute('content') ||
                           'rN400a1rY6H0c7Ex86YaiA9ibJbFmEDf';
          
          // Dynamic LMS backend URL for different environments (same logic as LearningHeader)
          let lmsBaseUrl;
          if (window.location.hostname === 'localhost' || window.location.hostname.includes('local.openedx.io')) {
            // Development - LMS runs on port 8000
            lmsBaseUrl = 'http://local.openedx.io:8000';
          } else {
            // Production - LMS runs on subdomain lms.nihongodrill.com
            lmsBaseUrl = 'https://lms.nihongodrill.com';
          }
          const apiUrl = `${lmsBaseUrl}/courseware/check_block_completion/`;
          console.log(`🔗 Environment: ${window.location.hostname.includes('local') ? 'Development' : 'Production'}`);
          console.log(`🔗 LMS Base URL: ${lmsBaseUrl}`);
          console.log(`🔗 API URL: ${apiUrl}`);
          console.log(`🔗 Frontend origin: ${window.location.origin}`);
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken,
              'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
              'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include',
            body: JSON.stringify({
              'block_key': id
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`📊 Completion status for ${title}:`, data);
            
            // 0 = chưa hoàn thành, 1 = hoàn thành
            const completed = data.is_completed === true || data.completion > 0;
            console.log(`🔍 Completion logic: is_completed=${data.is_completed}, completion=${data.completion}, result=${completed}`);
            setIsCompleted(completed);
            
            if (completed !== complete) {
              console.log(`🔄 Status changed for ${title}: ${complete} -> ${completed}`);
            }
          } else {
            console.log(`❌ Failed to check completion for ${title}:`, response.status, response.statusText);
            // Fallback to original complete status if API fails
            setIsCompleted(complete);
          }
        } catch (error) {
          console.log(`❌ Error checking completion for ${title}:`, error);
        } finally {
          setIsChecking(false);
          setHasChecked(true);
        }
      };
      
      checkCompletionStatus();
    }
  }, [isQuizUnit, id, title]); // Removed complete and isChecking from dependencies

  const iconType = isLocked ? UNIT_ICON_TYPES.lock : icon;

  // Determine completion status for display
  const displayCompleted = isQuizUnit ? isCompleted : complete;
  const isQuizCompleted = isQuizUnit && displayCompleted;

  // Debug logging
  console.log(`🔍 SidebarUnit Debug:`, {
    title,
    id,
    isActive,
    isQuizUnit,
    isQuizCompleted,
    displayCompleted,
    complete,
    isCompleted
  });

  // Inline style for current quiz
  const currentQuizStyle = isActive && isQuizUnit ? {
    backgroundColor: '#F5F5DC',
    color: '#333'
  } : {};

  // Force style with useEffect
  useEffect(() => {
    if (isActive && isQuizUnit) {
      const element = document.querySelector(`li[data-unit-id="${id}"]`);
      if (element) {
        element.style.setProperty('background-color', '#F5F5DC', 'important');
        element.style.setProperty('color', '#333', 'important');
      }
    }
  }, [isActive, isQuizUnit, id]);

  return (
    <li 
      data-unit-id={id}
      className={classNames({
        'bg-info-100': isActive, 
        'border-top border-light': !isFirst,
        'quiz-completed': isQuizCompleted,
        'quiz-incomplete': isQuizUnit && !isQuizCompleted,
        'current-quiz': isActive && isQuizUnit, // Add current-quiz class for active quiz
      })}
      style={currentQuizStyle}
    >
      <UnitLinkWrapper
        {...{
          sequenceId,
          activeUnitId,
          id,
          courseId,
        }}
      >
        <div className="col-12 p-0">
          <span className={classNames('unit-title', {
            'quiz-title-completed': isQuizCompleted,
            'quiz-title-incomplete': isQuizUnit && !isQuizCompleted,
          })}>
            {title}
            {isQuizUnit && isQuizCompleted && (
              <span className="completion-indicator ml-2">
                ✅
              </span>
            )}
            {isChecking && (
              <span className="ml-2 text-muted">🔄</span>
            )}
          </span>
          <span className="sr-only">
            , {intl.formatMessage(displayCompleted ? messages.completedUnit : messages.incompleteUnit)}
          </span>
        </div>
      </UnitLinkWrapper>
    </li>
  );
};

SidebarUnit.propTypes = {
  intl: intlShape.isRequired,
  id: PropTypes.string.isRequired,
  isFirst: PropTypes.bool.isRequired,
  unit: PropTypes.shape({
    complete: PropTypes.bool,
    icon: PropTypes.string,
    id: PropTypes.string,
    title: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  isLocked: PropTypes.bool.isRequired,
  courseId: PropTypes.string.isRequired,
  sequenceId: PropTypes.string.isRequired,
  activeUnitId: PropTypes.string.isRequired,
};

export default injectIntl(SidebarUnit);
