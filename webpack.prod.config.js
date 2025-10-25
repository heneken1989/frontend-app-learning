const path = require('path');
const { createConfig } = require('@openedx/frontend-build');
const CopyPlugin = require('copy-webpack-plugin');

const config = createConfig('webpack-prod');

// BẬT CODE SPLITTING CHO PRODUCTION ĐỂ GIẢM BUNDLE SIZE
config.optimization = {
  ...config.optimization,
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10,
      },
      charts: {
        test: /[\\/]node_modules[\\/](recharts|chart\.js|react-chartjs-2)[\\/]/,
        name: 'charts',
        chunks: 'all',
        priority: 20,
      },
      paragon: {
        test: /[\\/]node_modules[\\/]@openedx[\\/]paragon[\\/]/,
        name: 'paragon',
        chunks: 'all',
        priority: 15,
      },
      frontendPlatform: {
        test: /[\\/]node_modules[\\/]@edx[\\/]frontend-platform[\\/]/,
        name: 'frontend-platform',
        chunks: 'all',
        priority: 15,
      },
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all',
        priority: 5,
        reuseExistingChunk: true,
      },
    },
  },
  runtimeChunk: {
    name: 'runtime',
  },
  usedExports: true,
  sideEffects: false,
  providedExports: true,
  concatenateModules: true,
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

// Thêm cấu hình tối ưu hóa cho production
config.performance = {
  hints: 'warning',
  maxEntrypointSize: 512000, // 500KB
  maxAssetSize: 512000, // 500KB
};

// Thêm cấu hình output để tối ưu caching
config.output = {
  ...config.output,
  filename: '[name].[contenthash].js',
  chunkFilename: '[name].[contenthash].chunk.js',
  clean: true,
};

// Thêm cấu hình tối ưu hóa module resolution
config.resolve = {
  ...config.resolve,
  modules: ['node_modules'],
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  alias: {
    ...config.resolve.alias,
    '@src': path.resolve(__dirname, 'src'),
  },
};

module.exports = config;
