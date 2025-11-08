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
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: `以下のサービス情報を基に、3つのカテゴリに分けて、合計6つの差別化されたピボット案を生成してください。

元サービス:
- 名前: ${analyzed.serviceName}
- カテゴリ: ${analyzed.category || '不明'}
- 機能: ${analyzed.features.join(', ')}
- ターゲット: ${analyzed.targetCustomer}
- 価値: ${analyzed.valueProposition}

【顧客面での評価点】
${analyzed.customerAnalysis.strengths.join('\n- ')}
【顧客面での課題】
${analyzed.customerAnalysis.challenges.join('\n- ')}

【サービス面での評価点】
${analyzed.serviceAnalysis.strengths.join('\n- ')}
【サービス面での課題】
${analyzed.serviceAnalysis.challenges.join('\n- ')}

【ピボットの3つのカテゴリ】

■ カテゴリ1: 顧客対象をピボット（2案生成）
活用する技術やコア機能は維持したまま、異なる顧客層にアプローチする案を考えてください。
例: BtoC → BtoB、一般向け → 特定業界向け、個人 → 企業、若年層 → シニア層など

■ カテゴリ2: 技術・課題をピボット（2案生成）
ターゲット顧客は維持しつつ、解決する課題、提供価値、使用技術を変更する案を考えてください。
例: 機能の絞り込み、機能の拡張、別の課題解決、技術的アプローチの変更など

■ カテゴリ3: 大胆にピボット（2案生成）
元サービスのコアコンセプトやブランドイメージのみを残し、大きく方向転換する案を考えてください。
例: 提供形態の変更（SaaS → マーケットプレイス）、全く異なる市場への展開、ビジネスモデルの転換など

【重要な指示】
- 各カテゴリで明確に異なるアプローチを取ること
- 実現可能性とビジネスインパクトを考慮すること
- 具体的で説得力のある差別化ポイントを提示すること

以下の形式のJSONで返してください（JSON以外の文字は一切含めないでください）:
{
  "pivots": [
    {
      "category": "顧客対象をピボット",
      "title": "案のタイトル",
      "differentiators": ["差別化ポイント1", "差別化ポイント2", "差別化ポイント3"],
      "targetAudience": "想定ターゲット",
      "difference": "元サービスとの違いの説明"
    },
    {
      "category": "顧客対象をピボット",
      "title": "案のタイトル",
      "differentiators": ["差別化ポイント1", "差別化ポイント2", "差別化ポイント3"],
      "targetAudience": "想定ターゲット",
      "difference": "元サービスとの違いの説明"
    },
    {
      "category": "技術・課題をピボット",
      "title": "案のタイトル",
      "differentiators": ["差別化ポイント1", "差別化ポイント2", "差別化ポイント3"],
      "targetAudience": "想定ターゲット",
      "difference": "元サービスとの違いの説明"
    },
    {
      "category": "技術・課題をピボット",
      "title": "案のタイトル",
      "differentiators": ["差別化ポイント1", "差別化ポイント2", "差別化ポイント3"],
      "targetAudience": "想定ターゲット",
      "difference": "元サービスとの違いの説明"
    },
    {
      "category": "大胆にピボット",
      "title": "案のタイトル",
      "differentiators": ["差別化ポイント1", "差別化ポイント2", "差別化ポイント3"],
      "targetAudience": "想定ターゲット",
      "difference": "元サービスとの違いの説明"
    },
    {
      "category": "大胆にピボット",
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