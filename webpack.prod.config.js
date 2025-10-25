const path = require('path');
const { createConfig } = require('@openedx/frontend-build');
const CopyPlugin = require('copy-webpack-plugin');

const config = createConfig('webpack-prod');

// TẮT HOÀN TOÀN CODE SPLITTING CHO PRODUCTION
config.optimization = {
  ...config.optimization,
  splitChunks: false,
  runtimeChunk: false,
  usedExports: false,
  sideEffects: false,
  providedExports: false,
  concatenateModules: false,
};

// TẮT NEW RELIC PLUGINS ĐỂ TRÁNH LỖI 403
config.plugins = config.plugins.filter(plugin => {
  const pluginName = plugin.constructor.name;
  return !pluginName.includes('NewRelic') && !pluginName.includes('NewRelicSourceMap');
});

config.plugins.push(
  new CopyPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, './public/static'),
        to: path.resolve(__dirname, './dist/static'),
      },
    ],
  }),
);

config.resolve.alias = {
  ...config.resolve.alias,
  '@src': path.resolve(__dirname, 'src'),
};


module.exports = config;
