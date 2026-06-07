import type { ReactNode } from 'react';

export default function ClientesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
