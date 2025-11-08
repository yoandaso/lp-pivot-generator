import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

// リトライ機能付きAPI呼び出し
async function callClaudeWithRetry(anthropic, messages, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${maxRetries}`);
      
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages,
      });
      
      return message;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      
      // overloaded_error の場合は待機してリトライ
      if (error.error?.type === 'overloaded_error' && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 1000; // 1秒, 2秒, 4秒
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // その他のエラーは即座に投げる
      throw error;
    }
  }
}

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

    console.log('Calling Claude API with retry...');

    const message = await callClaudeWithRetry(anthropic, [
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
    ]);

    console.log('Claude API response received');

    // レスポンスの検証
    if (!message || !message.content || !Array.isArray(message.content) || message.content.length === 0) {
      console.error('Invalid response format:', message);
      return NextResponse.json(
        { error: 'Claude APIからの応答が不正です' },
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

    console.log('Response text length:', responseText.length);

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

    // Anthropic API固有のエラー
    if (error.error) {
      console.error('API Error type:', error.error.type);
      console.error('API Error message:', error.error.message);
      
      // overloaded_error の場合
      if (error.error.type === 'overloaded_error') {
        return NextResponse.json(
          {
            error: 'Anthropic APIが一時的に過負荷状態です。しばらく待ってから再度お試しください。',
            details: 'サーバーが混雑しています',
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'API呼び出しに失敗しました',
        details: error.message,
      },
      { status: 500 }
    );
  }
}