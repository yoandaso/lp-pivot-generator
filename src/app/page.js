'use client';

import React, { useState } from 'react';
import { Loader2, ArrowRight, ArrowLeft, Download, Share2, RefreshCw, Sparkles, Target, Lightbulb, CheckCircle, Users, Zap, TrendingUp, AlertCircle } from 'lucide-react';

const LPPivotGenerator = () => {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analyzedData, setAnalyzedData] = useState(null);
  const [pivotOptions, setPivotOptions] = useState([]);
  const [selectedPivot, setSelectedPivot] = useState(null);
  const [generatedLP, setGeneratedLP] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState(''); 
  const [showShareModal, setShowShareModal] = useState(false);

  // ログ送信用の関数を追加
  const logEvent = async (eventName, eventData) => {
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventName,
          data: eventData
        })
      });
    } catch (error) {
      // エラーは無視（ユーザー体験に影響しないように）
      console.error('Log error:', error);
    }
  };

  
// 共有機能
const shareLP = async () => {
  if (!generatedLP || sharing) return;

  setSharing(true);

  try {
    console.log('Saving LP for sharing...');
    
    // LPをAPIに保存
    const response = await fetch('/api/save-lp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(generatedLP)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Save LP API Error:', errorData);
      throw new Error(errorData.details || errorData.error || '保存に失敗しました');
    }

    const { id, url, data } = await response.json();
    console.log('LP saved successfully:', { id, url });
    
    // localStorageにも保存
    if (typeof window !== 'undefined') {
      localStorage.setItem(`lp-${id}`, JSON.stringify(data));
    }
    
    setShareUrl(url);
    setShowShareModal(true);

  } catch (error) {
    console.error('Share error:', error);
    alert('共有に失敗しました: ' + error.message);
  } finally {
    setSharing(false);
  }
};


