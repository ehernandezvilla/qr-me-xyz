// /app/api/shorturl/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const token = req.nextUrl.searchParams.get('token');

  if (!url || !token) {
    return NextResponse.json({ error: 'Missing url or token' }, { status: 400 });
  }

  const yourlsApiUrl = `https://qr-me.xyz/yourls-api.php?signature=${token}&action=shorturl&format=json&url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(yourlsApiUrl);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in proxy:', error);
    return NextResponse.json({ error: 'Failed to fetch from YOURLS' }, { status: 500 });
  }
}
