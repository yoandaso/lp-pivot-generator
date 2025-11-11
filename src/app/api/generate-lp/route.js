import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

async function callClaudeWithRetry(anthropic, messages, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${maxRetries}`);
      
      const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 8000,
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
        content: `あなたは世界トップクラスのマーケター兼コピーライターです。コンバージョン率の高い、感情に訴えかけるランディングページのコンテンツを生成してください。

【基本情報】
サービス名: ${serviceName}
ターゲット顧客: ${targetCustomer}

【選択されたピボット案】
${JSON.stringify(selectedPivot, null, 2)}

【重要な要件】
1. **数字で説得する**: すべての主張に具体的な数字を含める（50%削減、3倍向上、月間100時間節約など）
2. **感情に訴える**: 不安→希望→成功への道筋を描く。顧客の痛みに共感し、未来の喜びを想像させる
3. **ストーリーで魅了する**: 導入事例は実在するかのようなリアルな企業名・人名で、ドラマチックな変化を描く
4. **信頼を構築する**: お客様の声は5段階評価つきで、具体的な成果数値を含む
5. **差別化を明確に**: 競合との違いを「なぜ他社ではできないのか」という形で説明
6. **緊急性を演出**: CTAには限定性や緊急性を持たせる（例：今なら○○、先着○名様限定）

以下のJSON形式で、魅力的で説得力のあるLPコンテンツを生成してください：

{
  "serviceName": "${serviceName}",
  "catchphrase": "心を揺さぶる強力なキャッチコピー（50-70文字。感情に訴える）",
  "subCatchphrase": "具体的な成果を示すサブヘッド（例：導入3日で業務時間50%削減、月間コスト80万円減を実現）",
  "problems": [
    "痛みを感じる課題1（数字と状況を含む。例：月間60時間を○○に費やし、年間720万円の機会損失が発生）",
    "感情的な痛みを伴う課題2（ストレス、不安、焦りなど）",
    "金銭的・時間的損失を含む課題3"
  ],
  "solution": "250文字程度の詳細なソリューション説明。どのように課題を解決し、どんな明るい未来が待っているかを情熱的に描写。具体的な数字と感情的なベネフィットを両方含める",
  "useCases": [
    {
      "title": "劇的な成果を含むタイトル（例：月間コスト80万円削減、売上30%増加を実現）",
      "persona": "○○株式会社 マーケティング部長 山田太郎様（45歳）",
      "situation": "導入前の具体的な苦労。数字と感情を含めてリアルに描写（250文字程度）",
      "result": "導入後の劇的な変化。Before/Afterの数字を明確に。感動的なストーリーで（200文字程度）",
      "quote": "山田様の生の声。感情と成果を含む印象的なコメント（80-100文字）"
    },
    {
      "title": "導入事例2（別の業界・職種）",
      "persona": "具体的な企業・役職・名前・年齢",
      "situation": "導入前の課題",
      "result": "劇的な改善",
      "quote": "お客様の声"
    },
    {
      "title": "導入事例3（さらに別の業界）",
      "persona": "具体的な企業・役職・名前・年齢",
      "situation": "導入前の課題",
      "result": "劇的な改善",
      "quote": "お客様の声"
    }
  ],
  "features": [
    {
      "title": "機能名1",
      "description": "機能の詳細説明（どう動作するか）100文字程度",
      "benefit": "この機能で得られる具体的な成果（数字を含む。例：作業時間を70%短縮）"
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
      "導入前の課題1（具体的な時間・コスト・損失を含む。例：月間80時間を手作業に費やし、年間960時間＝約1200万円相当を浪費）",
      "導入前の課題2（機会損失や精神的負担を含む）",
      "導入前の課題3（競合に負ける、顧客満足度低下など）"
    ],
    "after": [
      "導入後の劇的な改善1（数字で示す。例：月間5時間に削減し、年間900時間＝約1125万円を本業に投資可能に）",
      "導入後の改善2（売上増加、コスト削減など金銭的成果）",
      "導入後の改善3（精神的余裕、顧客満足度向上など）"
    ]
  },
  "strengths": [
    "差別化ポイント1：競合との決定的な違いを明確に。「なぜ他社ではできないか」を説明（業界唯一の○○技術、特許取得済みのアルゴリズムなど）",
    "差別化ポイント2：具体的な優位性（処理速度が競合の3倍、導入実績No.1など）",
    "差別化ポイント3：独自の強み（専門家チームによる無料サポート、返金保証など）"
  ],
  "testimonials": [
    {
      "name": "○○株式会社 代表取締役 田中一郎様",
      "company": "従業員50名 / IT企業 / 東京都渋谷区",
      "content": "具体的なお客様の声。導入の決め手、使用感、劇的な成果を含む感動的なコメント（150-200文字）",
      "result": "月間売上30%増加、業務時間50%削減を実現",
      "rating": 5
    },
    {
      "name": "株式会社△△ マーケティング部長 佐藤花子様",
      "company": "従業員200名 / 製造業 / 愛知県名古屋市",
      "content": "具体的な声（150-200文字）",
      "result": "コスト60%削減、生産性2倍向上",
      "rating": 5
    },
    {
      "name": "××商事 営業課長 鈴木次郎様",
      "company": "従業員30名 / 商社 / 大阪府大阪市",
      "content": "具体的な声（150-200文字）",
      "result": "業務時間70%短縮、顧客満足度95%達成",
      "rating": 5
    }
  ],
  "dailyWorkflow": [
    {
      "time": "朝（8:00）",
      "task": "具体的なタスク内容と効果",
      "duration": "5分",
      "improvement": "従来の30分から5分に短縮（83%削減）"
    },
    {
      "time": "昼（12:00）",
      "task": "タスク",
      "duration": "10分",
      "improvement": "改善内容（数字を含む）"
    },
    {
      "time": "夕（17:00）",
      "task": "タスク",
      "duration": "5分",
      "improvement": "改善内容（数字を含む）"
    }
  ],
  "steps": [
    {
      "title": "Step 1: 簡単登録（30秒）",
      "description": "メールアドレスだけで即座に利用開始。クレジットカード登録不要、今すぐ無料で体験"
    },
    {
      "title": "Step 2: 自動設定（3分）",
      "description": "AIが最適な設定を自動で提案。専門知識不要で誰でも簡単にスタート"
    },
    {
      "title": "Step 3: すぐに効果実感（即日）",
      "description": "初日から業務効率化を実感。平均で初週に30%の生産性向上を達成"
    }
  ],
  "ctaText": "今すぐ無料で始める（14日間完全無料トライアル）",
  "ctaSubtext": "クレジットカード登録不要 / 30秒で利用開始 / いつでもキャンセル可能"
}

**重要**: JSONのみを返してください。マークダウンのコードブロック記号も不要です。純粋なJSONオブジェクトのみを出力してください。`,
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