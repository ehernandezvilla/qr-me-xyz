// /app/api/save-qr/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDBConnection } from '@/app/lib/db';

export async function POST(req: NextRequest) {
  const { username, original_url, short_url, qr_svg } = await req.json();

  if (!username || !original_url || !short_url || !qr_svg) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const connection = await getDBConnection();

    // UPDATE qr_svg del registro
    await connection.execute(
      'UPDATE qr_history SET qr_svg = ? WHERE username = ? AND original_url = ? AND short_url = ?',
      [qr_svg, username, original_url, short_url]
    );

    await connection.end();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating qr_svg:', error);
    return NextResponse.json({ error: 'Failed to update qr_svg' }, { status: 500 });
  }
}
