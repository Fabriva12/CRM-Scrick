import { ClienteForm } from '@/components/organisms/ClienteForm';
import { createCliente } from '@/actions/clientes';

export default function NuevoClientePage() {
  return (
    <div className="space-y-6">
      <ClienteForm action={createCliente} />
    </div>
  );
}
