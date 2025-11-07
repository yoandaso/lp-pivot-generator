import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

function generateId() {
  return Math.random().toString(36).substring(2, 12);
}

export async function POST(request) {
  try {
    const lpData = await request.json();
    const id = generateId();
    
    console.log('Saving LP with ID:', id);
    
    const blob = await put(`lp-${id}.json`, JSON.stringify(lpData), {
      access: 'public',
      contentType: 'application/json',
    });
    
    console.log('Saved successfully:', blob.url);
    
    // URLとデータの両方を返す
    return NextResponse.json({ 
      id, 
      blobUrl: blob.url,
      data: lpData  // データも一緒に返す
    });
  } catch (error) {
    console.error('Save LP error:', error);
    return NextResponse.json(
      { error: 'LP保存に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}