import { describe, expect, it } from 'vitest';
import {
  COSTO_PAQUETE,
  calcularCostoPaquetes,
  calcularMargen,
} from '@/lib/margen';

describe('calcularCostoPaquetes', () => {
  it('multiplica la cantidad de paquetes por el costo fijo', () => {
    expect(calcularCostoPaquetes(0)).toBe(0);
    expect(calcularCostoPaquetes(1)).toBe(COSTO_PAQUETE);
    expect(calcularCostoPaquetes(10)).toBe(COSTO_PAQUETE * 10);
  });
});

describe('calcularMargen', () => {
  it('calcula el margen restando el costo fijo', () => {
    // 10 paquetes a 1600 facturados, costo 10 × 1045
    expect(calcularMargen(16000, calcularCostoPaquetes(10))).toBeCloseTo(
      (16000 - 10450) / 16000
    );
  });

  it('devuelve fracción entre 0 y 1', () => {
    const margen = calcularMargen(2000, 1000);
    expect(margen).toBe(0.5);
  });

  it('devuelve null cuando el facturado no es mayor a 0', () => {
    expect(calcularMargen(0, 100)).toBeNull();
    expect(calcularMargen(-100, 100)).toBeNull();
  });
});