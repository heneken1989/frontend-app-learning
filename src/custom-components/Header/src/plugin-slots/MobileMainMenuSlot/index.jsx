import React from 'react';
import { PluginSlot } from '@openedx/frontend-plugin-framework';
import MobileHeaderMainMenu, { mobileHeaderMainMenuDataShape } from '../../mobile-header/MobileHeaderMainMenu';

const MobileMainMenuSlot = ({
  menu,
}) => (
  <PluginSlot
    id="mobile_main_menu_slot"
    slotOptions={{
      mergeProps: true,
    }}
  >
    <MobileHeaderMainMenu menu={menu} />
  </PluginSlot>
);

MobileMainMenuSlot.propTypes = {
  menu: mobileHeaderMainMenuDataShape,
};

export default MobileMainMenuSlot;
