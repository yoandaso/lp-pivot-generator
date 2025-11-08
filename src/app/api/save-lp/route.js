import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';

// REDIS_URLから情報を抽出
function parseRedisUrl(redisUrl) {
  // redis://default:TOKEN@HOST:PORT の形式
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
      throw new Error('REDIS_URL環境変数が設定されていません');
    }
    
    const { password, restUrl } = parseRedisUrl(process.env.REDIS_URL);
    console.log('Redis REST URL:', restUrl);

    // リクエストボディの取得
    const lpData = await request.json();
    console.log('LP data received');
    
    // IDの生成
    const id = nanoid(10);
    console.log('Generated ID:', id);
    
    // Redis REST APIで保存
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
      }
    );
    
    if (!redisResponse.ok) {
      const errorText = await redisResponse.text();
      console.error('Redis error:', errorText);
      throw new Error('Redisへの保存に失敗しました: ' + errorText);
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