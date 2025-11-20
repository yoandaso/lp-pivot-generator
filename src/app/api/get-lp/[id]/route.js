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

// メモリストレージ（save-lpと共有）
import { memoryStorage } from '../../save-lp/route.js';

export async function GET(request, context) {
  console.log('=== Get LP API Called ===');
  
  try {
    // Next.js 15対応: paramsをawaitで取得
    const params = await context.params;
    const { id } = params;
    
    console.log('Fetching LP with ID:', id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter missing' },
        { status: 400 }
      );
    }

    let lpData = null;

    // 1. Redisから取得を試みる
    if (redis) {
      try {
        console.log('Fetching from Redis...');
        const data = await redis.get(`lp:${id}`);
        
        if (data) {
          console.log('✅ LP found in Redis');
          // Redisから取得したデータは既にオブジェクトの場合とJSON文字列の場合がある
          lpData = typeof data === 'string' ? JSON.parse(data) : data;
        } else {
          console.log('❌ LP not found in Redis');
        }
      } catch (redisError) {
        console.error('Redis fetch error:', redisError);
        // Redisエラーの場合はメモリストレージにフォールバック
      }
    }

    // 2. Redisになければメモリストレージから取得
    if (!lpData && memoryStorage) {
      console.log('Checking memory storage...');
      const memoryItem = memoryStorage.get(id);
      
      if (memoryItem) {
        // 有効期限チェック
        if (memoryItem.expiresAt > Date.now()) {
          console.log('✅ LP found in memory storage');
          lpData = memoryItem.data;
        } else {
          console.log('❌ LP expired in memory storage');
          memoryStorage.delete(id);
        }
      } else {
        console.log('❌ LP not found in memory storage');
      }
    }

    // 3. どこにもなければ404
    if (!lpData) {
      console.error('LP not found anywhere. ID:', id);
      return NextResponse.json(
        { error: 'LPが見つかりません' },
        { status: 404 }
      );
    }

    // データの検証
    if (!lpData.serviceName) {
      console.error('Invalid LP data structure:', lpData);
      return NextResponse.json(
        { error: 'LPデータが壊れています' },
        { status: 500 }
      );
    }

    console.log('✅ LP retrieved successfully:', lpData.serviceName);
    
    return NextResponse.json(lpData);

  } catch (error) {
    console.error('=== Get LP Error ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    return NextResponse.json(
      { error: 'LP取得に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}