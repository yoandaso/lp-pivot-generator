import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { url } = await request.json();
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `以下のURLのサービスを分析して、JSON形式で返してください。URLの内容を推測して構いません。

URL: ${url}

以下の形式で返してください（JSON以外の文字は一切含めないでください）:
{
  "serviceName": "サービス名",
  "features": ["主要機能1", "主要機能2", "主要機能3"],
  "targetCustomer": "ターゲット顧客の説明",
  "valueProposition": "提供価値の説明"
}`
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const analyzed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    
    return NextResponse.json(analyzed);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: '分析に失敗しました' },
      { status: 500 }
    );
  }
}