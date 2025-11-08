import { NextResponse } from 'next/server';

export async function GET(request) {
  console.log('=== Test Redis API Called ===');
  
  try {
    const restUrl = process.env.UPSTASH_REDIS_REST_URL;
    const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!restUrl || !restToken) {
      return NextResponse.json({
        success: false,
        error: 'Upstash環境変数が設定されていません'
      });
    }
    
    console.log('Testing connection to:', restUrl);
    
    // テストキーを保存
    const testKey = 'test:' + Date.now();
    const testValue = 'Hello from LP Pivot!';
    
    // Upstash REST API の正しい形式で保存
    const saveResponse = await fetch(
      `${restUrl}/set/${testKey}/${encodeURIComponent(testValue)}?EX=60`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${restToken}`,
        },
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