// /app/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/app/lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return null; // No renderiza nada, solo redirige
}
