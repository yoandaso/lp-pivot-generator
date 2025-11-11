import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

async function callClaudeWithRetry(anthropic, messages, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${maxRetries}`);
      
      const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 6000,
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
  console.log('=== Generate LP API Called ===');
  
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY環境変数が設定されていません' },
        { status: 500 }
      );
    }

    const { serviceName, targetCustomer, selectedPivot } = await request.json();
    console.log('Generating LP for:', serviceName);

    if (!serviceName || !targetCustomer || !selectedPivot) {
      return NextResponse.json(
        { error: '必要な情報が不足しています' },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await callClaudeWithRetry(anthropic, [
      {
        role: 'user',
        content: `あなたはトップマーケター兼コピーライターとして、コンバージョン率の高いランディングページのコンテンツを生成してください。

【基本情報】
サービス名: ${serviceName}
ターゲット顧客: ${targetCustomer}

【選択されたピボット案】
${JSON.stringify(selectedPivot, null, 2)}

【重要な要件】
1. 具体的な数字を必ず含める（時間削減率、コスト削減額、成功率など）
2. 感情に訴える表現を使う（不安→希望→成功への道筋）
3. 利用シーンは具体的な企業名（架空）と担当者名でリアルなストーリーを描く
4. ビフォー・アフターは劇的な変化を定量的に示す（50%以上の改善）
5. 強みは「なぜ競合ではできないのか」を明確にする
6. お客様の声は信頼性が高く、具体的な成果数値を含む
7. CTAは緊急性と行動を促す表現にする
8. すべての説明に「どんな価値があるか」を含める

以下のJSON形式で、具体的で説得力のある内容を生成してください：

{
  "serviceName": "サービス名",
  "catchphrase": "感情に訴える強力なキャッチフレーズ（60文字以内）",
  "subCatchphrase": "具体的な成果を示すサブヘッド（例：導入3日で業務時間50%削減を実現）",
  "problems": [
    "具体的な課題1（数字や状況を含む。例：月間60時間を○○に費やし、本業に集中できない）",
    "具体的な課題2（感情的な痛みを含む）",
    "具体的な課題3（金銭的・時間的損失を含む）"
  ],
  "solution": "200文字程度の詳細なソリューション説明。どのように課題を解決し、どんな未来が待っているかを描写",
  "useCases": [
    {
      "title": "導入事例タイトル（成果を含む。例：月間コスト80万円削減に成功）",
      "persona": "○○株式会社 △△部 ××課長 山田太郎様（具体的に）",
      "situation": "導入前の具体的な状況。数字を含めてリアルに（200文字程度）",
      "result": "導入後の劇的な成果。Before/Afterの数字を明確に（150文字程度）",
      "quote": "山田様の生の声（50-80文字。感情と成果を含む）"
    },
    {
      "title": "導入事例2",
      "persona": "具体的な企業・役職・名前",
      "situation": "課題の詳細",
      "result": "改善の詳細",
      "quote": "お客様の声"
    },
    {
      "title": "導入事例3",
      "persona": "具体的な企業・役職・名前",
      "situation": "課題の詳細",
      "result": "改善の詳細",
      "quote": "お客様の声"
    }
  ],
  "features": [
    {
      "title": "機能名",
      "description": "機能の詳細説明（どう動作するか）",
      "benefit": "この機能で得られる具体的な成果（数字を含む）"
    },
    {
      "title": "機能名2",
      "description": "詳細",
      "benefit": "成果"
    },
    {
      "title": "機能名3",
      "description": "詳細",
      "benefit": "成果"
    }
  ],
  "beforeAfter": {
    "before": [
      "導入前の課題1（具体的な時間・コスト。例：月間80時間を手作業に費やし、年間960時間を浪費）",
      "導入前の課題2（機会損失を含む）",
      "導入前の課題3（精神的負担を含む）"
    ],
    "after": [
      "導入後の改善1（劇的な数字。例：月間5時間まで削減し、年間900時間を本業に投資可能に）",
      "導入後の改善2（金銭的な成果）",
      "導入後の改善3（精神的な余裕）"
    ]
  },
  "strengths": [
    "競合との差別化ポイント1。「なぜ他社ではできないか」を明確に（業界唯一の○○技術など）",
    "差別化ポイント2（具体的な優位性）",
    "差別化ポイント3（独自の強み）"
  ],
  "testimonials": [
    {
      "name": "○○株式会社 代表取締役 田中一郎様",
      "company": "従業員50名 / IT企業",
      "content": "具体的なお客様の声。導入の決め手、使用感、成果を含む（100-150文字）",
      "result": "月間売上30%増加",
      "rating": 5
    },
    {
      "name": "株式会社△△ マーケティング部長 佐藤花子様",
      "company": "従業員200名 / 製造業",
      "content": "具体的な声",
      "result": "コスト50%削減",
      "rating": 5
    },
    {
      "name": "××商事 営業課長 鈴木次郎様",
      "company": "従業員30名 / 商社",
      "content": "具体的な声",
      "result": "業務時間70%短縮",
      "rating": 5
    }
  ],
  "dailyWorkflow": [
    {
      "time": "朝（8:00）",
      "task": "具体的なタスク内容と効果",
      "duration": "5分",
      "improvement": "従来の30分から5分に短縮"
    },
    {
      "time": "昼（12:00）",
      "task": "タスク",
      "duration": "10分",
      "improvement": "改善内容"
    },
    {
      "time": "夕（17:00）",
      "task": "タスク",
      "duration": "5分",
      "improvement": "改善内容"
    }
  ],
  "steps": [
    {
      "title": "Step 1: 簡単登録（30秒）",
      "description": "メールアドレスだけで即座に利用開始。クレジットカード不要"
    },
    {
      "title": "Step 2: 自動設定（3分）",
      "description": "AIが最適な設定を自動で提案。専門知識不要"
    },
    {
      "title": "Step 3: すぐに効果実感（即日）",
      "description": "初日から業務効率化を実感。平均で初週に30%の改善"
    }
  ],
  "ctaText": "今すぐ無料で始める（14日間完全無料）",
  "ctaSubtext": "クレジットカード登録不要 / 30秒で利用開始"
}

JSONのみを返してください。他の説明は不要です。`,
      },
    ]);

    const responseText = message.content[0].text;
    let jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const lpData = JSON.parse(jsonText);
    
    console.log('LP generation successful');
    return NextResponse.json(lpData);

  } catch (error) {
    console.error('=== Generate LP Error ===');
    console.error('Error:', error.message);

    if (error.error && error.error.type === 'overloaded_error') {
      return NextResponse.json(
        { error: 'APIが一時的に過負荷状態です。30秒後に再度お試しください。' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'LP生成に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}
