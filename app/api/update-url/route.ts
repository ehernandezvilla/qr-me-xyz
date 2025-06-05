// /app/api/update-url/route.ts

import { NextResponse } from 'next/server';
import { getDBConnection } from '@/app/lib/db';
import { users } from '@/app/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, new_url, short_url, username } = body;

    if (!id || !new_url || !short_url || !username) {
      return NextResponse.json({ success: false, message: 'Missing required fields' });
    }

    const userData = users.find(u => u.username === username);
    const token = userData?.token;

    if (!token) {
      return NextResponse.json({ success: false, message: 'User token not found' });
    }

    const urlParts = short_url.split('/');
    const keyword = urlParts[urlParts.length - 1];

    const yourlsApiUrl = `https://qr-me.xyz/yourls-api.php?action=update&shorturl=${keyword}&url=${encodeURIComponent(new_url)}&signature=${token}&format=json`;

    console.log('Calling YOURLS API:', yourlsApiUrl);

    const yourlsResponse = await fetch(yourlsApiUrl);
    const yourlsData = await yourlsResponse.json();

    console.log('YOURLS API response:', yourlsData);

    if (yourlsData.statusCode !== 200) {
      return NextResponse.json({ success: false, message: 'Failed to update YOURLS', yourlsData });
    }

    const connection = await getDBConnection();

    await connection.execute(
      'UPDATE qr_history SET original_url = ? WHERE id = ?',
      [new_url, id]
    );

    await connection.end();

    console.log('DB updated successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in update-url:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' });
  }
}
