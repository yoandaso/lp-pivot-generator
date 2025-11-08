import { NextResponse } from 'next/server';

// REDIS_URLから情報を抽出
function parseRedisUrl(redisUrl) {
  const match = redisUrl.match(/redis:\/\/(.+):(.+)@(.+):(\d+)/);
  if (!match) {
    throw new Error('Invalid REDIS_URL format');
  }
  
  return {
    username: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    restUrl: `https://${match[3]}`
  };
}

export async function GET(request) {
  console.log('=== Test Redis API Called ===');
  
  try {
    // 環境変数の確認
    if (!process.env.REDIS_URL) {
      return NextResponse.json({
        success: false,
        error: 'REDIS_URL not found',
        env: Object.keys(process.env).filter(k => k.includes('REDIS'))
      });
    }
    
    console.log('REDIS_URL exists');
    
    const { password, restUrl } = parseRedisUrl(process.env.REDIS_URL);
    
    console.log('Testing connection to:', restUrl);
    
    // テストキーを保存
    const testKey = 'test:' + Date.now();
    const testValue = 'Hello from LP Pivot!';
    
    console.log('Saving test key:', testKey);
    
    const saveResponse = await fetch(
      `${restUrl}/set/${testKey}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${password}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: testValue,
          ex: 60 // 1分で削除
        }),
      }
    );
    
    console.log('Save response status:', saveResponse.status);
    
    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      console.error('Save error:', errorText);
      return NextResponse.json({
        success: false,
        error: 'Save failed',
        details: errorText,
        status: saveResponse.status
      });
    }
    
    const saveResult = await saveResponse.json();
    console.log('Save result:', saveResult);
    
    // テストキーを取得
    console.log('Getting test key:', testKey);
    
    const getResponse = await fetch(
      `${restUrl}/get/${testKey}`,
      {
        headers: {
          Authorization: `Bearer ${password}`,
        },
      }
    );
    
    console.log('Get response status:', getResponse.status);
    
    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('Get error:', errorText);
      return NextResponse.json({
        success: false,
        error: 'Get failed',
        details: errorText,
        status: getResponse.status
      });
    }
    
    const result = await getResponse.json();
    console.log('Get result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Redis connection successful!',
      testKey,
      testValue,
      retrievedValue: result.result,
      match: result.result === testValue,
      saveResult,
      getResult: result
    });
    
  } catch (error) {
    console.error('Test Redis Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      type: error.name,
      stack: error.stack
    }, { status: 500 });
  }
}