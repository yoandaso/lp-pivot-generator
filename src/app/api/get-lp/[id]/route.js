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

export async function GET(request, { params }) {
  console.log('=== Get LP API Called ===');
  console.log('Params:', params);
  
  try {
    const { id } = params;
    console.log('Fetching LP with ID:', id);
    
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
    console.log('Fetching key:', `lp:${id}`);
    
    // Redis REST APIで取得
    const redisResponse = await fetch(
      `${restUrl}/get/lp:${id}`,
      {
        headers: {
          Authorization: `Bearer ${password}`,
        },
      }
    );
    
    console.log('Redis response status:', redisResponse.status);
    
    if (!redisResponse.ok) {
      const errorText = await redisResponse.text();
      console.error('Redis fetch failed:', errorText);
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