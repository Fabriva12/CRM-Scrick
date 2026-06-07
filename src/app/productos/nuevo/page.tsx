import { ProductoForm } from '@/components/organisms/ProductoForm';
import { createProducto } from '@/actions/productos';

export default function NuevoProductoPage() {
  return (
    <div className="space-y-6">
      <ProductoForm action={createProducto} />
    </div>
  );
}
