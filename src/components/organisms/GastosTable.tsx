'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DeleteGastoDialog } from '@/components/organisms/DeleteGastoDialog';
import type { Gasto } from '@/lib/types/gastos';
import { CATEGORIAS } from '@/lib/validations/gastos';
import { Eye, Pencil, Trash2 } from 'lucide-react';

interface GastosTableProps {
  gastos: Gasto[];
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'CRC',
  }).format(value);
}

export function GastosTable({ gastos }: GastosTableProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    label: string;
  }>({ open: false, id: '', label: '' });
  const [categoria, setCategoria] = useState<'Todas' | (typeof CATEGORIAS)[number]>(
    'Todas'
  );
  const [busqueda, setBusqueda] = useState('');

  const categorias = Array.from(new Set(gastos.map((g) => g.categoria)));

  const filtered = gastos.filter((gasto) => {
    if (categoria !== 'Todas' && gasto.categoria !== categoria) return false;
    if (
      busqueda.trim() &&
      !gasto.descripcion.toLowerCase().includes(busqueda.trim().toLowerCase())
    )
      return false;
    return true;
  });

  function handleDeleteClick(gasto: Gasto) {
    const label = gasto.descripcion.slice(0, 40);
    setDeleteDialog({ open: true, id: gasto.id, label });
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={categoria}
          onChange={(e) =>
            setCategoria(e.target.value as typeof categoria)
          }
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm sm:w-auto"
        >
          <option value="Todas">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por descripción..."
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm sm:max-w-xs"
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden sm:table-cell">Categoría</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="hidden sm:table-cell">Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((gasto) => (
              <TableRow key={gasto.id}>
                <TableCell className="hidden sm:table-cell">
                  <span className="inline-flex items-center rounded-full bg-[#FEA372]/10 px-2.5 py-0.5 text-xs font-medium text-[#2F3031]">
                    {gasto.categoria}
                  </span>
                </TableCell>
                <TableCell className="font-medium max-w-xs truncate">
                  <Link
                    href={`/finanzas/${gasto.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {gasto.descripcion}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">
                  {formatCurrency(gasto.monto)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground whitespace-nowrap">
                  {formatDate(gasto.fecha)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="max-sm:size-11"
                      render={<Link href={`/finanzas/${gasto.id}`} />}
                    >
                      <Eye className="size-4" />
                      <span className="sr-only">Ver</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="max-sm:size-11"
                      render={<Link href={`/finanzas/${gasto.id}/editar`} />}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="max-sm:size-11"
                      onClick={() => handleDeleteClick(gasto)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No hay gastos que coincidan con el filtro
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteGastoDialog
        gastoId={deleteDialog.id}
        gastoLabel={deleteDialog.label}
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({ ...prev, open }))
        }
      />
    </>
  );
}
