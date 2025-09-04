import PropTypes from 'prop-types';
import { PluginSlot } from '@openedx/frontend-plugin-framework';

const SequenceContainerSlot = ({ courseId, unitId = null }) => (
  <PluginSlot
    id="sequence_container_slot"
    pluginProps={{
      courseId,
      unitId,
    }}
  />
);

SequenceContainerSlot.propTypes = {
  courseId: PropTypes.string.isRequired,
  unitId: PropTypes.string,
};


export default SequenceContainerSlot;
