// /app/layout.tsx

import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QR Generator App - YOURLS/BAKSLASH',
  description: 'Generador de QR dinámico con YOURLS | BAKSLASH',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-gray-800 antialiased">
        <main className="max-w-4xl mx-auto py-6 px-4">
          {children}
        </main>
      </body>
    </html>
  );
}
