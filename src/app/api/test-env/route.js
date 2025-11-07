import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    keyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 20) || 'NOT_FOUND',
    keyLength: process.env.ANTHROPIC_API_KEY?.length || 0,
    nodeEnv: process.env.NODE_ENV,
  });
}