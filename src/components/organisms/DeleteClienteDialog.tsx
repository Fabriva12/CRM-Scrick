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
import { deleteCliente } from '@/actions/clientes';

interface DeleteClienteDialogProps {
  clienteId: string;
  clienteNombre: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteClienteDialog({
  clienteId,
  clienteNombre,
  open,
  onOpenChange,
  onSuccess,
}: DeleteClienteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteCliente(clienteId);
      if (result.success) {
        toast.success(`Cliente "${clienteNombre}" eliminado correctamente`);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error ?? 'Error al eliminar el cliente');
      }
    } catch {
      toast.error('Error inesperado al eliminar el cliente');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar Cliente</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de eliminar a{' '}
            <span className="font-medium text-foreground">{clienteNombre}</span>?
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
