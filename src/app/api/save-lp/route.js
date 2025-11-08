import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';

// REDIS_URLから情報を抽出
function parseRedisUrl(redisUrl) {
  const match = redisUrl.match(/redis:\/\/(.+):(.+)@(.+):(\d+)/);
  if (!match) {
    throw new Error('Invalid REDIS_URL format');
  }
  
  return {
    username: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    restUrl: `https://${match[3]}`
  };
}

export async function POST(request) {
  console.log('=== Save LP API Called ===');
  
  try {
    // REDIS_URLから情報を取得
    if (!process.env.REDIS_URL) {
      console.error('REDIS_URL not found');
      return NextResponse.json(
        { error: 'REDIS_URL環境変数が設定されていません' },
        { status: 500 }
      );
    }
    
    const { password, restUrl } = parseRedisUrl(process.env.REDIS_URL);
    console.log('Redis REST URL:', restUrl);

    // リクエストボディの取得
    const lpData = await request.json();
    console.log('LP data received, keys:', Object.keys(lpData));
    
    // IDの生成
    const id = nanoid(10);
    console.log('Generated ID:', id);
    
    // Redis REST APIで保存（タイムアウト設定を追加）
    console.log('Attempting to save to Redis...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
    
    try {
      const redisResponse = await fetch(
        `${restUrl}/set/lp:${id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${password}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            value: JSON.stringify(lpData),
            ex: 60 * 60 * 24 * 30, // 30日間
          }),
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      console.log('Redis response status:', redisResponse.status);
      
      if (!redisResponse.ok) {
        const errorText = await redisResponse.text();
        console.error('Redis error response:', errorText);
        throw new Error('Redisへの保存に失敗しました: ' + errorText);
      }
      
      const result = await redisResponse.json();
      console.log('Redis save result:', result);
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Redis接続がタイムアウトしました');
      }
      throw fetchError;
    }
    
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
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: '保存に失敗しました',
        details: error.message,
        type: error.name
      },
      { status: 500 }
    );
  }
}