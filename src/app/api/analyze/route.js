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

// URLのコンテンツをフェッチする関数
async function fetchWebContent(url) {
  try {
    console.log('Fetching URL content:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // タイムアウトを設定
      signal: AbortSignal.timeout(15000) // 15秒でタイムアウト
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Fetched ${html.length} characters from URL`);
    
    return html;
  } catch (error) {
    console.error('Error fetching URL:', error.message);
    throw new Error(`URLの取得に失敗しました: ${error.message}`);
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

    // URLの検証
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json(
        { error: '有効なURLを入力してください' },
        { status: 400 }
      );
    }

    // URLのコンテンツを取得
    let webContent;
    try {
      webContent = await fetchWebContent(url);
    } catch (fetchError) {
      return NextResponse.json(
        { error: 'Webページの取得に失敗しました', details: fetchError.message },
        { status: 400 }
      );
    }

    // コンテンツが長すぎる場合は切り詰める（Claude APIの制限対策）
    const maxLength = 50000; // 約50,000文字まで
    if (webContent.length > maxLength) {
      console.log(`Content too long (${webContent.length} chars), truncating to ${maxLength}`);
      webContent = webContent.substring(0, maxLength);
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log('Calling Claude API with retry...');

    const message = await callClaudeWithRetry(anthropic, [
      {
        role: 'user',
        content: `あなたは、市場・競合分析能力に長けたベンチャーキャピタリスト兼経営戦略コンサルタントです。以下のサービスのWebページを分析して、JSON形式で情報を抽出してください。

サービスの分析にあたっては、まず、サービス内容の正確な理解につとめてください。metaタグや本文に記載されているサービス内容をよく理解した上で、どんな提供価値をどんな顧客に対して提供しているのかを正しく推定してください。取得できる情報が限られている場合は、サービス名やタグ等の情報からの類推を加えて情報を組み立ててください。

サービス内容の理解ができたら、ターゲットとしている顧客セグメントの良い点と悪い点を評価してください。PEST分析のフレームを参考にしながら、現代社会でその顧客ターゲットを対象とすることのビジネス的なよさもしくは悪さを評価してください。たとえばターゲット顧客の数が増えるのか減るのか、競合がたくさんいるセグメントかどうかなどを評価します。

また、その上で、そのターゲット顧客を対象とする場合の、分析対象サービスの強みと弱みを評価してください。技術的な優位性があるのかどうか、ブランド価値が高いのかどうか、など。参入障壁をどの程度築けているのか、などを評価してください。

以下がWebページのHTMLコンテンツです：

<webpage_content>
${webContent}
</webpage_content>

以下の形式でJSONを返してください（JSONのみ、他のテキストは不要）：

{
  "serviceName": "サービス名",
  "targetCustomer": "ターゲット顧客（具体的に。例：中小企業のマーケティング担当者、フリーランスのデザイナー）",
  "valueProposition": "提供価値（顧客の何を解決するのか）",
  "features": ["主要機能1", "主要機能2", "主要機能3"],
  "customerAnalysis": {
    "strengths": ["このターゲット顧客を狙うビジネス的メリット1", "メリット2"],
    "challenges": ["このターゲット顧客を狙う際の課題1", "課題2"]
  },
  "serviceAnalysis": {
    "strengths": ["このサービスの強み1（技術的優位性、ブランド力など）", "強み2"],
    "challenges": ["このサービスの弱み・改善点1", "弱み2"]
  }
}

重要: 必ず有効なJSONのみを返してください。マークダウンのコードブロック記号（\`\`\`）は不要です。`,
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

    // JSONの抽出（マークダウンのコードブロックを削除）
    let jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('Parsing JSON...');
    let analyzedData;
    try {
      analyzedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Response text:', responseText.substring(0, 500));
      return NextResponse.json(
        { error: 'JSONのパースに失敗しました', details: parseError.message },
        { status: 500 }
      );
    }
    
    console.log('Analysis successful');
    return NextResponse.json(analyzedData);

  } catch (error) {
    console.error('=== Analyze API Error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // より詳細なエラー情報を返す
    if (error.error?.type === 'overloaded_error') {
      return NextResponse.json(
        {
          error: 'Anthropic APIが一時的に過負荷状態です。30秒後に再度お試しください。',
          details: 'サーバーが混雑しています',
        },
        { status: 503 }
      );
    }

    if (error.error?.type === 'authentication_error') {
      return NextResponse.json(
        {
          error: 'API認証エラー',
          details: 'ANTHROPIC_API_KEYを確認してください',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'API呼び出しに失敗しました',
        details: error.message || '不明なエラー',
        type: error.error?.type || 'unknown',
      },
      { status: 500 }
    );
  }
}