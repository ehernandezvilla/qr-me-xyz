// app/api/analytics/traffic-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';
import type { 
  DailyStatsRecord, 
  HourlyStatsRecord, 
  DeviceStats,
  TrafficStatsResponse 
} from '@/app/types/analytics';

export async function GET(req: NextRequest): Promise<NextResponse<TrafficStatsResponse | { error: string }>> {
  const username = req.nextUrl.searchParams.get('username');
  const shortUrl = req.nextUrl.searchParams.get('shortUrl');
  const timeframe = req.nextUrl.searchParams.get('timeframe') || '30d';

  if (!username && !shortUrl) {
    return NextResponse.json({ error: 'Se requiere username o shortUrl' }, { status: 400 });
  }

  try {
    const whereCondition: Prisma.yprezq_logWhereInput = {};
    let dateFilter: Date | undefined;

    // Filtro por tiempo
    if (timeframe === '7d') {
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === '30d') {
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeframe === '90d') {
      dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    }

    if (dateFilter) {
      whereCondition.click_time = {
        gte: dateFilter
      };
    }

    // Si es para una URL específica
    if (shortUrl) {
      // Extraer el keyword de la URL
      const keyword = shortUrl.split('/').pop();
      if (keyword) {
        whereCondition.shorturl = keyword;
      }
    }

    // Si es para un usuario específico, necesitamos correlacionar con qr_history
    if (username && !shortUrl) {
      // Primero obtener todas las URLs del usuario
      const userUrls = await prisma.qr_history.findMany({
        where: { username },
        select: { short_url: true }
      });

      // Filtrar undefined y extraer keywords válidos
      const keywords = userUrls
        .map(url => url.short_url.split('/').pop())
        .filter((keyword): keyword is string => keyword !== undefined && keyword !== '');
      
      if (keywords.length > 0) {
        whereCondition.shorturl = {
          in: keywords
        };
      } else {
        // Si no hay keywords válidos, retornar estadísticas vacías
        return NextResponse.json({
          timeframe,
          totalClicks: 0,
          uniqueVisitors: 0,
          dailyTraffic: [],
          locationStats: [],
          trafficSources: [],
          deviceStats: { 
            devices: { mobile: 0, desktop: 0, tablet: 0 },
            browsers: { chrome: 0, firefox: 0, safari: 0, edge: 0, other: 0 },
            os: { windows: 0, mac: 0, linux: 0, android: 0, ios: 0, other: 0 }
          },
          hourlyDistribution: [],
          timestamp: new Date().toISOString()
        });
      }
    }

    // 1. Traffic Statistics - Conteo por días
    const trafficByDay = await prisma.yprezq_log.groupBy({
      by: ['click_time'],
      where: whereCondition,
      _count: {
        click_id: true
      },
      orderBy: {
        click_time: 'asc'
      }
    });

    // Agrupar por día manualmente (ya que Prisma no tiene DATE() function)
    const dailyStats: DailyStatsRecord = trafficByDay.reduce((acc: DailyStatsRecord, item) => {
      const date = item.click_time.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += item._count.click_id;
      return acc;
    }, {} as DailyStatsRecord);

    // 2. Traffic by Location - Conteo por país
    const trafficByLocation = await prisma.yprezq_log.groupBy({
      by: ['country_code'],
      where: whereCondition,
      _count: {
        click_id: true
      },
      orderBy: {
        _count: {
          click_id: 'desc'
        }
      }
    });

    // 3. Traffic Sources - Conteo por referrer
    const trafficSources = await prisma.yprezq_log.groupBy({
      by: ['referrer'],
      where: whereCondition,
      _count: {
        click_id: true
      },
      orderBy: {
        _count: {
          click_id: 'desc'
        }
      }
    });

    // 4. Device/Browser Analysis desde User Agent
    const userAgents = await prisma.yprezq_log.findMany({
      where: whereCondition,
      select: {
        user_agent: true
      }
    });

    // Analizar user agents para extraer info de dispositivos
    const deviceStats = analyzeUserAgents(userAgents.map(ua => ua.user_agent));

    // 5. Estadísticas generales
    const totalClicks = await prisma.yprezq_log.count({
      where: whereCondition
    });

    const uniqueIPs = await prisma.yprezq_log.groupBy({
      by: ['ip_address'],
      where: whereCondition,
      _count: {
        click_id: true
      }
    });

    // 6. Top performing hours
    const hourlyStats: HourlyStatsRecord = trafficByDay.reduce((acc: HourlyStatsRecord, item) => {
      const hour = item.click_time.getHours();
      if (!acc[hour]) {
        acc[hour] = 0;
      }
      acc[hour] += item._count.click_id;
      return acc;
    }, {} as HourlyStatsRecord);

    return NextResponse.json({
      timeframe,
      totalClicks,
      uniqueVisitors: uniqueIPs.length,
      
      dailyTraffic: Object.entries(dailyStats).map(([date, clicks]) => ({
        date,
        clicks
      })),
      
      locationStats: trafficByLocation.map(item => ({
        countryCode: item.country_code,
        clicks: item._count.click_id,
        percentage: ((item._count.click_id / totalClicks) * 100).toFixed(1)
      })),
      
      trafficSources: trafficSources.map(item => ({
        source: categorizeReferrer(item.referrer),
        referrer: item.referrer,
        clicks: item._count.click_id,
        percentage: ((item._count.click_id / totalClicks) * 100).toFixed(1)
      })).slice(0, 10), // Top 10 sources
      
      deviceStats,
      
      hourlyDistribution: Object.entries(hourlyStats).map(([hour, clicks]) => ({
        hour: parseInt(hour),
        clicks
      })).sort((a, b) => a.hour - b.hour),
      
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching traffic stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}

// Función helper para analizar user agents
function analyzeUserAgents(userAgents: string[]): DeviceStats {
  const devices = { mobile: 0, desktop: 0, tablet: 0 };
  const browsers = { chrome: 0, firefox: 0, safari: 0, edge: 0, other: 0 };
  const os = { windows: 0, mac: 0, linux: 0, android: 0, ios: 0, other: 0 };

  userAgents.forEach(ua => {
    const uaLower = ua.toLowerCase();
    
    // Device detection
    if (uaLower.includes('mobile') || uaLower.includes('iphone') || uaLower.includes('android')) {
      devices.mobile++;
    } else if (uaLower.includes('tablet') || uaLower.includes('ipad')) {
      devices.tablet++;
    } else {
      devices.desktop++;
    }
    
    // Browser detection
    if (uaLower.includes('chrome') && !uaLower.includes('edge')) {
      browsers.chrome++;
    } else if (uaLower.includes('firefox')) {
      browsers.firefox++;
    } else if (uaLower.includes('safari') && !uaLower.includes('chrome')) {
      browsers.safari++;
    } else if (uaLower.includes('edge')) {
      browsers.edge++;
    } else {
      browsers.other++;
    }
    
    // OS detection
    if (uaLower.includes('windows')) {
      os.windows++;
    } else if (uaLower.includes('mac') || uaLower.includes('osx')) {
      os.mac++;
    } else if (uaLower.includes('linux')) {
      os.linux++;
    } else if (uaLower.includes('android')) {
      os.android++;
    } else if (uaLower.includes('ios') || uaLower.includes('iphone') || uaLower.includes('ipad')) {
      os.ios++;
    } else {
      os.other++;
    }
  });

  return { devices, browsers, os };
}

// Función helper para categorizar referrers
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