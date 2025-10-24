const path = require('path');
const { createConfig } = require('@openedx/frontend-build');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config = createConfig('webpack-dev');

// GHI ĐÈ splitChunks config từ @openedx/frontend-build
config.optimization.splitChunks = {
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
};

config.resolve.alias = {
  ...config.resolve.alias,
  '@src': path.resolve(__dirname, 'src'),
};

config.devServer = {
  historyApiFallback: true,
  hot: true,
  allowedHosts: 'all',
  host: '0.0.0.0',
  port: 2000,
  static: {
    directory: path.join(__dirname, 'public'),
  },
  client: {
    webSocketURL: 'auto://0.0.0.0:0/ws',
  },
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
};

config.output = {
  path: path.resolve(__dirname, 'dist'),
  publicPath: '/',
  filename: '[name].js',
  chunkFilename: '[name].[contenthash].chunk.js',
};


config.plugins = config.plugins.filter(plugin => !(plugin instanceof HtmlWebpackPlugin));

config.plugins.push(
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, 'public/index.html'),
    filename: 'index.html',
    inject: true,
  }),
);

config.plugins.push(
  new CopyWebpackPlugin({
    patterns: [
      {
        from: 'public',
        to: '',
        globOptions: {
          ignore: ['**/index.html'],
        },
      },
    ],
  }),
);

module.exports = config;
