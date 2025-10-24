const { merge } = require('webpack-merge');
const devConfig = require('./webpack.dev.config');

// Tutor-specific overrides
const tutorConfig = {
  output: {
    publicPath: '/',
    chunkFilename: '[name].[contenthash].chunk.js',
  },
  devServer: {
    host: '0.0.0.0',
    port: 2000,
    allowedHosts: 'all',
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  // TẮT HOÀN TOÀN CODE SPLITTING
  optimization: {
    splitChunks: false,
  },
};

module.exports = merge(devConfig, tutorConfig);
