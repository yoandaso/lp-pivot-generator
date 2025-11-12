'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import LPRenderer from '../../components/LPRenderer';

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
          <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 font-semibold animate-pulse">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !lp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <p className="text-lg text-red-600 font-semibold mb-4">{error || 'LPが見つかりません'}</p>
          <a href="/" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
            トップページに戻る
          </a>
        </div>
      </div>
    );
  }

  return (
    <LPRenderer 
      lpData={lp}
      showToolbar={false}
      showFloatingCTA={true}
    />
  );
}
