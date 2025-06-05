import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col flex-grow h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-6 py-6">
      <div className="w-full flex-grow flex flex-col">
        {children}
      </div>
    </div>
  );
}
