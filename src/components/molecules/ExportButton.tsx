'use client';

import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';

interface Column {
  key: string;
  label: string;
  format?: 'currency' | 'date' | 'number';
}

interface ExportButtonProps {
  data: Record<string, unknown>[];
  columns: Column[];
  filename: string;
  label?: string;
}

export function ExportButton({
  data,
  columns,
  filename,
  label = 'Exportar a Excel',
}: ExportButtonProps) {
  function handleExport() {
    const rows = data.map((item) => {
      const row: Record<string, unknown> = {};
      for (const col of columns) {
        const value = item[col.key];
        if (col.format === 'currency' && typeof value === 'number') {
          row[col.label] = value;
        } else if (col.format === 'date' && typeof value === 'string') {
          row[col.label] = value.split('T')[0];
        } else {
          row[col.label] = value ?? '';
        }
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-size columns
    const colWidths = columns.map((col) => ({
      wch: Math.max(col.label.length, 12),
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');

    // Write with explicit bookType and UTF-8 encoding
    XLSX.writeFile(wb, `${filename}.xlsx`, {
      bookType: 'xlsx',
      type: 'binary',
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="border-scrick-charcoal/20 text-scrick-charcoal hover:bg-scrick-salmon/10"
    >
      <span className="mr-1.5">📥</span>
      {label}
    </Button>
  );
}
