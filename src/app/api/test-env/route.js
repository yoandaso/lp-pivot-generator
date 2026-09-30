import { NextResponse } from 'next/server';
import { debugRouteGuard } from '../../../lib/costGuards.js';

export async function GET() {
  // 本番環境では無効（環境変数の露出・外部書き込みを防ぐ）
  const blocked = debugRouteGuard();
  if (blocked) return blocked;

  console.log('=== Environment Variables Test ===');
  
  // すべてのRedis/KV関連の環境変数を確認
  const allEnvKeys = Object.keys(process.env).filter(k => 
    k.includes('REDIS') || k.includes('UPSTASH') || k.includes('KV')
  );
  
  console.log('All Redis/KV env vars:', allEnvKeys);
  
  const envVars = {};
  allEnvKeys.forEach(key => {
    envVars[key] = process.env[key] ? 
      (process.env[key].substring(0, 20) + '...') : 
      null;
  });
  
  return NextResponse.json({
    allKeys: allEnvKeys,
    values: envVars
  });
}