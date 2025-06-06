// /app/api/update-url/route.ts

import { NextResponse } from 'next/server';
import { getDBConnection } from '@/app/lib/db';
import prisma from '@/app/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, new_url, short_url, username } = body;

    // Validación de campos requeridos
    if (!id || !new_url || !short_url || !username) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields: id, new_url, short_url, username' 
      }, { status: 400 });
    }

    // Validar que la nueva URL sea válida
    try {
      new URL(new_url);
    } catch {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid URL format' 
      }, { status: 400 });
    }

    // 1. Buscar el usuario en la base de datos por email
    const user = await prisma.user.findUnique({
      where: { email: username }, // username es el email en tu sistema
      include: {
        subscription: {
          include: { plan: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }

    // 2. Verificar que el QR pertenece al usuario
    const connection = await getDBConnection();
    
    interface QRHistoryRow {
      id: number;
      username: string;
      original_url: string;
      short_url: string;
      correlativo: string;
      created_at: Date;
      qr_svg?: string;
    }
    
    const [qrRows] = await connection.execute(
      'SELECT * FROM qr_history WHERE id = ? AND username = ?',
      [id, username]
    ) as [QRHistoryRow[], unknown];

    if (!qrRows || qrRows.length === 0) {
      await connection.end();
      return NextResponse.json({ 
        success: false, 
        message: 'QR not found or access denied' 
      }, { status: 403 });
    }

    // 3. Obtener el token por defecto (deberías tener esto en variables de entorno)
    const token = process.env.YOURLS_DEFAULT_TOKEN || process.env.NEXT_PUBLIC_DEFAULT_TOKEN;
    
    if (!token) {
      await connection.end();
      return NextResponse.json({ 
        success: false, 
        message: 'YOURLS token not configured' 
      }, { status: 500 });
    }

    // 4. Extraer keyword de la URL corta
    const urlParts = short_url.split('/');
    const keyword = urlParts[urlParts.length - 1];

    // 5. Actualizar en YOURLS
    const yourlsApiUrl = `https://qr-me.xyz/yourls-api.php?action=update&shorturl=${keyword}&url=${encodeURIComponent(new_url)}&signature=${token}&format=json`;

    console.log('🔄 Calling YOURLS API to update:', keyword);

    const yourlsResponse = await fetch(yourlsApiUrl);
    
    if (!yourlsResponse.ok) {
      await connection.end();
      return NextResponse.json({ 
        success: false, 
        message: `YOURLS API request failed: ${yourlsResponse.status}` 
      }, { status: 500 });
    }

    const yourlsData = await yourlsResponse.json();
    console.log('📝 YOURLS API response:', yourlsData);

    // 6. Verificar respuesta de YOURLS (diferentes APIs pueden tener diferentes formatos)
    const isYourlsSuccess = yourlsData.status === 'success' || 
                           yourlsData.statusCode === 200 || 
                           yourlsData.message?.includes('success') ||
                           !yourlsData.error;

    if (!isYourlsSuccess) {
      await connection.end();
      console.error('❌ YOURLS update failed:', yourlsData);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to update YOURLS: ' + (yourlsData.message || yourlsData.error || 'Unknown error'),
        yourlsData 
      }, { status: 400 });
    }

    // 7. Actualizar en la base de datos local
    try {
      await connection.execute(
        'UPDATE qr_history SET original_url = ? WHERE id = ? AND username = ?',
        [new_url, id, username]
      );

      console.log('✅ Database updated successfully for QR ID:', id);
    } catch (dbError) {
      console.error('❌ Database update failed:', dbError);
      // Nota: YOURLS ya se actualizó, pero la DB local falló
      // Podrías considerar un rollback o logging para reconciliación
    } finally {
      await connection.end();
    }

    return NextResponse.json({ 
      success: true,
      message: 'URL updated successfully',
      data: {
        id,
        new_url,
        short_url,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 Error in update-url API:', error);
    
    // Type guard para error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}