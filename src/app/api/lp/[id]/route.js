import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Upstash Redisクライアントの初期化（環境変数がある場合）
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function GET(request, { params }) {
  try {
    const { id } = params;
    console.log('=== Get LP API Called ===');
    console.log('LP ID:', id);

    let lpData = null;

    // Redisから取得を試みる
    if (redis) {
      try {
        const data = await redis.get(`lp:${id}`);
        if (data) {
          lpData = typeof data === 'string' ? JSON.parse(data) : data;
          console.log('LP found in Redis');
        }
      } catch (redisError) {
        console.error('Redis get error:', redisError);
      }
    }

    // Redisにない場合、メモリストレージから取得を試みる
    if (!lpData) {
      // メモリストレージは同じプロセス内でのみ有効
      // 本番環境では必ずRedisを使用すること
      console.log('LP not found in Redis, checking memory storage...');
      
      // このAPIルートでは直接メモリにアクセスできないため、
      // 代わりにlocalStorageを使う（クライアントサイド）
      return NextResponse.json(
        { error: 'LPが見つかりません', id },
        { status: 404 }
      );
    }

    if (!lpData) {
      console.log('LP not found:', id);
      return NextResponse.json(
        { error: 'LPが見つかりません。URLが間違っているか、有効期限が切れています。' },
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
