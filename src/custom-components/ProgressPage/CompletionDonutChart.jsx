import React from 'react';
import { getLocale, isRtl, useIntl } from '@edx/frontend-platform/i18n';
import { useModel } from '../../generic/model-store';
import { useContextId } from '../../data/hooks';
import messages from './messages';

const CompletionDonutChart = () => {
  const intl = useIntl();
  const courseId = useContextId();

  const {
    completionSummary: {
      completeCount,
      incompleteCount,
      lockedCount,
    },
  } = useModel('progress', courseId);

  const numTotalUnits = completeCount + incompleteCount + lockedCount;
  const completePercentage = completeCount ? Number(((completeCount / numTotalUnits) * 100).toFixed(0)) : 0;
  const lockedPercentage = lockedCount ? Number(((lockedCount / numTotalUnits) * 100).toFixed(0)) : 0;
  const incompletePercentage = 100 - completePercentage - lockedPercentage;

  const isLocaleRtl = isRtl(getLocale());

  return (
    <>
      <svg role="img" width="50%" height="100%" viewBox="0 0 42 42" className="donut" style={{ maxWidth: '178px' }} aria-hidden="true">
        <circle className="donut-hole" fill="#fff" cx="21" cy="21" r="15.91549430918954" />
        <g className="donut-chart-text">
          <text x="50%" y="50%" className="donut-chart-number">
            {completePercentage}{isLocaleRtl && '\u200f'}%
          </text>
          <text x="50%" y="50%" className="donut-chart-label">
            {intl.formatMessage(messages.complete)}
          </text>
        </g>

        {/* Incomplete segment */}
        {incompletePercentage > 0 && (
          <circle
            className="donut-segment incomplete-stroke"
            cx="21"
            cy="21"
            r="15.91549430918954"
            strokeDasharray={`${incompletePercentage} ${100 - incompletePercentage}`}
            strokeDashoffset="25"
          />
        )}

        {/* Locked segment */}
        {lockedPercentage > 0 && (
          <circle
            className="donut-segment locked-stroke"
            cx="21"
            cy="21"
            r="15.91549430918954"
            strokeDasharray={`${lockedPercentage} ${100 - lockedPercentage}`}
            strokeDashoffset={25 + incompletePercentage}
          />
        )}

        {/* Complete segment */}
        {completePercentage > 0 && (
          <circle
            className="donut-segment complete-stroke"
            cx="21"
            cy="21"
            r="15.91549430918954"
            strokeDasharray={`${completePercentage} ${100 - completePercentage}`}
            strokeDashoffset={25 + incompletePercentage + lockedPercentage}
          />
        )}
      </svg>
      <div className="sr-only">
        {intl.formatMessage(messages.completedUnits, { count: completeCount })}
        {intl.formatMessage(messages.incompleteUnits, { count: incompleteCount })}
        {lockedCount > 0 && intl.formatMessage(messages.lockedUnits, { count: lockedCount })}
      </div>
    </>
  );
};

export default CompletionDonutChart;
