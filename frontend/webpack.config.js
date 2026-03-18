const path = require('path');

module.exports = {
  // 入口文件
  entry: './src/index.js',

  // 输出配置
  output: {
    // 输出目录
    path: path.resolve(__dirname, 'dist/static'),
    // 输出文件名
    filename: 'bundle.js'
  },

  // 模块加载器配置
  module: {
    rules: [
      // 处理 CSS 文件
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      // 处理图片文件
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ['file-loader']
      }
    ]
  }
};
