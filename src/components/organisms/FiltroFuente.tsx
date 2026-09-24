'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { FUENTES } from '@/lib/validations/clientes';

interface FiltroFuenteProps {
  fuente?: string;
}

export function FiltroFuente({ fuente }: FiltroFuenteProps) {
  const router = useRouter();

  const handleChange = useCallback(
    (value: string) => {
      router.push(
        value ? `/clientes?fuente=${encodeURIComponent(value)}` : '/clientes'
      );
    },
    [router]
  );

  return (
    <select
      value={fuente ?? ''}
      onChange={(e) => handleChange(e.target.value)}
      aria-label="Filtrar clientes por fuente"
      className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="">Todas las fuentes</option>
      {FUENTES.map((f) => (
        <option key={f} value={f}>
          {f}
        </option>
      ))}
    </select>
  );
}