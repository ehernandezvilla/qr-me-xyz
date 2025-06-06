// app/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import QRGenerator from '@/app/components/QRGenerator';

export default function GeneratorPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-2xl font-bold">QR-me xyz</h1>
        <p className="text-gray-600">
          Bienvenido, {session.user?.name || session.user?.email}
        </p>
      </div>

      <QRGenerator />
    </div>
  );
}