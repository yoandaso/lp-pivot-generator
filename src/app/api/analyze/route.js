import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

async function callClaudeWithRetry(anthropic, messages, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${maxRetries}`);
      
      const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',  // Haikuに変更
        max_tokens: 2000,
        messages,
      });
      
      return message;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      
      if (error.error?.type === 'overloaded_error' && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 5000; // 5秒, 10秒, 20秒, 40秒, 80秒
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
        content: `以下のサービスのURLを分析して、JSON形式で情報を抽出してください。

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
      return NextResponse.j