import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { event, data } = await request.json();
    
    // コンソールに出力（Vercel Logsで確認可能）
    console.log('📊 EVENT:', event, 'DATA:', JSON.stringify(data));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Log error:', error);
    return NextResponse.json(
      { error: 'ログ記録に失敗しました' },
      { status: 500 }
    );
  }
}