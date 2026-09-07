'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { Calendar, RotateCcw, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FiltroMesProps {
  basePath: string;
  mes?: string;
}

function formatMes(mes: string): string {
  const [year, month] = mes.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('es-MX', { month: 'short', year: 'numeric' }).format(
    date
  );
}

export function FiltroMes({ basePath, mes }: FiltroMesProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (value: string) => {
      if (!value) return;
      router.push(`${basePath}?mes=${value}`);
      setOpen(false);
    },
    [basePath, router]
  );

  const handleGeneral = useCallback(() => {
    router.push(basePath);
    setOpen(false);
  }, [basePath, router]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Calendar className="size-3.5" />
            {mes && <span className="font-medium">{formatMes(mes)}</span>}
          </Button>
        }
      />
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side="bottom"
          align="end"
          className="z-50 outline-none"
        >
          <PopoverPrimitive.Popup className="w-64 rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-border outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <div className="flex items-center justify-between gap-2">
              <PopoverPrimitive.Title className="font-medium">
                Filtrar por mes
              </PopoverPrimitive.Title>
              <PopoverPrimitive.Close
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Cerrar"
                    className="text-muted-foreground"
                  >
                    <X />
                  </Button>
                }
              />
            </div>
            <div className="mt-3">
              <Input
                type="month"
                value={mes ?? ''}
                onChange={(e) => handleSelect(e.target.value)}
                aria-label="Elegir mes"
              />
            </div>
            <PopoverPrimitive.Close
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full gap-1.5"
                  onClick={handleGeneral}
                >
                  <RotateCcw className="size-3.5" />
                  General
                </Button>
              }
            />
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}