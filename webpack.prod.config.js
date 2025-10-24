const path = require('path');
const { createConfig } = require('@openedx/frontend-build');
const CopyPlugin = require('copy-webpack-plugin');

const config = createConfig('webpack-prod');

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

// Code splitting configuration for production - Optimized for fewer chunks
config.optimization = {
  ...config.optimization,
  splitChunks: {
    chunks: "all",
    minSize: 100000,        // Tăng từ 20KB lên 100KB
    maxSize: 500000,        // Tăng từ 244KB lên 500KB
    maxAsyncRequests: 5,    // Giới hạn async chunks
    maxInitialRequests: 3,  // Giới hạn initial chunks
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10,
        enforce: true,      // Bắt buộc tạo vendor chunk
      },
      common: {
        name: 'common',
        minChunks: 3,       // Tăng từ 2 lên 3
        chunks: 'all',
        priority: 5,
        reuseExistingChunk: true,
        enforce: true,
      },
      // Gộp các thư viện React
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
        name: 'react-vendor',
        chunks: 'all',
        priority: 15,
        enforce: true,
      },
    },
  },
  runtimeChunk: "single",
};

module.exports = config;
