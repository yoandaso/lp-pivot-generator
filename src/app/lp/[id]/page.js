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
        // まずlocalStorageをチェック
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(`lp-${params.id}`);
          if (cached) {
            console.log('Loading from localStorage');
            setLp(JSON.parse(cached));
            setLoading(false);
            return;
          }
        }
        
        // localStorageになければAPIから取得
        console.log('Loading from API');
        const response = await fetch(`/api/get-lp/${params.id}`);
        if (!response.ok) {
          throw new Error('LPが見つかりません');
        }
        const data = await response.json();
        setLp(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'LPが見つかりません');
      } finally {
        setLoading(false);
      }
    };

    fetchLP();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !lp) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">{error || 'LPが見つかりません'}</p>
          <a href="/" className="text-indigo-600 hover:underline">
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

      {/* 主要機能 */}
      <section className="py-16 px-4 bg-gray-50">
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

      {/* 使い方 */}
      <section className="py-16 px-4 bg-gray-50">
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
        </div>
      </footer>

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
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700">競合分析</p>
            <p className="text-xs text-gray-500">URLから自動分析</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700">ピボット案生成</p>
            <p className="text-xs text-gray-500">6つの差別化案</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700">LP自動生成</p>
            <p className="text-xs text-gray-500">1分で完成</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


      {/* トップに戻るボタン */}
      <div className="fixed bottom-8 right-8">
        <a 
          href="/"
          className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        >
          自分でも作る
        </a>
      </div>
    </div>
  );
}