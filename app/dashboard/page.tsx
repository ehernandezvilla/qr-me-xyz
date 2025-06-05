// /app/dashboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/app/lib/auth';
import QRGenerator from '@/app/components/QRGenerator';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
    }
  }, [router]);


  if (!user) {
    return null; // no mostrar nada mientras redirige
  }

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-2xl font-bold">QR Generator Dashboard</h1>
      </div>

      <QRGenerator />
    </div>
  );
}
