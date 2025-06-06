// app/components/QRGenerator.tsx
'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSession } from 'next-auth/react';
import { AlertTriangle, Crown, Zap } from 'lucide-react';

interface UserStats {
  currentQRCount: number;
  monthlyQRCount: number;
  maxQRCodes: number;
  planName: string;
}

export default function QRGenerator() {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrStyle, setQrStyle] = useState<'classic' | 'blue'>('classic');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  
  const { data: session, update } = useSession();

  const defaultToken = process.env.NEXT_PUBLIC_DEFAULT_TOKEN || '';

  // Configuraciones de colores para diferentes estilos
  const qrStyles = {
    classic: { fgColor: '#000000', bgColor: '#ffffff' },
    blue: { fgColor: '#2563eb', bgColor: '#ffffff' },
  };

  // Actualizar stats del usuario desde la sesión
  useEffect(() => {
    if (session?.user) {
      setUserStats({
        currentQRCount: session.user.currentQRCount || 0,
        monthlyQRCount: session.user.monthlyQRCount || 0,
        maxQRCodes: session.user.subscription?.plan.maxQRCodes || 0,
        planName: session.user.subscription?.plan.displayName || 'Free'
      });
    }
  }, [session]);

  const handleGenerate = async () => {
    if (!longUrl) {
      setError('Por favor ingresa una URL');
      return;
    }

    if (!session?.user) {
      setError('Debes estar autenticado para generar QR codes');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const apiUrl = `/api/shorturl?token=${defaultToken}&url=${encodeURIComponent(longUrl)}&username=${session.user.email}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok) {
        // Manejar diferentes tipos de errores
        if (response.status === 403) {
          setError(data.error || 'Límite de QRs alcanzado');
          
          // Si incluye información de límites, actualizarla
          if (data.currentCount !== undefined) {
            setUserStats(prev => prev ? {
              ...prev,
              currentQRCount: data.currentCount,
              maxQRCodes: data.maxAllowed,
              planName: data.planName
            } : null);
          }
          
          setIsLoading(false);
          return;
        }
        
        throw new Error(data.error || 'Error al generar el link corto');
      }

      if (data.shorturl) {
        setShortUrl(data.shorturl);

        // Actualizar estadísticas del usuario
        if (data.userStats) {
          setUserStats(data.userStats);
          
          // Actualizar la sesión con los nuevos datos
          await update({
            ...session,
            user: {
              ...session.user,
              currentQRCount: data.userStats.currentQRCount,
              monthlyQRCount: data.userStats.monthlyQRCount
            }
          });
        }

        // Esperar que React renderice el QR
        await new Promise(resolve => setTimeout(resolve, 100));

        // Capturar SVG del QR generado
        const svgElement = document.getElementById('qr-svg')?.querySelector('svg')?.outerHTML || '';

        if (svgElement) {
          // Guardar el QR en la base de datos
          await fetch('/api/save-qr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: session.user.email,
              original_url: longUrl,
              short_url: data.shorturl,
              qr_svg: svgElement
            })
          });
        }
      } else {
        throw new Error('No se pudo generar el link corto');
      }
    } catch (error) {
      console.error('Error generating QR:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setShortUrl('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setLongUrl('');
    setShortUrl('');
    setError('');
  };

  const downloadQR = () => {
    const svgElement = document.getElementById('qr-svg')?.querySelector('svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `qr-code-${Date.now()}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      URL.revokeObjectURL(svgUrl);
    }
  };

  // Calcular porcentaje de uso
  const getUsagePercentage = () => {
    if (!userStats || userStats.maxQRCodes === -1) return 0;
    return Math.round((userStats.currentQRCount / userStats.maxQRCodes) * 100);
  };

  const isNearLimit = () => {
    const percentage = getUsagePercentage();
    return percentage >= 80;
  };

  const isAtLimit = () => {
    if (!userStats || userStats.maxQRCodes === -1) return false;
    return userStats.currentQRCount >= userStats.maxQRCodes;
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-2xl mb-6 font-bold text-gray-800 dark:text-gray-100">
        Generador de QR Dinámico
      </h2>

      {/* Información del usuario y límites */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
            <Crown size={16} className="mr-1" />
            <strong>{userStats?.planName || 'Free'}</strong>
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            👤 {session?.user?.name || session?.user?.email}
          </p>
        </div>

        {/* Barra de progreso de uso */}
        {userStats && userStats.maxQRCodes !== -1 && (
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-blue-700 dark:text-blue-300">
                QRs utilizados
              </span>
              <span className="text-xs text-blue-700 dark:text-blue-300">
                {userStats.currentQRCount}/{userStats.maxQRCodes}
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isAtLimit() ? 'bg-red-500' : 
                  isNearLimit() ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Estadísticas mensuales */}
        <p className="text-xs text-blue-600 dark:text-blue-400">
          📊 Este mes: {userStats?.monthlyQRCount || 0} QRs generados
        </p>
      </div>

      {/* Advertencia si está cerca del límite */}
      {isNearLimit() && !isAtLimit() && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
          <div className="flex items-center">
            <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400 mr-2" />
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              Te quedan {userStats!.maxQRCodes - userStats!.currentQRCount} QRs en tu plan actual
            </p>
          </div>
        </div>
      )}

      {/* Bloqueo si alcanzó el límite */}
      {isAtLimit() && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
          <div className="flex items-center mb-2">
            <AlertTriangle size={16} className="text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">
              Límite alcanzado
            </p>
          </div>
          <p className="text-red-600 dark:text-red-400 text-sm mb-3">
            Has utilizado todos los QRs de tu plan {userStats?.planName}. 
          </p>
          <button className="flex items-center bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-md text-sm transition-all">
            <Zap size={16} className="mr-1" />
            Actualizar Plan
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="longUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            URL a acortar
          </label>
          <input
            id="longUrl"
            type="url"
            placeholder="https://ejemplo.com/tu-url-larga"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            disabled={isLoading || isAtLimit()}
            className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded-md text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
          />
        </div>

        {/* Selector de estilo QR */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estilo del QR
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setQrStyle('classic')}
              disabled={isAtLimit()}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                qrStyle === 'classic'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Clásico
            </button>
            <button
              onClick={() => setQrStyle('blue')}
              disabled={isAtLimit()}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                qrStyle === 'blue'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Azul
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !longUrl.trim() || isAtLimit()}
            className={`flex-1 p-3 rounded-md text-white font-medium transition-colors ${
              isLoading || !longUrl.trim() || isAtLimit()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generando...
              </span>
            ) : isAtLimit() ? (
              'Límite alcanzado'
            ) : (
              'Generar QR'
            )}
          </button>

          {shortUrl && (
            <button
              onClick={handleReset}
              className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
            >
              Nuevo
            </button>
          )}
        </div>
      </div>

      {shortUrl && (
        <div className="mt-8 text-center border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            ¡QR Generado! 🎉
          </h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">URL acortada:</p>
            <a 
              href={shortUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline break-all"
            >
              {shortUrl}
            </a>
          </div>

          <div id="qr-svg" className="flex justify-center mb-4">
            <div className={`p-4 rounded-lg shadow-sm ${
              qrStyle === 'classic' ? 'bg-gradient-to-br from-blue-50 to-blue-100' : 'bg-white'
            }`}>
              <QRCodeSVG 
                value={`${shortUrl}?nocache=1`} 
                size={200}
                level="M"
                includeMargin={true}
                fgColor={qrStyles[qrStyle].fgColor}
                bgColor={qrStyles[qrStyle].bgColor}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-center mb-4">
            <button
              onClick={downloadQR}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
            >
              📥 Descargar QR
            </button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>Estilo: {qrStyle} | Plan: {userStats?.planName}</p>
            <p>QRs restantes: {userStats?.maxQRCodes === -1 ? '∞' : (userStats?.maxQRCodes || 0) - (userStats?.currentQRCount || 0)}</p>
          </div>
        </div>
      )}
    </div>
  );
}