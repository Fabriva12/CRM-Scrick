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
import { deleteProducto } from '@/actions/productos';

interface DeleteProductoDialogProps {
  productoId: string;
  productoNombre: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteProductoDialog({
  productoId,
  productoNombre,
  open,
  onOpenChange,
  onSuccess,
}: DeleteProductoDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteProducto(productoId);
      if (result.success) {
        toast.success(`Producto "${productoNombre}" eliminado correctamente`);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error ?? 'Error al eliminar el producto');
      }
    } catch {
      toast.error('Error inesperado al eliminar el producto');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar Producto</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de eliminar{' '}
            <span className="font-medium text-foreground">{productoNombre}</span>?
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
