'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Target, Lightbulb } from 'lucide-react';

export default function SharedLPPage({ params }) {
  const [lpData, setLpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLP = async () => {
      try {
        const { id } = params;
        console.log('Fetching LP with ID:', id);

        // まずlocalStorageから取得を試みる
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(`lp-${id}`);
          if (cached) {
            console.log('LP found in localStorage');
            setLpData(JSON.parse(cached));
            setLoading(false);
            return;
          }
        }

        // APIから取得
        const response = await fetch(`/api/lp/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('このLPは見つかりませんでした。URLが間違っているか、有効期限（7日間）が切れている可能性があります。');
          }
          throw new Error('LP取得に失敗しました');
        }

        const data = await response.json();
        console.log('LP loaded successfully');
        setLpData(data);

        // localStorageにキャッシュ
        if (typeof window !== 'undefined') {
          localStorage.setItem(`lp-${id}`, JSON.stringify(data));
        }

      } catch (err) {
        console.error('Load error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLP();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">LPを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">エラー</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            トップページに戻る
          </a>
        </div>
      </div>
    );
  }

  if (!lpData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヒーローセクション */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">{lpData.serviceName}</h1>
          <p className="text-2xl mb-4 opacity-90">{lpData.catchphrase}</p>
          {lpData.subCatchphrase && (
            <p className="text-lg mb-8 opacity-80">{lpData.subCatchphrase}</p>
          )}
          <button className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-4 px-8 rounded-lg text-lg transition-colors">
            {lpData.ctaText}
          </button>
          {lpData.ctaSubtext && (
            <p className="text-sm mt-4 opacity-75">{lpData.ctaSubtext}</p>
          )}
        </div>
      </section>

      {/* 社会的証明バー */}
      {lpData.socialProof && (
        <section className="bg-white py-8 px-4 border-b border-gray-200">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-indigo-600">{lpData.socialProof.users}</p>
                <p className="text-sm text-gray-600 mt-1">導入企業数</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-indigo-600">{lpData.socialProof.satisfaction}</p>
                <p className="text-sm text-gray-600 mt-1">顧客満足度</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-indigo-600">{lpData.socialProof.growth}</p>
                <p className="text-sm text-gray-600 mt-1">成長率</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-indigo-600">{lpData.socialProof.rating}</p>
                <p className="text-sm text-gray-600 mt-1">平均評価</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 問題提起 */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">こんな課題はありませんか？</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {lpData.problems.map((problem, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-md">
                <p className="text-gray-700 text-center">{problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ソリューション */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">解決策</h2>
          <p className="text-xl text-gray-700 leading-relaxed">{lpData.solution}</p>
        </div>
      </section>

      {/* 導入事例 */}
      {lpData.useCases && lpData.useCases.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">導入事例</h2>
            <div className="space-y-8">
              {lpData.useCases.map((useCase, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-lg p-8">
                  <h3 className="text-2xl font-bold text-indigo-600 mb-4">{useCase.title}</h3>
                  <p className="text-sm text-gray-600 mb-6">{useCase.persona}</p>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">導入前の課題</h4>
                      <p className="text-gray-700">{useCase.situation}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">導入後の成果</h4>
                      <p className="text-gray-700">{useCase.result}</p>
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4">
                    <p className="text-gray-800 italic">"{useCase.quote}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 主要機能 */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">主要機能</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {lpData.features.map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 mb-2">{feature.description}</p>
                {feature.benefit && (
                  <p className="text-sm text-indigo-600 font-semibold">{feature.benefit}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After */}
      {lpData.beforeAfter && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">導入前後の比較</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-red-600 mb-4">Before（導入前）</h3>
                <ul className="space-y-3">
                  {lpData.beforeAfter.before.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-red-500 mt-1">✗</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-green-600 mb-4">After（導入後）</h3>
                <ul className="space-y-3">
                  {lpData.beforeAfter.after.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* お客様の声 */}
      {lpData.testimonials && lpData.testimonials.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">お客様の声</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {lpData.testimonials.map((testimonial, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating || 5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                  {testimonial.result && (
                    <p className="text-sm font-semibold text-indigo-600 mb-3">{testimonial.result}</p>
                  )}
                  <div className="border-t border-gray-200 pt-3">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.company}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 差別化ポイント */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">3つの強み</h2>
          <div className="space-y-4">
            {lpData.strengths.map((strength, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
                <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                <p className="text-lg text-gray-800">{strength}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 1日の業務フロー */}
      {lpData.dailyWorkflow && lpData.dailyWorkflow.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">1日の業務フロー</h2>
            <p className="text-center text-gray-600 mb-12">実際の1日の使い方をイメージしてみましょう</p>
            
            <div className="space-y-6">
              {lpData.dailyWorkflow.map((flow, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{flow.task}</h3>
                    <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full self-start">
                      {flow.duration}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{flow.time}</p>
                  {flow.improvement && (
                    <p className="text-sm text-green-600 font-semibold">{flow.improvement}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 使い方 */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">簡単3ステップ</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {lpData.steps.map((step, idx) => (
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
            {lpData.ctaText}
          </button>
          {lpData.ctaSubtext && (
            <p className="text-sm mt-4 opacity-75">{lpData.ctaSubtext}</p>
          )}
        </div>
      </section>

      {/* ブランディングセクション */}
      <section className="py-12 px-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-t-2 border-indigo-100">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-indigo-100">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 text-center md:text-left">
                <a 
                  href="https://www.lp-pivot.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block group"
                >
                  <div className="flex items-center justify-center mb-4">
                    <img src="/image/logo.png" alt="LP PIVOT" className="h-24 w-auto" onError={(e) => {
                      e.target.style.display = 'none';
                    }} />
                  </div>
                </a>
                <p className="text-gray-600 mb-4">
                  このランディングページは、競合サービスを分析して差別化されたアイデアを自動生成する
                  <span className="font-semibold text-indigo-600"> LP PIVOT </span>
                  で作成されました。
                </p>
              </div>
            </div>

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

      {/* フッター */}
      <footer className="py-8 px-4 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400">© 2025 {lpData.serviceName}. All rights reserved.</p>
          <p className="text-sm text-gray-500 mt-2">Generated by LP PIVOT</p>
        </div>
      </footer>
    </div>
  );
}
