// 引入模組
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const exifr = require('exifr');
const sharp = require('sharp');

// 設定檔案路徑
const inputDir = path.join(__dirname, 'Zora-Family');
const markdownPath = path.join(inputDir, 'photo-story.md');
const htmlPath = path.join(inputDir, 'photo-story.html');

// 照片描述（可以根據需要修改）
const photoDescriptions = [
  {
    filename: 'DSC02105.JPG',
    description: `在這片寧靜的時光中，陽光溫柔地灑落在每一片葉子上，彷彿在訴說著大自然的秘密。這是一個關於成長、關於愛的故事，就像《編織勝草》中描述的那樣，每一刻都充滿了生命的奇蹟。`
  },
  {
    filename: 'DSC02110.JPG',
    description: `微風輕拂，帶來遠方的氣息。這張照片捕捉了生活中最純粹的瞬間，讓我們停下腳步，感受當下的美好。正如基默爾所說：「在寂靜中，我們聽見了生命的低語。」`
  },
  {
    filename: 'DSC02113.JPG',
    description: `這是一個關於連結的故事，關於我們如何與自然、與彼此建立深厚的關係。每一幀畫面都是一個新的開始，一個新的發現。`
  }
];

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

// 生成 Markdown 內容
async function generateMarkdown() {
  let markdown = '# 照片故事集\n\n';
  markdown += '> 這是一個關於生活、關於愛的視覺敘事，每一張照片都承載著獨特的故事和情感。\n\n';
  
  // 讀取實際存在的圖片文件
  const imageFiles = fs.readdirSync(inputDir)
    .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i))
    .sort();
  
  for (const [index, filename] of imageFiles.entries()) {
    const filepath = path.join(inputDir, filename);
    const photoInfo = await getPhotoInfo(filepath);
    
    markdown += `## #${index + 1}\n\n`;
    markdown += `![${filename}](./${filename})\n\n`;
    
    if (photoInfo) {
      markdown += '<div class="photo-info">\n\n';
      markdown += `- 相機：${photoInfo.camera}\n`;
      markdown += `- 鏡頭：${photoInfo.lens}\n`;
      if (photoInfo.focalLength) markdown += `- 焦距：${photoInfo.focalLength}\n`;
      if (photoInfo.aperture) markdown += `- 光圈：${photoInfo.aperture}\n`;
      if (photoInfo.shutterSpeed) markdown += `- 快門：${photoInfo.shutterSpeed}\n`;
      if (photoInfo.iso) markdown += `- ISO：${photoInfo.iso}\n`;
      if (photoInfo.ev) markdown += `- 曝光補償：${photoInfo.ev}\n`;
      markdown += `- 拍攝時間：${photoInfo.date}\n`;
      markdown += '\n</div>\n\n';
    }
    
    // 查找對應的描述或使用默認描述
    const description = photoDescriptions.find(p => p.filename === filename)?.description ||
      `這張照片捕捉了一個特別的時刻，讓我們一起感受這份溫暖與寧靜。在這個瞬間，時光彷彿靜止，讓我們能夠細細品味生活中的每一個細節。`;
    
    markdown += `${description}\n\n`;
    markdown += '---\n\n';
  }
  
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
      <title>照片故事集</title>
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

        /* 引言區塊設定 */
        blockquote {
          margin: 50px 0;
          padding: 30px 40px;
          background: linear-gradient(to right, #f8f9fa, #ffffff);
          border-left: none;
          position: relative;
          font-style: normal;
        }

        blockquote::before {
          content: '"';
          position: absolute;
          left: -20px;
          top: 0;
          font-size: 60px;
          color: #3498db;
          opacity: 0.2;
          font-family: Georgia, serif;
        }

        blockquote p {
          font-size: 1.4em;
          line-height: 1.8;
          color: #34495e;
          font-weight: 300;
          text-align: justify;
          margin: 0;
          padding: 0;
        }

        /* 段落設定 */
        p {
          font-size: 1.2em;
          line-height: 2;
          color: #444;
          margin: 30px 0;
          text-align: justify;
          letter-spacing: 0.02em;
        }

        /* 照片資訊設定 */
        .photo-info {
          background: #f8f9fa;
          padding: 20px 30px;
          border-radius: 8px;
          margin: 30px 0;
          font-family: "SF Mono", "Consolas", monospace;
          font-size: 0.9em;
          color: #666;
          line-height: 1.6;
        }

        .photo-info ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .photo-info li {
          margin: 8px 0;
          display: inline-block;
          margin-right: 20px;
        }

        /* 分隔線設定 */
        hr {
          border: none;
          height: 1px;
          background: linear-gradient(to right, transparent, #e0e0e0, transparent);
          margin: 60px 0;
        }

        /* 響應式設計 */
        @media (max-width: 768px) {
          .container {
            padding: 20px;
          }

          h1 {
            font-size: 2.4em;
            margin: 40px 0;
          }

          h2 {
            font-size: 1.8em;
            margin: 50px 0 20px;
          }

          blockquote {
            padding: 20px;
            margin: 30px 0;
          }

          blockquote p {
            font-size: 1.2em;
          }

          p {
            font-size: 1.1em;
          }

          .photo-info {
            padding: 15px;
            font-size: 0.85em;
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