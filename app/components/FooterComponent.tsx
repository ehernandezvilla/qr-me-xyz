'use client';

import Link from 'next/link';
import { QrCode } from 'lucide-react';

export default function FooterComponent() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-10">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
        {/* Left: Logo / Nombre */}
        <div className="flex items-center space-x-2 mb-4 md:mb-0">
          <QrCode size={20} />
          <span>QRApp © {new Date().getFullYear()}</span>
        </div>

        {/* Right: Links */}
        <div className="flex space-x-4">
          <Link
            href="/"
            className="hover:text-blue-500 transition-colors"
          >
            Inicio
          </Link>
          <Link
            href="/dashboard"
            className="hover:text-blue-500 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/history"
            className="hover:text-blue-500 transition-colors"
          >
            Historial
          </Link>
          <a
            href="https://bakslash.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500 transition-colors"
          >
            by Bakslash
          </a>
        </div>
      </div>
    </footer>
  );
}
