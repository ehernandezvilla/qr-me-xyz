// app/components/URLAnalytics.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, Users, Globe, Clock, Eye, ExternalLink, Copy, Check } from 'lucide-react';
import { 
  URLDetailsResponse, 
  TrafficStatsResponse,
  getCountryInfo,
  formatNumber,
  formatDateTime,
  formatDate
} from '@/app/types/analytics';

interface URLAnalyticsProps {
  shortUrl: string;
  onClose: () => void;
}

export default function URLAnalytics({ shortUrl, onClose }: URLAnalyticsProps) {
  const [urlDetails, setUrlDetails] = useState<URLDetailsResponse | null>(null);
  const [trafficStats, setTrafficStats] = useState<TrafficStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [shortUrl, timeframe]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch URL details y traffic stats en paralelo
      const [detailsResponse, statsResponse] = await Promise.all([
        fetch(`/api/analytics/url-details?shortUrl=${encodeURIComponent(shortUrl)}`),
        fetch(`/api/analytics/traffic-stats?shortUrl=${encodeURIComponent(shortUrl)}&timeframe=${timeframe}`)
      ]);

      if (!detailsResponse.ok || !statsResponse.ok) {
        throw new Error('Error al cargar las estadísticas');
      }

      const [detailsData, statsData] = await Promise.all([
        detailsResponse.json(),
        statsResponse.json()
      ]);

      setUrlDetails(detailsData);
      setTrafficStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const getTopDevice = () => {
    if (!trafficStats?.deviceStats.devices) return 'N/A';
    const devices = trafficStats.deviceStats.devices;
    const maxDevice = Object.entries(devices).reduce((a, b) => devices[a[0] as keyof typeof devices] > devices[b[0] as keyof typeof devices] ? a : b);
    return maxDevice[0].charAt(0).toUpperCase() + maxDevice[0].slice(1);
  };

  const getTopBrowser = () => {
    if (!trafficStats?.deviceStats.browsers) return 'N/A';
    const browsers = trafficStats.deviceStats.browsers;
    const maxBrowser = Object.entries(browsers).reduce((a, b) => browsers[a[0] as keyof typeof browsers] > browsers[b[0] as keyof typeof browsers] ? a : b);
    return maxBrowser[0].charAt(0).toUpperCase() + maxBrowser[0].slice(1);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
            Cargando análisis de {shortUrl}...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-red-600">Error</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Análisis del QR
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">URL Original:</span>
                  <a 
                    href={urlDetails?.urlInfo.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                  >
                    {urlDetails?.urlInfo.originalUrl}
                    <ExternalLink size={14} />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">URL Corta:</span>
                  <button
                    onClick={() => copyToClipboard(shortUrl)}
                    className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                  >
                    {shortUrl}
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                  Creado: {urlDetails?.urlInfo.createdAt ? formatDateTime(urlDetails.urlInfo.createdAt) : 'N/A'}
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex gap-2 mt-4">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timeframe === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {period === '7d' ? 'Últimos 7 días' : period === '30d' ? 'Últimos 30 días' : 'Últimos 90 días'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Clicks</p>
                  <p className="text-2xl font-bold">{formatNumber(trafficStats?.totalClicks || 0)}</p>
                </div>
                <TrendingUp size={24} className="text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Visitantes Únicos</p>
                  <p className="text-2xl font-bold">{formatNumber(trafficStats?.uniqueVisitors || 0)}</p>
                </div>
                <Users size={24} className="text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Dispositivo Principal</p>
                  <p className="text-lg font-bold">{getTopDevice()}</p>
                </div>
                <Eye size={24} className="text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Navegador Principal</p>
                  <p className="text-lg font-bold">{getTopBrowser()}</p>
                </div>
                <Globe size={24} className="text-orange-200" />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Traffic Chart */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Tráfico Diario
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {trafficStats?.dailyTraffic.slice(-14).map((day,) => (

                  <div key={day.date} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(day.date)}
                    </span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="bg-blue-500 h-2 rounded"
                        style={{ width: `${Math.max((day.clicks / Math.max(...(trafficStats?.dailyTraffic.map(d => d.clicks) || [1]))) * 60, 4)}px` }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[2rem] text-right">
                        {day.clicks}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Countries */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Países con Más Tráfico
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {trafficStats?.locationStats.slice(0, 10).map((location, ) => {
                  const countryInfo = getCountryInfo(location.countryCode);
                  return (
                    <div key={location.countryCode} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{countryInfo.flag}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {countryInfo.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {location.countryCode}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {location.clicks}
                        </div>
                        <div className="text-xs text-gray-500">
                          {location.percentage}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Device & Browser Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Devices */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Dispositivos
              </h3>
              <div className="space-y-3">
                {trafficStats?.deviceStats.devices && Object.entries(trafficStats.deviceStats.devices).map(([device, count]) => (
                  <div key={device} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {device}
                    </span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="bg-green-500 h-2 rounded"
                        style={{ 
                          width: `${Math.max((count / Math.max(...Object.values(trafficStats.deviceStats.devices))) * 40, 4)}px` 
                        }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[2rem] text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Browsers */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Navegadores
              </h3>
              <div className="space-y-3">
                {trafficStats?.deviceStats.browsers && Object.entries(trafficStats.deviceStats.browsers).map(([browser, count]) => (
                  <div key={browser} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {browser}
                    </span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="bg-purple-500 h-2 rounded"
                        style={{ 
                          width: `${Math.max((count / Math.max(...Object.values(trafficStats.deviceStats.browsers))) * 40, 4)}px` 
                        }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[2rem] text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Traffic Sources */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Fuentes de Tráfico
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {trafficStats?.trafficSources.slice(0, 8).map((source, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {source.source}
                    </span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="bg-orange-500 h-2 rounded"
                        style={{ 
                          width: `${Math.max((source.clicks / Math.max(...(trafficStats?.trafficSources.map(s => s.clicks) || [1]))) * 40, 4)}px` 
                        }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[2rem] text-right">
                        {source.clicks}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Clock size={20} />
              Actividad Reciente
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="pb-2">Fecha/Hora</th>
                    <th className="pb-2">País</th>
                    <th className="pb-2">Referrer</th>
                    <th className="pb-2">IP</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {urlDetails?.recentClicks.slice(0, 10).map((click, ) => {
                    const countryInfo = getCountryInfo(click.country);
                    return (
                      <tr key={click.id} className="text-sm">
                        <td className="py-2 text-gray-900 dark:text-gray-100">
                          {formatDateTime(click.timestamp)}
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <span>{countryInfo.flag}</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {countryInfo.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {click.referrer}
                        </td>
                        <td className="py-2 text-gray-500 dark:text-gray-500 font-mono text-xs">
                          {click.ip}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {(!urlDetails?.recentClicks || urlDetails.recentClicks.length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay actividad reciente registrada
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 rounded-b-lg">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Datos actualizados: {trafficStats?.timestamp ? formatDateTime(trafficStats.timestamp) : 'N/A'}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}