import { NextResponse } from 'next/server';

export async function GET(request) {
  console.log('=== Test Redis API Called ===');
  
  try {
    // Upstash環境変数を確認
    const restUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const restToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    
    console.log('Environment variables check:');
    console.log('KV_REST_API_URL:', !!process.env.KV_REST_API_URL);
    console.log('UPSTASH_REDIS_REST_URL:', !!process.env.UPSTASH_REDIS_REST_URL);
    console.log('KV_REST_API_TOKEN:', !!process.env.KV_REST_API_TOKEN);
    console.log('UPSTASH_REDIS_REST_TOKEN:', !!process.env.UPSTASH_REDIS_REST_TOKEN);
    
    if (!restUrl || !restToken) {
      return NextResponse.json({
        success: false,
        error: 'Upstash環境変数が設定されていません',
        available: Object.keys(process.env).filter(k => k.includes('REDIS') || k.includes('KV'))
      });
    }
    
    console.log('Testing connection to:', restUrl);
    
    // テストキーを保存
    const testKey = 'test:' + Date.now();
    const testValue = 'Hello from LP Pivot!';
    
    const saveResponse = await fetch(
      `${restUrl}/set/${testKey}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${restToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: testValue,
          ex: 60
        }),
      }
    );
    
    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      return NextResponse.json({
        success: false,
        error: 'Save failed',
        details: errorText,
        status: saveResponse.status
      });
    }
    
    // 取得テスト
    const getResponse = await fetch(
      `${restUrl}/get/${testKey}`,
      {
        headers: {
          Authorization: `Bearer ${restToken}`,
        },
      }
    );
    
    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      return NextResponse.json({
        success: false,
        error: 'Get failed',
        details: errorText
      });
    }
    
    const result = await getResponse.json();
    
    return NextResponse.json({
      success: true,
      message: 'Upstash connection successful!',
      testValue,
      retrievedValue: result.result,
      match: result.result === testValue
    });
    
  } catch (error) {
    console.error('Test Redis Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      type: error.name
    }, { status: 500 });
  }
}