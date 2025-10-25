const path = require('path');
const { createConfig } = require('@openedx/frontend-build');
const CopyPlugin = require('copy-webpack-plugin');

const config = createConfig('webpack-prod');

// TỐI ƯU HÓA CODE SPLITTING CHO PRODUCTION - CHIA NHỎ APP.JS
config.optimization = {
  ...config.optimization,
  splitChunks: {
    chunks: 'all',
    maxInitialRequests: 8, // Giảm từ 30 xuống 8 để ít HTTP requests hơn
    maxAsyncRequests: 15,  // Giảm từ 30 xuống 15
    minSize: 50000,       // Tăng từ 20KB lên 50KB
    maxSize: 500000,       // Tăng từ 244KB lên 500KB
    cacheGroups: {
      // React + Redux - gộp lại để giảm requests
      reactRedux: {
        test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|@reduxjs|redux|react-redux|reselect)[\\/]/,
        name: 'react-redux',
        chunks: 'all',
        priority: 30,
        reuseExistingChunk: true,
        enforce: true,
      },
      // Chart libraries - chỉ tách khi cần thiết
      charts: {
        test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2|recharts)[\\/]/,
        name: 'charts',
        chunks: 'async', // Chỉ load khi cần
        priority: 25,
        reuseExistingChunk: true,
        enforce: true,
      },
      // FontAwesome + Lodash - gộp lại
      utilities: {
        test: /[\\/]node_modules[\\/](@fortawesome|lodash)[\\/]/,
        name: 'utilities',
        chunks: 'all',
        priority: 25,
        reuseExistingChunk: true,
        enforce: true,
      },
      // EdX platform libraries - gộp tất cả
      edx: {
        test: /[\\/]node_modules[\\/](@edx|@openedx)[\\/]/,
        name: 'edx-platform',
        chunks: 'all',
        priority: 20,
        reuseExistingChunk: true,
        enforce: true,
      },
      // Other vendor libraries - gộp tất cả còn lại
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10,
        reuseExistingChunk: true,
        minChunks: 1,
      },
      // Default group - tăng minChunks để giảm chunks
      default: {
        minChunks: 3,
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

// Tối ưu hóa output - giảm hash length để ngắn hơn
config.output = {
  ...config.output,
  filename: '[name].[contenthash:6].js',
  chunkFilename: '[name].[contenthash:6].chunk.js',
  assetModuleFilename: 'assets/[name].[contenthash:6][ext]',
  clean: true,
};

// Thêm tối ưu hóa cho performance
config.performance = {
  hints: 'warning',
  maxEntrypointSize: 1000000, // 1MB
  maxAssetSize: 1000000, // 1MB
};

// Tối ưu hóa resolve
config.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx'];
config.resolve.symlinks = false;

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
