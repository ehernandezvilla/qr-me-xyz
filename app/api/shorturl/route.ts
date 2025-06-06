// app/api/shorturl/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDBConnection } from '@/app/lib/db';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const token = req.nextUrl.searchParams.get('token');
  const username = req.nextUrl.searchParams.get('username'); // Ahora será email

  if (!url || !token) {
    return NextResponse.json({ error: 'Missing url or token' }, { status: 400 });
  }

  const yourlsApiUrl = `https://qr-me.xyz/yourls-api.php?signature=${token}&action=shorturl&format=json&url=${encodeURIComponent(url)}`;

  try {
    // Llamada a YOURLS
    const response = await fetch(yourlsApiUrl);
    const data = await response.json();

    if (!data.shorturl) {
      console.error('Error in YOURLS API:', data);
      return NextResponse.json({ error: 'YOURLS API error', details: data }, { status: 500 });
    }

    // Insertar en base de datos usando email como identificador
    if (username) {
      const connection = await getDBConnection();

      await connection.execute(
        'INSERT INTO qr_history (username, original_url, short_url, correlativo) VALUES (?, ?, ?, ?)',
        [username, url, data.shorturl, username] // username ahora es email
      );

      await connection.end();
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in proxy or DB:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}