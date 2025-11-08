'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SharedLP() {
  const params = useParams();
  const [lp, setLp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLP = async () => {
      try {
        console.log('Fetching LP with ID:', params.id);
        
        // localStorageをチェック
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(`lp-${params.id}`);
          if (cached) {
            console.log('Loading from localStorage');
            const data = JSON.parse(cached);
            console.log('Cached data:', data);
            setLp(data);
            setLoading(false);
            return;
          }
        }
        
        // APIから取得
        console.log('Loading from API');
        const response = await fetch(`/api/get-lp/${params.id}`);
        
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          throw new Error(errorData.error || 'LPが見つかりません');
        }
        
        const data = await response.json();
        console.log('LP data loaded:', data);
        console.log('Data keys:', Object.keys(data));
        
        setLp(data);
        
        // localStorageにキャッシュ
        if (typeof window !== 'undefined') {
          localStorage.setItem(`lp-${params.id}`, JSON.stringify(data));
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'LPが見つかりません');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchLP();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">読み込み中...</p>
          <p className="text-sm text-gray-400 mt-2">ID: {params.id}</p>
        </div>
      </div>
    );
  }

  if (error || !lp) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-lg text-red-600 mb-4">{error || 'LPが見つかりません'}</p>
          <p className="text-sm text-gray-500 mb-4">ID: {params.id}</p>
          <a href="/" className="text-indigo-600 hover:underline">
            トップページに戻る
          </a>
        </div>
      </div>
    );
  }

  // データの存在確認
  const hasData = lp.serviceName && lp.catchphrase && lp.problems && lp.features && lp.strengths && lp.steps;

  if (!hasData) {
    console.error('Missing required data:', {
      serviceName: !!lp.serviceName,
      catchphrase: !!lp.catchphrase,
      problems: !!lp.problems,
      features: !!lp.features,
      strengths: !!lp.strengths,
      steps: !!lp.steps
    });
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-lg text-red-600 mb-4">データが不完全です</p>
          <pre className="text-xs text-left bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(lp, null, 2)}
          </pre>
          <a href="/" className="text-indigo-600 hover:underline mt-4 inline-block">
            トップページに戻る
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ヒーローセクション */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">{lp.serviceName}</h1>
          <p className="text-2xl mb-8 opacity-90">{lp.catchphrase}</p>
          <button className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-4 px-8 rounded-lg text-lg transition-colors">
            {lp.ctaText}
          </button>
        </div>
      </section>

      {/* 問題提起 */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">こんな課題はありませんか?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {lp.problems.map((problem, idx) => (
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
          <p className="text-xl text-gray-700 leading-relaxed">{lp.solution}</p>
        </div>
      </section>

      {/* 利用シーン */}
      {lp.useCases && lp.useCases.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">こんな場面で活躍</h2>
            <div className="space-y-8">
              {lp.useCases.map((useCase, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-2">{useCase.title}</h3>
                  <p className="text-sm text-indigo-600 mb-3">{useCase.persona}</p>
                  <div className="bg-gray-50 rounded-lg p-4 mb-3">
                    <p className="text-gray-700">{useCase.situation}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-gray-900 font-semibold">{useCase.result}</p>
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
            {lp.features.map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ビフォー・アフター */}
      {lp.beforeAfter && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">導入前と導入後の違い</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">導入前</h3>
                <ul className="space-y-3">
                  {lp.beforeAfter.before.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-red-500 flex-shrink-0 mt-1">●</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-200">
                <h3 className="text-xl font-bold mb-4 text-gray-900">導入後</h3>
                <ul className="space-y-3">
                  {lp.beforeAfter.after.map((item, idx) => (
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
            {lp.strengths.map((strength, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-indigo-50 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <p className="text-lg text-gray-800">{strength}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 1日の業務フロー */}
      {lp.dailyWorkflow && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">1日の業務フロー</h2>
            <div className="space-y-8">
              {lp.dailyWorkflow.map((flow, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{flow.task}</h3>
                    <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      {flow.duration}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{flow.time}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 使い方 */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">簡単3ステップ</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {lp.steps.map((step, idx) => (
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

      {/* 最終CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">今すぐ始めましょう</h2>
          <p className="text-xl mb-8 opacity-90">無料で試せます</p>
          <button className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-4 px-8 rounded-lg text-lg transition-colors">
            {lp.ctaText}
          </button>
        </div>
      </section>

      {/* フッター */}
      <footer className="py-8 px-4 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400">© 2025 {lp.serviceName}. All rights reserved.</p>
          <p className="text-xs text-gray-500 mt-2">
            このLPは <a href="https://lp-pivot-generator.vercel.app" className="text-indigo-400 hover:text-indigo-300">LP PIVOT</a> で生成されました
          </p>
        </div>
      </footer>

      {/* トップに戻るボタン */}
      <div className="fixed bottom-8 right-8">
        <a 
          href="https://lp-pivot-generator.vercel.app"
          className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        >
          自分でも作る
        </a>
      </div>
    </div>
  );
}