// 引入模組
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const exifr = require('exifr');
const sharp = require('sharp');
const { Anthropic } = require('@anthropic-ai/sdk');

// 初始化 Claude API 客戶端
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 從命令行獲取文件夾名稱
const folderName = process.argv[2] || 'Zora-Family';

// 設定檔案路徑
const inputDir = path.join(__dirname, folderName);
const markdownPath = path.join(inputDir, 'photo-story.md');
const htmlPath = path.join(inputDir, 'photo-story.html');
const descriptionsPath = path.join(inputDir, 'photo_descriptions.json');

// 讀取照片描述
function loadPhotoDescriptions() {
  try {
    const data = fs.readFileSync(descriptionsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('讀取照片描述檔案時出錯:', error);
    return [];
  }
}

// 讀取照片的 EXIF 數據
async function getPhotoInfo(filepath) {
  try {
    const metadata = await sharp(filepath).metadata();
    const exif = await exifr.parse(filepath, {
      pick: [
        'Make', 'Model', 'LensModel',
        'FocalLength', 'FNumber', 'ExposureTime',
        'ISO', 'ExposureCompensation',
        'DateTimeOriginal'
      ]
    });

    const info = {
      width: metadata.width,
      height: metadata.height,
      date: '未知日期',
      camera: '未知相機',
      lens: '未知鏡頭',
      focalLength: '',
      aperture: '',
      shutterSpeed: '',
      iso: '',
      ev: ''
    };

    if (exif) {
      // 相機資訊
      if (exif.Make && exif.Model) {
        info.camera = `${exif.Make} ${exif.Model}`;
      }

      // 鏡頭資訊
      if (exif.LensModel) {
        info.lens = exif.LensModel;
      }

      // 焦距
      if (exif.FocalLength) {
        info.focalLength = `${Math.round(exif.FocalLength)}mm`;
      }

      // 光圈
      if (exif.FNumber) {
        info.aperture = `ƒ/${exif.FNumber.toFixed(1)}`;
      }

      // 快門速度
      if (exif.ExposureTime) {
        const exposureTime = exif.ExposureTime;
        info.shutterSpeed = exposureTime < 1 ? `1/${Math.round(1/exposureTime)}` : exposureTime;
        info.shutterSpeed += 's';
      }

      // ISO
      if (exif.ISO) {
        info.iso = `ISO ${exif.ISO}`;
      }

      // 曝光補償
      if (exif.ExposureCompensation) {
        info.ev = `${exif.ExposureCompensation > 0 ? '+' : ''}${exif.ExposureCompensation.toFixed(1)}ev`;
      }

      // 拍攝日期
      if (exif.DateTimeOriginal) {
        const date = new Date(exif.DateTimeOriginal);
        info.date = date.toLocaleString('zh-TW', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }

    return info;
  } catch (error) {
    console.error(`讀取圖片資訊時出錯 (${filepath}):`, error);
    return null;
  }
}

// 使用 Claude 生成圖片描述
async function generateImageDescription(imagePath) {
  try {
    // 讀取圖片並轉換為 base64
    const imageBuffer = await fs.promises.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // 調用 Claude API
    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: "請用優美的中文描述這張照片的內容和氛圍，描述要有文學性和感染力，長度在100-150字之間。"
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }]
    });

    return message.content[0].text || "這是一張充滿故事的照片";
  } catch (error) {
    console.error('生成圖片描述時出錯:', error);
    return "這是一張充滿故事的照片";
  }
}

// 生成 Markdown 內容
async function generateMarkdown() {
  let markdown = '# 日常的美感\n\n';
  markdown += '> 這是一個關於生活、關於愛的視覺敘事，每一張照片都承載著獨特的故事和情感。\n\n';
  
  // 讀取照片描述
  const descriptions = loadPhotoDescriptions();
  
  // 讀取實際存在的圖片文件
  const imageFiles = fs.readdirSync(inputDir)
    .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i))
    .sort();
  
  // 使用 index 來生成序號
  imageFiles.forEach((filename, index) => {
    // 查找對應的描述
    const photoDesc = descriptions.find(desc => desc.filename === filename);
    
    if (photoDesc) {
      // 使用序號格式化，確保是兩位數
      const number = String(index + 1).padStart(2, '0');
      markdown += `## #${number}\n\n`;
      markdown += `![${filename}](./${filename})\n\n`;
      markdown += `<div class="photo-description">${photoDesc.description}</div>\n\n`;
      markdown += '---\n\n';
    }
  });
  
  return markdown;
}

