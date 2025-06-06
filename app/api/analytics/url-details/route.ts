// app/api/analytics/url-details/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(req: NextRequest) {
  const shortUrl = req.nextUrl.searchParams.get('shortUrl');
  
  if (!shortUrl) {
    return NextResponse.json({ error: 'Se requiere shortUrl' }, { status: 400 });
  }

  try {
    // Extraer keyword de la URL
    const keyword = shortUrl.split('/').pop();
    
    if (!keyword) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    // 1. Información básica de la URL desde qr_history
    const urlInfo = await prisma.qr_history.findFirst({
      where: { 
        short_url: {
          contains: keyword
        }
      }
    });

    if (!urlInfo) {
      return NextResponse.json({ error: 'URL no encontrada' }, { status: 404 });
    }

    // 2. Detalles de clicks desde yprezq_log
    const clickDetails = await prisma.yprezq_log.findMany({
      where: {
        shorturl: keyword
      },
      orderBy: {
        click_time: 'desc'
      },
      take: 100 // Limitar a los últimos 100 clicks
    });

    // 3. Estadísticas agregadas
    const totalClicks = await prisma.yprezq_log.count({
      where: { shorturl: keyword }
    });

    const uniqueIPs = await prisma.yprezq_log.groupBy({
      by: ['ip_address'],
      where: { shorturl: keyword }
    });

    const locationStats = await prisma.yprezq_log.groupBy({
      by: ['country_code'],
      where: { shorturl: keyword },
      _count: {
        click_id: true
      },
      orderBy: {
        _count: {
          click_id: 'desc'
        }
      }
    });

    // 4. Formatear respuesta
    const recentClicks = clickDetails.map(click => ({
      id: click.click_id,
      timestamp: click.click_time,
      ip: click.ip_address,
      country: click.country_code,
      referrer: categorizeReferrer(click.referrer),
      userAgent: click.user_agent
    }));

    return NextResponse.json({
      urlInfo: {
        id: urlInfo.id,
        originalUrl: urlInfo.original_url,
        shortUrl: urlInfo.short_url,
        createdAt: urlInfo.created_at,
        username: urlInfo.username,
        correlativo: urlInfo.correlativo
      },
      stats: {
        totalClicks,
        uniqueVisitors: uniqueIPs.length,
        topCountries: locationStats.map(stat => ({
          countryCode: stat.country_code,
          clicks: stat._count.click_id,
          percentage: ((stat._count.click_id / totalClicks) * 100).toFixed(1)
        }))
      },
      recentClicks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching URL details:', error);
    return NextResponse.json({ error: 'Error al obtener detalles de la URL' }, { status: 500 });
  }
}

// Función helper para categorizar referrers (igual que en traffic-stats)
function categorizeReferrer(referrer: string): string {
  if (!referrer || referrer === '') return 'Direct';
  
  const refLower = referrer.toLowerCase();
  
  if (refLower.includes('google')) return 'Google';
  if (refLower.includes('facebook')) return 'Facebook';
  if (refLower.includes('twitter') || refLower.includes('t.co')) return 'Twitter';
  if (refLower.includes('linkedin')) return 'LinkedIn';
  if (refLower.includes('instagram')) return 'Instagram';
  if (refLower.includes('youtube')) return 'YouTube';
  if (refLower.includes('whatsapp')) return 'WhatsApp';
  if (refLower.includes('telegram')) return 'Telegram';
  if (refLower.includes('tiktok')) return 'TikTok';
  
  // Extract domain
  try {
    const domain = new URL(referrer).hostname;
    return domain.replace('www.', '');
  } catch {
    return 'Other';
  }
}