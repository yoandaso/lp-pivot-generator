'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import LPRenderer from '@/components/LPRenderer';
import { Loader2, Target, AlertCircle } from 'lucide-react';

export default function SharedLPPage() {
  const params = useParams();
  const id = params?.id;
  const [lpData, setLpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLP = () => {
      if (!id) {
        console.log('ID not available yet');
        return;
      }

      try {
        console.log('Loading LP with ID:', id);

        // LocalStorageから取得
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(`lp-${id}`);
          
          if (cached) {
            console.log('LP found in localStorage');
            const data = JSON.parse(cached);
            setLpData(data);
            setLoading(false);
            return;
          } else {
            console.log('LP not found in localStorage');
            setError('このLPは見つかりませんでした。共有URLは、LPを生成したブラウザでのみ開けます。');
            setLoading(false);
          }
        }

      } catch (err) {
        console.error('Load error:', err);
        setError('LPの読み込みに失敗しました: ' + err.message);
        setLoading(false);
      }
    };

    loadLP();
  }, [id]);

  // ローディング中
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

  // エラー時
  if (error || !lpData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 shadow-xl text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">LPが見つかりません</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {error || 'このLPは見つかりませんでした。'}
          </p>
          <div className="space-y-4">
            <a
              href="/"
              className="block w-full bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
            >
              トップページへ
            </a>
            <div className="bg-indigo-50 p-4 rounded-xl">
              <p className="text-sm text-indigo-900 font-medium mb-2">💡 ヒント</p>
              <p className="text-sm text-indigo-700">
                共有URLは、LPを生成した<strong>同じブラウザ</strong>でのみ開けます。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LPRendererを使用して表示
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* ヘッダー（共有版専用） */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">LP PIVOT</span>
            </div>
            <a
              href="/"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              自分のLPを作る →
            </a>
          </div>
        </div>
      </header>

      {/* LPRendererでLP本体を表示 - これが最新デザイン */}
      <LPRenderer 
        lpData={lpData}
        showToolbar={false}
        showFloatingCTA={true}
      />

      {/* フッター（共有版専用） */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400 text-sm">
            このLPは{' '}
            <a 
              href="/" 
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              LP PIVOT
            </a>
            {' '}で生成されました
          </p>
        </div>
      </footer>
    </div>
  );
}