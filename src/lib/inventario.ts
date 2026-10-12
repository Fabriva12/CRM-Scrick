import { esIngrediente } from '@/lib/recetas';
import { calcularCostoPorGramo } from '@/lib/validations/productos';

/** Campos mínimos de un producto para valorar los materiales en stock. */
export interface ProductoInventario {
  nombre: string;
  /** Ingredientes: costo por gramo calculado (fallback si falta costo_total/cantidad_comprada) */
  costo?: number | null;
  /** Ingredientes: cuánto pagó por la compra (₡) */
  costo_total?: number | null;
  /** Ingredientes: cuánta cantidad compró (gramos) */
  cantidad_comprada?: number | null;
  /** Ingredientes: gramos que quedan disponibles */
  gramos_restantes?: number | null;
}

export interface ValorMateriales {
  /** Dinero invertido en ingredientes disponibles (₡). */
  valor: number;
  /** Cuántos ingredientes no tienen costo cargado y no suman al valor. */
  sinCosto: number;
}

/** Suma el valor de la materia prima en stock: gramos restantes × costo por gramo. */
export function calcularValorMateriales(
  productos: ProductoInventario[]
): ValorMateriales {
  let valor = 0;
  let sinCosto = 0;

  for (const producto of productos) {
    if (!esIngrediente(producto.nombre)) continue;

    const costoPorGramo =
      calcularCostoPorGramo(producto.costo_total, producto.cantidad_comprada) ??
      (producto.costo ?? null);

    if (costoPorGramo == null || costoPorGramo <= 0) {
      sinCosto++;
      continue;
    }

    valor += (producto.gramos_restantes ?? 0) * costoPorGramo;
  }

  return { valor: Math.round(valor), sinCosto };
}