// app/components/QRGenerator.tsx
'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSession } from 'next-auth/react';

export default function QRGenerator() {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { data: session } = useSession();

  // Por ahora, usaremos un token y correlativo por defecto
  // TODO: Migrar el sistema de tokens a la nueva estructura de usuarios
  const defaultToken = process.env.NEXT_PUBLIC_DEFAULT_TOKEN || '';
  const defaultCorrelativo = session?.user?.username || session?.user?.email || 'user';

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
      // Construir la URL de la API
      const apiUrl = `/api/shorturl?token=${defaultToken}&url=${encodeURIComponent(longUrl)}&username=${session.user.email}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar el link corto');
      }

      if (data.shorturl) {
        setShortUrl(data.shorturl);

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

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-2xl mb-6 font-bold text-gray-800 dark:text-gray-100">
        Generador de QR Dinámico
      </h2>

      {/* Usuario actual */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          👤 Usuario: <strong>{session?.user?.name || session?.user?.email}</strong>
        </p>
        {session?.user?.subscription && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Plan: {session.user.subscription.plan.displayName} | 
            QRs creados: {session.user.currentQRCount || 0}/{session.user.subscription.plan.maxQRCodes === -1 ? '∞' : session.user.subscription.plan.maxQRCodes}
          </p>
        )}
      </div>

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
            disabled={isLoading}
            className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded-md text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !longUrl.trim()}
            className={`flex-1 p-3 rounded-md text-white font-medium transition-colors ${
              isLoading || !longUrl.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generando...
              </span>
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
            ¡QR Generado!
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
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <QRCodeSVG 
                value={`${shortUrl}?nocache=1`} 
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Correlativo: {defaultCorrelativo}
          </p>
        </div>
      )}
    </div>
  );
}