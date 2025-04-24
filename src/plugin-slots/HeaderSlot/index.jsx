import PropTypes from 'prop-types';
import { PluginSlot } from '@openedx/frontend-plugin-framework';

import Header from '../../custom-components/Header/src/learning-header/LearningHeader';

const HeaderSlot = ({
  courseOrg, courseNumber, courseTitle, showUserDropdown, courseId,
}) => (
  <PluginSlot
    id="header_slot"
    slotOptions={{
      mergeProps: true,
    }}
    pluginProps={{
      courseOrg,
      courseNumber,
      courseTitle,
      showUserDropdown,
      courseId,
    }}
  >
    <Header
      courseOrg={courseOrg}
      courseNumber={courseNumber}
      courseTitle={courseTitle}
      showUserDropdown={showUserDropdown}
      courseId={courseId}
    />
  </PluginSlot>
);

HeaderSlot.propTypes = {
  courseOrg: PropTypes.string,
  courseNumber: PropTypes.string,
  courseTitle: PropTypes.string,
  showUserDropdown: PropTypes.bool,
  courseId: PropTypes.string,
};

HeaderSlot.defaultProps = {
  courseOrg: null,
  courseNumber: null,
  courseTitle: null,
  showUserDropdown: true,
  courseId: null,
};

export default HeaderSlot;
