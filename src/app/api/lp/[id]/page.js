'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import LPRenderer from '@/components/LPRenderer';
import { Loader2, Target } from 'lucide-react';

export default function SharedLPPage() {
  const params = useParams();
  const id = params?.id;
  const [lpData, setLpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLP = async () => {
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

  // データなし
  if (!lpData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg text-gray-600">LPデータが見つかりません</p>
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
              href="https://lp-pivot.com"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              自分のLPを作る →
            </a>
          </div>
        </div>
      </header>

      {/* LPRendererでLP本体を表示 */}
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
              href="https://lp-pivot.com" 
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
