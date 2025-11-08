import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('=== Analyze API Called ===');
  
  try {
    // APIキーの確認
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY環境変数が設定されていません' },
        { status: 500 }
      );
    }

    const { url } = await request.json();
    console.log('Analyzing URL:', url);

    if (!url) {
      return NextResponse.json(
        { error: 'URLが指定されていません' },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log('Calling Claude API...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `以下のサービスのURLを分析して、JSON形式で情報を抽出してください。

URL: ${url}

以下の形式でJSONを返してください（JSONのみ、他のテキストは不要）：

{
  "serviceName": "サービス名",
  "targetCustomer": "ターゲット顧客（例：中小企業の経営者、個人事業主など）",
  "valueProposition": "提供価値（一言で）",
  "features": ["機能1", "機能2", "機能3"],
  "customerAnalysis": {
    "strengths": ["顧客セグメントの強み1", "強み2"],
    "challenges": ["課題1", "課題2"]
  },
  "serviceAnalysis": {
    "strengths": ["サービス・技術の強み1", "強み2"],
    "challenges": ["課題1", "課題2"]
  }
}`,
        },
      ],
    });

    console.log('Claude API response received');
    console.log('Full response:', JSON.stringify(message, null, 2));

    // レスポンスの検証
    if (!message || !message.content || !Array.isArray(message.content) || message.content.length === 0) {
      console.error('Invalid response format:', message);
      return NextResponse.json(
        { error: 'Claude APIからの応答が不正です', details: JSON.stringify(message) },
        { status: 500 }
      );
    }

    const responseText = message.content[0].text;
    
    if (!responseText) {
      console.error('Response text is empty');
      return NextResponse.json(
        { error: 'Claude APIからのテキストが空です' },
        { status: 500 }
      );
    }

    console.log('Response text:', responseText.substring(0, 200));

    // JSONの抽出
    let jsonText = responseText;
    
    // マークダウンのコードブロックを削除
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('Parsing JSON...');
    const analyzedData = JSON.parse(jsonText);
    
    console.log('Analysis successful');
    return NextResponse.json(analyzedData);

  } catch (error) {
    console.error('=== Analyze API Error ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Anthropic API固有のエラー
    if (error.status) {
      console.error('API Status:', error.status);
      console.error('API Error:', error.error);
    }

    return NextResponse.json(
      {
        error: 'API呼び出しに失敗しました',
        details: error.message,
        type: error.name,
        apiError: error.error || null,
      },
      { status: 500 }
    );
  }
}
