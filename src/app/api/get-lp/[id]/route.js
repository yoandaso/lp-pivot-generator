import { NextResponse } from 'next/server';

import { redis, memoryStorage } from '../../../../lib/redis.js';

// 保存済みLPは不変（7日で失効）なので CDN で短時間キャッシュする
const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=0, s-maxage=3600' };
const ID_PATTERN = /^[a-z0-9]{1,32}$/;

export async function GET(request, context) {
  console.log('=== Get LP API Called ===');
  
  try {
    // Next.js 15対応: paramsをawaitで取得
    const params = await context.params;
    const { id } = params;
    
    console.log('Fetching LP with ID:', id);
    
    if (!id || !ID_PATTERN.test(id)) {
      return NextResponse.json(
        { error: 'LPが見つかりません' },
        { status: 404 }
      );
    }

    let lpData = null;

    // 1. Redis Cloudから取得を試みる
    if (redis) {
      try {
        console.log('Fetching from Redis Cloud...');
        const data = await redis.get(`lp:${id}`);
        
        if (data) {
          console.log('✅ LP found in Redis Cloud');
          // ioredisは文字列を返すので、JSONパースが必要
          lpData = JSON.parse(data);
        } else {
          console.log('❌ LP not found in Redis Cloud');
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
    
    return NextResponse.json(lpData, { headers: CACHE_HEADERS });

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