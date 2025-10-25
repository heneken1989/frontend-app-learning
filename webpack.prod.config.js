const path = require('path');
const { createConfig } = require('@openedx/frontend-build');
const CopyPlugin = require('copy-webpack-plugin');

const config = createConfig('webpack-prod');

// TỐI ƯU HÓA CODE SPLITTING CHO PRODUCTION - CHIA NHỎ APP.JS
config.optimization = {
  ...config.optimization,
  splitChunks: {
    chunks: 'all',
    maxInitialRequests: 30,
    maxAsyncRequests: 30,
    minSize: 20000,
    maxSize: 244000,
    cacheGroups: {
      // React core libraries - tách riêng
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
        name: 'react',
        chunks: 'all',
        priority: 30,
        reuseExistingChunk: true,
        enforce: true,
      },
      // Redux ecosystem - tách riêng
      redux: {
        test: /[\\/]node_modules[\\/](@reduxjs|redux|react-redux|reselect)[\\/]/,
        name: 'redux',
        chunks: 'all',
        priority: 25,
        reuseExistingChunk: true,
        enforce: true,
      },
      // Chart libraries - tách riêng
      charts: {
        test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2|recharts)[\\/]/,
        name: 'charts',
        chunks: 'all',
        priority: 25,
        reuseExistingChunk: true,
        enforce: true,
      },
      // FontAwesome icons - tách riêng
      fontawesome: {
        test: /[\\/]node_modules[\\/](@fortawesome)[\\/]/,
        name: 'fontawesome',
        chunks: 'all',
        priority: 25,
        reuseExistingChunk: true,
        enforce: true,
      },
      // Lodash utilities - tách riêng
      lodash: {
        test: /[\\/]node_modules[\\/](lodash)[\\/]/,
        name: 'lodash',
        chunks: 'all',
        priority: 25,
        reuseExistingChunk: true,
        enforce: true,
      },
      // EdX platform libraries - tách riêng
      edx: {
        test: /[\\/]node_modules[\\/](@edx|@openedx)[\\/]/,
        name: 'edx-platform',
        chunks: 'all',
        priority: 20,
        reuseExistingChunk: true,
        enforce: true,
      },
      // Other vendor libraries
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10,
        reuseExistingChunk: true,
        minChunks: 1,
      },
      // Common code được sử dụng nhiều lần
      common: {
        name: 'common',
        minChunks: 3,
        chunks: 'all',
        priority: 5,
        reuseExistingChunk: true,
        enforce: true,
      },
      // Default group cho code không match với group nào khác
      default: {
        minChunks: 2,
        priority: -20,
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
  moduleIds: 'deterministic',
  chunkIds: 'deterministic',
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

// TỐI ƯU HÓA THÊM CHO PRODUCTION
config.optimization.usedExports = true;
config.optimization.sideEffects = false;

// Tối ưu hóa module resolution
config.resolve.modules = [
  path.resolve(__dirname, 'src'),
  'node_modules'
];

// Tối ưu hóa output
config.output = {
  ...config.output,
  filename: '[name].[contenthash:8].js',
  chunkFilename: '[name].[contenthash:8].chunk.js',
  assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
  clean: true,
};

// Thêm plugin để tối ưu hóa bundle size
const TerserPlugin = require('terser-webpack-plugin');
config.optimization.minimizer = [
  new TerserPlugin({
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
      },
      mangle: {
        safari10: true,
      },
    },
    extractComments: false,
  }),
];


module.exports = config;
