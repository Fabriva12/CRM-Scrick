import { describe, expect, it } from 'vitest';
import {
  agruparGastosPorCategoria,
  agruparGastosPorMes,
  serieGastosMensuales,
} from '../gastos-resumen';

const gasto = (p: {
  fecha?: string | null;
  monto?: number | null;
  categoria?: string | null;
}) => ({ fecha: '2026-01-15', monto: 100, categoria: 'Otros', ...p });

describe('agruparGastosPorMes', () => {
  it('agrupa montos por mes y ordena ascendente', () => {
    const result = agruparGastosPorMes([
      gasto({ fecha: '2026-01-10', monto: 300 }),
      gasto({ fecha: '2026-01-25', monto: 200 }),
      gasto({ fecha: '2025-12-05', monto: 150 }),
    ]);
    expect(result).toEqual([
      { mes: '2025-12', total: 150 },
      { mes: '2026-01', total: 500 },
    ]);
  });

  it('ignora gastos sin fecha o sin monto', () => {
    const result = agruparGastosPorMes([
      gasto({ fecha: null, monto: 500 }),
      gasto({ fecha: '2026-02-01', monto: null }),
      gasto({ fecha: '2026-02-02', monto: 250 }),
    ]);
    expect(result).toEqual([{ mes: '2026-02', total: 250 }]);
  });
});

describe('serieGastosMensuales', () => {
  it('con año devuelve 12 meses continuos con sus etiquetas', () => {
    const result = serieGastosMensuales(
      [gasto({ fecha: '2026-01-10', monto: 500 })],
      '2026'
    );
    expect(result).toHaveLength(12);
    expect(result[0]).toEqual({ mes: '2026-01', etiqueta: 'ene', gastos: 500 });
    expect(result[11].mes).toBe('2026-12');
    expect(result[11].etiqueta).toBe('dic');
    expect(result[1].gastos).toBe(0);
  });

  it('sin año ancla al último mes con datos y rellena los últimos 12', () => {
    const result = serieGastosMensuales([
      gasto({ fecha: '2025-12-10', monto: 100 }),
      gasto({ fecha: '2026-01-10', monto: 300 }),
    ]);
    expect(result).toHaveLength(12);
    expect(result[11]).toEqual({ mes: '2026-01', etiqueta: 'ene', gastos: 300 });
    expect(result[10]).toEqual({ mes: '2025-12', etiqueta: 'dic', gastos: 100 });
    expect(result[9]).toEqual({ mes: '2025-11', etiqueta: 'nov', gastos: 0 });
  });
});

describe('agruparGastosPorCategoria', () => {
  it('agrupa por categoría ordenada por monto descendente', () => {
    const result = agruparGastosPorCategoria([
      gasto({ categoria: 'Transporte', monto: 500 }),
      gasto({ categoria: 'Produccion', monto: 700 }),
      gasto({ categoria: 'Transporte', monto: 100 }),
    ]);
    expect(result).toEqual([
      { categoria: 'Produccion', monto: 700 },
      { categoria: 'Transporte', monto: 600 },
    ]);
  });

  it('ignora montos no positivos y manda categoría vacía a Otros', () => {
    const result = agruparGastosPorCategoria([
      gasto({ categoria: null, monto: 250 }),
      gasto({ categoria: '', monto: 150 }),
      gasto({ categoria: 'Marketing', monto: 0 }),
    ]);
    expect(result).toEqual([{ categoria: 'Otros', monto: 400 }]);
  });
});