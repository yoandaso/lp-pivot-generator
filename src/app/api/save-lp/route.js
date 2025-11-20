import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Upstash Redisクライアントの初期化（環境変数がある場合）
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('✅ Redis client initialized');
} else {
  console.warn('⚠️ Redis environment variables not found, using memory storage');
}

// メモリストレージ（Redisが使えない場合のフォールバック）
const memoryStorage = new Map();

// ランダムIDを生成
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export async function POST(request) {
  try {
    console.log('=== Save LP API Called ===');
    
    const lpData = await request.json();
    
    // データ検証
    if (!lpData || !lpData.serviceName) {
      console.error('Invalid LP data:', lpData);
      return NextResponse.json(
        { error: '無効なLPデータです', details: 'serviceName is required' },
        { status: 400 }
      );
    }

    // ユニークIDを生成
    const id = generateId();
    
    // 7日間の有効期限（秒単位）
    const expirationSeconds = 7 * 24 * 60 * 60; // 7 days
    
    console.log('Generated ID:', id);
    console.log('Service Name:', lpData.serviceName);

    let savedToRedis = false;

    // Redisに保存（利用可能な場合）
    if (redis) {
      try {
        await redis.set(`lp:${id}`, JSON.stringify(lpData), {
          ex: expirationSeconds,
        });
        console.log('✅ LP saved to Redis successfully');
        console.log('Key:', `lp:${id}`);
        savedToRedis = true;
      } catch (redisError) {
        console.error('❌ Redis save error:', redisError);
        console.error('Stack:', redisError.stack);
        // Redisエラーの場合はメモリストレージにフォールバック
        savedToRedis = false;
      }
    }

    // Redisに保存できなかった場合はメモリストレージを使用
    if (!savedToRedis) {
      memoryStorage.set(id, {
        data: lpData,
        expiresAt: Date.now() + (expirationSeconds * 1000)
      });
      console.log('💾 Saved to memory storage (fallback)');
      console.log('Memory storage size:', memoryStorage.size);
    }

    // 共有URL生成
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    request.headers.get('origin') || 
                    'http://localhost:3000';
    const shareUrl = `${baseUrl}/lp/${id}`;

    console.log('📤 Share URL:', shareUrl);
    console.log('💾 Storage:', savedToRedis ? 'Redis' : 'Memory');

    return NextResponse.json({
      id,
      url: shareUrl,
      data: lpData,
      expiresIn: '7日間',
      storage: savedToRedis ? 'Redis' : 'Memory'
    });

  } catch (error) {
    console.error('=== Save LP Error ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);

    return NextResponse.json(
      { 
        error: 'LP保存に失敗しました', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// メモリストレージから期限切れデータを削除（クリーンアップ）
if (!redis) {
  setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [id, item] of memoryStorage.entries()) {
      if (item.expiresAt < now) {
        memoryStorage.delete(id);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired LP(s) from memory`);
    }
  }, 60 * 60 * 1000); // 1時間ごとにクリーンアップ
}

// GET用のエクスポート（メモリストレージをget-lpで使えるようにする）
export { memoryStorage };