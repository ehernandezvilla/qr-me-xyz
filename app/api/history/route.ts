//app/api/history/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDBConnection } from '@/app/lib/db';

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Missing username' }, { status: 400 });
  }

  try {
    const connection = await getDBConnection();

    const [rows] = await connection.execute(
      `SELECT id, original_url, short_url, correlativo, created_at, qr_svg 
       FROM qr_history 
       WHERE username = ? 
       ORDER BY created_at DESC`,
      [username]
    );

    await connection.end();

    return NextResponse.json({ history: rows });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
