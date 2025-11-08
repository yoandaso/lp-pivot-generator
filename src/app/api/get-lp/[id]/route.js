import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  console.log('=== Get LP API Called ===');
  
  try {
    const { id } = params;
    console.log('Fetching LP with ID:', id);
    
    // Upstash環境変数を確認
    const restUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const restToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!restUrl || !restToken) {
      console.error('Upstash環境変数が見つかりません');
      return NextResponse.json(
        { error: 'Upstash環境変数が設定されていません' },
        { status: 500 }
      );
    }
    
    console.log('Redis REST URL:', restUrl);
    
    // Upstash REST APIで取得
    const redisResponse = await fetch(
      `${restUrl}/get/lp:${id}`,
      {
        headers: {
          Authorization: `Bearer ${restToken}`,
        },
      }
    );
    
    console.log('Redis response status:', redisResponse.status);
    
    if (!redisResponse.ok) {
      const errorText = await redisResponse.text();
      console.error('Redis error:', errorText);
      return NextResponse.json(
        { error: 'Redisからの取得に失敗しました', details: errorText },
        { status: 500 }
      );
    }
    
    const result = await redisResponse.json();
    console.log('Redis response:', result);
    
    if (!result.result) {
      console.error('LP not found:', id);
      return NextResponse.json(
        { error: 'LPが見つかりません' },
        { status: 404 }
      );
    }
    
    const lpData = JSON.parse(result.result);
    console.log('LP found successfully');
    
    return NextResponse.json(lpData);
  } catch (error) {
    console.error('=== Get LP Error ===');
    console.error('Error:', error);
    
    return NextResponse.json(
      { error: 'LP取得に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}