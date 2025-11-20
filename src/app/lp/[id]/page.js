'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';  // ← use を使う
import { Loader2, CheckCircle, Target, Lightbulb } from 'lucide-react';

export default function SharedLPPage() {
  const params = useParams();  // ← useParams フックを使用
  const id = params?.id;  // ← 安全にアクセス
  
  const [lpData, setLpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLP = async () => {
      // IDが取得できるまで待つ
      if (!id) {
        console.log('ID not available yet');
        return;
      }

      try {
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
        console.log('Fetching from API:', `/api/lp/${id}`);
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
  }, [id]);  // id を依存配列に追加

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">LPを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">エラー</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <a
            href="https://lp-pivot.com"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            トップページへ
          </a>
        </div>
      </div>
    );
  }

  if (!lpData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg text-gray-600">LPデータが見つかりません</p>
        </div>
      </div>
    );
  }

  // LP表示（既存のLPRendererコンポーネントを使用）
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">LP PIVOT</span>
            </div>
            <a
              href="https://lp-pivot.com"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              自分のLPを作る →
            </a>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {lpData.serviceName}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-indigo-100">
            {lpData.catchphrase}
          </p>
          <button className="bg-white text-indigo-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg">
            {lpData.ctaText || '今すぐ始める'}
          </button>
        </div>
      </section>

      {/* 課題セクション */}
      {lpData.problems && lpData.problems.length > 0 && (
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
              こんなお悩みありませんか？
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              多くの方が抱える課題を解決します
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {lpData.problems.map((problem, index) => (
                <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="text-4xl mb-4">😰</div>
                  <p className="text-gray-700 font-medium">{problem}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 機能セクション */}
      {lpData.features && lpData.features.length > 0 && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
              選ばれる理由
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              {lpData.serviceName}が提供する価値
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {lpData.features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-2">{feature.description}</p>
                  {feature.benefit && (
                    <p className="text-sm text-indigo-600 font-medium">
                      → {feature.benefit}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 強みセクション */}
      {lpData.strengths && lpData.strengths.length > 0 && (
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
              他社との違い
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lpData.strengths.map((strength, index) => (
                <div key={index} className="bg-white p-6 rounded-xl border-l-4 border-indigo-600 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-700 font-medium">{strength}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ステップセクション */}
      {lpData.steps && lpData.steps.length > 0 && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
              ご利用の流れ
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              簡単3ステップで始められます
            </p>
            <div className="space-y-8">
              {lpData.steps.map((step, index) => (
                <div key={index} className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-gray-900">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTAセクション */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            今すぐ始めませんか？
          </h2>
          <p className="text-xl mb-8 text-indigo-100">
            {lpData.serviceName}で新しい体験を
          </p>
          <button className="bg-white text-indigo-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg">
            {lpData.ctaText || '無料で始める'}
          </button>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400 text-sm">
            このLPは <a href="https://lp-pivot.com" className="text-indigo-400 hover:text-indigo-300">LP PIVOT</a> で生成されました
          </p>
        </div>
      </footer>
    </div>
  );
}