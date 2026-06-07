'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar className="hidden md:flex w-64" />

      {/* Mobile sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <Sidebar onClose={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {/* Mobile hamburger */}
        <button
          type="button"
          className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground md:hidden"
          onClick={() => setSheetOpen(true)}
        >
          <Menu className="size-5" />
          Menú
        </button>
        {children}
      </main>
    </div>
  );
}
