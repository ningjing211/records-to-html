const express = require('express');
const path = require('path');
const app = express();
const port = 3005;

// 设置多个静态文件目录
app.use('/motor', express.static(path.join(__dirname, 'E-motor-Heptabase-Export-2025-04-01')));
app.use('/koko', express.static(path.join(__dirname, 'Heptabase-Export-2025-04-01-02')));
app.use('/photos', express.static(path.join(__dirname, 'Zora-Family')));

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log(`您可以在浏览器中访问：`);
  console.log(`- 电动摩托车申请：http://localhost:${port}/motor/114年公益青年電動機車申請.html`);
  console.log(`- Kokoshome熟能生巧：http://localhost:${port}/koko/Kokoshome熟能生巧.html`);
  console.log(`- 照片故事集：http://localhost:${port}/photos/photo-story.html`);
}); 