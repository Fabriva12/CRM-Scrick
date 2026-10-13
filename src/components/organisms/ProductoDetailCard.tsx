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
import { formatCurrency } from '@/lib/format';
import { sufijoStock } from '@/lib/recetas';
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

function formatGramos(value: number) {
  return value.toLocaleString('es-CR', { maximumFractionDigits: 2 });
}

export function ProductoDetailCard({ producto }: ProductoDetailCardProps) {
  const esIngredienteProducto = producto.tipo === 'ingrediente';
  const formatoPorGramo = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
  const costoPorGramo = esIngredienteProducto ? producto.costo : null;
  const gramosRestantes = esIngredienteProducto
    ? producto.gramos_restantes
    : null;

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
          <DetailRow
            label="Precio Venta"
            value={formatCurrency(producto.precio_venta)}
          />
          {esIngredienteProducto ? (
            <>
              <DetailRow
                label="Costo total"
                value={formatCurrency(producto.costo_total)}
              />
              <DetailRow
                label="Cantidad"
                value={
                  producto.cantidad_comprada != null
                    ? String(producto.cantidad_comprada)
                    : null
                }
              />
              <DetailRow
                label="Costo por gramo"
                value={
                  costoPorGramo != null
                    ? formatoPorGramo.format(costoPorGramo)
                    : null
                }
              />
            </>
          ) : (
            <DetailRow label="Costo" value={formatCurrency(producto.costo)} />
          )}
          {esIngredienteProducto ? (
            <DetailRow
              label="Gramos restantes"
              value={
                gramosRestantes != null
                  ? formatGramos(gramosRestantes)
                  : null
              }
            />
          ) : (
            <DetailRow
              label="Stock"
              value={`${String(producto.stock)} ${sufijoStock(
                producto.nombre,
                producto.unidad || 'unid'
              )}`}
            />
          )}
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
