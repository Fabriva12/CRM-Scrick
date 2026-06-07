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
import { DeleteGastoDialog } from '@/components/organisms/DeleteGastoDialog';
import type { Gasto } from '@/lib/types/gastos';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

interface GastoDetailCardProps {
  gasto: Gasto;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
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
  }).format(new Date(dateStr));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
}

export function GastoDetailCard({ gasto }: GastoDetailCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gasto #{gasto.id.slice(0, 8)}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/30 p-4">
            <DetailRow label="Categoría" value={gasto.categoria} />
            <DetailRow label="Descripción" value={gasto.descripcion} />
            <DetailRow
              label="Monto"
              value={formatCurrency(gasto.monto)}
            />
            <DetailRow label="Fecha" value={formatDate(gasto.fecha)} />
            <DetailRow label="Notas" value={gasto.notas} />
            <DetailRow
              label="Creado"
              value={formatDate(gasto.created_at)}
            />
            <DetailRow
              label="Actualizado"
              value={formatDate(gasto.updated_at)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          <Button variant="outline" render={<Link href="/finanzas" />}>
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <div className="flex gap-2">
            <Button
              variant="default"
              render={<Link href={`/finanzas/${gasto.id}/editar`} />}
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

      <DeleteGastoDialog
        gastoId={gasto.id}
        gastoLabel={gasto.descripcion.slice(0, 40)}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
