import { describe, expect, it } from 'vitest';
import {
  calcularCostoPorGramo,
  productoSchema,
} from '../productos';

describe('calcularCostoPorGramo', () => {
  it('divide costo total entre cantidad comprada', () => {
    expect(calcularCostoPorGramo(8725, 1000)).toBeCloseTo(8.725, 6);
    expect(calcularCostoPorGramo(5000, 250)).toBeCloseTo(20, 6);
  });

  it('devuelve null cuando falta alguno de los datos', () => {
    expect(calcularCostoPorGramo(null, 1000)).toBeNull();
    expect(calcularCostoPorGramo(8725, null)).toBeNull();
    expect(calcularCostoPorGramo(undefined, 1000)).toBeNull();
  });

  it('devuelve null si la cantidad es 0 o negativa', () => {
    expect(calcularCostoPorGramo(8725, 0)).toBeNull();
    expect(calcularCostoPorGramo(8725, -5)).toBeNull();
  });
});

describe('productoSchema costo por gramo', () => {
  it('acepta costo_total + cantidad_comprada en ingrediente', () => {
    const result = productoSchema.safeParse({
      nombre: 'Harina de almendra',
      costo_total: '8725',
      cantidad_comprada: '1000',
      stock: '0',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.costo_total).toBe(8725);
      expect(result.data.cantidad_comprada).toBe(1000);
      expect(result.data.costo).toBeNull();
    }
  });

  it('rechaza costo_total sin cantidad comprada', () => {
    const result = productoSchema.safeParse({
      nombre: 'Harina de almendra',
      costo_total: '8725',
      cantidad_comprada: '',
      stock: '0',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors;
      expect(flattened.cantidad_comprada).toBeDefined();
    }
  });

  it('acepta costo manual en producto terminado', () => {
    const result = productoSchema.safeParse({
      nombre: 'Galleta Receta 1',
      precio_venta: '1600',
      costo: '1080',
      stock: '0',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.costo).toBe(1080);
      expect(result.data.precio_venta).toBe(1600);
    }
  });
});

describe('productoSchema gramos restantes', () => {
  it('acepta gramos con decimales en ingrediente', () => {
    const result = productoSchema.safeParse({
      nombre: 'Harina de almendra',
      gramos_restantes: '987.55',
      stock: '0',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gramos_restantes).toBeCloseTo(987.55, 2);
    }
  });

  it('permite gramos en null cuando no se cargan', () => {
    const result = productoSchema.safeParse({
      nombre: 'Galleta Receta 1',
      precio_venta: '1600',
      costo: '1080',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gramos_restantes).toBeNull();
    }
  });

  it('rechaza gramos negativos', () => {
    const result = productoSchema.safeParse({
      nombre: 'Harina de almendra',
      gramos_restantes: '-5',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors;
      expect(flattened.gramos_restantes).toBeDefined();
    }
  });

  it('ya no incluye los campos paquete ni descripcion', () => {
    const { success, data } = productoSchema.safeParse({
      nombre: 'Galleta Receta 1',
      precio_venta: '1600',
      costo: '1080',
    });
    expect(success).toBe(true);
    if (success) {
      expect(data).not.toHaveProperty('paquete');
      expect(data).not.toHaveProperty('descripcion');
    }
  });
});