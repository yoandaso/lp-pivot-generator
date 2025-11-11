import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

async function callClaudeWithRetry(anthropic, messages, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${maxRetries}`);
      
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages,
      });
      
      return message;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      
      if (error.error?.type === 'overloaded_error' && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 5000;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      throw error;
    }
  }
}

export async function POST(request) {
  console.log('=== Analyze API Called ===');
  
  try {
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
        content: `あなたは、市場・競合分析能力に長けたベンチャーキャピタリスト兼経営戦略コンサルタントです。以下のサービスのURLを分析して、JSON形式で情報を抽出してください。
        サービスの分析にあたっては、まず、サービス内容の正確な理解につとめてください。metaタグや本文に記載されているサービス内容をよく理解した上で、どんな提供価値をどんな顧客に対して提供しているのかを正しく推定してください。取得できる情報が限られている場合は、サービス名やタグ等の情報からの類推を加えて情報を組み立ててください。
        サービス内容の理解ができたら、ターゲットとしている顧客セグメントの良い点と悪い点を評価してください。PEST分析のフレームを参考にしながら、現代社会でその顧客ターゲットを対象とすることのビジネス的なよさもしくは悪さを評価してください。たとえばターゲット顧客の数が増えるのか減るのか、競合がたくさんいるセグメントかどうかなどを評価します。
        また、その上で、そのターゲット顧客を対象とする場合の、分析対象サービスの強みと弱みを評価してください。技術的な優位性があるのかどうか、ブランド価値が高いのかどうか、など。参入障壁をどの程度築けているのか、などを評価してください。

URL: ${url}

以下の形式でJSONを返してください（JSONのみ、他のテキストは不要）：

{
  "serviceName": "サービス名",
  "targetCustomer": "ターゲット顧客",
  "valueProposition": "提供価値",
  "features": ["機能1", "機能2", "機能3"],
  "customerAnalysis": {
    "strengths": ["強み1", "強み2"],
    "challenges": ["課題1", "課題2"]
  },
  "serviceAnalysis": {
    "strengths": ["強み1", "強み2"],
    "challenges": ["課題1", "課題2"]
  }
}`,
      },
    ]);

    console.log('Claude API response received');

    if (!message || !message.content || !Array.isArray(message.content) || message.content.length === 0) {
      console.error('Invalid response format');
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

    let jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('Parsing JSON...');
    const analyzedData = JSON.parse(jsonText);
    
    console.log('Analysis successful');
    return NextResponse.json(analyzedData);

  } catch (error) {
    console.error('=== Analyze API Error ===');
    console.error('Error:', error.message);

    if (error.error?.type === 'overloaded_error') {
      return NextResponse.json(
        {
          error: 'Anthropic APIが一時的に過負荷状態です。30秒後に再度お試しください。',
          details: 'サーバーが混雑しています',
        },
        { status: 503 }
      );
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