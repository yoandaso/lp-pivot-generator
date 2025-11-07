import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { analyzed } = await request.json();
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `以下のサービス情報を基に、4つの差別化されたピボット案を生成してください。

元サービス:
- 名前: ${analyzed.serviceName}
- 機能: ${analyzed.features.join(', ')}
- ターゲット: ${analyzed.targetCustomer}
- 価値: ${analyzed.valueProposition}

以下の形式のJSONで返してください（JSON以外の文字は一切含めないでください）:
{
  "pivots": [
    {
      "title": "案のタイトル",
      "differentiators": ["差別化ポイント1", "差別化ポイント2", "差別化ポイント3"],
      "targetAudience": "想定ターゲット",
      "difference": "元サービスとの違いの説明"
    }
  ]
}`
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Pivots generation error:', error);
    return NextResponse.json(
      { error: 'ピボット案の生成に失敗しました' },
      { status: 500 }
    );
  }
}