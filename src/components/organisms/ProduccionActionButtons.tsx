'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProduccionDialog } from './ProduccionDialog';
import { CookingPot } from 'lucide-react';

export function ProduccionActionButtons() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setDialogOpen(true)}>
        <CookingPot className="size-4" />
        Producir
      </Button>
      <ProduccionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