// 生成 HTML 內容
function generateHtml(markdownContent) {
  const htmlContent = marked(markdownContent);
  
  return `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <title>日常的美感</title>
      <style>
        /* 基礎設定 */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: "Noto Serif TC", "Noto Serif CJK TC", "Source Han Serif TC", serif;
          line-height: 1.8;
          color: #2c3e50;
          background-color: #fff;
          padding: 0;
          margin: 0;
        }

        /* 容器設定 */
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        /* 標題設定 */
        h1 {
          font-size: 3.2em;
          font-weight: 300;
          text-align: center;
          margin: 60px 0;
          color: #2c3e50;
          letter-spacing: 0.05em;
          line-height: 1.4;
        }

        h2 {
          font-size: 2em;
          font-weight: 400;
          text-align: left;
          margin: 80px 0 30px;
          color: #34495e;
          letter-spacing: 0.03em;
        }

        /* 圖片設定 */
        img {
          width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 40px 0;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          transition: transform 0.3s ease;
        }

        img:hover {
          transform: scale(1.01);
        }

        /* 照片描述設定 */
        .photo-description {
          font-size: 2em;
          line-height: 2;
          color: #444;
          margin: 30px auto;
          text-align: justify;
          letter-spacing: 0.02em;
          width: 100%;
          max-width: 800px;
          padding: 0 20px;
        }

        /* 引言區塊設定 */
        blockquote {
          margin: 80px auto;
          padding: 40px;
          background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.95));
          border: none;
          border-radius: 16px;
          position: relative;
          font-style: normal;
          width: 85%;
          max-width: 900px;
          box-shadow: 
            0 4px 6px rgba(0, 0, 0, 0.02),
            0 1px 3px rgba(0, 0, 0, 0.03);
          backdrop-filter: blur(10px);
        }

        blockquote::before {
          content: '"';
          position: absolute;
          left: 20px;
          top: -30px;
          font-size: 120px;
          color: #3498db;
          opacity: 0.15;
          font-family: "Noto Serif TC", serif;
          line-height: 1;
        }

        blockquote::after {
          content: '"';
          position: absolute;
          right: 20px;
          bottom: -80px;
          font-size: 120px;
          color: #3498db;
          opacity: 0.15;
          font-family: "Noto Serif TC", serif;
          line-height: 1;
        }

        blockquote p {
          font-size: 2em;
          line-height: 1.8;
          color: #2c3e50;
          font-weight: 300;
          text-align: center;
          margin: 0;
          padding: 0;
          position: relative;
          z-index: 1;
          letter-spacing: 0.05em;
        }

        /* 分隔線設定 */
        hr {
          border: none;
          height: 1px;
          background: linear-gradient(to right, transparent, #e0e0e0, transparent);
          margin: 60px 0;
          width: 85%;
          margin-left: auto;
          margin-right: auto;
        }

        /* 響應式設計 */
        @media (max-width: 768px) {
          .container {
            padding: 20px;
          }

          h1 {
            font-size: 2.6em;
            margin: 40px 0;
          }

          h2 {
            font-size: 2em;
            margin: 50px 0 20px;
          }

          .photo-description {
            width: 85%;
            font-size: 1.5em;
            line-height: 1.9;
            padding: 0;
          }

          blockquote {
            margin: 60px auto;
            padding: 30px;
            width: 90%;
          }

          blockquote::before {
            font-size: 100px;
            top: -25px;
            left: 10px;
          }

          blockquote::after {
            font-size: 100px;
            bottom: -65px;
            right: 10px;
          }

          blockquote p {
            font-size: 1.4em;
            line-height: 1.9;
          }
        }

        @media (max-width: 480px) {
          h1 {
            font-size: 2.4em;
          }

          h2 {
            font-size: 2em;
          }

          .photo-description {
            font-size: 1.4em;
            line-height: 2;
          }

          blockquote {
            margin: 40px auto;
            padding: 25px;
            width: 92%;
          }

          blockquote::before {
            font-size: 80px;
            top: -20px;
            left: 10px;
          }

          blockquote::after {
            font-size: 80px;
            bottom: -50px;
            right: 10px;
          }

          blockquote p {
            font-size: 1.3em;
            line-height: 2;
            letter-spacing: 0.03em;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${htmlContent}
      </div>
    </body>
    </html>
  `;
}

// 主程序
async function main() {
  try {
    // 生成 Markdown
    const markdownContent = await generateMarkdown();
    fs.writeFileSync(markdownPath, markdownContent);
    console.log(`已生成 Markdown 文件：${markdownPath}`);

    // 生成 HTML
    const htmlContent = generateHtml(markdownContent);
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`已生成 HTML 文件：${htmlPath}`);

    console.log('處理完成！');
  } catch (error) {
    console.error('發生錯誤：', error);
  }
}

// 執行主程序
main(); 