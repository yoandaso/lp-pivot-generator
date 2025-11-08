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
            setLp(JSON.parse(cached));
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

  // 以下、既存のLP表示コード
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

      {/* 以下、既存のコードをそのまま */}
      {/* ... */}
    </div>
  );
}