// /app/components/NavbarComponent.tsx

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCurrentUser, logout } from '@/app/lib/auth';
import { useRouter } from 'next/navigation';

export default function NavbarComponent() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Left: Logo & Links */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-xl font-bold text-blue-600">
              QRApp
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-500"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/history"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-500"
                >
                  Historial
                </Link>
              </>
            )}
          </div>

          {/* Right: User / Login / Logout */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-700 dark:text-gray-300">
                  Usuario: <strong>{user}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
