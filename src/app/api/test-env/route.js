import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== Environment Variables Test ===');
  
  const envVars = {
    REDIS_URL: !!process.env.REDIS_URL,
    UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
  };
  
  console.log('Environment variables:', envVars);
  
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  
  return NextResponse.json({
    envVars,
    hasUpstashUrl: !!upstashUrl,
    hasUpstashToken: !!upstashToken,
    upstashUrlPreview: upstashUrl ? upstashUrl.substring(0, 20) + '...' : null,
    tokenPreview: upstashToken ? upstashToken.substring(0, 10) + '...' : null,
  });
}