import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-scrick-charcoal px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Scrick"
            className="mx-auto h-28 w-auto object-contain brightness-0 invert"
          />
          <p className="mt-3 text-sm text-scrick-latte/60">
            Inicia sesión para continuar
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
