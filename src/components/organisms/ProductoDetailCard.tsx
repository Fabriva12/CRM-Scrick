'use client';

import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DetailRow } from '@/components/molecules/DetailRow';
import type { Producto } from '@/lib/types/productos';
import { ArrowLeft, Pencil } from 'lucide-react';

interface ProductoDetailCardProps {
  producto: Producto;
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
    currency: 'CRC',
  }).format(value);
}

export function ProductoDetailCard({ producto }: ProductoDetailCardProps) {
  return (
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
      <CardFooter className="flex flex-col-reverse justify-between gap-4 sm:flex-row">
        <Button variant="outline" render={<Link href="/productos" />}>
          <ArrowLeft className="size-4" />
          Volver
        </Button>
        <Button
          variant="default"
          render={<Link href={`/productos/${producto.id}/editar`} />}
        >
          <Pencil className="size-4" />
          Editar
        </Button>
      </CardFooter>
    </Card>
  );
}
