// /app/dashboard/history/layout.tsx

import { ReactNode } from 'react';

export default function HistoryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  );
}
