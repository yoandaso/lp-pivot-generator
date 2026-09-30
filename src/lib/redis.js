import Redis from 'ioredis';

// Redis Cloud クライアント（共有LPの保存とレート制限で共用）
// lazyConnect: ビルド時や未使用のインスタンスで接続しない
// maxRetriesPerRequest / commandTimeout: 1リクエストあたりのRedis待ちを有限にする
let redis = null;
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    retryStrategy(times) {
      return Math.min(times * 50, 2000);
    },
    maxRetriesPerRequest: 2,
    connectTimeout: 10000,
    commandTimeout: 3000,
  });
  redis.on('error', (error) => {
    console.error('Redis error:', error.message);
  });
}

// メモリストレージ（Redisが使えない場合のフォールバック）
const memoryStorage = new Map();

export { redis, memoryStorage };
