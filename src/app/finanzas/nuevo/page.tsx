import { GastoForm } from '@/components/organisms/GastoForm';
import { createGasto } from '@/actions/gastos';

export const dynamic = 'force-dynamic';

export default function NuevoGastoPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <GastoForm action={createGasto} />
    </div>
  );
}
