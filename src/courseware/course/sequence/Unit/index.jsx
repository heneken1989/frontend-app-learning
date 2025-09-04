import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';

import { AppContext } from '@edx/frontend-platform/react';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Button } from '@openedx/paragon';

import { useModel } from '@src/generic/model-store';
import { usePluginsCallback } from '@src/generic/plugin-store';

import messages from '../messages';
import ContentIFrame from './ContentIFrame';
import NoLoadingContentIFrame from './NoLoadingContentIFrame';
import UnitSuspense from './UnitSuspense';
import PageLoadMonitor from './PageLoadMonitor';
import GlobalErrorHandler from './GlobalErrorHandler';
import { modelKeys, views } from './constants';
import { useExamAccess, useShouldDisplayHonorCode } from './hooks';
import { getIFrameUrl, fetchUnitById } from './urls';
import UnitTitleSlot from '../../../../plugin-slots/UnitTitleSlot';
import UnitTimer from './UnitTimer';

const Unit = ({
  courseId,
  format = null,
  onLoaded = undefined,
  id,
  isOriginalUserStaff,
  isEnabledOutlineSidebar,
  renderUnitNavigation,
}) => {
  const { formatMessage } = useIntl();
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const { authenticatedUser } = React.useContext(AppContext);
  const [hasQuiz, setHasQuiz] = useState(false);

  const examAccess = useExamAccess({ id });
  const shouldDisplayHonorCode = useShouldDisplayHonorCode({ courseId, id });
  const unit = useModel(modelKeys.units, id);
  const view = authenticatedUser ? views.student : views.public;
  const shouldDisplayUnitPreview = pathname.startsWith('/preview') && isOriginalUserStaff;
  const getUrl = usePluginsCallback('getIFrameUrl', () => getIFrameUrl({
    id,
    view,
    format,
    examAccess,
    jumpToId: searchParams.get('jumpToId'),
    preview: shouldDisplayUnitPreview ? '1' : '0',
  }));
  const iframeUrl = getUrl();
  const handleTimeExpired = () => {
    // Logic to handle when the timer expires
    // You can add additional logic here, such as showing an alert or redirecting the user
  };
  const [time_limit, setTime_limit] = useState(null);

  useEffect(() => {
    fetchUnitById(id)
      .then((unitData) => {
        setTime_limit(unitData.time_limit);
        // Check if this unit contains a quiz
        if (unitData.html && unitData.html.includes('paragraph_quiz.html')) {
          setHasQuiz(true);
        }
      })
      .catch((error) => {
        // Error fetching unit data
      });
  }, [id]);

  return (
    <div className="unit">
      {/*  <UnitTitleSlot unitId={id} {...{ unit, isEnabledOutlineSidebar, renderUnitNavigation }} /> */}
      
      {/* Page Load Monitor for auto-reload on issues */}
      <PageLoadMonitor 
        courseId={courseId} 
        unitId={id} 
        maxLoadTime={30000}
        maxRetries={2}
      />
      
      {/* Global Error Handler for auto-reload on critical errors */}
      <GlobalErrorHandler 
        courseId={courseId} 
        unitId={id} 
        maxRetries={2}
      />

      <UnitSuspense {...{ courseId, id }} />
      <NoLoadingContentIFrame
        elementId="unit-iframe"
        id={id}
        iframeUrl={iframeUrl}
        loadingMessage={formatMessage(messages.loadingSequence)}
        onLoaded={onLoaded}
        shouldShowContent={!shouldDisplayHonorCode && !examAccess.blockAccess}
        title={unit.title}
        courseId={courseId}
        hasQuiz={hasQuiz}
        enableAutoReload={false}
      />
    </div>
  );
};

Unit.propTypes = {
  courseId: PropTypes.string.isRequired,
  format: PropTypes.string,
  id: PropTypes.string.isRequired,
  onLoaded: PropTypes.func,
  isOriginalUserStaff: PropTypes.bool.isRequired,
  isEnabledOutlineSidebar: PropTypes.bool.isRequired,
  renderUnitNavigation: PropTypes.func.isRequired,
};


export default Unit;
