import './globals.css';
import type { Metadata } from 'next';
import NavbarComponent from './components/NavbarComponent';
import FooterComponent from './components/FooterComponent'; 

export const metadata: Metadata = {
  title: 'QR Generator App - YOURLS/BAKSLASH',
  description: 'Generador de QR dinámico con YOURLS | BAKSLASH',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-gray-800 antialiased flex flex-col">
        <NavbarComponent />
        
        {/* Main content */}
        <main className="flex-grow max-w-4xl mx-auto py-6 px-4">
          {children}
        </main>

        {/* Footer */}
        <FooterComponent />
      </body>
    </html>
  );
}
