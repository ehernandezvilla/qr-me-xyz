// /app/api/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const shorturl = req.nextUrl.searchParams.get('shorturl');

  if (!token || !shorturl) {
    return NextResponse.json({ error: 'Missing token or shorturl' }, { status: 400 });
  }

  const statsUrl = `https://qr-me.xyz/yourls-api.php?signature=${token}&action=url-stats&shorturl=${shorturl}&format=json`;


  try {
    const response = await fetch(statsUrl);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in stats proxy:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
