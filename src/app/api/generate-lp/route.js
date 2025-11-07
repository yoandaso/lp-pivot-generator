import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { pivot, analyzedData } = await request.json();
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: `以下のピボット案に基づいて、ランディングページの内容を生成してください。

ピボット案:
- タイトル: ${pivot.title}
- 差別化: ${pivot.differentiators.join(', ')}
- ターゲット: ${pivot.targetAudience}
- 違い: ${pivot.difference}

元サービス: ${analyzedData.serviceName}

以下の形式のJSONで返してください（JSON以外の文字は一切含めないでください）:
{
  "serviceName": "新サービス名",
  "catchphrase": "キャッチコピー",
  "problems": ["課題1", "課題2", "課題3"],
  "solution": "ソリューションの説明",
  "features": [
    {"title": "機能名1", "description": "説明1"},
    {"title": "機能名2", "description": "説明2"},
    {"title": "機能名3", "description": "説明3"}
  ],
  "strengths": ["強み1", "強み2", "強み3"],
  "steps": [
    {"title": "ステップ1", "description": "説明1"},
    {"title": "ステップ2", "description": "説明2"},
    {"title": "ステップ3", "description": "説明3"}
  ],
  "ctaText": "CTAボタンテキスト"
}`
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const lp = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    
    return NextResponse.json(lp);
  } catch (error) {
    console.error('LP generation error:', error);
    return NextResponse.json(
      { error: 'LP生成に失敗しました' },
      { status: 500 }
    );
  }
}