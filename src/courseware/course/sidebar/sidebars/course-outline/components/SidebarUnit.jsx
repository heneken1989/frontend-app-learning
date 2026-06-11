import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';

import messages from '../messages';
import { UNIT_ICON_TYPES } from './UnitIcon';
import UnitLinkWrapper from './UnitLinkWrapper';

function findScrollParent(element) {
  let node = element?.parentElement;
  while (node) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function getLmsBaseUrl() {
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('local.openedx.io')) {
    return 'http://local.openedx.io:8000';
  }
  return 'https://lms.nihongodrill.com';
}

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

  const unitRef = useRef(null);
  const fetchingRef = useRef(false);
  const [isCompleted, setIsCompleted] = useState(complete);
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const isQuizUnit = icon === UNIT_ICON_TYPES.problem || title.toLowerCase().includes('quiz');

  const checkCompletionStatus = useCallback(async () => {
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    setIsChecking(true);
    try {
      const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value
        || document.querySelector('meta[name=csrf-token]')?.getAttribute('content')
        || '';

      const apiUrl = `${getLmsBaseUrl()}/courseware/check_block_completion/`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
          Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify({ block_key: id }),
      });

      if (response.ok) {
        const data = await response.json();
        const completed = data.is_completed === true || data.completion > 0;
        setIsCompleted(completed);
      } else {
        setIsCompleted(complete);
      }
    } catch {
      setIsCompleted(complete);
    } finally {
      fetchingRef.current = false;
      setIsChecking(false);
      setHasChecked(true);
    }
  }, [complete, id]);

  // Active unit: fetch immediately on every visit.
  useEffect(() => {
    if (!isQuizUnit || !isActive) {
      return undefined;
    }
    checkCompletionStatus();
    return undefined;
  }, [checkCompletionStatus, isActive, isQuizUnit]);

  // Visible (non-active) units: fetch only when scrolled into the sidebar viewport.
  useEffect(() => {
    if (!isQuizUnit || isActive || hasChecked) {
      return undefined;
    }

    const element = unitRef.current;
    if (!element) {
      return undefined;
    }

    const scrollRoot = findScrollParent(element);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          checkCompletionStatus();
          observer.disconnect();
        }
      },
      {
        root: scrollRoot,
        threshold: 0.01,
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [checkCompletionStatus, hasChecked, isActive, isQuizUnit]);

  const iconType = isLocked ? UNIT_ICON_TYPES.lock : icon;
  const displayCompleted = isQuizUnit ? isCompleted : complete;
  const isQuizCompleted = isQuizUnit && displayCompleted;

  const currentQuizStyle = isActive && isQuizUnit ? {
    backgroundColor: '#F5F5DC',
    color: '#333',
  } : {};

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
      ref={unitRef}
      data-unit-id={id}
      className={classNames({
        'bg-info-100': isActive,
        'border-top border-light': !isFirst,
        'quiz-completed': isQuizCompleted,
        'quiz-incomplete': isQuizUnit && !isQuizCompleted,
        'current-quiz': isActive && isQuizUnit,
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
          })}
          >
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
