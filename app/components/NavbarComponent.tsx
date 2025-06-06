//app/components/NavbarComponent.tsx

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  X,
  LogIn,
  LogOut,
  Home,
  History,
  QrCode,
} from 'lucide-react';

export default function NavbarComponent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  // Evitar hydration mismatch mostrando loading state
  if (!hasMounted) {
    return (
      <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-xl font-bold text-blue-600 flex items-center space-x-2"
              >
                <QrCode size={24} />
                <span>QRApp</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const isAuthenticated = status === 'authenticated' && session?.user;
  const isLoading = status === 'loading';

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Left: Logo */}
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-xl font-bold text-blue-600 flex items-center space-x-2"
            >
              <QrCode size={24} />
              <span>QRApp</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            {isLoading && (
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            )}

            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors"
                >
                  <Home size={18} className="mr-1" />
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/history"
                  className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors"
                >
                  <History size={18} className="mr-1" />
                  Historial
                </Link>
                <span className="text-gray-700 dark:text-gray-300">
                  Usuario: <strong>{session.user.username || session.user.email}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
                >
                  <LogOut size={18} className="mr-1" />
                  Logout
                </button>
              </>
            )}

            {!isAuthenticated && !isLoading && (
              <>
                <Link
                  href="/register"
                  className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors"
                >
                  Registro
                </Link>
                <Link
                  href="/login"
                  className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                >
                  <LogIn size={18} className="mr-1" />
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2 bg-white dark:bg-gray-900 transition-all duration-300">
          {isAuthenticated && (
            <>
              <Link
                href="/dashboard"
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors"
                onClick={toggleMenu}
              >
                <Home size={18} className="mr-2" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/history"
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors"
                onClick={toggleMenu}
              >
                <History size={18} className="mr-2" />
                Historial
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
                className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded w-full transition-colors"
              >
                <LogOut size={18} className="mr-2" />
                Logout
              </button>
            </>
          )}

          {!isAuthenticated && !isLoading && (
            <>
              <Link
                href="/register"
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors"
                onClick={toggleMenu}
              >
                Registro
              </Link>
              <Link
                href="/login"
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded w-full transition-colors"
                onClick={toggleMenu}
              >
                <LogIn size={18} className="mr-2" />
                Login
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}