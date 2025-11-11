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
        const response = await fetch(`/api/get-lp/${params.id}`);
        
        if (!response.ok) {
          throw new Error('LPが見つかりません');
        }
        
        const data = await response.json();
        setLp(data);
      } catch (err) {
        setError(err.message);
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 animate-pulse">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !lp) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
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
      {/* ヒーローセクション - グラデーション背景 */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-24 px-4 overflow-hidden">
        {/* アニメーション背景 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in-up leading-tight">
            {lp.serviceName}
          </h1>
          <p className="text-2xl md:text-3xl mb-4 opacity-95 animate-fade-in-up animation-delay-200 leading-relaxed">
            {lp.catchphrase}
          </p>
          {lp.subCatchphrase && (
            <p className="text-xl mb-8 opacity-90 animate-fade-in-up animation-delay-400">
              {lp.subCatchphrase}
            </p>
          )}
          <div className="animate-fade-in-up animation-delay-600">
            <button className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-5 px-10 rounded-full text-xl transition-all transform hover:scale-105 shadow-2xl hover:shadow-3xl">
              {lp.ctaText}
            </button>
            {lp.ctaSubtext && (
              <p className="mt-4 text-sm opacity-90">{lp.ctaSubtext}</p>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(20px, -50px) scale(1.1); }
            50% { transform: translate(-20px, 20px) scale(0.9); }
            75% { transform: translate(50px, 50px) scale(1.05); }
          }
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
            opacity: 0;
          }
          .animation-delay-200 {
            animation-delay: 0.2s;
          }
          .animation-delay-400 {
            animation-delay: 0.4s;
          }
          .animation-delay-600 {
            animation-delay: 0.6s;
          }
        `}</style>
      </section>

      {/* 問題提起セクション */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
            こんな課題、抱えていませんか？
          </h2>
          <p className="text-center text-gray-600 mb-16 text-lg">
            多くの企業が同じ悩みを抱えています
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {lp.problems.map((problem, idx) => (
              <div 
                key={idx} 
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-l-4 border-red-500"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-lg">{problem}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ソリューションセクション */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-semibold mb-6">
            ソリューション
          </div>
          <h2 className="text-4xl font-bold mb-8 text-gray-900">
            すべての課題を、一つのツールで解決
          </h2>
          <p className="text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
            {lp.solution}
          </p>
        </div>
      </section>

      {/* 主要機能セクション */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">主要機能</h2>
            <p className="text-gray-600 text-lg">成果につながる強力な機能</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {lp.features.map((feature, idx) => (
              <div 
                key={idx} 
                className="text-center group hover:scale-105 transition-transform duration-300"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-2xl transition-shadow">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                {feature.benefit && (
                  <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    {feature.benefit}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 利用シーン・導入事例セクション */}
      {lp.useCases && lp.useCases.length > 0 && (
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-900">導入事例</h2>
              <p className="text-gray-600 text-lg">多くの企業で実績があります</p>
            </div>
            <div className="space-y-10">
              {lp.useCases.map((useCase, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-3xl shadow-xl p-8 md:p-10 hover:shadow-2xl transition-shadow duration-300"
                >
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                      <div className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-4">
                        CASE {idx + 1}
                      </div>
                      <h3 className="text-2xl font-bold mb-3 text-gray-900">{useCase.title}</h3>
                      <p className="text-indigo-600 font-semibold mb-4">{useCase.persona}</p>
                      
                      <div className="mb-6">
                        <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                          <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm">課</span>
                          導入前の課題
                        </h4>
                        <p className="text-gray-600 leading-relaxed bg-red-50 p-4 rounded-lg">
                          {useCase.situation}
                        </p>
                      </div>
                      
                      <div className="mb-6">
                        <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                          <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm">果</span>
                          導入後の成果
                        </h4>
                        <p className="text-gray-900 font-semibold leading-relaxed bg-green-50 p-4 rounded-lg">
                          {useCase.result}
                        </p>
                      </div>

                      {useCase.quote && (
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border-l-4 border-indigo-500">
                          <p className="text-gray-700 italic text-lg">
                            "{useCase.quote}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ビフォー・アフターセクション */}
      {lp.beforeAfter && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
              導入前と導入後の違い
            </h2>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl shadow-lg p-8 border-2 border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">導入前</h3>
                </div>
                <ul className="space-y-4">
                  {lp.beforeAfter.before.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-700 leading-relaxed">
                      <span className="text-red-500 flex-shrink-0 mt-1 text-xl">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-xl p-8 border-4 border-green-400 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-50"></div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">導入後</h3>
                </div>
                <ul className="space-y-4 relative z-10">
                  {lp.beforeAfter.after.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-900 font-semibold leading-relaxed">
                      <span className="text-green-500 flex-shrink-0 mt-1 text-xl">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* お客様の声セクション */}
      {lp.testimonials && lp.testimonials.length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-900">お客様の声</h2>
              <p className="text-gray-600 text-lg">導入企業から高い評価をいただいています</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {lp.testimonials.map((testimonial, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  {/* 星評価 */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating || 5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  
                  <p className="text-gray-700 mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  
                  {testimonial.result && (
                    <div className="mb-4 px-4 py-2 bg-green-100 text-green-800 rounded-lg font-bold text-center">
                      {testimonial.result}
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    {testimonial.company && (
                      <p className="text-sm text-gray-600 mt-1">{testimonial.company}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 差別化ポイントセクション */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
            選ばれる3つの理由
          </h2>
          <div className="space-y-6">
            {lp.strengths.map((strength, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl hover:shadow-lg transition-shadow"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {idx + 1}
                </div>
                <p className="text-lg text-gray-800 leading-relaxed pt-2">{strength}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 1日の業務フローセクション */}
      {lp.dailyWorkflow && lp.dailyWorkflow.length > 0 && (
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-900">1日の業務フロー</h2>
              <p className="text-gray-600 text-lg">わずかな時間で大きな成果</p>
            </div>
            <div className="space-y-6">
              {lp.dailyWorkflow.map((flow, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                          {flow.time}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900">{flow.task}</h3>
                      </div>
                      {flow.improvement && (
                        <p className="text-green-600 font-semibold text-sm mt-2">
                          ✓ {flow.improvement}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <div className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full font-bold text-lg shadow-lg">
                        {flow.duration}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 導入ステップセクション */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
            簡単3ステップで始められます
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {lp.steps.map((step, idx) => (
              <div key={idx} className="text-center group">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto text-3xl font-bold shadow-2xl group-hover:scale-110 transition-transform">
                    {idx + 1}
                  </div>
                  {idx < lp.steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 left-full w-full h-1 bg-gradient-to-r from-indigo-300 to-purple-300 transform -translate-y-1/2"></div>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 最終CTAセクション */}
      <section className="py-24 px-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl font-bold mb-6">今すぐ始めましょう</h2>
          <p className="text-2xl mb-4 opacity-90">
            {lp.subCatchphrase || '無料で試せます'}
          </p>
          {lp.ctaSubtext && (
            <p className="text-lg mb-10 opacity-80">{lp.ctaSubtext}</p>
          )}
          <button className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-6 px-12 rounded-full text-2xl transition-all transform hover:scale-105 shadow-2xl inline-block">
            {lp.ctaText}
          </button>
        </div>
      </section>

      {/* フッター */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">{lp.serviceName}</h3>
            <p className="text-gray-400">{lp.catchphrase}</p>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">© 2025 {lp.serviceName}. All rights reserved.</p>
            <p className="text-xs text-gray-500 mt-4">
              このLPは{' '}
              <a 
                href="https://lp-pivot.com" 
                className="text-indigo-400 hover:text-indigo-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                LP PIVOT
              </a>
              {' '}で生成されました
            </p>
          </div>
        </div>
      </footer>

      {/* フローティングCTAボタン */}
      <div className="fixed bottom-8 right-8 z-50">
        <a 
          href="https://lp-pivot.com"
          className="block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 font-bold text-lg"
          target="_blank"
          rel="noopener noreferrer"
        >
          自分でも作る →
        </a>
      </div>
    </div>
  );
}
