const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3005;

// 设置多个静态文件目录
app.use('/motor', express.static(path.join(__dirname, 'E-motor-Heptabase-Export-2025-04-01')));
app.use('/koko', express.static(path.join(__dirname, 'Heptabase-Export-2025-04-01-02')));
app.use('/photos', express.static(path.join(__dirname, 'Zora-Family')));
app.use('/bobee', express.static(path.join(__dirname, 'Bobee-family')));

// 添加根路由
app.get('/', (req, res) => {
  res.send('服务器正在运行。可用路径：<br>/motor<br>/koko<br>/photos<br>/bobee');
});

// 添加调试路由
app.get('/debug', (req, res) => {
  const bobeeDir = path.join(__dirname, 'Bobee-family');
  const files = fs.readdirSync(bobeeDir);
  res.json({
    workingDirectory: __dirname,
    bobeeDirectory: bobeeDir,
    files: files
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('服务器出错了！');
});

// 404处理
app.use((req, res) => {
  console.log('404 错误：', req.url);
  res.status(404).send('找不到页面');
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log(`您可以在浏览器中访问：`);
  console.log(`- 电动摩托车申请：http://localhost:${port}/motor/114年公益青年電動機車申請.html`);
  console.log(`- Kokoshome熟能生巧：http://localhost:${port}/koko/Kokoshome熟能生巧.html`);
  console.log(`- 照片故事集：http://localhost:${port}/photos/photo-story.html`);
  console.log(`- Bobee故事集：http://localhost:${port}/bobee/photo-story.html`);
  console.log(`- 调试信息：http://localhost:${port}/debug`);
}); 