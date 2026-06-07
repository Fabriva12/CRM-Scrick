'use client';

import { cn } from '@/lib/utils';

interface DetailRowProps {
  label: string;
  value: string | null;
  className?: string;
}

export function DetailRow({ label, value, className }: DetailRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 py-2 text-sm border-b border-border/50 last:border-0 sm:grid sm:grid-cols-[120px_1fr] sm:gap-2',
        className
      )}
    >
      <span className="font-medium text-muted-foreground">{label}</span>
      <span>{value || '—'}</span>
    </div>
  );
}
