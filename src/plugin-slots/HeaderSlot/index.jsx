import PropTypes from 'prop-types';
import { PluginSlot } from '@openedx/frontend-plugin-framework';

import Header from '../../custom-components/Header/src/learning-header/LearningHeader';

const HeaderSlot = ({
  courseOrg = null, 
  courseNumber = null, 
  courseTitle = null, 
  showUserDropdown = true, 
  courseId = null, 
  unitId,
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
      unitId,
    }}
  >
    <Header
      courseOrg={courseOrg}
      courseNumber={courseNumber}
      courseTitle={courseTitle}
      showUserDropdown={showUserDropdown}
      courseId={courseId}
      unitId={unitId}
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


export default HeaderSlot;
