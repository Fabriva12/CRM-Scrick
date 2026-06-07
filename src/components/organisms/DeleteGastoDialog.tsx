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
import { deleteGasto } from '@/actions/gastos';

interface DeleteGastoDialogProps {
  gastoId: string;
  gastoLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteGastoDialog({
  gastoId,
  gastoLabel,
  open,
  onOpenChange,
  onSuccess,
}: DeleteGastoDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteGasto(gastoId);
      if (result.success) {
        toast.success('Gasto eliminado correctamente');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error ?? 'Error al eliminar el gasto');
      }
    } catch {
      toast.error('Error inesperado al eliminar el gasto');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar Gasto</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de eliminar{' '}
            <span className="font-medium text-foreground">{gastoLabel}</span>?
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
