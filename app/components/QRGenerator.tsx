// /app/components/QRGenerator.tsx

'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getCurrentUser, users } from '@/app/lib/auth';

export default function QRGenerator() {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = getCurrentUser();
  const userData = users.find(u => u.username === (currentUser || 'zoa'));
  const token = userData?.token || '';
  const correlativo = userData?.correlativo || '';
  const handleGenerate = async () => {
  if (!longUrl) return;

  const apiUrl = `/api/shorturl?token=${token}&url=${encodeURIComponent(longUrl)}&username=${currentUser}`;

  try {
    setIsLoading(true);

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.shorturl) {
      // 1️⃣ Mostrar el shortUrl
      setShortUrl(data.shorturl);

      // 2️⃣ Esperar que React renderice el QR
      await new Promise(resolve => setTimeout(resolve, 100));

      // 3️⃣ Capturar SVG
      const svgElement = document.getElementById('qr-svg')?.querySelector('svg')?.outerHTML || '';

      console.log('Captured SVG:', svgElement);

      // 4️⃣ POST a /api/save-qr
      await fetch('/api/save-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser,
          original_url: longUrl,
          short_url: data.shorturl,
          qr_svg: svgElement
        })
      });

      console.log('QR SVG saved to DB');
    } else {
      console.error('Error creating shortlink:', data);
      setShortUrl('');
    }
  } catch (error) {
    console.error('Error calling API:', error);
    setShortUrl('');
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="p-4 bg-white rounded shadow max-w-lg mx-auto">
      <h2 className="text-xl mb-4 font-bold text-gray-800">Generador de QR Dinámico</h2>

      <input
        type="text"
        placeholder="URL larga"
        value={longUrl}
        onChange={(e) => setLongUrl(e.target.value)}
        className="border p-2 w-full mb-4 rounded text-gray-800"
      />

      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className={`w-full p-2 rounded text-white ${
          isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {isLoading ? 'Generando...' : 'Generar QR'}
      </button>

      {shortUrl && (
        <div className="mt-6 text-center">
          <p className="mb-2 text-blue-700 underline">
            <a href={shortUrl} target="_blank" rel="noopener noreferrer">
              {shortUrl}
            </a>
          </p>

          <div id="qr-svg">
          <QRCodeSVG value={`${shortUrl}?nocache=1`} size={256} />
          </div>

          <p className="mt-2 text-sm text-gray-600">
            Correlativo: {correlativo}
          </p>
        </div>
      )}
    </div>
  );
}
