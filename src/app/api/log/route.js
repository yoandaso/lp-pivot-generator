import { NextResponse } from 'next/server';
import { redis } from '../../../lib/redis.js';
import { enforceRateLimit, readJsonBody, BODY_LIMITS } from '../../../lib/costGuards.js';

export async function POST(request) {
  try {
    const limited = await enforceRateLimit(redis, request, 'log');
    if (limited) return limited;

    const parsed = await readJsonBody(request, BODY_LIMITS.log);
    if (parsed.response) return parsed.response;
    const { event, data } = parsed.data ?? {};
    
    // コンソールに出力（Vercel Logsで確認可能）
    console.log('📊 EVENT:', event, 'DATA:', JSON.stringify(data));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Log error:', error);
    return NextResponse.json(
      { error: 'ログ記録に失敗しました' },
      { status: 500 }
    );
  }
}