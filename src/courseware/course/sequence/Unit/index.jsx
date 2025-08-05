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
import UnitSuspense from './UnitSuspense';
import { modelKeys, views } from './constants';
import { useExamAccess, useShouldDisplayHonorCode } from './hooks';
import { getIFrameUrl, fetchUnitById } from './urls';
import UnitTitleSlot from '../../../../plugin-slots/UnitTitleSlot';
import UnitTimer from './UnitTimer';

const Unit = ({
  courseId,
  format,
  onLoaded,
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
    console.log('Time has expired for unit:', id);
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
        console.error('Error fetching problem ID:', error);
      });
  }, [id]);

  return (
    <div className="unit">
      {/*  <UnitTitleSlot unitId={id} {...{ unit, isEnabledOutlineSidebar, renderUnitNavigation }} /> */}

      <UnitSuspense {...{ courseId, id }} />
      <ContentIFrame
        elementId="unit-iframe"
        id={id}
        iframeUrl={iframeUrl}
        loadingMessage={formatMessage(messages.loadingSequence)}
        onLoaded={onLoaded}
        shouldShowContent={!shouldDisplayHonorCode && !examAccess.blockAccess}
        title={unit.title}
        courseId={courseId}
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

Unit.defaultProps = {
  format: null,
  onLoaded: undefined,
};

export default Unit;
