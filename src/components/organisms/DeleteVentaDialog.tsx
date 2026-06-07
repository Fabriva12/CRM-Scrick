'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deleteVenta } from '@/actions/ventas';

interface DeleteVentaDialogProps {
  ventaId: string;
  ventaLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteVentaDialog({
  ventaId,
  ventaLabel,
  open,
  onOpenChange,
  onSuccess,
}: DeleteVentaDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteVenta(ventaId);
      if (result.success) {
        toast.success(`Venta eliminada correctamente`);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error ?? 'Error al eliminar la venta');
      }
    } catch {
      toast.error('Error inesperado al eliminar la venta');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar Venta</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de eliminar{' '}
            <span className="font-medium text-foreground">{ventaLabel}</span>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton={false}>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
