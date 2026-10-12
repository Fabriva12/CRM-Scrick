import { describe, expect, it } from 'vitest';

import { agruparResumenMensual } from '../resumen-mensual';

describe('agruparResumenMensual', () => {
  it('agrupa ingresos, egresos, envíos y paquetes por mes (desc)', () => {
    const ventas = [
      {
        fecha: '2026-01-10',
        monto_total: 1000,
        venta_productos: [{ cantidad: 2 }],
      },
      {
        fecha: '2026-01-20',
        monto_total: 500,
        venta_productos: [{ cantidad: 1 }],
      },
      {
        fecha: '2025-12-05',
        monto_total: 2000,
        venta_productos: [{ cantidad: 4 }],
      },
    ];
    const gastos = [
      { fecha: '2026-01-15', monto: 300, categoria: 'Transporte' },
      { fecha: '2026-01-18', monto: 100, categoria: 'Marketing' },
      { fecha: '2025-12-20', monto: 250, categoria: 'Transporte' },
    ];

    expect(agruparResumenMensual(ventas, gastos)).toEqual([
      {
        mes: '2026-01',
        ingreso: 1500,
        egreso: 400,
        envios: 300,
        ingresoNeto: 1200,
        paquetes: 3,
      },
      {
        mes: '2025-12',
        ingreso: 2000,
        egreso: 250,
        envios: 250,
        ingresoNeto: 1750,
        paquetes: 4,
      },
    ]);
  });

  it('estima paquetes de ventas sin detalle con el precio promedio', () => {
    const ventas = [
      { fecha: '2026-02-01', monto_total: 1000, venta_productos: [] },
    ];

    expect(agruparResumenMensual(ventas, [], 500)).toEqual([
      {
        mes: '2026-02',
        ingreso: 1000,
        egreso: 0,
        envios: 0,
        ingresoNeto: 1000,
        paquetes: 2,
      },
    ]);
  });

  it('incluye un mes que solo tiene gastos', () => {
    const gastos = [{ fecha: '2026-03-01', monto: 50, categoria: 'Oficina' }];

    expect(agruparResumenMensual([], gastos)).toEqual([
      {
        mes: '2026-03',
        ingreso: 0,
        egreso: 50,
        envios: 0,
        ingresoNeto: 0,
        paquetes: 0,
      },
    ]);
  });

  it('devuelve lista vacía sin datos', () => {
    expect(agruparResumenMensual([], [])).toEqual([]);
  });
});
