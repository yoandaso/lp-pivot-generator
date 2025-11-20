// app/api/generate-html/route.js
import { NextResponse } from 'next/server';
import { generateLPHTML } from '@/lib/generateLPHTML';

export async function POST(request) {
  try {
    const lpData = await request.json();

    if (!lpData || !lpData.serviceName) {
      return NextResponse.json(
        { error: '無効なLPデータです' },
        { status: 400 }
      );
    }

    // HTML生成関数を使用
    const htmlContent = generateLPHTML(lpData);

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
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