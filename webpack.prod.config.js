const path = require('path');
const { createConfig } = require('@openedx/frontend-build');
const CopyPlugin = require('copy-webpack-plugin');

const config = createConfig('webpack-prod');

// TẮT HOÀN TOÀN CODE SPLITTING - Gộp tất cả thành 1 file
config.optimization.splitChunks = {
  chunks: 'all',
  cacheGroups: {
    // Gộp TẤT CẢ thành 1 file duy nhất
    default: {
      name: 'bundle',
      chunks: 'all',
      priority: 1,
      enforce: true,
      minSize: 0,
      maxSize: 0,
    },
  },
};

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
