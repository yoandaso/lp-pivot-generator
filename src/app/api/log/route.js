import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { event, data } = await request.json();
    
    // データベースに保存
    await sql`
      INSERT INTO event_logs (event, data, timestamp, user_agent, ip)
      VALUES (
        ${event}, 
        ${JSON.stringify(data)}, 
        ${new Date().toISOString()}, 
        ${request.headers.get('user-agent')},
        ${request.headers.get('x-forwarded-for')}
      )
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Log error:', error);
    return NextResponse.json(
      { error: 'ログ記録に失敗しました' },
      { status: 500 }
    );
  }
}