'use client';

import React, { useState } from 'react';
import { Loader2, ArrowRight, ArrowLeft, Download, Share2, RefreshCw, Sparkles, Target, Lightbulb, CheckCircle } from 'lucide-react';

const LPPivotGenerator = () => {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analyzedData, setAnalyzedData] = useState(null);
  const [pivotOptions, setPivotOptions] = useState([]);
  const [selectedPivot, setSelectedPivot] = useState(null);
  const [generatedLP, setGeneratedLP] = useState(null);

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

    setLoading(true);
    setError('');

    try {
      const analyzed = await callAPI('analyze', { url });
      setAnalyzedData(analyzed);
      await generatePivots(analyzed);
      setStep(2);
    } catch (err) {
      setError('分析に失敗しました。もう一度お試しください。');
      console.error(err);
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
      const lp = await callAPI('generate-lp', { pivot, analyzedData });
      setGeneratedLP(lp);
    } catch (err) {
      setError('LP生成に失敗しました。');
      console.error(err);
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
            <Sparkles className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">LP Pivot Generator</h1>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
      </div>
    </div>
  );

  // ステップ2: ピボット案選択
  const renderStep2 = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 py-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => setStep(1)}
          className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">元サービスの分析結果</h2>
          {analyzedData && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">サービス名</p>
                <p className="text-lg font-semibold text-gray-900">{analyzedData.serviceName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">ターゲット顧客</p>
                <p className="text-gray-700">{analyzedData.targetCustomer}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">主要機能</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {analyzedData.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">提供価値</p>
                <p className="text-gray-700">{analyzedData.valueProposition}</p>
              </div>
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Lightbulb className="w-7 h-7 text-yellow-500" />
          ピボット案を選択してください
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {pivotOptions.map((pivot, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-200">
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
                  onClick={() => generateLP(pivot)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  この案でLP生成
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ステップ3: LP表示
  const renderStep3 = () => {
    if (loading || !generatedLP) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-lg text-gray-600">LPを生成中...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white">
        <div className="bg-indigo-600 text-white p-4 sticky top-0 z-10 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 hover:bg-indigo-700 px-3 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                別の案を選ぶ
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-2 hover:bg-indigo-700 px-3 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                最初から
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors font-medium">
                <Download className="w-4 h-4" />
                ダウンロード
              </button>
              <button className="flex items-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors font-medium">
                <Share2 className="w-4 h-4" />
                共有
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6">{generatedLP.serviceName}</h1>
              <p className="text-2xl mb-8 opacity-90">{generatedLP.catchphrase}</p>
              <button className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-4 px-8 rounded-lg text-lg transition-colors">
                {generatedLP.ctaText}
              </button>
            </div>
          </section>

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

          <section className="py-16 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">解決策</h2>
              <p className="text-xl text-gray-700 leading-relaxed">{generatedLP.solution}</p>
            </div>
          </section>

          <section className="py-16 px-4 bg-gray-50">
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

          <section className="py-16 px-4 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">簡単3ステップ</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {generatedLP.steps.map((step, idx) => (
                  <div key={idx} className="text-center">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                      {idx + 1}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6">今すぐ始めましょう</h2>
              <p className="text-xl mb-8 opacity-90">無料で試せます</p>
              <button className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-4 px-8 rounded-lg text-lg transition-colors">
                {generatedLP.ctaText}
              </button>
            </div>
          </section>

          <footer className="py-8 px-4 bg-gray-900 text-white">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-gray-400">© 2025 {generatedLP.serviceName}. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </div>
    );
  };

  return (
    <>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </>
  );
};

export default function Home() {
  return <LPPivotGenerator />;
}