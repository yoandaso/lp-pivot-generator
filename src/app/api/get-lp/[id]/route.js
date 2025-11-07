import { head } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const blobUrl = `https://${process.env.BLOB_READ_WRITE_TOKEN?.split('_')[2]}.public.blob.vercel-storage.com/lp-${id}.json`;
    
    console.log('Fetching from URL:', blobUrl);
    
    // Blobから直接取得
    const response = await fetch(blobUrl);
    
    if (!response.ok) {
      console.error('Blob fetch failed:', response.status);
      return NextResponse.json(
        { error: 'LPが見つかりません' },
        { status: 404 }
      );
    }
    
    const data = await response.json();
    console.log('LP found successfully');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get LP error:', error);
    return NextResponse.json(
      { error: 'LP取得に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}