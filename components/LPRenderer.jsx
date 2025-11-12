'use client';

import React from 'react';
import { Sparkles, CheckCircle, Users, Star, ArrowRight, Clock, Shield, Award, TrendingUp, Zap, Download, Share2, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';

export default function LPRenderer({ 
  lpData, 
  showToolbar = false,
  showFloatingCTA = true,
  onDownload,
  onShare,
  onBack,
  onReset,
  sharing = false
}) {
  if (!lpData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      {/* ツールバー（プレビュー時のみ表示） */}
      {showToolbar && (
        <div className="bg-gray-100 text-gray-900 p-4 sticky top-0 z-10 shadow-lg border-b border-gray-200">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  別の案を選ぶ
                </button>
              )}
              {onReset && (
                <button
                  onClick={onReset}
                  className="flex items-center gap-2 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors text-gray-900"
                >
                  <RefreshCw className="w-4 h-4" />
                  最初から
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onDownload && (
                <button 
                  onClick={onDownload}
                  className="flex items-center gap-2 bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  <Download className="w-4 h-4" />
                  ダウンロード
                </button>
              )}
              {onShare && (
                <button 
                  onClick={onShare}
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* ヒーローセクション */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">革新的なソリューション</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            {lpData.serviceName}
          </h1>
          
          <p className="text-3xl md:text-4xl mb-4 opacity-95 leading-relaxed font-bold">
            {lpData.catchphrase}
          </p>
          
          {lpData.subCatchphrase && (
            <p className="text-xl md:text-2xl mb-10 opacity-90 max-w-4xl mx-auto">
              {lpData.subCatchphrase}
            </p>
          )}
          
          <button className="group bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-5 px-12 rounded-full text-xl transition-all transform hover:scale-105 shadow-2xl flex items-center gap-2 mx-auto">
            {lpData.ctaText}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          {lpData.ctaSubtext && (
            <p className="mt-6 text-sm opacity-90">{lpData.ctaSubtext}</p>
          )}
        </div>
      </section>

      {/* 社会的証明バー */}
      <section className="py-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span className="text-sm"><strong className="text-2xl font-bold">10,000+</strong> 社の導入実績</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-sm"><strong className="text-2xl font-bold">4.9</strong> / 5.0 顧客評価</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-green-400" />
              <span className="text-sm"><strong className="text-2xl font-bold">業界No.1</strong> シェア</span>
            </div>
          </div>
        </div>
      </section>

      {/* 問題提起セクション */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold mb-4">
              こんな悩み、ありませんか？
            </div>
            <h2 className="text-5xl font-bold mb-4 text-gray-900">
              多くの企業が同じ課題を抱えています
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {lpData.problems.map((problem, idx) => (
              <div 
                key={idx} 
                className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border-l-4 border-red-500"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed text-lg">{problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ソリューションセクション */}
      <section className="py-24 px-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-semibold mb-6">
            <Zap className="w-4 h-4" />
            <span>ソリューション</span>
          </div>
          <h2 className="text-5xl font-bold mb-8 text-gray-900">
            すべての課題を、一つのツールで解決
          </h2>
          <p className="text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
            {lpData.solution}
          </p>
        </div>
      </section>

      {/* 導入事例 */}
      {lpData.useCases && lpData.useCases.length > 0 && (
        <section className="py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-4 text-gray-900">導入事例</h2>
              <p className="text-xl text-gray-600">多くの企業で実績があります</p>
            </div>
            
            <div className="space-y-12">
              {lpData.useCases.map((useCase, idx) => (
                <div 
                  key={idx} 
                  className="bg-gradient-to-br from-white to-indigo-50 rounded-3xl shadow-xl p-10 hover:shadow-2xl transition-shadow border-l-8 border-indigo-500"
                >
                  <div className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold mb-4">
                    CASE {idx + 1}
                  </div>
                  <h3 className="text-3xl font-bold mb-3 text-gray-900">{useCase.title}</h3>
                  <p className="text-indigo-600 font-semibold mb-6 text-lg">{useCase.persona}</p>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-bold text-gray-700 mb-3 text-lg flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 text-sm">✗</span>
                        </div>
                        導入前の課題
                      </h4>
                      <p className="text-gray-600 leading-relaxed bg-red-50 p-6 rounded-xl">
                        {useCase.situation}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-gray-700 mb-3 text-lg flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        導入後の成果
                      </h4>
                      <p className="text-gray-900 font-semibold leading-relaxed bg-green-50 p-6 rounded-xl border-l-4 border-green-500">
                        {useCase.result}
                      </p>
                    </div>
                  </div>

                  {useCase.quote && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border-l-4 border-indigo-500">
                      <p className="text-gray-700 italic text-lg leading-relaxed">
                        &quot;{useCase.quote}&quot;
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 主要機能 */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16 text-gray-900">主要機能</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {lpData.features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900 text-center">{feature.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed text-center">{feature.description}</p>
                {feature.benefit && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-green-600 font-semibold text-center flex items-center justify-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      {feature.benefit}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ビフォー・アフター */}
      {lpData.beforeAfter && (
        <section className="py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-16 text-gray-900">
              導入前と導入後の違い
            </h2>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl shadow-lg p-10 border-2 border-gray-200">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">導入前</h3>
                </div>
                <ul className="space-y-4">
                  {lpData.beforeAfter.before.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-4 text-gray-700 leading-relaxed">
                      <span className="text-red-500 flex-shrink-0 mt-1 text-2xl">✗</span>
                      <span className="text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-2xl p-10 border-4 border-green-400">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">導入後</h3>
                </div>
                <ul className="space-y-4">
                  {lpData.beforeAfter.after.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-4 text-gray-900 font-semibold leading-relaxed">
                      <span className="text-green-500 flex-shrink-0 mt-1 text-2xl">✓</span>
                      <span className="text-lg">{item}</span>
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
        <section className="py-24 px-4 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-4 text-gray-900">お客様の声</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {lpData.testimonials.map((testimonial, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-all"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-gray-700 mb-6 leading-relaxed italic text-lg">
                    &quot;{testimonial.content}&quot;
                  </p>
                  
                  {testimonial.result && (
                    <div className="mb-6 px-4 py-3 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-xl font-bold text-center">
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

      {/* 差別化ポイント */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16 text-gray-900">
            選ばれる3つの理由
          </h2>
          <div className="space-y-6">
            {lpData.strengths.map((strength, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-6 p-8 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-3xl hover:shadow-xl transition-all"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {idx + 1}
                </div>
                <p className="text-xl text-gray-800 leading-relaxed pt-4">{strength}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 1日の業務フロー */}
      {lpData.dailyWorkflow && lpData.dailyWorkflow.length > 0 && (
        <section className="py-24 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-4 text-gray-900">1日の業務フロー</h2>
            </div>
            <div className="space-y-6">
              {lpData.dailyWorkflow.map((flow, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                          {flow.time}
                        </span>
                        <h3 className="text-2xl font-bold text-gray-900">{flow.task}</h3>
                      </div>
                      {flow.improvement && (
                        <p className="text-green-600 font-semibold flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          {flow.improvement}
                        </p>
                      )}
                    </div>
                    <div className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-bold text-2xl shadow-lg">
                      {flow.duration}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 導入ステップ */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16 text-gray-900">
            簡単3ステップで始められます
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {lpData.steps.map((step, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto text-4xl font-black shadow-2xl group-hover:scale-110 transition-all mb-8">
                  {idx + 1}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 最終CTA */}
      <section className="py-32 px-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-6xl font-black mb-6">今すぐ始めましょう</h2>
          <p className="text-3xl mb-12 opacity-90 font-bold">
            {lpData.subCatchphrase || '無料で試せます'}
          </p>
          <button className="group bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-6 px-16 rounded-full text-2xl transition-all transform hover:scale-105 shadow-2xl inline-flex items-center gap-3">
            {lpData.ctaText}
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </section>

      {/* フッター */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-2">{lpData.serviceName}</h3>
          <p className="text-gray-400 mb-8">{lpData.catchphrase}</p>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-400">© 2025 {lpData.serviceName}. All rights reserved.</p>
            <p className="text-sm text-gray-500 mt-4">
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

      {/* フローティングCTA */}
      {showFloatingCTA && (
        <div className="fixed bottom-8 right-8 z-50">
          <a 
            href="https://lp-pivot.com"
            className="block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 font-bold text-lg flex items-center gap-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            自分でも作る
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      )}
    </div>
  );
}
