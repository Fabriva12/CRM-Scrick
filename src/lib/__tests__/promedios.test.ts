import { describe, expect, it } from 'vitest';
import {
  agruparPromediosPorMes,
  calcularPromedios,
  promedioPrecioUnitario,
} from '@/lib/promedios';

describe('promedioPrecioUnitario', () => {
  it('calcula el precio promedio ponderado por cantidad', () => {
    const precio = promedioPrecioUnitario([
      {
        fecha: '2026-09-01',
        monto_total: 0,
        venta_productos: [
          { cantidad: 1, precio_unitario: 1600 },
          { cantidad: 3, precio_unitario: 2400 },
        ],
      },
    ]);

    expect(precio).toBe(2200); // (1600 + 7200) / 4
  });

  it('devuelve null cuando no hay líneas reales', () => {
    const precio = promedioPrecioUnitario([
      { fecha: '2026-09-01', monto_total: 8000, venta_productos: [] },
      { fecha: '2026-09-02', monto_total: 5000, venta_productos: null },
    ]);

    expect(precio).toBeNull();
  });
});

describe('agruparPromediosPorMes', () => {
  it('agrupa ventas del mismo mes sumando ingresos y unidades', () => {
    const resultado = agruparPromediosPorMes([
      {
        fecha: '2026-03-10',
        monto_total: 1000,
        venta_productos: [{ cantidad: 2 }, { cantidad: 3 }],
      },
      {
        fecha: '2026-03-22',
        monto_total: '500',
        venta_productos: [{ cantidad: 1 }],
      },
    ]);

    expect(resultado).toEqual([
      {
        mes: '2026-03',
        ingresos: 1500,
        unidades: 6,
        unidadesReales: 6,
        unidadesEstimadas: 0,
      },
    ]);
  });

  it('estima unidades de ventas sin líneas usando el precio promedio', () => {
    const resultado = agruparPromediosPorMes(
      [
        { fecha: '2026-08-05', monto_total: 3200, venta_productos: [] },
        { fecha: '2026-08-20', monto_total: 1600, venta_productos: [] },
        {
          fecha: '2026-09-01',
          monto_total: 1600,
          venta_productos: [{ cantidad: 1, precio_unitario: 1600 }],
        },
      ],
      1600
    );

    expect(resultado).toEqual([
      {
        mes: '2026-08',
        ingresos: 4800,
        unidades: 3, // 3200/1600 + 1600/1600
        unidadesReales: 0,
        unidadesEstimadas: 3,
      },
      {
        mes: '2026-09',
        ingresos: 1600,
        unidades: 1, // real, no se estima
        unidadesReales: 1,
        unidadesEstimadas: 0,
      },
    ]);
  });

  it('sin precio promedio no estima unidades', () => {
    const resultado = agruparPromediosPorMes([
      { fecha: '2026-08-05', monto_total: 3200, venta_productos: [] },
    ]);

    expect(resultado).toEqual([
      {
        mes: '2026-08',
        ingresos: 3200,
        unidades: 0,
        unidadesReales: 0,
        unidadesEstimadas: 0,
      },
    ]);
  });

  it('normaliza strings y descarta fechas inválidas o null', () => {
    const resultado = agruparPromediosPorMes([
      { fecha: null, monto_total: 100, venta_productos: [{ cantidad: 2 }] },
      { fecha: '2025-12-05', monto_total: '200', venta_productos: null },
      { fecha: '2025-12-08', monto_total: 0, venta_productos: [] },
    ]);

    expect(resultado).toEqual([
      {
        mes: '2025-12',
        ingresos: 200,
        unidades: 0,
        unidadesReales: 0,
        unidadesEstimadas: 0,
      },
    ]);
  });

  it('ordena los meses de menor a mayor', () => {
    const resultado = agruparPromediosPorMes([
      { fecha: '2026-02-01', monto_total: 1, venta_productos: [] },
      { fecha: '2025-11-01', monto_total: 1, venta_productos: [] },
    ]);

    expect(resultado.map((m) => m.mes)).toEqual(['2025-11', '2026-02']);
  });
});

describe('calcularPromedios', () => {
  const meses = [
    {
      mes: '2025-11',
      ingresos: 1100,
      unidades: 4,
      unidadesReales: 4,
      unidadesEstimadas: 0,
    },
    { mes: '2025-12', ingresos: 0, unidades: 0, unidadesReales: 0, unidadesEstimadas: 0 },
    {
      mes: '2026-01',
      ingresos: 2700,
      unidades: 8,
      unidadesReales: 8,
      unidadesEstimadas: 0,
    },
    {
      mes: '2026-02',
      ingresos: 1300,
      unidades: 6,
      unidadesReales: 0,
      unidadesEstimadas: 6,
    },
  ];

  it('filtrando por año divide por los meses activos de ese año', () => {
    const p = calcularPromedios(meses, '2026');

    expect(p.ingresosTotales).toBe(4000);
    expect(p.unidadesTotales).toBe(14);
    expect(p.mesesConVentas).toBe(2);
    expect(p.ingresoPromedioMensual).toBe(2000);
    expect(p.unidadesPromedioMensuales).toBe(7);
  });

  it('marca usandoEstimacion cuando hay unidades estimadas en el período', () => {
    const conEstimacion = calcularPromedios(meses, '2026');
    expect(conEstimacion.usandoEstimacion).toBe(true);

    const sinEstimacion = calcularPromedios(meses, '2025');
    expect(sinEstimacion.usandoEstimacion).toBe(false);
  });

  it('con histórico (null) usa todos los meses activos', () => {
    const p = calcularPromedios(meses, null);

    expect(p.mesesConVentas).toBe(3);
    expect(p.ingresoPromedioMensual).toBeCloseTo(5100 / 3);
    expect(p.unidadesPromedioMensuales).toBe(6);
  });

  it('ignora meses sin actividad para el promedio', () => {
    const p = calcularPromedios(meses, '2025');

    expect(p.mesesConVentas).toBe(1);
    expect(p.ingresoPromedioMensual).toBe(1100);
    expect(p.unidadesPromedioMensuales).toBe(4);
  });

  it('devuelve nulls cuando no hay meses activos en el período', () => {
    const p = calcularPromedios(meses, '2024');

    expect(p.mesesConVentas).toBe(0);
    expect(p.ingresoPromedioMensual).toBeNull();
    expect(p.unidadesPromedioMensuales).toBeNull();
  });
});