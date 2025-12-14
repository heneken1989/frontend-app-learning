const path = require('path');
const { createConfig } = require('@openedx/frontend-build');
const CopyPlugin = require('copy-webpack-plugin');

const config = createConfig('webpack-prod');

// TỐI ƯU HÓA CODE SPLITTING CHO PRODUCTION - GIẢM SỐ LƯỢNG CHUNKS
// Tùy chọn: Tắt hoàn toàn code splitting để chỉ có 1 file
const DISABLE_CODE_SPLITTING = process.env.DISABLE_CODE_SPLITTING === 'true';

if (DISABLE_CODE_SPLITTING) {
  // Tắt hoàn toàn code splitting - chỉ có 1 file app.js
  config.optimization = {
    ...config.optimization,
    splitChunks: false,
    runtimeChunk: false,
    usedExports: true,
    sideEffects: false,
    providedExports: true,
    concatenateModules: true,
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
  };
} else {
  // Code splitting với ít chunks nhất có thể - TỐI ƯU HÓA THÊM
  config.optimization = {
    ...config.optimization,
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 2, // Chỉ 2 chunks ban đầu: vendors, app
      maxAsyncRequests: 3,   // Chỉ 3 chunks async
      minSize: 500000,      // Tăng lên 500KB để chunks lớn hơn
      maxSize: 3000000,      // Tăng lên 3MB để ít chunks hơn
      cacheGroups: {
        // Tất cả vendor libraries - gộp thành 1 chunk duy nhất
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true,
        },
        // Default group - tăng minChunks để giảm chunks
        default: {
          minChunks: 20, // Tăng lên 20 để ít chunks hơn
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
    runtimeChunk: false, // Tắt runtime chunk để ít file hơn
    usedExports: true,
    sideEffects: false,
    providedExports: true,
    concatenateModules: true,
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
  };
}

config.plugins.push(
  new CopyPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, './public/static'),
        to: path.resolve(__dirname, './dist/static'),
      },
      {
        from: path.resolve(__dirname, './public/assets'),
        to: path.resolve(__dirname, './dist/assets'),
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

// Thêm tối ưu hóa cho performance - tăng giới hạn để ít chunks hơn
config.performance = {
  hints: 'warning',
  maxEntrypointSize: 2000000, // 2MB - tăng để cho phép chunks lớn hơn
  maxAssetSize: 2000000, // 2MB - tăng để cho phép chunks lớn hơn
};

// Tối ưu hóa resolve
config.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx'];
config.resolve.symlinks = false;

// Thêm plugin để tối ưu hóa bundle size
const TerserPlugin = require('terser-webpack-plugin');
// Cho phép giữ lại console.warn và console.error cho debugging
// Có thể bật ENABLE_CONSOLE_LOG=true để giữ tất cả console.log
const ENABLE_CONSOLE_LOG = process.env.ENABLE_CONSOLE_LOG === 'true';
config.optimization.minimizer = [
  new TerserPlugin({
    terserOptions: {
      compress: {
        // Chỉ drop console.log, console.info, console.debug nếu không bật ENABLE_CONSOLE_LOG
        // Giữ lại console.warn và console.error cho debugging
        drop_console: false, // Không drop tất cả console
        drop_debugger: true,
        // Chỉ loại bỏ console.log, console.info, console.debug nếu không bật flag
        pure_funcs: ENABLE_CONSOLE_LOG 
          ? [] // Giữ tất cả console nếu bật flag
          : ['console.log', 'console.info', 'console.debug'], // Chỉ loại bỏ log/info/debug, giữ warn/error
        // TỐI ƯU HÓA THÊM: Loại bỏ code không sử dụng
        unused: true,
        dead_code: true,
        // Tối ưu hóa loops và conditions
        loops: true,
        conditionals: true,
        evaluate: true,
        // Loại bỏ các biến không sử dụng
        keep_fargs: false,
        keep_fnames: false,
      },
      mangle: {
        safari10: true,
        // Tối ưu hóa tên biến
        keep_fnames: false,
        toplevel: true,
      },
      // Tối ưu hóa output
      format: {
        comments: false,
        ascii_only: true,
      },
    },
    extractComments: false,
    parallel: true, // Sử dụng multiple cores
  }),
];

// TỐI ƯU HÓA THÊM: Module concatenation
config.optimization.concatenateModules = true;

// TỐI ƯU HÓA THÊM: Scope hoisting
config.optimization.providedExports = true;
config.optimization.usedExports = true;
config.optimization.sideEffects = false;

// TỐI ƯU HÓA THÊM: Tree shaking cho CSS
config.optimization.splitChunks.cacheGroups.styles = {
  name: 'styles',
  test: /\.(css|scss|sass)$/,
  chunks: 'all',
  enforce: true,
  priority: 20,
};

// Add webp support
if (!config.module) {
  config.module = { rules: [] };
}
if (!config.module.rules) {
  config.module.rules = [];
}
config.module.rules.push({
  test: /\.webp$/i,
  type: 'asset/resource',
  generator: {
    filename: 'assets/[name].[hash:6][ext]',
  },
});

module.exports = config;
