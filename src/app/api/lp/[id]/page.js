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
    // IDが取得できるまで待つ
    if (!id) {
      console.log('ID not available yet');
      return;
    }

    console.log('Loading LP with ID:', id);

    const loadLP = async () => {
      try {
        // 1. まずLocalStorageを確認（高速・キャッシュ）
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(`lp-${id}`);
          
          if (cached) {
            console.log('✅ LP found in localStorage (cache)');
            const data = JSON.parse(cached);
            setLpData(data);
            setLoading(false);
            return; // LocalStorageにあればここで終了
          }
        }

        // 2. LocalStorageになければAPIから取得
        console.log('📡 Fetching LP from API...');
        const response = await fetch(`/api/get-lp/${id}`);
        
        console.log('API response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log('❌ LP not found (404)');
            setError('not_found');
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Error:', errorData);
            throw new Error(errorData.error || 'APIエラー');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log('✅ LP retrieved from API');
        
        // データが正しく取得できたか確認
        if (!data || !data.serviceName) {
          console.error('Invalid LP data:', data);
          setError('invalid_data');
          setLoading(false);
          return;
        }
        
        setLpData(data);
        
        // LocalStorageにキャッシュ（次回は高速化）
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`lp-${id}`, JSON.stringify(data));
            console.log('💾 Cached to localStorage');
          } catch (storageError) {
            // LocalStorage容量エラーなどは無視
            console.warn('LocalStorage save failed:', storageError);
          }
        }

      } catch (err) {
        console.error('Load error:', err);
        setError('load_error');
      } finally {
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
          <p className="text-sm text-gray-400 mt-2">初回アクセスは数秒かかる場合があります</p>
        </div>
      </div>
    );
  }

  // エラー時
  if (error || !lpData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 shadow-xl text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            LPが見つかりません
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            {error === 'not_found' && 'このLPは存在しないか、有効期限が切れています。'}
            {error === 'invalid_data' && 'LPデータが壊れています。'}
            {error === 'load_error' && 'LPの読み込みに失敗しました。'}
            {!error && 'このLPは見つかりませんでした。'}
          </p>

          <div className="bg-indigo-50 p-4 rounded-xl mb-6 text-left">
            <p className="text-sm font-semibold text-indigo-900 mb-3">💡 考えられる原因</p>
            <ul className="text-sm text-indigo-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>URLが間違っている</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>LPの有効期限が切れた（7日間）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>一時的なサーバーエラー</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <a
              href="/"
              className="block w-full bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
            >
              自分のLPを作る
            </a>
            
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              再読み込み
            </button>
            
            <p className="text-sm text-gray-500">
              新しいLPを生成してください
            </p>
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