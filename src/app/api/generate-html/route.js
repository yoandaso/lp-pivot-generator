// app/api/generate-html/route.js
// 新しいファイルを作成

import { renderToStaticMarkup } from 'react-dom/server';
import { NextResponse } from 'next/server';
import LPRenderer from '@/components/LPRenderer';

export async function POST(request) {
  try {
    const lpData = await request.json();

    // LPRendererコンポーネントを静的HTMLに変換
    const lpHTML = renderToStaticMarkup(
      <LPRenderer 
        lpData={lpData}
        showToolbar={false}
        showFloatingCTA={false}
      />
    );

    // 完全なHTML文書を作成
    const htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lpData.serviceName}</title>
  <meta name="description" content="${lpData.catchphrase}">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes blob {
      0%, 100% { transform: translate(0, 0) scale(1); }
      25% { transform: translate(20px, -50px) scale(1.1); }
      50% { transform: translate(-20px, 20px) scale(0.9); }
      75% { transform: translate(50px, 50px) scale(1.05); }
    }
    .animate-blob { animation: blob 7s infinite; }
    .animation-delay-2000 { animation-delay: 2s; }
    .animation-delay-4000 { animation-delay: 4s; }
  </style>
</head>
<body>
  ${lpHTML}
</body>
</html>`;

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${lpData.serviceName.replace(/\s+/g, '-')}-LP.html"`
      }
    });

  } catch (error) {
    console.error('HTML generation error:', error);
    return NextResponse.json(
      { error: 'HTML生成に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}
