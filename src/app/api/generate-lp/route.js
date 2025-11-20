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
        content: `あなたは世界トップクラスのマーケティングストラテジスト兼コピーライターです。深い顧客理解に基づき、一貫性があり説得力の高いランディングページを生成してください。

【基本情報】
サービス名: ${serviceName}
ターゲット顧客: ${targetCustomer}
差別化戦略: ${JSON.stringify(selectedPivot, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【STEP 1: サービスの本質理解】（最重要）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

まず、以下を深く分析してください：

1. **サービスの核心価値**は何か？
   - このサービスは顧客の「どんな状態」を「どんな状態」に変えるのか？
   - なぜそれが重要なのか？

2. **典型的な利用シーン**は？
   - 顧客はいつ、どこで、どのような状況でこのサービスを使うのか？
   - 1日の業務フローのどの部分に入り込むのか？

3. **ビジネスモデル**は？
   - SaaS（月額/年額課金）
   - マーケットプレイス（取引手数料）
   - プロダクト販売（買い切り）
   - サービス提供（時間単位・プロジェクト単位）
   - その他
   ※ CTA・料金表現はこれに基づいて適切に変更すること

4. **真の競合**は誰か？
   - 顧客は現在、この課題をどう解決しているか？（代替手段）
   - なぜ既存の方法では不十分なのか？

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【STEP 2: 顧客課題の深掘り】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

表面的な課題ではなく、**根本的な痛み**を特定してください：

❌ NG例: 「作業に時間がかかる」
✅ OK例: 「手作業で月間80時間を費やし、本来注力すべき戦略立案ができず、競合に市場シェアを奪われている」

課題は以下の構造で記述すること：
1. **具体的な状況**（いつ、どこで、何が起きているか）
2. **定量的な損失**（時間、コスト、機会損失）
3. **感情的な痛み**（焦り、不安、ストレス、諦め）
4. **ビジネスへの影響**（売上減、離職、競合劣位）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【STEP 3: ソリューションと因果関係】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ソリューション説明では必ず以下を含めること：

1. **メカニズム**: なぜこの方法で課題が解決されるのか？
2. **因果関係**: 機能 → 直接的な効果 → 最終的な成果
3. **差別化根拠**: なぜ他の方法ではなく、これなのか？

例：
「AIが過去10万件の商談データを学習し、あなたの商談内容から成約確率を90%の精度で予測。優先順位が明確になるため、成約率の高い案件に注力でき、営業効率が3倍向上。結果として売上が50%増加します」

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【STEP 4: リアルな顧客の声の生成】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

顧客の声には以下を必ず含めること：

1. **導入前の具体的な苦労** - ストーリー性のある描写
2. **導入のきっかけ** - なぜ決断したのか？
3. **使用感の生々しい描写** - 実際に使った時の感覚
4. **予想外の副次効果** - 期待以上だった点
5. **導入後の数値変化** - Before/After

❌ NG例: 「使いやすくて良かったです」
✅ OK例: 「導入前は毎朝1時間かけてデータ集計していました。Excelとにらめっこで目も疲れるし、ミスも多くて。でも◯◯を使い始めたら、朝会社に着いた時には既にレポートが完成していて、その1時間を顧客訪問に使えるようになりました。3ヶ月で新規顧客が12社増え、売上が800万円伸びたんです」

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【STEP 5: 一貫性の担保】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LP全体で以下を統一してください：

1. **メインメッセージ**を1つ決め、全セクションで一貫させる
2. **数字の整合性**を取る（課題の時間 → 改善後の時間など）
3. **ターゲット顧客の具体像**を統一する
4. **業界・職種**を統一する（BtoB SaaSならマーケター、営業など）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【出力JSON形式】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "serviceName": "${serviceName}",
  "coreValue": "このサービスの核心価値を1文で（例：営業活動を可視化し、成約率を2倍にするAI営業支援）",
  "catchphrase": "核心価値に基づく一貫したキャッチコピー（50-70文字。ターゲット顧客の最大の痛みに直接語りかける）",
  "subCatchphrase": "具体的な利用シーンと成果（例：商談の優先順位を自動判定し、月間営業時間を60時間削減）",
  
  "problems": [
    {
      "situation": "具体的な状況描写（いつ、どこで、何が）",
      "loss": "定量的な損失（時間・コスト・機会損失を数字で）",
      "emotion": "感情的な痛み（具体的に）",
      "impact": "ビジネスへの影響"
    },
    {
      "situation": "別の状況（異なる切り口で）",
      "loss": "定量的な損失",
      "emotion": "感情的な痛み",
      "impact": "ビジネスへの影響"
    },
    {
      "situation": "さらに別の状況",
      "loss": "定量的な損失",
      "emotion": "感情的な痛み",
      "impact": "ビジネスへの影響"
    }
  ],
  
  "solution": {
    "overview": "ソリューション概要（150文字程度）",
    "mechanism": "なぜこの方法で解決できるのか？仕組みを説明（150文字程度）",
    "differentiation": "なぜ他の方法ではなく、これなのか？（100文字程度）",
    "outcome": "最終的にどんな状態になるか？明るい未来を描写（150文字程度）"
  },
  
  "useCases": [
    {
      "title": "具体的な成果を含むタイトル（数字必須）",
      "persona": "○○株式会社 △△部 ××様（年齢・役職）",
      "company": "従業員数・業種・所在地",
      "beforeSituation": "導入前の具体的な苦労をストーリー形式で（200-250文字）",
      "trigger": "なぜ導入を決めたのか？きっかけ（50-80文字）",
      "afterResult": "導入後の変化をストーリー形式で（200-250文字）",
      "numbers": {
        "before": "導入前の数字（例：月間80時間）",
        "after": "導入後の数字（例：月間5時間）",
        "improvement": "改善率（例：93.75%削減）"
      },
      "quote": "生々しい実感を伴った感想（100-150文字。具体的なエピソードを含む）",
      "unexpectedBenefit": "予想外の良かった点（50文字程度）"
    },
    {
      "title": "別の業界・職種の事例（数字必須）",
      "persona": "具体的な企業・役職・名前・年齢",
      "company": "従業員数・業種・所在地",
      "beforeSituation": "導入前のストーリー",
      "trigger": "導入のきっかけ",
      "afterResult": "導入後のストーリー",
      "numbers": {
        "before": "導入前",
        "after": "導入後",
        "improvement": "改善率"
      },
      "quote": "生々しい感想",
      "unexpectedBenefit": "予想外の良かった点"
    },
    {
      "title": "さらに別の業界の事例（数字必須）",
      "persona": "具体的な企業・役職・名前・年齢",
      "company": "従業員数・業種・所在地",
      "beforeSituation": "導入前のストーリー",
      "trigger": "導入のきっかけ",
      "afterResult": "導入後のストーリー",
      "numbers": {
        "before": "導入前",
        "after": "導入後",
        "improvement": "改善率"
      },
      "quote": "生々しい感想",
      "unexpectedBenefit": "予想外の良かった点"
    }
  ],
  
  "features": [
    {
      "title": "機能名1",
      "description": "機能の動作説明（100文字程度）",
      "mechanism": "なぜこの機能が効果的なのか？仕組み（80文字）",
      "benefit": "具体的な成果（数字を含む）",
      "useCase": "実際の利用シーン（50文字）"
    },
    {
      "title": "機能名2",
      "description": "動作説明",
      "mechanism": "仕組み",
      "benefit": "成果",
      "useCase": "利用シーン"
    },
    {
      "title": "機能名3",
      "description": "動作説明",
      "mechanism": "仕組み",
      "benefit": "成果",
      "useCase": "利用シーン"
    }
  ],
  
  "beforeAfter": {
    "before": [
      {
        "issue": "課題の具体的な描写",
        "time": "時間的損失（数字）",
        "cost": "金銭的損失（数字）",
        "emotion": "感情的な負担"
      },
      {
        "issue": "課題2",
        "time": "時間的損失",
        "cost": "金銭的損失",
        "emotion": "感情的な負担"
      },
      {
        "issue": "課題3",
        "time": "時間的損失",
        "cost": "金銭的損失",
        "emotion": "感情的な負担"
      }
    ],
    "after": [
      {
        "improvement": "改善の具体的な描写",
        "time": "削減された時間（数字）",
        "cost": "削減されたコスト（数字）",
        "emotion": "得られた感情的なベネフィット"
      },
      {
        "improvement": "改善2",
        "time": "削減時間",
        "cost": "削減コスト",
        "emotion": "感情的ベネフィット"
      },
      {
        "improvement": "改善3",
        "time": "削減時間",
        "cost": "削減コスト",
        "emotion": "感情的ベネフィット"
      }
    ]
  },
  
  "strengths": [
    {
      "point": "差別化ポイント1",
      "why": "なぜ他社ではできないのか？技術的・構造的な理由",
      "proof": "裏付けとなる事実（特許、実績、データなど）"
    },
    {
      "point": "差別化ポイント2",
      "why": "他社との違いの理由",
      "proof": "裏付け"
    },
    {
      "point": "差別化ポイント3",
      "why": "他社との違いの理由",
      "proof": "裏付け"
    }
  ],
  
  "testimonials": [
    {
      "name": "○○株式会社 △△部 ××様",
      "age": "年齢（例：45歳）",
      "role": "役職",
      "company": "従業員数・業種・所在地",
      "beforeStory": "導入前の苦労を具体的に（100文字）",
      "afterStory": "導入後の変化を具体的に（100文字）",
      "realFeeling": "実際に使った時の生々しい感想（150-200文字。具体的なエピソード付き）",
      "numbers": {
        "metric1": "成果指標1（例：売上30%増）",
        "metric2": "成果指標2（例：工数50%減）"
      },
      "rating": 5
    },
    {
      "name": "別の企業・役職・名前",
      "age": "年齢",
      "role": "役職",
      "company": "企業情報",
      "beforeStory": "導入前",
      "afterStory": "導入後",
      "realFeeling": "生々しい感想",
      "numbers": {
        "metric1": "成果1",
        "metric2": "成果2"
      },
      "rating": 5
    },
    {
      "name": "さらに別の企業・役職・名前",
      "age": "年齢",
      "role": "役職",
      "company": "企業情報",
      "beforeStory": "導入前",
      "afterStory": "導入後",
      "realFeeling": "生々しい感想",
      "numbers": {
        "metric1": "成果1",
        "metric2": "成果2"
      },
      "rating": 5
    }
  ],
  
  "dailyWorkflow": [
    {
      "time": "具体的な時刻（例：朝8:30）",
      "scene": "どんな状況か（例：出社直後、メールチェック前）",
      "task": "このサービスで何をするか",
      "before": "従来の方法と所要時間",
      "after": "改善後の所要時間",
      "improvement": "削減率（%）",
      "feeling": "使用時の実感"
    },
    {
      "time": "時刻",
      "scene": "状況",
      "task": "タスク",
      "before": "従来",
      "after": "改善後",
      "improvement": "削減率",
      "feeling": "実感"
    },
    {
      "time": "時刻",
      "scene": "状況",
      "task": "タスク",
      "before": "従来",
      "after": "改善後",
      "improvement": "削減率",
      "feeling": "実感"
    }
  ],
  
  "steps": [
    {
      "number": 1,
      "title": "Step 1: 開始方法（所要時間）",
      "description": "具体的な手順。ビジネスモデルに応じた適切な表現を使用",
      "ease": "なぜ簡単なのか？"
    },
    {
      "number": 2,
      "title": "Step 2: セットアップ（所要時間）",
      "description": "具体的な手順",
      "ease": "なぜ簡単なのか？"
    },
    {
      "number": 3,
      "title": "Step 3: 効果実感（時期）",
      "description": "いつから、どんな効果を実感できるか",
      "ease": "すぐに効果が出る理由"
    }
  ],
  
  "businessModel": "SaaS/マーケットプレイス/プロダクト販売/サービス提供/その他（どれか1つ）",
  
  "cta": {
    "primary": "ビジネスモデルに応じた適切なCTA（例：SaaSなら「14日間無料トライアル」、プロダクトなら「今すぐ購入」、サービスなら「無料相談を予約」）",
    "subtext": "不安を取り除く補足情報（ビジネスモデルに応じて変更）",
    "urgency": "緊急性・限定性（自然な範囲で）"
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【最重要ルール】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ✅ **一貫性**: 全セクションで同じメインメッセージを伝える
2. ✅ **具体性**: 抽象的な表現は避け、具体的なシーン・数字を使う
3. ✅ **因果関係**: 「なぜ」を必ず説明する
4. ✅ **リアリティ**: 顧客の声は実際に使った実感を伴う内容にする
5. ✅ **ビジネスモデル適合**: CTAや料金表現をサービスタイプに合わせる
6. ✅ **数字の整合性**: Before/Afterの数字に矛盾がないようにする

**重要**: JSONのみを返してください。マークダウンのコードブロック記号は不要です。純粋なJSONオブジェクトのみを出力してください。`,
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