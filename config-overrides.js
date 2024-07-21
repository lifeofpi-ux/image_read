const webpack = require('webpack');

module.exports = function override(config, env) {
  // PDF.js worker 파일을 처리하기 위한 설정
  config.module.rules.push({
    test: /pdf\.worker\.(min\.)?js/,
    type: 'asset/resource',
    generator: {
      filename: 'static/js/[name][ext]'
    }
  });

  // ProvidePlugin 설정 추가
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
    })
  );

  return config;
};