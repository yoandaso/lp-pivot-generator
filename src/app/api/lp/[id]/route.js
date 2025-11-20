// src/app/api/lp/[id]/route.js
import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'IDが指定されていません' },
        { status: 400 }
      );
    }

    console.log('Fetching LP data for ID:', id);

    // Vercel KVからデータを取得
    const lpData = await kv.get(`lp:${id}`);

    if (!lpData) {
      console.log('LP not found:', id);
      return NextResponse.json(
        { error: 'LPが見つかりません' },
        { status: 404 }
      );
    }

    console.log('LP found:', id);

    // CORSヘッダーを追加
    return NextResponse.json(lpData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'サーバーエラー', details: error.message },
      { status: 500 }
    );
  }
}
