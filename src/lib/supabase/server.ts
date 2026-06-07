import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Supabase client SIN sesión de usuario, SOLO con service_role key.
 * BYPASEA RLS totalmente — NO toca cookies, NO inyecta sesión.
 * Usar para TODAS las operaciones CRUD (Server Actions, páginas, API routes).
 * Para un CRM de admin único, RLS es overhead innecesario.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}

/**
 * Supabase client con anon key + cookies de sesión.
 * RESPETA RLS — usar SOLO para operaciones de auth (signIn, signOut).
 */
export async function createAuthSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
