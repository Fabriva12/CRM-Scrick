'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AjustarStockDialog } from './AjustarStockDialog';
import type { Producto } from '@/lib/types/productos';
import { PackagePlus } from 'lucide-react';

interface AjustarStockButtonProps {
  productos: Producto[];
}

export function AjustarStockButton({ productos }: AjustarStockButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setDialogOpen(true)}>
        <PackagePlus className="size-4" />
        Añadir
      </Button>
      <AjustarStockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productos={productos}
      />
    </>
  );
}
