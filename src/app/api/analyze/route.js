import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

async function callClaudeWithRetry(anthropic, messages, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${maxRetries}`);
      
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022', // 修正: 正しいモデル名
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

// URLのコンテンツをフェッチする関数（互換性のあるタイムアウト実装）
async function fetchWebContent(url) {
  try {
    console.log('Fetching URL content:', url);
    
    // タイムアウト用のAbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        },
        signal: controller.signal,
        // リダイレクトを許可
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      console.log(`Fetched ${html.length} characters from URL`);
      
      return html;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error fetching URL:', error.message);
    
    if (error.name === 'AbortError') {
      throw new Error('URLの取得がタイムアウトしました（15秒以内に応答がありませんでした）');
    }
    
    throw new Error(`URLの取得に失敗しました: ${error.message}`);
  }
}

export async function POST(request) {
  console.log('=== Analyze API Called ===');
  
  try {
    // 環境変数チェック
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY環境変数が設定されていません' },
        { status: 500 }
      );
    }

    // リクエストボディの取得
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json(
        { error: 'リクエストボディのパースに失敗しました' },
        { status: 400 }
      );
    }

    const { url } = body;
    console.log('Analyzing URL:', url);

    if (!url) {
      return NextResponse.json(
        { error: 'URLが指定されていません' },
        { status: 400 }
      );
    }

    // URLの検証
    try {
      const parsedUrl = new URL(url);
      // httpまたはhttpsのみ許可
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return NextResponse.json(
          { error: 'httpまたはhttpsのURLを入力してください' },
          { status: 400 }
        );
      }
    } catch (e) {
      console.error('Invalid URL:', e);
      return NextResponse.json(
        { error: '有効なURLを入力してください' },
        { status: 400 }
      );
    }

    // URLのコンテンツを取得
    let webContent;
    try {
      webContent = await fetchWebContent(url);
      
      if (!webContent || webContent.trim().length === 0) {
        return NextResponse.json(
          { error: 'Webページの内容が空です' },
          { status: 400 }
        );
      }
      
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Webページの取得に失敗しました', details: fetchError.message },
        { status: 400 }
      );
    }

    // コンテンツが長すぎる場合は切り詰める（Claude APIの制限対策）
    const maxLength = 40000; // 約40,000文字まで（トークン制限を考慮）
    if (webContent.length > maxLength) {
      console.log(`Content too long (${webContent.length} chars), truncating to ${maxLength}`);
      webContent = webContent.substring(0, maxLength) + '\n\n[... 省略 ...]';
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
      console.error('Invalid response format:', JSON.stringify(message));
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
    console.log('Response preview:', responseText.substring(0, 200));

    // JSONの抽出（マークダウンのコードブロックを削除）
    let jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('Parsing JSON...');
    let analyzedData;
    try {
      analyzedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Failed to parse:', jsonText.substring(0, 500));
      return NextResponse.json(
        { 
          error: 'JSONのパースに失敗しました', 
          details: parseError.message,
          preview: jsonText.substring(0, 200)
        },
        { status: 500 }
      );
    }

    // 必須フィールドのチェック
    if (!analyzedData.serviceName || !analyzedData.targetCustomer) {
      console.error('Missing required fields in response');
      return NextResponse.json(
        { error: '必須フィールドが不足しています' },
        { status: 500 }
      );
    }
    
    console.log('Analysis successful:', analyzedData.serviceName);
    return NextResponse.json(analyzedData);

  } catch (error) {
    console.error('=== Analyze API Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Anthropic APIのエラー
    if (error.error) {
      console.error('Anthropic API error:', error.error);
      
      if (error.error.type === 'overloaded_error') {
        return NextResponse.json(
          {
            error: 'Anthropic APIが一時的に過負荷状態です。30秒後に再度お試しください。',
            details: 'サーバーが混雑しています',
          },
          { status: 503 }
        );
      }

      if (error.error.type === 'authentication_error') {
        return NextResponse.json(
          {
            error: 'API認証エラー',
            details: 'ANTHROPIC_API_KEYを確認してください',
          },
          { status: 401 }
        );
      }

      if (error.error.type === 'invalid_request_error') {
        return NextResponse.json(
          {
            error: 'APIリクエストエラー',
            details: error.error.message || 'リクエストパラメータを確認してください',
          },
          { status: 400 }
        );
      }
    }

    // 一般的なエラー
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