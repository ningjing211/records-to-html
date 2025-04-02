// 引入模組
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// 設定輸入和輸出檔案路徑
const inputPath = path.join(__dirname, 'Heptabase-Export-2025-04-01-02', 'Kokoshome熟能生巧.md');
const outputPath = path.join(__dirname, 'Heptabase-Export-2025-04-01-02', 'Kokoshome熟能生巧.html');

// 檢查輸入檔案是否存在
if (!fs.existsSync(inputPath)) {
  console.error('找不到輸入檔案：', inputPath);
  process.exit(1);
}

// 讀取 Markdown 檔案
fs.readFile(inputPath, 'utf8', (err, data) => {
  if (err) {
    console.error('讀取檔案時出錯：', err);
    process.exit(1);
  }

  // 將 Markdown 轉換成 HTML
  const htmlContent = marked(data);

  // 包裹成一個簡單 HTML 結構
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <title>Kokoshome熟能生巧</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        img {
          max-width: 100%;
          height: auto;
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;

  // 寫入 HTML 檔案
  fs.writeFile(outputPath, fullHtml, (err) => {
    if (err) {
      console.error('寫入檔案時出錯：', err);
      process.exit(1);
    }
    console.log(`已成功將 Markdown 轉換成 HTML：${outputPath}`);
  });
});
