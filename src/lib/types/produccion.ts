export interface ProduccionHistorial {
  id: string;
  producto_id: string;
  receta_id: string;
  receta_nombre: string;
  cantidad: number;
  lote: string;
  created_at: string;
}

export interface HistorialConProducto extends ProduccionHistorial {
  productos: { nombre: string } | null;
}