// HTMLダウンロード機能
const downloadHTML = () => {
  if (!generatedLP) return;

  // LP全体のHTMLを生成
  const htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${generatedLP.serviceName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <!-- ヒーローセクション -->
  <section class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 px-4">
    <div class="max-w-4xl mx-auto text-center">
      <h1 class="text-5xl font-bold mb-6">${generatedLP.serviceName}</h1>
      <p class="text-2xl mb-8 opacity-90">${generatedLP.catchphrase}</p>
      <button class="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-4 px-8 rounded-lg text-lg transition-colors">
        ${generatedLP.ctaText}
      </button>
    </div>
  </section>

  <!-- 問題提起 -->
  <section class="py-16 px-4 bg-gray-50">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold text-center mb-12 text-gray-900">こんな課題はありませんか?</h2>
      <div class="grid md:grid-cols-3 gap-6">
        ${generatedLP.problems.map(problem => `
          <div class="bg-white p-6 rounded-xl shadow-md">
            <p class="text-gray-700 text-center">${problem}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- ソリューション -->
  <section class="py-16 px-4">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-3xl font-bold mb-6 text-gray-900">解決策</h2>
      <p class="text-xl text-gray-700 leading-relaxed">${generatedLP.solution}</p>
    </div>
  </section>

  <!-- 主要機能 -->
  <section class="py-16 px-4 bg-gray-50">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold text-center mb-12 text-gray-900">主要機能</h2>
      <div class="grid md:grid-cols-3 gap-8">
        ${generatedLP.features.map(feature => `
          <div class="text-center">
            <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-2 text-gray-900">${feature.title}</h3>
            <p class="text-gray-600">${feature.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- 差別化ポイント -->
  <section class="py-16 px-4">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold text-center mb-12 text-gray-900">3つの強み</h2>
      <div class="space-y-4">
        ${generatedLP.strengths.map(strength => `
          <div class="flex items-center gap-4 p-4 bg-indigo-50 rounded-lg">
            <svg class="w-6 h-6 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <p class="text-lg text-gray-800">${strength}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- 使い方 -->
  <section class="py-16 px-4 bg-gray-50">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold text-center mb-12 text-gray-900">簡単3ステップ</h2>
      <div class="grid md:grid-cols-3 gap-8">
        ${generatedLP.steps.map((step, idx) => `
          <div class="text-center">
            <div class="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              ${idx + 1}
            </div>
            <h3 class="text-xl font-bold mb-2 text-gray-900">${step.title}</h3>
            <p class="text-gray-600">${step.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- 最終CTA -->
  <section class="py-20 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-4xl font-bold mb-6">今すぐ始めましょう</h2>
      <p class="text-xl mb-8 opacity-90">無料で試せます</p>
      <button class="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-4 px-8 rounded-lg text-lg transition-colors">
        ${generatedLP.ctaText}
      </button>
    </div>
  </section>

  <!-- フッター -->
  <footer class="py-8 px-4 bg-gray-900 text-white">
    <div class="max-w-4xl mx-auto text-center">
      <p class="text-gray-400">© 2025 ${generatedLP.serviceName}. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>`;

  // Blobを作成してダウンロード
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${generatedLP.serviceName.replace(/\s+/g, '-')}-LP.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};




  // API呼び出し用の関数
  const callAPI = async (endpoint, data) => {
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('API呼び出しに失敗しました');
    }
    
    return response.json();
  };

  // URL分析
const analyzeURL = async () => {
  if (!url.trim()) {
    setError('URLを入力してください');
    return;
  }

  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  if (!urlPattern.test(url)) {
    setError('有効なURLを入力してください');
    return;
  }

  // ログを記録（awaitなし = 非同期で実行）
  logEvent('analyze_button_clicked', {
    url: url,
    timestamp: new Date().toISOString()
  });

  setLoading(true);
  setError('');

  try {
    const analyzed = await callAPI('analyze', { url });
    setAnalyzedData(analyzed);
    await generatePivots(analyzed);
    setStep(2);
    
    // 成功ログ
    logEvent('analyze_success', { url: url });
  } catch (err) {
    setError('分析に失敗しました。もう一度お試しください。');
    console.error(err);
    
    // 失敗ログ
    logEvent('analyze_failed', { 
      url: url, 
      error: err.message 
    });
  } finally {
    setLoading(false);
  }
};

  // ピボット案生成
  const generatePivots = async (analyzed) => {
    setLoading(true);
    try {
      const result = await callAPI('pivots', { analyzed });
      setPivotOptions(result.pivots);
    } catch (err) {
      setError('ピボット案の生成に失敗しました。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // LP生成
  const generateLP = async (pivot) => {
    setSelectedPivot(pivot);
    setLoading(true);
    setStep(3);

    try {
      console.log('Generating LP with data:', {
        serviceName: analyzedData?.serviceName,
        targetCustomer: analyzedData?.targetCustomer,
        selectedPivot: pivot
      });

      if (!analyzedData?.serviceName) {
        throw new Error('サービス名が見つかりません');
      }

      const lp = await callAPI('generate-lp', {
        serviceName: analyzedData.serviceName,
        targetCustomer: analyzedData.targetCustomer,
        selectedPivot: pivot
      });
      
      setGeneratedLP(lp);
    } catch (err) {
      setError('LP生成に失敗しました: ' + err.message);
      console.error('LP generation error:', err);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // リセット
  const reset = () => {
    setStep(1);
    setUrl('');
    setAnalyzedData(null);
    setPivotOptions([]);
    setSelectedPivot(null);
    setGeneratedLP(null);
    setError('');
  };

  // ステップ1: URL入力
  const renderStep1 = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src="/image/logo.png" alt="LP PIVOT" className="h-24 w-auto" />
          </div>
          <p className="text-lg text-gray-600">
            競合サービスを分析して、差別化されたアイデアのLPを自動生成
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ベンチマークサービスのURL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              onKeyPress={(e) => e.key === 'Enter' && analyzeURL()}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={analyzeURL}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                分析開始
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-900 font-medium mb-2">使い方:</p>
            <ol className="text-sm text-indigo-700 space-y-1 list-decimal list-inside">
              <li>参考にしたいサービスのURLを入力</li>
              <li>AIが差別化案を複数提案</li>
              <li>気に入った案のLPが自動生成されます</li>
            </ol>
          </div>
        </div>
      <div className="text-center mb-8">
      </div>
      {/* 活用シーンガイド */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            こんな時に使えます
          </h2>
          <p className="text-gray-600">
            新規事業の検証から、既存サービスのピボットまで
          </p>
        </div>

        {/* 実績・信頼要素（オプション） */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-indigo-600">1分</p>
            <p className="text-xs text-gray-600">で完成</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-600">6案</p>
            <p className="text-xs text-gray-600">の提案</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-600">無料</p>
            <p className="text-xs text-gray-600">登録不要</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* ユースケース1: MVP作成 */}
          <div className="group hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 p-6 rounded-xl transition-all border-2 border-transparent hover:border-indigo-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Lightbulb className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  新規事業のアイデア検証
                </h3>
                <p className="text-gray-700 mb-3">
                  <span className="font-semibold text-indigo-600">「顧客にぶつけるMVPが欲しい」</span>
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  競合サービスを分析して、差別化ポイントを明確にしたモックLPを1分で作成。
                  顧客インタビューや社内プレゼンで、具体的なビジョンを共有できます。
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">開発前に市場反応を確認</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">投資家へのピッチ資料として活用</span>
                </div>
              </div>
            </div>
          </div>

          {/* ユースケース2: アイデア発想 */}
          <div className="group hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 p-6 rounded-xl transition-all border-2 border-transparent hover:border-indigo-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  アイデアに詰まった時の発想支援
                </h3>
                <p className="text-gray-700 mb-3">
                  <span className="font-semibold text-purple-600">「良いアイデアが思い浮かばない」</span>
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  既存サービスから6つの異なる切り口でピボット案を自動生成。
                  「顧客を変える」「技術を変える」「大胆に変える」の3軸で、新しい視点を提供します。
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">思考の壁を突破するきっかけに</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">ブレストの材料として最適</span>
                </div>
              </div>
            </div>
          </div>

          {/* ユースケース3: ピボット検討 */}
          <div className="group hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 p-6 rounded-xl transition-all border-2 border-transparent hover:border-indigo-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  既存サービスのピボットや事業拡張の方向性
                </h3>
                <p className="text-gray-700 mb-3">
                  <span className="font-semibold text-green-600">「今のサービスがうまくいかない」「周辺領域に展開したい」</span>
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  自社サービスのURLを入力すれば、客観的な視点でピボット・事業拡張案を提案。
                  「ターゲットを変える」「機能を絞る」など、具体的な方向性が見えてきます。
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">経営判断の材料として活用</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">チームでピボット方針を議論</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTAエリア */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white text-center">
            <p className="text-lg font-semibold mb-2">
              💡 まずは試してみませんか？
            </p>
            <p className="text-sm opacity-90 mb-4">
              完全無料・登録不要で、今すぐ使えます
            </p>
            <button
              onClick={() => document.querySelector('input[type="text"]').focus()}
              className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-3 px-8 rounded-lg transition-colors shadow-lg"
            >
              上に戻って試してみる ↑
            </button>
          </div>
        </div>

      </div>        
      </div>
    </div>
  );

  // ステップ2: ピボット案選択
const renderStep2 = () => {
  // ピボット案をカテゴリごとにグループ化
  const groupedPivots = {
    '顧客対象をピボット': [],
    '技術・課題をピボット': [],
    '大胆にピボット': []
  };
  
  pivotOptions.forEach(pivot => {
    if (groupedPivots[pivot.category]) {
      groupedPivots[pivot.category].push(pivot);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 py-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => setStep(1)}
          className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </button>

<div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
  <h2 className="text-2xl font-bold text-gray-900 mb-2">元サービスの分析結果</h2>
  {analyzedData && (
    <>
      {/* 基本情報 */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">サービス名</p>
            <p className="text-lg font-semibold text-gray-900">{analyzedData.serviceName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">ターゲット顧客</p>
            <p className="text-gray-700">{analyzedData.targetCustomer}</p>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-500 mb-1">提供価値</p>
          <p className="text-gray-700">{analyzedData.valueProposition}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">主要機能</p>
          <div className="flex flex-wrap gap-2">
            {analyzedData.features.map((feature, idx) => (
              <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ビジネス分析セクション */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 顧客分析 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">顧客について</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <h4 className="font-semibold text-gray-800 text-sm">評価できる点</h4>
              </div>
              <ul className="space-y-2">
                {analyzedData.customerAnalysis.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <h4 className="font-semibold text-gray-800 text-sm">課題</h4>
              </div>
              <ul className="space-y-2">
                {analyzedData.customerAnalysis.challenges.map((challenge, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* サービス・技術分析 */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">サービス・技術について</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <h4 className="font-semibold text-gray-800 text-sm">評価できる点</h4>
              </div>
              <ul className="space-y-2">
                {analyzedData.serviceAnalysis.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <h4 className="font-semibold text-gray-800 text-sm">課題</h4>
              </div>
              <ul className="space-y-2">
                {analyzedData.serviceAnalysis.challenges.map((challenge, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )}
</div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Lightbulb className="w-7 h-7 text-yellow-500" />
          ピボット案を選択してください
        </h2>
        <p className="text-gray-600 mb-8">3つのカテゴリから、合計6つの差別化案を提案します</p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-10">
            {/* カテゴリ1: 顧客対象をピボット */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">顧客対象をピボット</h3>
                  <p className="text-sm text-gray-600">技術は維持、ターゲット顧客を変更</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {groupedPivots['顧客対象をピボット'].map((pivot, idx) => (
                  <PivotCard key={idx} pivot={pivot} onSelect={() => generateLP(pivot)} />
                ))}
              </div>
            </div>

            {/* カテゴリ2: 技術・課題をピボット */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">技術・課題をピボット</h3>
                  <p className="text-sm text-gray-600">顧客は維持、技術や解決課題を変更</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {groupedPivots['技術・課題をピボット'].map((pivot, idx) => (
                  <PivotCard key={idx} pivot={pivot} onSelect={() => generateLP(pivot)} />
                ))}
              </div>
            </div>

            {/* カテゴリ3: 大胆にピボット */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-lg">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">大胆にピボット</h3>
                  <p className="text-sm text-gray-600">コンセプトを活かし、大きく方向転換</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {groupedPivots['大胆にピボット'].map((pivot, idx) => (
                  <PivotCard key={idx} pivot={pivot} onSelect={() => generateLP(pivot)} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ステップ2.5: 寄付画面
const renderStep2_5 = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
    <div className="max-w-2xl w-full">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src="/image/logo.png" alt="LP PIVOT" className="h-24 w-auto" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            からの大切なお願い
          </h2>
        </div>

        {/* メッセージ */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-indigo-600" />
              LP PIVOTは、収益モデルを持たないハッカソン発サービスです
            </p>
            <p>
              生成にはAIのトークン利用料が発生しています。現在、利用者の拡大によってトークンが不足しています。
            </p>
            <p className="font-semibold text-red-600">
              1回の分析＆LP生成で数円のトークン料が発生しており、トークンが切れた場合には利用ができなくなります。
            </p>
            <p className="text-lg font-bold text-gray-900 mt-6">
              もしよろしければ、トークン代のために<span className="text-indigo-600">300円から</span>少額の寄付をお願いいたします。
            </p>
            <p className="text-sm text-gray-600">
              LP PIVOTのサービス継続のために、ご支援いただけますと幸いです。
            </p>
          </div>
        </div>

        {/* 寄付ボタン */}
        <div className="space-y-3 mb-6">
          <a
            href="https://yoandaso.base.shop/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg text-center transition-all shadow-lg hover:shadow-xl"
          >
            💝 寄付をする（300円）
          </a>
          
          <p className="text-xs text-gray-500 text-center">
            ※ 外部の決済サービスに移動します
          </p>
        </div>

        {/* スキップボタン */}
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={() => {
              setStep(3);
              generateLP(selectedPivot);
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            今回はスキップして生成を続ける
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            ※ 寄付は任意です。スキップしても生成は続けられます
          </p>
        </div>

        {/* 戻るボタン */}
        <div className="mt-6">
          <button
            onClick={() => setStep(2)}
            className="w-full text-gray-600 hover:text-gray-700 font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            PIVOT案の選択に戻る
          </button>
        </div>
      </div>
    </div>
  </div>
);




// ピボットカードコンポーネント
const PivotCard = ({ pivot, onSelect }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-200">
    <div className="flex items-start gap-3 mb-4">
      <Target className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
      <h3 className="text-xl font-bold text-gray-900">{pivot.title}</h3>
    </div>
    
    <div className="mb-4">
      <p className="text-sm font-medium text-gray-500 mb-2">差別化ポイント</p>
      <ul className="space-y-1">
        {pivot.differentiators.map((diff, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            {diff}
          </li>
        ))}
      </ul>
    </div>

    <div className="mb-4">
      <p className="text-sm font-medium text-gray-500 mb-1">想定ターゲット</p>
      <p className="text-sm text-gray-700">{pivot.targetAudience}</p>
    </div>

    <div className="mb-4">
      <p className="text-sm font-medium text-gray-500 mb-1">元サービスとの違い</p>
      <p className="text-sm text-gray-700">{pivot.difference}</p>
    </div>

    <button
      onClick={() => {
        setSelectedPivot(pivot);
        setStep(2.5); // 寄付画面へ
      }}
      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
    >
      この案でLP生成
      <ArrowRight className="w-4 h-4" />
    </button>
  </div>
);

  // ステップ3: LP表示
  const renderStep3 = () => {
  if (loading || !generatedLP) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">LPを生成中...<br>（1分くらいかかります）</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 操作バー */}
      <div className="bg-gray-100 text-gray-900 p-4 sticky top-0 z-10 shadow-lg border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              別の案を選ぶ
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors text-gray-900"
            >
              <RefreshCw className="w-4 h-4" />
              最初から
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={downloadHTML}
              className="flex items-center gap-2 bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              ダウンロード
            </button>
            <button 
              onClick={shareLP}
              disabled={sharing}
              className="flex items-center gap-2 bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {sharing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  共有
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* LP内容 */}
      <div className="max-w-6xl mx-auto">
        {/* ヒーローセクション */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">{generatedLP.serviceName}</h1>
            <p className="text-2xl mb-8 opacity-90">{generatedLP.catchphrase}</p>
            <button className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-4 px-8 rounded-lg text-lg transition-colors">
              {generatedLP.ctaText}
            </button>
          </div>
        </section>

        {/* 問題提起 */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">こんな課題はありませんか?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {generatedLP.problems.map((problem, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl shadow-md">
                  <p className="text-gray-700 text-center">{problem}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ソリューション */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">解決策</h2>
            <p className="text-xl text-gray-700 leading-relaxed">{generatedLP.solution}</p>
          </div>
        </section>

        {/* 具体的な利用シーン */}
        {generatedLP.useCases && (
          <section className="py-16 px-4 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">こんな場面で活躍</h2>
              <p className="text-center text-gray-600 mb-12">実際の利用シーンをご紹介します</p>
              <div className="space-y-8">
                {generatedLP.useCases.map((useCase, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-600">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-bold text-xl">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{useCase.title}</h3>
                        <p className="text-sm text-indigo-600 font-medium mb-3">{useCase.persona}</p>
                        <div className="bg-gray-50 rounded-lg p-4 mb-3">
                          <p className="text-sm font-medium text-gray-500 mb-1">状況:</p>
                          <p className="text-gray-700">{useCase.situation}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-sm font-medium text-green-700 mb-1">結果:</p>
                          <p className="text-gray-900 font-semibold">{useCase.result}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 主要機能 */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">主要機能</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {generatedLP.features.map((feature, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ビフォー・アフター比較 */}
        {generatedLP.beforeAfter && (
          <section className="py-16 px-4 bg-gradient-to-r from-gray-50 to-indigo-50">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">導入前と導入後の違い</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">導入前</h3>
                  </div>
                  <ul className="space-y-3">
                    {generatedLP.beforeAfter.before.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-red-500 flex-shrink-0 mt-1">●</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">導入後</h3>
                  </div>
                  <ul className="space-y-3">
                    {generatedLP.beforeAfter.after.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-green-500 flex-shrink-0 mt-1">●</span>
                        <span className="text-gray-700 font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 差別化ポイント */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">3つの強み</h2>
            <div className="space-y-4">
              {generatedLP.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-indigo-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                  <p className="text-lg text-gray-800">{strength}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 1日の業務フロー */}
        {generatedLP.dailyWorkflow && (
          <section className="py-16 px-4 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">1日の業務フロー</h2>
              <p className="text-center text-gray-600 mb-12">実際の1日の使い方をイメージしてみましょう</p>
              
              <div className="relative">
                {/* タイムライン */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-indigo-200 hidden md:block"></div>
                
                <div className="space-y-8">
                  {generatedLP.dailyWorkflow.map((flow, idx) => (
                    <div key={idx} className="relative md:pl-20">
                      <div className="md:absolute left-0 w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold mb-4 md:mb-0 mx-auto md:mx-0">
                        <span className="text-sm">{flow.time.split('（')[0]}</span>
                      </div>
                      <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
                          <h3 className="text-lg font-bold text-gray-900">{flow.task}</h3>
                          <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full self-start">
                            {flow.duration}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{flow.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 最終CTA */}
        <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">今すぐ始めましょう</h2>
            <p className="text-xl mb-8 opacity-90">無料で試せます</p>
            <button className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-4 px-8 rounded-lg text-lg transition-colors">
              {generatedLP.ctaText}
            </button>
          </div>
        </section>

        {/* フッター */}
        <footer className="py-8 px-4 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-400">© 2025 {generatedLP.serviceName}. All rights reserved.</p>
          </div>
        </footer>
      </div>

{/* ブランディングセクション（LP Pivot Generator） */}
<section className="py-12 px-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-t-2 border-indigo-100">
  <div className="max-w-4xl mx-auto">
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-indigo-100">
      <div className="flex flex-col md:flex-row items-center gap-6">
      
        {/* テキストエリア */}
        <div className="flex-1 text-center md:text-left">
          <a 
            href="https://www.lp-pivot.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block group"
          >
          <div className="flex items-center justify-center mb-4">
            <img src="/image/logo.png" alt="LP PIVOT" className="h-24 w-auto" />
          </div>
          </a>
          <p className="text-gray-600 mb-4">
            このランディングページは、競合サービスを分析して差別化されたアイデアを自動生成する
            <span className="font-semibold text-indigo-600"> LP PIVOT </span>
            で作成されました。
          </p>
        </div>
      </div>

      {/* 機能紹介 */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">競合分析</p>
            <p className="text-xs text-gray-500">URLから自動分析</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <Lightbulb className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">ピボット案生成</p>
            <p className="text-xs text-gray-500">6つの差別化案</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">LP自動生成</p>
            <p className="text-xs text-gray-500">1分で完成</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* 共有URLモーダル */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">共有URL</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              以下のURLでLPを共有できます
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-900 break-all font-mono">
                {shareUrl}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl);
                  alert('URLをコピーしました！');
                }}
                className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                URLをコピー
              </button>

              {navigator.share && (
                <button
                  onClick={async () => {
                    try {
                      await navigator.share({
                        title: generatedLP.serviceName,
                        text: generatedLP.catchphrase,
                        url: shareUrl,
                      });
                    } catch (error) {
                      if (error.name !== 'AbortError') {
                        console.error('Share error:', error);
                      }
                    }
                  }}
                  className="flex-1 bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  共有メニュー
                </button>
              )}
            </div>

            <button
              onClick={() => window.open(shareUrl, '_blank')}
              className="w-full mt-3 text-indigo-600 hover:text-indigo-700 py-2 text-sm font-medium"
            >
              新しいタブで開く →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

  return (
    <>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 2.5 && renderStep2_5()}
      {step === 3 && renderStep3()}
    </>
  );
};

export default function Home() {
  return <LPPivotGenerator />;
}