// app/api/shorturl/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDBConnection } from '@/app/lib/db';
import prisma from '@/app/lib/prisma';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const token = req.nextUrl.searchParams.get('token');
  const username = req.nextUrl.searchParams.get('username'); // Email del usuario

  if (!url || !token || !username) {
    return NextResponse.json({ 
      error: 'Missing url, token or username' 
    }, { status: 400 });
  }

  try {
    // 1. Buscar el usuario en Prisma y verificar límites
    const user = await prisma.user.findUnique({
      where: { email: username },
      include: { 
        subscription: { 
          include: { plan: true } 
        } 
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'Usuario no encontrado' 
      }, { status: 404 });
    }

    if (!user.subscription) {
      return NextResponse.json({ 
        error: 'Usuario sin suscripción activa' 
      }, { status: 403 });
    }

    // 2. Verificar reset mensual (si ha pasado un mes desde el último reset)
    const now = new Date();
    const lastReset = new Date(user.lastMonthReset);
    const monthsSinceReset = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                            (now.getMonth() - lastReset.getMonth());

    let currentUser = user;
    if (monthsSinceReset >= 1) {
      // Reset del contador mensual
      currentUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          monthlyQRCount: 0,
          lastMonthReset: now
        },
        include: { 
          subscription: { 
            include: { plan: true } 
          } 
        }
      });
      
      console.log(`✅ Reset mensual aplicado para usuario ${user.email}`);
    }

    // 3. Verificar si el usuario ha excedido su límite (después del posible reset)
    if (!currentUser.subscription) {
      return NextResponse.json({ 
        error: 'Usuario sin suscripción activa' 
      }, { status: 403 });
    }

    const plan = currentUser.subscription.plan;
    const currentCount = currentUser.currentQRCount || 0;
    
    // -1 significa ilimitado
    if (plan.maxQRCodes !== -1 && currentCount >= plan.maxQRCodes) {
      return NextResponse.json({ 
        error: `Límite alcanzado. Tu plan ${plan.displayName} permite ${plan.maxQRCodes} QRs. Considera actualizar tu plan.`,
        currentCount,
        maxAllowed: plan.maxQRCodes,
        planName: plan.displayName
      }, { status: 403 });
    }

    // 4. Llamada a YOURLS API
    const yourlsApiUrl = `https://qr-me.xyz/yourls-api.php?signature=${token}&action=shorturl&format=json&url=${encodeURIComponent(url)}`;
    
    const response = await fetch(yourlsApiUrl);
    const data = await response.json();

    if (!data.shorturl) {
      console.error('Error in YOURLS API:', data);
      return NextResponse.json({ 
        error: 'Error al generar URL corta', 
        details: data 
      }, { status: 500 });
    }

    // 5. Transacción: Incrementar contadores + Insertar en historial
    await prisma.$transaction(async (tx) => {
      // Incrementar contadores del usuario
      await tx.user.update({
        where: { id: currentUser.id },
        data: {
          currentQRCount: { increment: 1 },
          monthlyQRCount: { increment: 1 }
        }
      });

      // Insertar en historial usando MySQL directo (tabla legacy)
      const connection = await getDBConnection();
      await connection.execute(
        'INSERT INTO qr_history (username, original_url, short_url, correlativo) VALUES (?, ?, ?, ?)',
        [username, url, data.shorturl, username]
      );
      await connection.end();
    });

    // 6. Obtener datos actualizados del usuario para la respuesta
    const finalUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { 
        subscription: { 
          include: { plan: true } 
        } 
      }
    });

    return NextResponse.json({
      ...data,
      userStats: {
        currentQRCount: finalUser?.currentQRCount || 0,
        monthlyQRCount: finalUser?.monthlyQRCount || 0,
        maxQRCodes: finalUser?.subscription?.plan.maxQRCodes || 0,
        planName: finalUser?.subscription?.plan.displayName || 'Unknown'
      }
    });

  } catch (error) {
    console.error('Error in shorturl API:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}