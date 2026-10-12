import { describe, it, expect } from 'vitest';
import { agruparVentasPorFuente, resumirVentas } from '../ventas';
import type { Venta } from '@/lib/types/ventas';

function crearVenta(overrides: Partial<Venta> = {}): Venta {
  return {
    id: 'v1',
    cliente_id: 'c1',
    fecha: '2026-01-15',
    estado: 'pagado',
    monto_total: 1000,
    notas: null,
    created_at: '2026-01-15T00:00:00.000Z',
    updated_at: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('resumirVentas', () => {
  it('devuelve ceros para una lista vacía', () => {
    expect(resumirVentas([])).toEqual({
      totalFacturado: 0,
      cantidad: 0,
      cobrado: 0,
      cantidadPagadas: 0,
      porCobrar: 0,
      cantidadPendientes: 0,
    });
  });

  it('suma el total y separa cobrado de por cobrar', () => {
    const ventas = [
      crearVenta({ id: 'a', estado: 'pagado', monto_total: 1400 }),
      crearVenta({ id: 'b', estado: 'pendiente', monto_total: 600 }),
    ];
    expect(resumirVentas(ventas)).toEqual({
      totalFacturado: 2000,
      cantidad: 2,
      cobrado: 1400,
      cantidadPagadas: 1,
      porCobrar: 600,
      cantidadPendientes: 1,
    });
  });

  it('no cuenta las ventas canceladas en cobrado ni por cobrar', () => {
    const ventas = [crearVenta({ id: 'a', estado: 'cancelado', monto_total: 500 })];
    expect(resumirVentas(ventas)).toEqual({
      totalFacturado: 500,
      cantidad: 1,
      cobrado: 0,
      cantidadPagadas: 0,
      porCobrar: 0,
      cantidadPendientes: 0,
    });
  });
});

describe('agruparVentasPorFuente', () => {
  it('cuenta ventas por fuente ordenando de mayor a menor', () => {
    const ventas = [
      { clientes: { fuente: 'Redes Sociales' } },
      { clientes: { fuente: 'Redes Sociales' } },
      { clientes: { fuente: 'Web' } },
    ];
    expect(agruparVentasPorFuente(ventas)).toEqual([
      { fuente: 'Redes Sociales', cantidad: 2 },
      { fuente: 'Web', cantidad: 1 },
    ]);
  });

  it('agrupa fuente nula o no reconocida en "Desconocido"', () => {
    const ventas = [
      { clientes: { fuente: null } },
      { clientes: null },
      {},
      { clientes: { fuente: 'Instagram' } },
    ];
    expect(agruparVentasPorFuente(ventas)).toEqual([
      { fuente: 'Desconocido', cantidad: 4 },
    ]);
  });

  it('mantiene "Otro" cuando el cliente lo eligió explícitamente', () => {
    const ventas = [
      { clientes: { fuente: 'Otro' } },
      { clientes: { fuente: 'Otro' } },
      { clientes: { fuente: null } },
    ];
    expect(agruparVentasPorFuente(ventas)).toEqual([
      { fuente: 'Otro', cantidad: 2 },
      { fuente: 'Desconocido', cantidad: 1 },
    ]);
  });

  it('devuelve lista vacía sin ventas', () => {
    expect(agruparVentasPorFuente([])).toEqual([]);
  });
});
