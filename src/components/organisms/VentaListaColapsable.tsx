'use client';

import type { ReactNode } from 'react';
import { Collapsible } from '@base-ui/react/collapsible';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VentaListaColapsableProps {
  count: number;
  children: ReactNode;
}

export function VentaListaColapsable({
  count,
  children,
}: VentaListaColapsableProps) {
  return (
    <Collapsible.Root>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-heading text-xl tracking-wide">Lista de ventas</h2>
        <Collapsible.Trigger
          render={
            <Button variant="outline" size="sm" className="group gap-1.5">
              Ver lista ({count})
              <ChevronDown className="size-4 transition-transform group-data-[panel-open]:rotate-180" />
            </Button>
          }
        />
      </div>
      <Collapsible.Panel keepMounted>{children}</Collapsible.Panel>
    </Collapsible.Root>
  );
}
