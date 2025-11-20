import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Upstash Redisクライアントの初期化（環境変数がある場合）
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('Redis client initialized');
} else {
  console.warn('Redis environment variables not found. Redis will not be available.');
}

export async function GET(request, { params }) {
  try {
    const { id } = params;
    console.log('=== Get LP API Called ===');
    console.log('LP ID:', id);
    console.log('Redis available:', !!redis);

    let lpData = null;

    // Redisが利用可能かチェック
    if (!redis) {
      console.error('Redis is not configured. Cannot retrieve LP.');
      return NextResponse.json(
        { 
          error: 'ストレージが設定されていません', 
          details: 'Redis configuration is missing',
          id 
        },
        { status: 500 }
      );
    }

    // Redisから取得を試みる
    try {
      console.log(`Attempting to get key: lp:${id}`);
      const data = await redis.get(`lp:${id}`);
      console.log('Redis response:', data ? 'Data found' : 'No data');
      
      if (data) {
        lpData = typeof data === 'string' ? JSON.parse(data) : data;
        console.log('LP found in Redis, serviceName:', lpData?.serviceName);
      }
    } catch (redisError) {
      console.error('Redis get error:', redisError);
      return NextResponse.json(
        { 
          error: 'データ取得エラー', 
          details: redisError.message,
          id 
        },
        { status: 500 }
      );
    }

    // データが見つからない場合
    if (!lpData) {
      console.log('LP not found in Redis for ID:', id);
      return NextResponse.json(
        { 
          error: 'LPが見つかりません。URLが間違っているか、有効期限（7日間）が切れている可能性があります。',
          id 
        },
        { status: 404 }
      );
    }

    console.log('LP retrieved successfully');
    return NextResponse.json(lpData);

  } catch (error) {
    console.error('=== Get LP Error ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);

    return NextResponse.json(
      { 
        error: 'LP取得に失敗しました', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}