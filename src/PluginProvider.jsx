import React from 'react';
import PropTypes from 'prop-types';

const PluginProvider = ({ children }) => {
  return <>{children}</>;
};

PluginProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PluginProvider; 