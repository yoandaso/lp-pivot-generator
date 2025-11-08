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
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `以下のピボット案に基づいて、具体的でイメージしやすいランディングページの内容を生成してください。

ピボット案:
- タイトル: ${pivot.title}
- カテゴリ: ${pivot.category}
- 差別化: ${pivot.differentiators.join(', ')}
- ターゲット: ${pivot.targetAudience}
- 違い: ${pivot.difference}

元サービス: ${analyzedData.serviceName}

【重要な指示】
- 抽象的な表現を避け、具体的なシーンや数値を使ってください
- ターゲット顧客が「自分ごと」として捉えられる内容にしてください
- 実際の業務での活用イメージが湧く内容にしてください

以下の形式のJSONで返してください（JSON以外の文字は一切含めないでください）:
{
  "serviceName": "新サービス名（キャッチーで具体的に）",
  "catchphrase": "キャッチコピー（ターゲットの課題を明確に）",
  "problems": [
    "具体的な課題1（「〇〇に3時間かかる」など数値を含む）",
    "具体的な課題2",
    "具体的な課題3"
  ],
  "solution": "ソリューションの説明（どう解決するか具体的に）",
  "useCases": [
    {
      "title": "利用シーン1のタイトル",
      "persona": "ペルソナ（例: マーケティング担当の田中さん）",
      "situation": "具体的な状況説明",
      "result": "導入後の結果（数値を含む）"
    },
    {
      "title": "利用シーン2のタイトル",
      "persona": "ペルソナ",
      "situation": "具体的な状況説明",
      "result": "導入後の結果"
    },
    {
      "title": "利用シーン3のタイトル",
      "persona": "ペルソナ",
      "situation": "具体的な状況説明",
      "result": "導入後の結果"
    }
  ],
  "features": [
    {"title": "機能名1", "description": "具体的な説明（何ができるか明確に）"},
    {"title": "機能名2", "description": "具体的な説明"},
    {"title": "機能名3", "description": "具体的な説明"}
  ],
  "beforeAfter": {
    "before": [
      "導入前の状態1（具体的に）",
      "導入前の状態2",
      "導入前の状態3"
    ],
    "after": [
      "導入後の状態1（数値を含む改善）",
      "導入後の状態2",
      "導入後の状態3"
    ]
  },
  "strengths": [
    "強み1（競合との違いが明確）",
    "強み2",
    "強み3"
  ],
  "dailyWorkflow": [
    {"time": "朝（9:00）", "task": "具体的なタスク", "duration": "所要時間"},
    {"time": "昼（12:00）", "task": "具体的なタスク", "duration": "所要時間"},
    {"time": "夕（17:00）", "task": "具体的なタスク", "duration": "所要時間"}
  ],
  "steps": [
    {"title": "ステップ1", "description": "具体的な説明"},
    {"title": "ステップ2", "description": "具体的な説明"},
    {"title": "ステップ3", "description": "具体的な説明"}
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