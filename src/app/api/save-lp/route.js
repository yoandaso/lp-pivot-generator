import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('=== Save LP API Called ===');
  
  try {
    // Upstash環境変数を確認
    const restUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const restToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!restUrl || !restToken) {
      console.error('Upstash環境変数が見つかりません');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('REDIS') || k.includes('KV')));
      return NextResponse.json(
        { error: 'Upstash環境変数が設定されていません' },
        { status: 500 }
      );
    }
    
    console.log('Redis REST URL:', restUrl);

    // リクエストボディの取得
    const lpData = await request.json();
    console.log('LP data received');
    
    // IDの生成
    const id = nanoid(10);
    console.log('Generated ID:', id);
    
    // Upstash REST APIで保存
    console.log('Saving to Upstash...');
    
    const redisResponse = await fetch(
      `${restUrl}/set/lp:${id}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${restToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(lpData),
          ex: 60 * 60 * 24 * 30, // 30日間
        }),
      }
    );
    
    console.log('Redis response status:', redisResponse.status);
    
    if (!redisResponse.ok) {
      const errorText = await redisResponse.text();
      console.error('Redis error:', errorText);
      return NextResponse.json(
        { error: 'Redisへの保存に失敗しました', details: errorText },
        { status: 500 }
      );
    }
    
    const result = await redisResponse.json();
    console.log('Redis save result:', result);
    
    // URLの生成
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lp-pivot.com';
    const url = `${baseUrl}/lp/${id}`;
    console.log('Generated URL:', url);
    
    return NextResponse.json({
      success: true,
      id,
      url,
      data: lpData
    });
    
  } catch (error) {
    console.error('=== Save LP Error ===');
    console.error('Error:', error);
    
    return NextResponse.json(
      { 
        error: '保存に失敗しました',
        details: error.message,
      },
      { status: 500 }
    );
  }
}