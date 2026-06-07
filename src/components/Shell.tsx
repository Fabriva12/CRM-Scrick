'use client';

import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/organisms/AppShell';
import { Toaster } from '@/components/ui/sonner';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith('/login')) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <AppShell>
      {children}
      <Toaster />
    </AppShell>
  );
}
