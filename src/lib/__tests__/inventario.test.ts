import { describe, expect, it } from 'vitest';
import { calcularValorMateriales } from '../inventario';

// Nombres reales de ingredientes (según RECETAS) y de productos terminados.
const ingrediente = (p: Record<string, unknown>) => ({ tipo: 'ingrediente', costo: null, costo_total: null, cantidad_comprada: null, gramos_restantes: null, ...p });

describe('calcularValorMateriales', () => {
  it('ignora productos que no son ingredientes (paquetes terminados)', () => {
    const result = calcularValorMateriales([
      { nombre: 'Galleta Chocolate Blanco', tipo: 'paquete', costo: 1000, gramos_restantes: 5 },
    ]);
    expect(result).toEqual({ valor: 0, sinCosto: 0 });
  });

  it('valora ingredientes con costo_total y cantidad_comprada (costo por gramo)', () => {
    const result = calcularValorMateriales([
      ingrediente({
        nombre: 'Avena',
        costo_total: 1000,
        cantidad_comprada: 100, // 10 por gramo
        gramos_restantes: 250,
      }),
    ]);
    expect(result).toEqual({ valor: 2500, sinCosto: 0 });
  });

  it('usa el campo costo como fallback cuando falta costo_total/cantidad_comprada', () => {
    const result = calcularValorMateriales([
      ingrediente({ nombre: 'Canela', costo: 5, gramos_restantes: 200 }),
    ]);
    expect(result).toEqual({ valor: 1000, sinCosto: 0 });
  });

  it('cuenta como sinCosto los ingredientes sin costo cargado', () => {
    const result = calcularValorMateriales([
      ingrediente({ nombre: 'Empaque', gramos_restantes: 100 }),
    ]);
    expect(result).toEqual({ valor: 0, sinCosto: 1 });
  });

  it('no aporta valor ni sinCosto si el ingrediente no tiene gramos restantes', () => {
    const result = calcularValorMateriales([
      ingrediente({ nombre: 'Avena', costo: 10, gramos_restantes: null }),
    ]);
    expect(result).toEqual({ valor: 0, sinCosto: 0 });
  });

  it('suma todos los ingredientes y cuenta los que faltan por costo', () => {
    const result = calcularValorMateriales([
      ingrediente({
        nombre: 'Avena',
        costo_total: 1000,
        cantidad_comprada: 100,
        gramos_restantes: 100, // 1000
      }),
      ingrediente({ nombre: 'Canela', costo: 5, gramos_restantes: 10 }), // 50
      ingrediente({ nombre: 'Empaque', gramos_restantes: 10 }), // sin costo
      { nombre: 'Galleta Receta 1', tipo: 'paquete', costo: 900, gramos_restantes: 3 }, // no aplica
    ]);
    expect(result).toEqual({ valor: 1050, sinCosto: 1 });
  });

  it('redondea el valor final', () => {
    const result = calcularValorMateriales([
      ingrediente({
        nombre: 'Avena',
        costo_total: 1000,
        cantidad_comprada: 3,
        gramos_restantes: 3, // 3 × 333.333... = 1000 exacto
      }),
    ]);
    expect(result.valor).toBe(1000);
  });
});