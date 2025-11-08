import { NextResponse } from 'next/server';

export async function GET(request, context) {
  console.log('=== Debug LP API Called ===');
  
  try {
    // Next.js 15対応
    const params = await context.params;
    const { id } = params;
    
    console.log('Debug LP with ID:', id);
    
    if (!id) {
      return NextResponse.json({
        error: 'ID parameter missing',
        receivedParams: params
      }, { status: 400 });
    }
    
    const restUrl = process.env.UPSTASH_REDIS_REST_URL;
    const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!restUrl || !restToken) {
      return NextResponse.json({
        error: 'Environment variables not found'
      }, { status: 500 });
    }
    
    // Redisから取得
    const redisResponse = await fetch(
      `${restUrl}/get/lp:${id}`,
      {
        headers: {
          Authorization: `Bearer ${restToken}`,
        },
      }
    );
    
    const result = await redisResponse.json();
    
    return NextResponse.json({
      id,
      key: `lp:${id}`,
      found: !!result.result,
      rawResponse: result,
      dataType: typeof result.result,
      dataPreview: result.result ? result.result.substring(0, 200) : null
    });
    
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}