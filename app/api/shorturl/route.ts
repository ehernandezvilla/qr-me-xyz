// /app/api/shorturl/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDBConnection } from '@/app/lib/db';
import { users } from '@/app/lib/auth';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const token = req.nextUrl.searchParams.get('token');

  if (!url || !token) {
    return NextResponse.json({ error: 'Missing url or token' }, { status: 400 });
  }

  const yourlsApiUrl = `https://qr-me.xyz/yourls-api.php?signature=${token}&action=shorturl&format=json&url=${encodeURIComponent(url)}`;

  try {
    // 1️⃣ Llamada a YOURLS
    const response = await fetch(yourlsApiUrl);
    const data = await response.json();

    if (!data.shorturl) {
      console.error('Error in YOURLS API:', data);
      return NextResponse.json({ error: 'YOURLS API error', details: data }, { status: 500 });
    }

    // 2️⃣ Obtener user actual y correlativo
    // OJO: En API route no tienes localStorage, pero puedes pasar el username como parámetro
    const username = req.nextUrl.searchParams.get('username') || 'unknown';
    const userData = users.find(u => u.username === username);
    const correlativo = userData?.correlativo || '';

    // 3️⃣ Insertar en MySQL
    const connection = await getDBConnection();

    await connection.execute(
      'INSERT INTO qr_history (username, original_url, short_url, correlativo) VALUES (?, ?, ?, ?)',
      [username, url, data.shorturl, correlativo]
    );

    await connection.end();

    // 4️⃣ Retornar respuesta
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in proxy or DB:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
