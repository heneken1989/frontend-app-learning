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
      // Gộp TẤT CẢ vendor libraries thành 1 file lớn
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 20,
        enforce: true,
        minSize: 0,         // Bỏ qua minSize cho vendor
        maxSize: 0,         // Không giới hạn kích thước
      },
      // Gộp code chung thành 1 file
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all',
        priority: 10,
        reuseExistingChunk: true,
        enforce: true,
        minSize: 50000,     // Chỉ tách khi >= 50KB
      },
    },
  },
  runtimeChunk: "single",
};

module.exports = config;
