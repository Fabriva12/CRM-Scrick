'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeleteProductoDialog } from '@/components/organisms/DeleteProductoDialog';
import type { Producto } from '@/lib/types/productos';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

interface ProductoDetailCardProps {
  producto: Producto;
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 py-2 text-sm border-b border-border/50 last:border-0">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span>{value || '—'}</span>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function formatCurrency(value: number | null) {
  if (value === null) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
}

export function ProductoDetailCard({ producto }: ProductoDetailCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>{producto.nombre}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/30 p-4">
            <DetailRow label="SKU" value={producto.sku} />
            <DetailRow
              label="Precio Venta"
              value={formatCurrency(producto.precio_venta)}
            />
            <DetailRow label="Costo" value={formatCurrency(producto.costo)} />
            <DetailRow label="Stock" value={String(producto.stock)} />
            <DetailRow label="Unidad" value={producto.unidad} />
            <DetailRow label="Paquete" value={producto.paquete} />
            <DetailRow label="Descripción" value={producto.descripcion} />
            <DetailRow
              label="Creado"
              value={formatDate(producto.created_at)}
            />
            <DetailRow
              label="Actualizado"
              value={formatDate(producto.updated_at)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          <Button variant="outline" render={<Link href="/productos" />}>
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <div className="flex gap-2">
            <Button
              variant="default"
              render={<Link href={`/productos/${producto.id}/editar`} />}
            >
              <Pencil className="size-4" />
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          </div>
        </CardFooter>
      </Card>

      <DeleteProductoDialog
        productoId={producto.id}
        productoNombre={producto.nombre}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
