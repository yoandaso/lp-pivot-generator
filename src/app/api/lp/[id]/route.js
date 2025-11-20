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
    console.log('=== Get LP API Called ===');
    console.log('Params before await:', params);
    console.log('Params type:', typeof params);
    console.log('Is Promise?:', params instanceof Promise);
    
    const { id } = await params;
    
    console.log('Params after await:', { id });
    console.log('LP ID:', id);
    console.log('ID type:', typeof id);
    console.log('Redis available:', !!redis);

    // IDが undefined の場合、URLから抽出を試みる
    if (!id || id === 'undefined') {
      console.error('ID is undefined, extracting from URL');
      const urlParts = new URL(request.url).pathname.split('/');
      const extractedId = urlParts[urlParts.length - 1];
      console.log('URL:', request.url);
      console.log('Extracted ID from URL:', extractedId);
      
      if (extractedId && extractedId !== 'lp') {
        console.log('Using extracted ID:', extractedId);
        return await fetchLP(extractedId, request);
      }
      
      return NextResponse.json(
        { 
          error: 'IDを取得できませんでした',
          debug: {
            paramsType: typeof params,
            paramsValue: params,
            url: request.url
          }
        },
        { status: 400 }
      );
    }

    return await fetchLP(id, request);

  } catch (error) {
    console.error('=== Get LP Error ===');
    console.error('Error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);

    return NextResponse.json(
      { 
        error: 'LP取得に失敗しました', 
        details: error.message,
        errorName: error.name
      },
      { status: 500 }
    );
  }
}

// LP取得の共通関数
async function fetchLP(id, request) {
  console.log(`fetchLP called with ID: ${id}`);
  
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
    console.log('Redis data type:', typeof data);
    
    if (data) {
      lpData = typeof data === 'string' ? JSON.parse(data) : data;
      console.log('LP found in Redis, serviceName:', lpData?.serviceName);
      console.log('LP retrieved successfully');
      return NextResponse.json(lpData);
    }
  } catch (redisError) {
    console.error('Redis get error:', redisError);
    console.error('Redis error message:', redisError.message);
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
  console.log('LP not found in Redis for ID:', id);
  return NextResponse.json(
    { 
      error: 'LPが見つかりません。URLが間違っているか、有効期限（7日間）が切れている可能性があります。',
      id 
    },
    { status: 404 }
  );
}