//app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import NavbarComponent from './components/NavbarComponent';
import FooterComponent from './components/FooterComponent'; 
import SessionProvider from './components/SessionProvider';

export const metadata: Metadata = {
  title: 'QR Generator App - YOURLS/BAKSLASH',
  description: 'Generador de QR dinámico con YOURLS | BAKSLASH',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-gray-800 antialiased flex flex-col">
        <SessionProvider>
          <NavbarComponent />

          {/* Main content (sin max-w) */}
          <main className="flex-grow px-4">
            {children}
          </main>

          <FooterComponent />
        </SessionProvider>
      </body>
    </html>
  );
}