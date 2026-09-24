import { describe, expect, it } from 'vitest';
import {
  RECETAS,
  buscarRecetaPorProducto,
  calcularCostoReceta,
  esIngrediente,
} from '../recetas';

const receta1 = RECETAS.find((r) => r.id === 'receta-1')!;
const receta2 = RECETAS.find((r) => r.id === 'receta-2')!;

describe('buscarRecetaPorProducto', () => {
  it('encuentra la receta por nombre del producto terminado', () => {
    expect(buscarRecetaPorProducto('Galleta Chocolate Blanco')?.id).toBe(
      'receta-2'
    );
    expect(buscarRecetaPorProducto('Galleta Receta 1')?.id).toBe('receta-1');
  });

  it('devuelve undefined para productos sin receta', () => {
    expect(buscarRecetaPorProducto('No existe')).toBeUndefined();
  });
});

describe('esIngrediente', () => {
  it('reconoce ingredientes de las recetas', () => {
    expect(esIngrediente('Harina de almendra')).toBe(true);
    expect(esIngrediente('Empaque')).toBe(true);
  });

  it('no marca como ingrediente a los productos terminados', () => {
    expect(esIngrediente('Galleta Receta 1')).toBe(false);
    expect(esIngrediente('Galleta Chocolate Blanco')).toBe(false);
  });

  it('maneja valores vacíos', () => {
    expect(esIngrediente(null)).toBe(false);
    expect(esIngrediente(undefined)).toBe(false);
    expect(esIngrediente('')).toBe(false);
  });
});

describe('calcularCostoReceta', () => {
  it('suma cantidad × costo de cada ingrediente cuando todos tienen costo', () => {
    const costos: Record<string, number> = {};
    for (const ing of receta1.ingredientes) costos[ing.nombre] = 100;

    const esperado = receta1.ingredientes.reduce(
      (sum, ing) => sum + ing.cantidad * 100,
      0
    );
    expect(calcularCostoReceta(receta1, costos)).toBeCloseTo(esperado, 6);
  });

  it('permite costo 0 explícito (ingrediente sin costo)', () => {
    const costos: Record<string, number> = {};
    for (const ing of receta2.ingredientes) costos[ing.nombre] = 0;

    expect(calcularCostoReceta(receta2, costos)).toBeCloseTo(0, 6);
  });

  it('devuelve null si falta el costo de al menos un ingrediente', () => {
    const costos: Record<string, number | null> = {};
    for (const ing of receta2.ingredientes) costos[ing.nombre] = 50;
    costos[receta2.ingredientes[0].nombre] = null;

    expect(calcularCostoReceta(receta2, costos)).toBeNull();
  });

  it('devuelve null si ningún ingrediente tiene costo cargado', () => {
    const costos: Record<string, null> = {};
    for (const ing of receta1.ingredientes) costos[ing.nombre] = null;

    expect(calcularCostoReceta(receta1, costos)).toBeNull();
  });
});
